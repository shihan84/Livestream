import { AdvancedSCTE35 } from '@/lib/scte35/advanced'
import { SSAIManager } from './ssai'
import { db } from '@/lib/db'

export interface ManifestGenerationOptions {
  type: 'hls' | 'dash'
  baseUrl: string
  segmentDuration: number
  targetDuration?: number
  includeSSAI?: boolean
  adDecisionServerUrl?: string
}

export interface SegmentInfo {
  sequence: number
  url: string
  duration: number
  startTime: number
  scte35Markers?: Array<{
    id: string
    time: number
    duration: number
    cueId?: string
    adType: string
  }>
}

export class ManifestGenerator {
  private ssaiManager: SSAIManager

  constructor(options?: {
    adDecisionServerUrl?: string
    adTrackingEnabled?: boolean
  }) {
    this.ssaiManager = new SSAIManager(options)
  }

  /**
   * Generate HLS master playlist
   * Based on Bitmovin's HLS implementation
   */
  async generateHLSMasterPlaylist(
    streamId: string,
    variants: Array<{
      bandwidth: number
      resolution: string
      codecs: string
      url: string
    }>,
    options: ManifestGenerationOptions
  ): Promise<string> {
    const { baseUrl, includeSSAI = false } = options

    let playlist = `#EXTM3U\n`
    playlist += `#EXT-X-VERSION:6\n`

    variants.forEach(variant => {
      playlist += `#EXT-X-STREAM-INF:BANDWIDTH=${variant.bandwidth},RESOLUTION=${variant.resolution},CODECS="${variant.codecs}"\n`
      playlist += `${baseUrl}/${variant.url}\n`
    })

    if (includeSSAI) {
      // Add SSAI-specific tags
      playlist += `#EXT-X-SSAI:AD-DECISION-SERVER="${options.adDecisionServerUrl || ''}"\n`
    }

    return playlist
  }

  /**
   * Generate HLS media playlist with SCTE-35 markers
   * Based on Bitmovin's HLS SCTE-35 implementation
   */
  async generateHLSMediaPlaylist(
    streamId: string,
    segments: SegmentInfo[],
    options: ManifestGenerationOptions
  ): Promise<string> {
    const { baseUrl, targetDuration = 10, includeSSAI = false } = options

    // Get SCTE-35 markers for this stream
    const scte35Markers = await this.getSCTE35MarkersForStream(streamId)

    // Map markers to segments
    const segmentsWithMarkers = segments.map(segment => ({
      ...segment,
      scte35Markers: scte35Markers.filter(marker => 
        marker.time >= segment.startTime && 
        marker.time < segment.startTime + segment.duration
      ).map(marker => ({
        id: marker.id,
        time: marker.time - segment.startTime,
        duration: marker.duration,
        cueId: marker.cueId,
        adType: marker.adType
      }))
    }))

    if (includeSSAI) {
      // Generate SSAI manifest
      const originalManifest = AdvancedSCTE35.generateHLSManifest(
        baseUrl,
        segmentsWithMarkers.map(segment => ({
          url: segment.url,
          duration: segment.duration,
          scte35Markers: segment.scte35Markers
        })),
        { targetDuration }
      )

      const ssaiManifest = await this.ssaiManager.generateSSAIManifest(
        streamId,
        originalManifest,
        'hls'
      )

      return AdvancedSCTE35.generateHLSManifest(
        baseUrl,
        ssaiManifest.segments,
        { targetDuration }
      )
    } else {
      // Generate regular HLS manifest with SCTE-35 markers
      return AdvancedSCTE35.generateHLSManifest(
        baseUrl,
        segmentsWithMarkers.map(segment => ({
          url: segment.url,
          duration: segment.duration,
          scte35Markers: segment.scte35Markers
        })),
        { targetDuration }
      )
    }
  }

