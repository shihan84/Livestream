import { SCTE35Generator } from './index'

export interface HLSSCTE35Marker {
  id: string
  time: number
  duration: number
  cueId?: string
  adType: string
  description?: string
}

export interface DASHSCTE35Marker {
  id: string
  time: number
  duration: number
  schemeIdUri: string
  value: string
  cueId?: string
}

export interface SSAIManifest {
  type: 'hls' | 'dash'
  baseUrl: string
  segments: Array<{
    url: string
    duration: number
    scte35Markers?: HLSSCTE35Marker[]
  }>
  adBreaks: Array<{
    id: string
    startTime: number
    duration: number
    adType: string
    adServerUrl?: string
  }>
}

export class AdvancedSCTE35 {
  /**
   * Generate HLS manifest with SCTE-35 markers
   * Based on Bitmovin's HLS SCTE-35 implementation
   */
  static generateHLSManifest(
    baseUrl: string,
    segments: Array<{
      url: string
      duration: number
      scte35Markers?: HLSSCTE35Marker[]
    }>,
    options: {
      version?: number
      targetDuration?: number
      mediaSequence?: number
    } = {}
  ): string {
    const {
      version = 6,
      targetDuration = 10,
      mediaSequence = 0
    } = options

    let manifest = `#EXTM3U\n`
    manifest += `#EXT-X-VERSION:${version}\n`
    manifest += `#EXT-X-TARGETDURATION:${targetDuration}\n`
    manifest += `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}\n`

    segments.forEach((segment, index) => {
      // Add SCTE-35 markers before the segment
      if (segment.scte35Markers && segment.scte35Markers.length > 0) {
        segment.scte35Markers.forEach(marker => {
          manifest += `#EXT-X-SCTE35:ID="${marker.id}",TIME=${marker.time.toFixed(3)},DURATION=${marker.duration.toFixed(3)}`
          
          if (marker.cueId) {
            manifest += `,CUE="${marker.cueId}"`
          }
          
          if (marker.adType) {
            manifest += `,ADTYPE="${marker.adType}"`
          }
          
          if (marker.description) {
            manifest += `,DESC="${marker.description}"`
          }
          
          manifest += `\n`
        })
      }

      manifest += `#EXTINF:${segment.duration.toFixed(3)},\n`
      manifest += `${segment.url}\n`
    })

    manifest += `#EXT-X-ENDLIST\n`
    return manifest
  }

