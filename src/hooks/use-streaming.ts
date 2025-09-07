import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Stream {
  id: string
  name: string
  description?: string
  streamKey: string
  srtUrl?: string
  rtmpUrl?: string
  externalSrtUrl?: string
  externalRtmpUrl?: string
  status: 'OFFLINE' | 'STARTING' | 'LIVE' | 'STOPPING' | 'ERROR'
  isLive: boolean
  viewerCount: number
  bitrate?: number
  resolution?: string
  fps?: number
  startTime?: string
  endTime?: string
  createdAt: string
  updatedAt: string
}

interface AdMarker {
  id: string
  streamId: string
  cueId?: string
  startTime: number
  duration: number
  adType: 'PROGRAM' | 'PROVIDER_ADVERTISEMENT' | 'DISTRIBUTOR_ADVERTISEMENT' | 'NETWORK_ADVERTISEMENT' | 'LOCAL_ADVERTISEMENT'
  description?: string
  isInserted: boolean
  insertionTime?: string
  createdAt: string
  updatedAt: string
}

interface SrtPusherConfig {
  inputUrl: string
  outputUrl: string
  bitrate?: number
  resolution?: string
  fps?: number
  audioBitrate?: string
  videoCodec?: string
  audioCodec?: string
}

export function useStreaming() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [streams, setStreams] = useState<Stream[]>([])
  const [adMarkers, setAdMarkers] = useState<AdMarker[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socketio'
    })

    socketInstance.on('connect', () => {
      console.log('Connected to streaming server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from streaming server')
      setIsConnected(false)
    })

    // Stream events
    socketInstance.on('stream_started', (data) => {
      console.log('Stream started:', data)
      setStreams(prev => prev.map(stream => 
        stream.id === data.streamId 
          ? { ...stream, status: 'LIVE', isLive: true, startTime: new Date().toISOString() }
          : stream
      ))
    })

    socketInstance.on('stream_stopped', (data) => {
      console.log('Stream stopped:', data)
      setStreams(prev => prev.map(stream => 
        stream.id === data.streamId 
          ? { ...stream, status: 'OFFLINE', isLive: false, viewerCount: 0, endTime: new Date().toISOString() }
          : stream
      ))
    })

    socketInstance.on('external_stream_started', (data) => {
      console.log('External stream started:', data)
      setStreams(prev => prev.map(stream => 
        stream.id === data.streamId 
          ? { ...stream, status: 'LIVE', isLive: true, startTime: new Date().toISOString() }
          : stream
      ))
    })

    socketInstance.on('external_stream_stopped', (data) => {
      console.log('External stream stopped:', data)
      setStreams(prev => prev.map(stream => 
        stream.id === data.streamId 
          ? { ...stream, status: 'OFFLINE', isLive: false, viewerCount: 0, endTime: new Date().toISOString() }
          : stream
      ))
    })

    socketInstance.on('viewer_count_updated', (data) => {
      console.log('Viewer count updated:', data)
      setViewerCounts(prev => ({ ...prev, [data.streamKey]: data.count }))
      setStreams(prev => prev.map(stream => 
        stream.streamKey === data.streamKey 
          ? { ...stream, viewerCount: data.count }
          : stream
      ))
    })

    // Stream stats events
    socketInstance.on('stream_stats', (data) => {
      console.log('Stream stats updated:', data)
      setStreams(prev => prev.map(stream => 
        stream.id === data.streamId 
          ? { 
              ...stream, 
              bitrate: data.stats.bitrate ? Math.round(data.stats.bitrate) : stream.bitrate,
              fps: data.stats.fps ? Math.round(data.stats.fps) : stream.fps
            }
          : stream
      ))
    })

    // Ad marker events
    socketInstance.on('ad_marker_inserted', (data) => {
      console.log('Ad marker inserted:', data)
      setAdMarkers(prev => prev.map(marker => 
        marker.cueId === data.marker.cueId 
          ? { ...marker, isInserted: true, insertionTime: new Date().toISOString() }
          : marker
      ))
    })

    socketInstance.on('ad_marker_error', (data) => {
      console.error('Ad marker error:', data)
    })

    setSocket(socketInstance)

    // Fetch initial data
    fetchInitialData()

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const fetchInitialData = async () => {
    try {
      // Fetch streams
      const streamsResponse = await fetch('/api/streams')
      if (streamsResponse.ok) {
        const streamsData = await streamsResponse.json()
        setStreams(streamsData)
      }

      // Fetch ad markers
      const adMarkersResponse = await fetch('/api/ad-markers')
      if (adMarkersResponse.ok) {
        const adMarkersData = await adMarkersResponse.json()
        setAdMarkers(adMarkersData)
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
    }
  }

  const createStream = async (streamData: {
    name: string
    description?: string
    streamKey?: string
    externalSrtUrl?: string
    externalRtmpUrl?: string
  }) => {
    try {
      const response = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(streamData),
      })

      if (response.ok) {
        const newStream = await response.json()
        setStreams(prev => [newStream, ...prev])
        return newStream
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create stream')
      }
    } catch (error) {
      console.error('Error creating stream:', error)
      throw error
    }
  }

  const startExternalStream = async (
    streamId: string, 
    inputUrl: string, 
    outputUrl: string, 
    config?: Partial<SrtPusherConfig>
  ) => {
    if (socket && isConnected) {
      socket.emit('start_external_stream', { streamId, inputUrl, outputUrl, config })
    } else {
      throw new Error('Socket not connected')
    }
  }

  const stopExternalStream = async (streamId: string) => {
    if (socket && isConnected) {
      socket.emit('stop_external_stream', { streamId })
    } else {
      throw new Error('Socket not connected')
    }
  }

  const deleteStream = async (streamId: string) => {
    try {
      const response = await fetch(`/api/streams/${streamId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setStreams(prev => prev.filter(stream => stream.id !== streamId))
        return true
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete stream')
      }
    } catch (error) {
      console.error('Error deleting stream:', error)
      throw error
    }
  }

  const createAdMarker = async (markerData: {
    streamId: string
    startTime: number
    duration: number
    adType?: string
    description?: string
    cueId?: string
  }) => {
    try {
      const response = await fetch('/api/ad-markers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(markerData),
      })

      if (response.ok) {
        const newMarker = await response.json()
        setAdMarkers(prev => [...prev, newMarker])
        return newMarker
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create ad marker')
      }
    } catch (error) {
      console.error('Error creating ad marker:', error)
      throw error
    }
  }

  const insertAdMarker = async (streamKey: string, marker: any) => {
    if (socket && isConnected) {
      socket.emit('insert_ad_marker', { streamKey, marker })
    } else {
      throw new Error('Socket not connected')
    }
  }

  const subscribeToStream = (streamKey: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe_stream', streamKey)
    }
  }

  const unsubscribeFromStream = (streamKey: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe_stream', streamKey)
    }
  }

  return {
    streams,
    adMarkers,
    isConnected,
    viewerCounts,
    createStream,
    startExternalStream,
    stopExternalStream,
    deleteStream,
    createAdMarker,
    insertAdMarker,
    subscribeToStream,
    unsubscribeFromStream,
  }
}