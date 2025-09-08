import { AdvancedSCTE35 } from '@/lib/scte35/advanced'
import { SSAIManager } from './ssai'
import { db } from '@/lib/db'

export interface PackagerConfig {
  type: 'hls' | 'dash' | 'both'
  baseUrl: string
  outputDirectory: string
  segmentDuration: number
  playlistLength: number
  encryption?: {
    enabled: boolean
    keyUri?: string
    keyFormat?: string
  }
}

export interface PackagedStream {
  id: string
  type: 'hls' | 'dash'
  manifestUrl: string
  segments: string[]
  size: number
  createdAt: Date
}

export class HLSDASHPackager {
  private config: PackagerConfig
  private ssaiManager: SSAIManager
  private packagedStreams: Map<string, PackagedStream> = new Map()

  constructor(config: PackagerConfig, ssaiManager: SSAIManager) {
    this.config = config
    this.ssaiManager = ssaiManager
  }

  /**
   * Package a stream into HLS and/or DASH formats
   * Based on Bitmovin's packaging implementation
   */
  async packageStream(
    streamId: string,
    inputUrl: string,
    options: {
      includeSCTE35?: boolean
      enableSSAI?: boolean
      adaptiveBitrate?: boolean
    } = {}
  ): Promise<{
    hls?: PackagedStream
    dash?: PackagedStream
    manifestUrls: string[]
  }> {
    const {
      includeSCTE35 = true,
      enableSSAI = true,
      adaptiveBitrate = true
    } = options

    try {
      // Get stream information from database
      const stream = await db.stream.findUnique({
        where: { id: streamId },
        include: {
          adMarkers: {
            where: { isInserted: true },
            orderBy: { startTime: 'asc' }
          }
        }
      })

      if (!stream) {
        throw new Error('Stream not found')
      }

      const result: {
        hls?: PackagedStream
        dash?: PackagedStream
        manifestUrls: string[]
      } = { manifestUrls: [] }

      // Package HLS if requested
      if (this.config.type === 'hls' || this.config.type === 'both') {
        const hlsStream = await this.packageHLS(
          streamId,
          inputUrl,
          stream,
          includeSCTE35,
          enableSSAI,
          adaptiveBitrate
        )
        result.hls = hlsStream
        result.manifestUrls.push(hlsStream.manifestUrl)
      }

      // Package DASH if requested
      if (this.config.type === 'dash' || this.config.type === 'both') {
        const dashStream = await this.packageDASH(
          streamId,
          inputUrl,
          stream,
          includeSCTE35,
          enableSSAI,
          adaptiveBitrate
        )
        result.dash = dashStream
        result.manifestUrls.push(dashStream.manifestUrl)
      }

      return result
    } catch (error) {
      console.error('Error packaging stream:', error)
      throw error
    }
  }

  /**
   * Package stream into HLS format
   */
  private async packageHLS(
    streamId: string,
    inputUrl: string,
    stream: any,
    includeSCTE35: boolean,
    enableSSAI: boolean,
    adaptiveBitrate: boolean
  ): Promise<PackagedStream> {
    const manifestName = `${stream.streamKey}_master.m3u8`
    const manifestUrl = `${this.config.baseUrl}/${manifestName}`

    // Generate segments with SCTE-35 markers
    const segments = await this.generateHLSSegments(
      streamId,
      inputUrl,
      stream,
      includeSCTE35
    )

    // Generate HLS manifest
    let hlsManifest: string

    if (enableSSAI) {
      // Use SSAI manager to generate manifest with ad insertion
      hlsManifest = await this.ssaiManager.generateHLSWithSSAI(
        streamId,
        this.config.baseUrl,
        segments
      )
    } else {
      // Generate standard HLS manifest with SCTE-35 markers
      hlsManifest = AdvancedSCTE35.generateHLSManifest(
        this.config.baseUrl,
        segments,
        {
          version: 6,
          targetDuration: this.config.segmentDuration,
          mediaSequence: 0
        }
      )
    }

    // Add adaptive bitrate variants if requested
    if (adaptiveBitrate) {
      hlsManifest = this.addAdaptiveBitrateVariants(hlsManifest, stream)
    }

    // Store packaged stream info
    const packagedStream: PackagedStream = {
      id: streamId,
      type: 'hls',
      manifestUrl,
      segments: segments.map(s => s.url),
      size: hlsManifest.length,
      createdAt: new Date()
    }

    this.packagedStreams.set(`${streamId}_hls`, packagedStream)

    return packagedStream
  }

