import { Server } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { SrtPusher, SrtPusherConfig } from '@/lib/srt-pusher'
import { db } from '@/lib/db'
import { SCTE35Generator, SCTE35Marker } from '@/lib/scte35'
import { SSAIManager } from './ssai'
import { HLSDASHPackager } from './hls-dash-packager'

export interface StreamConfig {
  rtmp: {
    port: number
    chunk_size: number
    gop_cache: boolean
    ping: number
    ping_timeout: number
  }
  http: {
    port: number
    allow_origin: string
  }
  srt: {
    port: number
    maxbitrate: number
    pbkeylen: number
    passphrase?: string
  }
}

export class StreamingServer {
  private io: SocketIOServer
  private config: StreamConfig
  private activeStreams: Map<string, any> = new Map()
  private srtPushers: Map<string, SrtPusher> = new Map()
  private ssaiManager: SSAIManager
  private packager: HLSDASHPackager

  constructor(config: StreamConfig, httpServer: Server) {
    this.config = config
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    // Initialize SSAI manager
    this.ssaiManager = new SSAIManager({
      url: process.env.AD_DECISION_SERVER_URL || 'http://localhost:3001',
      timeout: 5000,
      fallbackAds: [
        {
          adId: 'fallback-1',
          adUrl: '/ads/fallback.mp4',
          duration: 30,
          adType: 'PROGRAM',
          trackingEvents: {
            start: '/tracking/fallback-start',
            complete: '/tracking/fallback-complete'
          }
        }
      ]
    })

    // Initialize HLS/DASH packager
    this.packager = new HLSDASHPackager({
      type: 'both',
      baseUrl: process.env.PACKAGER_BASE_URL || 'http://localhost:8000',
      outputDirectory: './output',
      segmentDuration: 10,
      playlistLength: 6
    }, this.ssaiManager)

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // WebSocket event handlers
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)

      socket.on('subscribe_stream', (streamKey: string) => {
        socket.join(`stream_${streamKey}`)
        console.log(`Client ${socket.id} subscribed to stream ${streamKey}`)
      })

      socket.on('unsubscribe_stream', (streamKey: string) => {
        socket.leave(`stream_${streamKey}`)
        console.log(`Client ${socket.id} unsubscribed from stream ${streamKey}`)
      })

      socket.on('start_external_stream', async (data: { 
        streamId: string, 
        inputUrl: string, 
        outputUrl: string,
        config?: Partial<SrtPusherConfig>
      }) => {
        try {
          await this.startExternalStream(data.streamId, data.inputUrl, data.outputUrl, data.config)
          socket.emit('external_stream_started', { success: true, streamId: data.streamId })
        } catch (error) {
          socket.emit('external_stream_error', { error: 'Failed to start external stream' })
        }
      })

      socket.on('stop_external_stream', async (data: { streamId: string }) => {
        try {
          await this.stopExternalStream(data.streamId)
          socket.emit('external_stream_stopped', { success: true, streamId: data.streamId })
        } catch (error) {
          socket.emit('external_stream_error', { error: 'Failed to stop external stream' })
        }
      })

      socket.on('insert_ad_marker', async (data: { streamKey: string, marker: SCTE35Marker }) => {
        try {
          await this.insertAdMarker(data.streamKey, data.marker)
          socket.emit('ad_marker_inserted', { success: true, streamKey: data.streamKey })
        } catch (error) {
          socket.emit('ad_marker_error', { error: 'Failed to insert ad marker' })
        }
      })

      socket.on('package_stream', async (data: { 
        streamId: string, 
        inputUrl: string,
        packageType: 'hls' | 'dash' | 'both',
        includeSCTE35?: boolean,
        enableSSAI?: boolean,
        adaptiveBitrate?: boolean
      }) => {
        try {
          const result = await this.packageStream(data.streamId, data.inputUrl, {
            type: data.packageType,
            includeSCTE35: data.includeSCTE35,
            enableSSAI: data.enableSSAI,
            adaptiveBitrate: data.adaptiveBitrate
          })
          socket.emit('stream_packaged', { success: true, streamId: data.streamId, result })
        } catch (error) {
          socket.emit('packaging_error', { error: 'Failed to package stream' })
        }
      })