  /**
   * Generate DASH manifest with SCTE-35 markers
   * Based on Bitmovin's DASH implementation
   */
  async generateDASHManifest(
    streamId: string,
    periods: Array<{
      id: string
      duration: number
      adaptations: Array<{
        id: string
        contentType: 'video' | 'audio'
        mimeType: string
        codecs: string
        bandwidth: number
        segments: SegmentInfo[]
      }>
    }>,
    options: ManifestGenerationOptions
  ): Promise<string> {
    const { baseUrl, includeSSAI = false } = options

    // Get SCTE-35 markers for this stream
    const scte35Markers = await this.getSCTE35MarkersForStream(streamId)

    // Map markers to DASH format
    const dashMarkers = scte35Markers.map(marker => ({
      id: marker.id,
      time: marker.startTime,
      duration: marker.duration,
      schemeIdUri: AdvancedSCTE35.SchemeUris.SCTE35_XML,
      value: 'scte35'
    }))

    const periodsWithMarkers = periods.map(period => ({
      ...period,
      scte35Markers: dashMarkers.filter(marker =>
        marker.time >= 0 && marker.time < period.duration
      ),
      adaptations: period.adaptations.map(adaptation => ({
        ...adaptation,
        segments: adaptation.segments.map(segment => ({
          ...segment,
          scte35Markers: scte35Markers.filter(marker =>
            marker.time >= segment.startTime && 
            marker.time < segment.startTime + segment.duration
          ).map(marker => ({
            id: marker.id,
            time: marker.time - segment.startTime,
            duration: marker.duration,
            schemeIdUri: AdvancedSCTE35.SchemeUris.SCTE35_XML,
            value: 'scte35'
          }))
        }))
      }))
    }))

    if (includeSSAI) {
      // Generate SSAI manifest
      const originalManifest = AdvancedSCTE35.generateDASHManifest(
        baseUrl,
        periodsWithMarkers
      )

      const ssaiManifest = await this.ssaiManager.generateSSAIManifest(
        streamId,
        originalManifest,
        'dash'
      )

      // For DASH, we need to transform the SSAI manifest back to DASH format
      return this.transformSSAIToDASH(ssaiManifest, periodsWithMarkers)
    } else {
      return AdvancedSCTE35.generateDASHManifest(
        baseUrl,
        periodsWithMarkers
      )
    }
  }

  /**
   * Generate low-latency HLS manifest
   * Based on Bitmovin's Low-Latency HLS implementation
   */
  async generateLowLatencyHLS(
    streamId: string,
    segments: SegmentInfo[],
    options: ManifestGenerationOptions & {
      partDuration?: number
      preloadHint?: boolean
    }
  ): Promise<string> {
    const { baseUrl, targetDuration = 6, partDuration = 0.2, preloadHint = true } = options

    let playlist = `#EXTM3U\n`
    playlist += `#EXT-X-VERSION:9\n` // LLHLS requires version 9+
    playlist += `#EXT-X-TARGETDURATION:${targetDuration}\n`
    playlist += `#EXT-X-MEDIA-SEQUENCE:0\n`
    playlist += `#EXT-X-SERVER-CONTROL:CAN-SKIP-UNTIL=12\n` // Allow skipping segments
    playlist += `#EXT-X-PART-INF:PART-TARGET=${partDuration.toFixed(3)}\n`

    // Get SCTE-35 markers for this stream
    const scte35Markers = await this.getSCTE35MarkersForStream(streamId)

    segments.forEach((segment, index) => {
      const segmentMarkers = scte35Markers.filter(marker => 
        marker.time >= segment.startTime && 
        marker.time < segment.startTime + segment.duration
      )

      // Add SCTE-35 markers
      segmentMarkers.forEach(marker => {
        playlist += `#EXT-X-SCTE35:ID="${marker.id}",TIME=${marker.time.toFixed(3)},DURATION=${marker.duration.toFixed(3)}`
        if (marker.cueId) playlist += `,CUE="${marker.cueId}"`
        if (marker.adType) playlist += `,ADTYPE="${marker.adType}"`
        playlist += `\n`
      })

      // Add segment parts
      const partCount = Math.ceil(segment.duration / partDuration)
      for (let i = 0; i < partCount; i++) {
        const partStartTime = i * partDuration
        const partDuration = Math.min(partDuration, segment.duration - partStartTime)
        
        playlist += `#EXT-X-PART:DURATION=${partDuration.toFixed(3)},URI="${segment.url}_part${i}.ts"\n`
      }

      playlist += `#EXTINF:${segment.duration.toFixed(3)},\n`
      playlist += `${segment.url}\n`

      // Add preload hint for next segment
      if (preloadHint && index < segments.length - 1) {
        const nextSegment = segments[index + 1]
        playlist += `#EXT-X-PRELOAD-HINT:TYPE=PART,URI="${nextSegment.url}_part0.ts"\n`
      }
    })

    playlist += `#EXT-X-ENDLIST\n`
    return playlist
  }