  /**
   * Package stream into DASH format
   */
  private async packageDASH(
    streamId: string,
    inputUrl: string,
    stream: any,
    includeSCTE35: boolean,
    enableSSAI: boolean,
    adaptiveBitrate: boolean
  ): Promise<PackagedStream> {
    const manifestName = `${stream.streamKey}_manifest.mpd`
    const manifestUrl = `${this.config.baseUrl}/${manifestName}`

    // Generate periods with SCTE-35 markers
    const periods = await this.generateDASHPeriods(
      streamId,
      inputUrl,
      stream,
      includeSCTE35
    )

    // Generate DASH manifest
    let dashManifest: string

    if (enableSSAI) {
      // Use SSAI manager to generate manifest with ad insertion
      dashManifest = await this.ssaiManager.generateDASHWithSSAI(
        streamId,
        this.config.baseUrl,
        periods
      )
    } else {
      // Generate standard DASH manifest with SCTE-35 markers
      dashManifest = AdvancedSCTE35.generateDASHManifest(
        this.config.baseUrl,
        periods,
        {
          minBufferTime: 2,
          suggestedPresentationDelay: 10
        }
      )
    }

    // Store packaged stream info
    const packagedStream: PackagedStream = {
      id: streamId,
      type: 'dash',
      manifestUrl,
      segments: periods.flatMap(p => p.adaptations.flatMap(a => a.segments.map(s => s.url))),
      size: dashManifest.length,
      createdAt: new Date()
    }

    this.packagedStreams.set(`${streamId}_dash`, packagedStream)

    return packagedStream
  }

  /**
   * Generate HLS segments with SCTE-35 markers
   */
  private async generateHLSSegments(
    streamId: string,
    inputUrl: string,
    stream: any,
    includeSCTE35: boolean
  ): Promise<Array<{
    url: string
    duration: number
    scte35Markers?: any[]
  }>> {
    const segments: Array<{
      url: string
      duration: number
      scte35Markers?: any[]
    }> = []

    // Generate segments based on stream duration
    const totalDuration = stream.endTime && stream.startTime 
      ? (new Date(stream.endTime).getTime() - new Date(stream.startTime).getTime()) / 1000
      : 3600 // Default 1 hour

    const segmentCount = Math.ceil(totalDuration / this.config.segmentDuration)

    for (let i = 0; i < segmentCount; i++) {
      const segmentUrl = `${stream.streamKey}_segment_${i.toString().padStart(4, '0')}.ts`
      const segmentDuration = Math.min(
        this.config.segmentDuration,
        totalDuration - (i * this.config.segmentDuration)
      )

      const segment = {
        url: segmentUrl,
        duration: segmentDuration
      }

      // Add SCTE-35 markers if requested
      if (includeSCTE35 && stream.adMarkers) {
        const segmentStartTime = i * this.config.segmentDuration
        const segmentEndTime = segmentStartTime + segmentDuration

        const scte35Markers = stream.adMarkers
          .filter(marker => 
            marker.startTime >= segmentStartTime && 
            marker.startTime < segmentEndTime
          )
          .map(marker => ({
            id: marker.cueId || marker.id,
            time: marker.startTime - segmentStartTime,
            duration: marker.duration,
            cueId: marker.cueId,
            adType: marker.adType,
            description: marker.description
          }))

        if (scte35Markers.length > 0) {
          segment.scte35Markers = scte35Markers
        }
      }

      segments.push(segment)
    }

    return segments
  }