  /**
   * Generate DASH manifest with SCTE-35 markers
   * Based on Bitmovin's DASH SCTE-35 implementation
   */
  static generateDASHManifest(
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
          scte35Markers?: DASHSCTE35Marker[]
        }>
      }>
      scte35Markers?: DASHSCTE35Marker[]
    }>,
    options: {
      minBufferTime?: number
      suggestedPresentationDelay?: number
    } = {}
  ): string {
    const {
      minBufferTime = 2,
      suggestedPresentationDelay = 10
    } = options

    let manifest = `<?xml version="1.0" encoding="UTF-8"?>\n`
    manifest += `<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"\n`
    manifest += `     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`
    manifest += `     xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 http://standards.iso.org/ittf/PubliclyAvailableStandards/MPEG-DASH_schema_files/DASH-MPD.xsd"\n`
    manifest += `     profiles="urn:mpeg:dash:profile:isoff-live:2011"\n`
    manifest += `     type="dynamic"\n`
    manifest += `     minBufferTime="${minBufferTime}"\n`
    manifest += `     suggestedPresentationDelay="${suggestedPresentationDelay}">\n`

    periods.forEach(period => {
      manifest += `  <Period id="${period.id}" duration="PT${period.duration}S">\n`

      // Add SCTE-35 EventStream for this period
      if (period.scte35Markers && period.scte35Markers.length > 0) {
        manifest += `    <EventStream schemeIdUri="urn:scte:scte35:2013:xml" value="scte35">\n`
        period.scte35Markers.forEach(marker => {
          manifest += `      <Event presentationTime="${marker.time}" duration="${marker.duration}" id="${marker.id}">\n`
          manifest += `        <Signal xmlns="http://www.scte.org/schemas/35/2016">\n`
          manifest += `          <Binary>${this.encodeSCTE35ToBase64(marker)}</Binary>\n`
          manifest += `        </Signal>\n`
          manifest += `      </Event>\n`
        })
        manifest += `    </EventStream>\n`
      }

      period.adaptations.forEach(adaptation => {
        manifest += `    <AdaptationSet id="${adaptation.id}" contentType="${adaptation.contentType}" mimeType="${adaptation.mimeType}" codecs="${adaptation.codecs}" bandwidth="${adaptation.bandwidth}">\n`
        manifest += `      <SegmentTemplate timescale="90000">\n`
        manifest += `        <SegmentTimeline>\n`

        adaptation.segments.forEach(segment => {
          manifest += `          <S t="${segment.duration * 90000}" d="${segment.duration * 90000}">\n`
          
          // Add SCTE-35 markers within segments
          if (segment.scte35Markers && segment.scte35Markers.length > 0) {
            segment.scte35Markers.forEach(marker => {
              manifest += `            <SCTE35 schemeIdUri="${marker.schemeIdUri}" value="${marker.value}" time="${marker.time}" duration="${marker.duration}"/>\n`
            })
          }
          
          manifest += `          </S>\n`
        })

        manifest += `        </SegmentTimeline>\n`
        manifest += `      </SegmentTemplate>\n`
        manifest += `    </AdaptationSet>\n`
      })

      manifest += `  </Period>\n`
    })

    manifest += `</MPD>\n`
    return manifest
  }

  /**
   * Generate SSAI (Server-Side Ad Insertion) manifest
   * Based on Bitmovin's SSAI implementation
   */
  static generateSSAIManifest(
    originalManifest: string,
    adBreaks: Array<{
      id: string
      startTime: number
      duration: number
      adType: string
      adServerUrl?: string
    }>,
    options: {
      type: 'hls' | 'dash'
      adDecisionServer?: string
      adTracking?: boolean
    }
  ): SSAIManifest {
    const { type, adDecisionServer, adTracking = true } = options

    // Parse original manifest and transform it
    const baseUrl = this.extractBaseUrl(originalManifest)
    const segments = this.extractSegments(originalManifest, type)

    // Insert ad breaks into segments
    const transformedSegments = this.insertAdBreaks(segments, adBreaks)

    return {
      type,
      baseUrl,
      segments: transformedSegments,
      adBreaks
    }
  }

  /**
   * Create SCTE-35 segmentation descriptor
   * Enhanced version with more detailed segmentation information
   */
  static createSegmentationDescriptor(
    segmentationEventId: string,
    segmentationTypeId: number,
    segmentNum: number,
    segmentsExpected: number,
    options: {
      subSegmentNum?: number
      subSegmentsExpected?: number
      duration?: number
      deliveryNotRestricted?: boolean
      componentCount?: number
    } = {}
  ): Buffer {
    const {
      subSegmentNum,
      subSegmentsExpected,
      duration,
      deliveryNotRestricted = true,
      componentCount = 0
    } = options

    const descriptor = Buffer.alloc(20 + (componentCount * 6))

    // Descriptor tag (0x02 for segmentation descriptor)
    descriptor[0] = 0x02
    
    // Descriptor length (will be calculated)
    descriptor[1] = 0x00
    
    // Identifier (0x43554549 for 'CUEI')
    descriptor.writeUInt32BE(0x43554549, 2)
    
    // Segmentation event ID
    descriptor.writeUInt32BE(parseInt(segmentationEventId, 16), 6)
    
    // Segmentation event cancel indicator (0 for active)
    descriptor[10] = 0x00
    
    // Program segmentation flag (1 for program-level)
    descriptor[11] = 0x01
    
    // Segmentation duration flag
    descriptor[12] = duration ? 0x01 : 0x00
    
    // Delivery not restricted flag
    descriptor[13] = deliveryNotRestricted ? 0x01 : 0x00
    
    // Component tag (not used for program segmentation)
    descriptor[14] = 0xFF
    
    // Segmentation type ID
    descriptor[15] = segmentationTypeId
    
    // Segment number
    descriptor[16] = segmentNum & 0xFF
    descriptor[17] = (segmentNum >> 8) & 0xFF
    descriptor[18] = (segmentNum >> 16) & 0xFF
    descriptor[19] = (segmentNum >> 24) & 0xFF
    
    // Segments expected
    descriptor[20] = segmentsExpected & 0xFF
    descriptor[21] = (segmentsExpected >> 8) & 0xFF
    descriptor[22] = (segmentsExpected >> 16) & 0xFF
    descriptor[23] = (segmentsExpected >> 24) & 0xFF
    
    let offset = 24
    
    // Sub segment number (if provided)
    if (subSegmentNum !== undefined) {
      descriptor[offset] = subSegmentNum & 0xFF
      descriptor[offset + 1] = (subSegmentNum >> 8) & 0xFF
      descriptor[offset + 2] = (subSegmentNum >> 16) & 0xFF
      descriptor[offset + 3] = (subSegmentNum >> 24) & 0xFF
      offset += 4
      
      // Sub segments expected (if provided)
      if (subSegmentsExpected !== undefined) {
        descriptor[offset] = subSegmentsExpected & 0xFF
        descriptor[offset + 1] = (subSegmentsExpected >> 8) & 0xFF
        descriptor[offset + 2] = (subSegmentsExpected >> 16) & 0xFF
        descriptor[offset + 3] = (subSegmentsExpected >> 24) & 0xFF
        offset += 4
      }
    }
    
    // Duration (if provided)
    if (duration) {
      const duration90kHz = Math.floor(duration * 90000)
      descriptor[offset] = (duration90kHz >> 24) & 0xFF
      descriptor[offset + 1] = (duration90kHz >> 16) & 0xFF
      descriptor[offset + 2] = (duration90kHz >> 8) & 0xFF
      descriptor[offset + 3] = duration90kHz & 0xFF
      offset += 4
    }
    
    // Update descriptor length
    descriptor[1] = offset - 2
    
    return descriptor.slice(0, offset)
  }

  /**
   * Create time signal command for precise timing
   */
  static createTimeSignal(ptsTime: number): Buffer {
    const command = Buffer.alloc(5)
    
    // Time specified flag
    command[0] = 0x01
    
    // Reserved bits
    command[1] = 0x3F
    
    // PTS time (90kHz clock units)
    command[2] = (ptsTime >> 24) & 0xFF
    command[3] = (ptsTime >> 16) & 0xFF
    command[4] = (ptsTime >> 8) & 0xFF
    command[5] = ptsTime & 0xFF
    
    return command
  }

  /**
   * Encode SCTE-35 marker to base64 for DASH manifests
   */
  private static encodeSCTE35ToBase64(marker: DASHSCTE35Marker): string {
    // Create a simplified SCTE-35 packet for encoding
    const packet = SCTE35Generator.generateSpliceInsert({
      cueId: marker.id,
      startTime: marker.time,
      duration: marker.duration,
      adType: 'PROGRAM'
    })
    
    return packet.toString('base64')
  }

  /**
   * Extract base URL from manifest
   */
  private static extractBaseUrl(manifest: string): string {
    // Simple implementation - in production, parse manifest properly
    const lines = manifest.split('\n')
    for (const line of lines) {
      if (line.startsWith('#EXT-X-STREAM-INF:') || line.includes('.m3u8')) {
        return line.split(',')[1] || ''
      }
    }
    return ''
  }

  /**
   * Extract segments from manifest
   */
  private static extractSegments(manifest: string, type: 'hls' | 'dash') {
    // Simplified implementation - in production, use proper manifest parser
    return []
  }

  /**
   * Insert ad breaks into segments
   */
  private static insertAdBreaks(segments: any[], adBreaks: any[]) {
    // Simplified implementation - in production, use proper timing logic
    return segments
  }

  /**
   * Common segmentation type IDs according to SCTE-35 standard
   */
  static readonly SegmentationTypes = {
    PROGRAM_START: 0x00,
    PROGRAM_END: 0x01,
    PROGRAM_EARLY_TERMINATION: 0x02,
    PROGRAM_BREAK_START: 0x10,
    PROGRAM_BREAK_END: 0x11,
    CHAPTER_START: 0x30,
    CHAPTER_END: 0x31,
    PROVIDER_ADVERTISEMENT_START: 0x16,
    PROVIDER_ADVERTISEMENT_END: 0x17,
    DISTRIBUTOR_ADVERTISEMENT_START: 0x18,
    DISTRIBUTOR_ADVERTISEMENT_END: 0x19,
    PROVIDER_OVERLAY_START: 0x20,
    PROVIDER_OVERLAY_END: 0x21,
    PROGRAM_BLACKOUT_START: 0x22,
    PROGRAM_BLACKOUT_END: 0x23
  }

  /**
   * Common scheme URIs for DASH SCTE-35
   */
  static readonly SchemeUris = {
    SCTE35: 'urn:scte:scte35:2013:xml',
    SCTE35_BINARY: 'urn:scte:scte35:2013:bin',
    SCTE35_XML: 'urn:scte:scte35:2016:xml'
  }
}