      socket.on('get_ssai_manifest', async (data: { 
        streamId: string, 
        originalManifest: string,
        manifestType: 'hls' | 'dash'
      }) => {
        try {
          const manifest = await this.ssaiManager.processStreamWithSSAI(
            data.streamId,
            data.originalManifest,
            data.manifestType
          )
          socket.emit('ssai_manifest', { success: true, streamId: data.streamId, manifest })
        } catch (error) {
          socket.emit('ssai_error', { error: 'Failed to generate SSAI manifest' })
        }
      })

      socket.on('track_ad_event', async (data: { 
        streamId: string, 
        adId: string, 
        eventType: 'start' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'complete',
        viewerId?: string
      }) => {
        try {
          await this.ssaiManager.trackAdEvent(
            data.streamId,
            data.adId,
            data.eventType,
            data.viewerId
          )
          socket.emit('ad_event_tracked', { success: true, streamId: data.streamId, adId: data.adId, eventType: data.eventType })
        } catch (error) {
          socket.emit('tracking_error', { error: 'Failed to track ad event' })
        }
      })

      socket.on('get_packaging_stats', async () => {
        try {
          const stats = this.packager.getStatistics()
          const ssaiStats = this.ssaiManager.getStatistics()
          socket.emit('packaging_stats', { 
            success: true, 
            packaging: stats,
            ssai: ssaiStats
          })
        } catch (error) {
          socket.emit('stats_error', { error: 'Failed to get packaging stats' })
        }
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  private async startExternalStream(
    streamId: string, 
    inputUrl: string, 
    outputUrl: string, 
    config?: Partial<SrtPusherConfig>
  ) {
    try {
      // Update stream status in database
      await db.stream.update({
        where: { id: streamId },
        data: {
          status: 'STARTING',
          isLive: true,
          startTime: new Date()
        }
      })

      // Create SRT pusher configuration
      const pusherConfig: SrtPusherConfig = {
        inputUrl,
        outputUrl,
        ...config
      }

      // Create and start SRT pusher
      const pusher = new SrtPusher(pusherConfig)

      pusher.on('stats', (stats) => {
        // Update stream stats in database
        this.updateStreamStats(streamId, stats)
        
        // Broadcast stats to clients
        this.io.to(`stream_${streamId}`).emit('stream_stats', {
          streamId,
          stats
        })
      })

      pusher.on('error', (error) => {
        console.error('SRT pusher error:', error)
        this.io.to(`stream_${streamId}`).emit('stream_error', {
          streamId,
          error: error.message
        })
      })

      pusher.on('stopped', (code) => {
        console.log(`SRT pusher stopped for stream ${streamId} with code ${code}`)
        this.stopExternalStream(streamId)
      })

      await pusher.start()

      // Store pusher instance
      this.srtPushers.set(streamId, pusher)

      // Update stream status to LIVE
      await db.stream.update({
        where: { id: streamId },
        data: {
          status: 'LIVE'
        }
      })

      // Notify clients
      this.io.emit('stream_started', { streamId })
      
      // Start SCTE-35 monitoring for this stream
      this.startSCTE35Monitoring(streamId)

      console.log(`External stream started: ${streamId}`)
    } catch (error) {
      console.error('Error starting external stream:', error)
      
      // Update stream status to ERROR
      await db.stream.update({
        where: { id: streamId },
        data: {
          status: 'ERROR',
          isLive: false
        }
      })
      
      throw error
    }
  }

  private async stopExternalStream(streamId: string) {
    try {
      const pusher = this.srtPushers.get(streamId)
      if (pusher) {
        pusher.stop()
        this.srtPushers.delete(streamId)
      }

      // Update stream status in database
      await db.stream.update({
        where: { id: streamId },
        data: {
          status: 'OFFLINE',
          isLive: false,
          viewerCount: 0,
          endTime: new Date()
        }
      })

      // Notify clients
      this.io.emit('stream_stopped', { streamId })
      
      // Stop SCTE-35 monitoring
      this.stopSCTE35Monitoring(streamId)

      console.log(`External stream stopped: ${streamId}`)
    } catch (error) {
      console.error('Error stopping external stream:', error)
      throw error
    }
  }

  private async updateStreamStats(streamId: string, stats: any) {
    try {
      await db.stream.update({
        where: { id: streamId },
        data: {
          bitrate: Math.round(stats.bitrate) || null,
          fps: Math.round(stats.fps) || null
        }
      })

      // Store analytics
      await db.streamAnalytics.create({
        data: {
          streamId,
          bitrate: Math.round(stats.bitrate) || null,
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating stream stats:', error)
    }
  }

  private startSCTE35Monitoring(streamKey: string) {
    console.log(`Starting SCTE-35 monitoring for stream: ${streamKey}`)
    
    // Simulate SCTE-35 monitoring
    const interval = setInterval(async () => {
      try {
        // Check for pending ad markers
        const stream = await db.stream.findUnique({
          where: { id: streamKey },
          include: {
            adMarkers: {
              where: { isInserted: false }
            }
          }
        })

        if (stream && stream.startTime && stream.adMarkers.length > 0) {
          const streamDuration = (Date.now() - new Date(stream.startTime).getTime()) / 1000
          
          for (const marker of stream.adMarkers) {
            if (marker.startTime <= streamDuration) {
              await this.insertAdMarker(stream.streamKey || '', {
                cueId: marker.cueId,
                startTime: marker.startTime,
                duration: marker.duration,
                adType: marker.adType,
                description: marker.description
              })
            }
          }
        }
      } catch (error) {
        console.error('Error in SCTE-35 monitoring:', error)
      }
    }, 1000) // Check every second

    this.activeStreams.set(streamKey, interval)
  }

  private stopSCTE35Monitoring(streamKey: string) {
    console.log(`Stopping SCTE-35 monitoring for stream: ${streamKey}`)
    
    const interval = this.activeStreams.get(streamKey)
    if (interval) {
      clearInterval(interval)
      this.activeStreams.delete(streamKey)
    }
  }

  private async insertAdMarker(streamKey: string, marker: SCTE35Marker) {
    try {
      // Generate SCTE-35 packet
      const scte35Packet = SCTE35Generator.generateSpliceInsert(marker)
      
      // Update database
      await db.adMarker.updateMany({
        where: {
          streamId: streamKey,
          cueId: marker.cueId,
          isInserted: false
        },
        data: {
          isInserted: true,
          insertionTime: new Date()
        }
      })

      // Broadcast to all clients in the stream
      this.io.to(`stream_${streamKey}`).emit('ad_marker_inserted', {
        streamKey,
        marker,
        packet: SCTE35Generator.formatHex(scte35Packet)
      })

      console.log(`SCTE-35 ad marker inserted for stream ${streamKey}:`, marker)
    } catch (error) {
      console.error('Error inserting ad marker:', error)
      throw error
    }
  }

  private async packageStream(
    streamId: string, 
    inputUrl: string, 
    options: {
      type: 'hls' | 'dash' | 'both'
      includeSCTE35?: boolean
      enableSSAI?: boolean
      adaptiveBitrate?: boolean
    }
  ) {
    try {
      const result = await this.packager.packageStream(
        streamId,
        inputUrl,
        options
      )

      console.log(`Stream packaged: ${streamId}`, result)
      return result
    } catch (error) {
      console.error('Error packaging stream:', error)
      throw error
    }
  }

  public async getStreamStats(streamKey: string) {
    try {
      const stream = await db.stream.findUnique({
        where: { streamKey },
        include: {
          adMarkers: true,
          analytics: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      })

      return stream
    } catch (error) {
      console.error('Error getting stream stats:', error)
      return null
    }
  }

  public start() {
    console.log('Streaming server started')
    console.log(`External SRT/RTMP pusher ready`)
  }

  public stop() {
    // Stop all active SRT pushers
    for (const [streamId, pusher] of this.srtPushers) {
      pusher.stop()
    }
    this.srtPushers.clear()

    // Stop all monitoring intervals
    for (const [streamKey, interval] of this.activeStreams) {
      clearInterval(interval)
    }
    this.activeStreams.clear()

    this.io.close()
    console.log('Streaming server stopped')
  }

  public getSocketServer() {
    return this.io
  }
}