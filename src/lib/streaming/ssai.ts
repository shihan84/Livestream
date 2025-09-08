import { AdvancedSCTE35, SSAIManifest } from '@/lib/scte35/advanced'
import { db } from '@/lib/db'

export interface AdDecision {
  adId: string
  adUrl: string
  duration: number
  adType: string
  trackingEvents?: {
    start?: string
    firstQuartile?: string
    midpoint?: string
    thirdQuartile?: string
    complete?: string
  }
}

export interface AdDecisionServerConfig {
  url: string
  apiKey?: string
  timeout: number
  fallbackAds?: AdDecision[]
}

export class SSAIManager {
  private config: AdDecisionServerConfig
  private activeManifests: Map<string, SSAIManifest> = new Map()

  constructor(config: AdDecisionServerConfig) {
    this.config = config
  }

  /**
   * Process a stream with SSAI ad insertion
   * Based on Bitmovin's SSAI implementation
   */
  async processStreamWithSSAI(
    streamId: string,
    originalManifest: string,
    manifestType: 'hls' | 'dash'
  ): Promise<SSAIManifest> {
    try {
      // Get stream and ad markers from database
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

      // Convert ad markers to ad breaks format
      const adBreaks = stream.adMarkers.map(marker => ({
        id: marker.cueId || marker.id,
        startTime: marker.startTime,
        duration: marker.duration,
        adType: marker.adType
      }))

      // Generate SSAI manifest
      const ssaiManifest = AdvancedSCTE35.generateSSAIManifest(
        originalManifest,
        adBreaks,
        {
          type: manifestType,
          adDecisionServer: this.config.url,
          adTracking: true
        }
      )

      // Store active manifest
      this.activeManifests.set(streamId, ssaiManifest)

      return ssaiManifest
    } catch (error) {
      console.error('Error processing stream with SSAI:', error)
      throw error
    }
  }