  /**
   * Generate CMAF (Common Media Application Format) manifest
   * Based on Bitmovin's CMAF implementation
   */
  async generateCMAFManifest(
    streamId: string,
    segments: SegmentInfo[],
    options: ManifestGenerationOptions
  ): Promise<string> {
    const { baseUrl } = options

    // CMAF uses DASH manifest format with specific adaptations
    const periods = [{
      id: 'period-1',
      duration: segments.reduce((total, segment) => total + segment.duration, 0),
      adaptations: [
        {
          id: 'video-adaptation',
          contentType: 'video' as const,
          mimeType: 'video/mp4',
          codecs: 'avc1.640028',
          bandwidth: 5000000,
          segments: segments.map(segment => ({
            ...segment,
            url: segment.url.replace('.ts', '.m4v')
          }))
        },
        {
          id: 'audio-adaptation',
          contentType: 'audio' as const,
          mimeType: 'audio/mp4',
          codecs: 'mp4a.40.2',
          bandwidth: 128000,
          segments: segments.map(segment => ({
            ...segment,
            url: segment.url.replace('.ts', '.m4a')
          }))
        }
      ]
    }]

    return await this.generateDASHManifest(streamId, periods, options)
  }

  /**
   * Get SCTE-35 markers for a stream
   */
  private async getSCTE35MarkersForStream(streamId: string) {
    const adMarkers = await db.adMarker.findMany({
      where: {
        streamId
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    return adMarkers.map(marker => ({
      id: marker.id,
      cueId: marker.cueId,
      time: marker.startTime,
      duration: marker.duration,
      adType: marker.adType
    }))
  }

  /**
   * Transform SSAI manifest back to DASH format
   */
  private transformSSAIToDASH(ssaiManifest: any, periods: any[]): string {
    // This is a simplified transformation
    // In production, you would properly parse and transform the manifest
    return AdvancedSCTE35.generateDASHManifest(
      ssaiManifest.baseUrl,
      periods
    )
  }

  /**
   * Validate manifest format
   */
  validateManifest(manifest: string, type: 'hls' | 'dash'): boolean {
    try {
      if (type === 'hls') {
        return this.validateHLSManifest(manifest)
      } else {
        return this.validateDASHManifest(manifest)
      }
    } catch (error) {
      console.error('Manifest validation error:', error)
      return false
    }
  }

  private validateHLSManifest(manifest: string): boolean {
    const lines = manifest.split('\n')
    
    // Check required tags
    const requiredTags = ['#EXTM3U', '#EXT-X-VERSION', '#EXT-X-TARGETDURATION']
    for (const tag of requiredTags) {
      if (!lines.some(line => line.startsWith(tag))) {
        return false
      }
    }

    // Check segment format
    const segmentLines = lines.filter(line => !line.startsWith('#') && line.trim() !== '')
    for (const line of segmentLines) {
      if (!line.endsWith('.ts') && !line.endsWith('.m3u8')) {
        return false
      }
    }

    return true
  }

  private validateDASHManifest(manifest: string): boolean {
    try {
      // Try to parse as XML
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(manifest, 'text/xml')
      
      // Check root element
      const mpdElement = xmlDoc.getElementsByTagName('MPD')[0]
      if (!mpdElement) {
        return false
      }

      // Check required attributes
      const requiredAttrs = ['xmlns', 'profiles', 'type']
      for (const attr of requiredAttrs) {
        if (!mpdElement.hasAttribute(attr)) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get manifest generator status
   */
  getStatus(): {
    ssaiManager: any
    isConfigured: boolean
  } {
    return {
      ssaiManager: this.ssaiManager.getStatus(),
      isConfigured: this.ssaiManager.getStatus().isConfigured
    }
  }
}