  /**
   * Generate DASH periods with SCTE-35 markers
   */
  private async generateDASHPeriods(
    streamId: string,
    inputUrl: string,
    stream: any,
    includeSCTE35: boolean
  ): Promise<Array<{
    id: string
    duration: number
    adaptations: Array<{
      id: string
      contentType: 'video' | 'audio'
      mimeType: string
      codecs: string
      bandwidth: number
      segments: Array<{
        url: string
        duration: number
        scte35Markers?: any[]
      }>
    }>
    scte35Markers?: any[]
  }>> {
    const periods: Array<{
      id: string
      duration: number
      adaptations: Array<{
        id: string
        contentType: 'video' | 'audio'
        mimeType: string
        codecs: string
        bandwidth: number
        segments: Array<{
          url: string
          duration: number
          scte35Markers?: any[]
        }>
      }>
      scte35Markers?: any[]
    }> = []

    // Create a single period for the entire stream
    const totalDuration = stream.endTime && stream.startTime 
      ? (new Date(stream.endTime).getTime() - new Date(stream.startTime).getTime()) / 1000
      : 3600 // Default 1 hour

    const period = {
      id: `period_${streamId}`,
      duration: totalDuration,
      adaptations: [
        {
          id: 'video_adaptation',
          contentType: 'video' as const,
          mimeType: 'video/mp4',
          codecs: 'avc1.640028',
          bandwidth: 5000000,
          segments: []
        },
        {
          id: 'audio_adaptation',
          contentType: 'audio' as const,
          mimeType: 'audio/mp4',
          codecs: 'aac',
          bandwidth: 128000,
          segments: []
        }
      ]
    }

    // Generate segments for each adaptation
    const segmentCount = Math.ceil(totalDuration / this.config.segmentDuration)

    for (let i = 0; i < segmentCount; i++) {
      const segmentUrl = `${stream.streamKey}_segment_${i.toString().padStart(4, '0')}.m4s`
      const segmentDuration = Math.min(
        this.config.segmentDuration,
        totalDuration - (i * this.config.segmentDuration)
      )

      const segment = {
        url: segmentUrl,
        duration: segmentDuration
      }

      // Add SCTE-35 markers if requested
      if (includeSCTE35 && stream.adMarkers) {
        const segmentStartTime = i * this.config.segmentDuration
        const segmentEndTime = segmentStartTime + segmentDuration

        const scte35Markers = stream.adMarkers
          .filter(marker => 
            marker.startTime >= segmentStartTime && 
            marker.startTime < segmentEndTime
          )
          .map(marker => ({
            id: marker.cueId || marker.id,
            time: marker.startTime - segmentStartTime,
            duration: marker.duration,
            schemeIdUri: AdvancedSCTE35.SchemeUris.SCTE35,
            value: 'scte35',
            cueId: marker.cueId
          }))

        if (scte35Markers.length > 0) {
          segment.scte35Markers = scte35Markers
        }
      }

      period.adaptations.forEach(adaptation => {
        adaptation.segments.push({ ...segment })
      })
    }

    // Add SCTE-35 markers at period level
    if (includeSCTE35 && stream.adMarkers) {
      period.scte35Markers = stream.adMarkers.map(marker => ({
        id: marker.cueId || marker.id,
        time: marker.startTime,
        duration: marker.duration,
        schemeIdUri: AdvancedSCTE35.SchemeUris.SCTE35,
        value: 'scte35',
        cueId: marker.cueId
      }))
    }

    periods.push(period)
    return periods
  }

  /**
   * Add adaptive bitrate variants to HLS manifest
   */
  private addAdaptiveBitrateVariants(manifest: string, stream: any): string {
    const variants = [
      { bandwidth: 3000000, resolution: '1280x720', codecs: 'avc1.640028' },
      { bandwidth: 1500000, resolution: '854x480', codecs: 'avc1.640028' },
      { bandwidth: 800000, resolution: '640x360', codecs: 'avc1.640028' }
    ]

    let masterManifest = `#EXTM3U\n`
    masterManifest += `#EXT-X-VERSION:6\n`

    // Add original stream as the highest quality
    masterManifest += `#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"\n`
    masterManifest += `${stream.streamKey}_master.m3u8\n`

    // Add adaptive bitrate variants
    variants.forEach(variant => {
      masterManifest += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution},CODECS="${variant.codecs},mp4a.40.2"\n`
      masterManifest += `${stream.streamKey}_${variant.bandwidth}.m3u8\n`
    })

    return masterManifest
  }

  /**
   * Get packaged stream information
   */
  getPackagedStream(streamId: string, type: 'hls' | 'dash'): PackagedStream | undefined {
    return this.packagedStreams.get(`${streamId}_${type}`)
  }

  /**
   * Get all packaged streams
   */
  getAllPackagedStreams(): PackagedStream[] {
    return Array.from(this.packagedStreams.values())
  }

  /**
   * Remove packaged stream
   */
  removePackagedStream(streamId: string, type: 'hls' | 'dash'): void {
    this.packagedStreams.delete(`${streamId}_${type}`)
  }

  /**
   * Get packaging statistics
   */
  getStatistics(): {
    totalStreams: number
    hlsStreams: number
    dashStreams: number
    totalSize: number
  } {
    const allStreams = this.getAllPackagedStreams()
    const hlsStreams = allStreams.filter(s => s.type === 'hls').length
    const dashStreams = allStreams.filter(s => s.type === 'dash').length
    const totalSize = allStreams.reduce((sum, stream) => sum + stream.size, 0)

    return {
      totalStreams: allStreams.length,
      hlsStreams,
      dashStreams,
      totalSize
    }
  }

  /**
   * Validate packaging configuration
   */
  validateConfiguration(): boolean {
    return !!this.config.baseUrl && this.config.segmentDuration > 0
  }
}