  /**
   * Get ad decisions from ad decision server
   */
  async getAdDecision(
    adBreak: {
      id: string
      startTime: number
      duration: number
      adType: string
    },
    streamContext: {
      streamId: string
      viewerId?: string
      deviceType?: string
      location?: string
    }
  ): Promise<AdDecision> {
    try {
      // In a real implementation, this would call an external ad decision server
      // For now, we'll simulate the response
      
      const response = await fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey || ''}`,
          'User-Agent': 'SCTE35-SSAI-Manager/1.0'
        },
        body: JSON.stringify({
          adBreak,
          streamContext,
          timestamp: Date.now()
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      })

      if (!response.ok) {
        throw new Error(`Ad decision server error: ${response.status}`)
      }

      const adDecision = await response.json()
      return adDecision
    } catch (error) {
      console.error('Error getting ad decision:', error)
      
      // Fallback to predefined ads if available
      if (this.config.fallbackAds && this.config.fallbackAds.length > 0) {
        const fallbackAd = this.config.fallbackAds[
          Math.floor(Math.random() * this.config.fallbackAds.length)
        ]
        return fallbackAd
      }

      // Default fallback ad
      return {
        adId: `fallback-${Date.now()}`,
        adUrl: '/ads/fallback.mp4',
        duration: adBreak.duration,
        adType: adBreak.adType,
        trackingEvents: {
          start: '/tracking/fallback-start',
          complete: '/tracking/fallback-complete'
        }
      }
    }
  }

  /**
   * Generate HLS manifest with SSAI ad insertion
   */
  async generateHLSWithSSAI(
    streamId: string,
    baseUrl: string,
    segments: Array<{
      url: string
      duration: number
      scte35Markers?: any[]
    }>
  ): Promise<string> {
    try {
      // Get SSAI manifest for the stream
      const ssaiManifest = this.activeManifests.get(streamId)
      if (!ssaiManifest) {
        throw new Error('No active SSAI manifest found for stream')
      }

      // Generate enhanced HLS manifest with SSAI
      const hlsManifest = AdvancedSCTE35.generateHLSManifest(
        baseUrl,
        segments.map(segment => ({
          ...segment,
          scte35Markers: segment.scte35Markers?.map(marker => ({
            id: marker.id,
            time: marker.startTime,
            duration: marker.duration,
            cueId: marker.cueId,
            adType: marker.adType,
            description: marker.description
          }))
        })),
        {
          version: 6,
          targetDuration: 10,
          mediaSequence: 0
        }
      )

      return hlsManifest
    } catch (error) {
      console.error('Error generating HLS with SSAI:', error)
      throw error
    }
  }

  /**
   * Generate DASH manifest with SSAI ad insertion
   */
  async generateDASHWithSSAI(
    streamId: string,
    baseUrl: string,
    periods: Array<{
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
    }>
  ): Promise<string> {
    try {
      // Get SSAI manifest for the stream
      const ssaiManifest = this.activeManifests.get(streamId)
      if (!ssaiManifest) {
        throw new Error('No active SSAI manifest found for stream')
      }

      // Generate enhanced DASH manifest with SSAI
      const dashManifest = AdvancedSCTE35.generateDASHManifest(
        baseUrl,
        periods.map(period => ({
          ...period,
          scte35Markers: period.scte35Markers?.map(marker => ({
            id: marker.id,
            time: marker.startTime,
            duration: marker.duration,
            schemeIdUri: AdvancedSCTE35.SchemeUris.SCTE35,
            value: 'scte35',
            cueId: marker.cueId
          })),
          adaptations: period.adaptations.map(adaptation => ({
            ...adaptation,
            segments: adaptation.segments.map(segment => ({
              ...segment,
              scte35Markers: segment.scte35Markers?.map(marker => ({
                id: marker.id,
                time: marker.startTime,
                duration: marker.duration,
                schemeIdUri: AdvancedSCTE35.SchemeUris.SCTE35,
                value: 'scte35',
                cueId: marker.cueId
              }))
            }))
          }))
        })),
        {
          minBufferTime: 2,
          suggestedPresentationDelay: 10
        }
      )

      return dashManifest
    } catch (error) {
      console.error('Error generating DASH with SSAI:', error)
      throw error
    }
  }

  /**
   * Track ad events for analytics
   */
  async trackAdEvent(
    streamId: string,
    adId: string,
    eventType: 'start' | 'firstQuartile' | 'midpoint' | 'thirdQuartile' | 'complete',
    viewerId?: string
  ): Promise<void> {
    try {
      // Store tracking event in database
      await db.streamAnalytics.create({
        data: {
          streamId,
          timestamp: new Date(),
          // In a real implementation, you'd have a dedicated analytics table for ad tracking
          viewerCount: 0,
          bitrate: 0,
          bandwidth: 0,
          cpuUsage: 0,
          memoryUsage: 0,
          networkLatency: 0
        }
      })

      // Send tracking event to ad server if available
      if (this.config.url) {
        await fetch(`${this.config.url}/tracking`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey || ''}`
          },
          body: JSON.stringify({
            streamId,
            adId,
            eventType,
            viewerId,
            timestamp: Date.now()
          })
        }).catch(error => {
          console.error('Error sending tracking event:', error)
        })
      }
    } catch (error) {
      console.error('Error tracking ad event:', error)
    }
  }

  /**
   * Get active SSAI manifest for a stream
   */
  getActiveManifest(streamId: string): SSAIManifest | undefined {
    return this.activeManifests.get(streamId)
  }

  /**
   * Clear active manifest for a stream
   */
  clearActiveManifest(streamId: string): void {
    this.activeManifests.delete(streamId)
  }

  /**
   * Get all active manifests
   */
  getAllActiveManifests(): Map<string, SSAIManifest> {
    return new Map(this.activeManifests)
  }

  /**
   * Validate SSAI configuration
   */
  validateConfiguration(): boolean {
    return !!this.config.url && this.config.timeout > 0
  }

  /**
   * Get SSAI statistics
   */
  getStatistics(): {
    activeStreams: number
    totalAdBreaks: number
    configurationValid: boolean
  } {
    const activeStreams = this.activeManifests.size
    let totalAdBreaks = 0

    for (const manifest of this.activeManifests.values()) {
      totalAdBreaks += manifest.adBreaks.length
    }

    return {
      activeStreams,
      totalAdBreaks,
      configurationValid: this.validateConfiguration()
    }
  }
}