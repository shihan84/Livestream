export interface SCTE35Marker {
  cueId?: string
  startTime: number
  duration: number
  adType: string
  description?: string
  spliceEventId?: string
  spliceImmediate?: boolean
  outOfNetwork?: boolean
  programId?: string
  availNum?: number
  availsExpected?: number
}

export class SCTE35Generator {
  private static readonly SPLICE_COMMAND_TYPES = {
    SPLICE_NULL: 0x00,
    SPLICE_SCHEDULE: 0x04,
    SPLICE_INSERT: 0x05,
    TIME_SIGNAL: 0x06,
    BANDWIDTH_RESERVATION: 0x07,
    PRIVATE_COMMAND: 0xFF
  }

  private static readonly DESCRIPTOR_TAGS = {
    AVAIL_DESCRIPTOR: 0x00,
    DTMF_DESCRIPTOR: 0x01,
    SEGMENTATION_DESCRIPTOR: 0x02,
    TIME_DESCRIPTOR: 0x03,
    AUDIO_DESCRIPTOR: 0x04
  }

  static generateSpliceInsert(marker: SCTE35Marker): Buffer {
    const spliceEventId = marker.spliceEventId || this.generateSpliceEventId()
    const spliceImmediate = marker.spliceImmediate || false
    const outOfNetwork = marker.outOfNetwork || false
    const programId = marker.programId || '0x0000'
    const availNum = marker.availNum || 0
    const availsExpected = marker.availsExpected || 0

    // Create SCTE-35 packet structure
    const packet = Buffer.alloc(188) // Standard TS packet size
    
    // TS Header
    packet[0] = 0x47 // Sync byte
    packet[1] = 0x40 // Payload unit start indicator
    packet[2] = 0x1F // PID low bits (0x1FFF = null packet)
    packet[3] = 0xFF // PID high bits
    
    // Adaptation field and payload
    packet[4] = 0x00 // No adaptation field
    
    // Pointer field
    packet[5] = 0x00 // No pointer field
    
    // Table ID (SCTE-35)
    packet[6] = 0xFC // SCTE-35 table ID
    
    // Section syntax indicator and private indicator
    packet[7] = 0x80 // Section syntax indicator
    
    // Section length (will be calculated)
    packet[8] = 0x00 // Section length high
    packet[9] = 0x00 // Section length low
    
    // Protocol version
    packet[10] = 0x00 // Protocol version
    
    // Encrypted packet
    packet[11] = 0x00 // Not encrypted
    
    // Encryption algorithm
    packet[12] = 0x00 // No encryption
    
    // PTS adjustment
    packet[13] = 0x00 // PTS adjustment (7 bytes)
    packet[14] = 0x00
    packet[15] = 0x00
    packet[16] = 0x00
    packet[17] = 0x00
    packet[18] = 0x00
    packet[19] = 0x00
    
    // CW index
    packet[20] = 0x00 // No CW
    
    // Tier
    packet[21] = 0x00 // No tier
    
    // Splice command length
    packet[22] = 0x00 // Command length (will be calculated)
    
    // Splice command type (SPLICE_INSERT)
    packet[23] = this.SPLICE_COMMAND_TYPES.SPLICE_INSERT
    
    // Splice event ID (4 bytes)
    const eventIdBuffer = Buffer.from(spliceEventId, 'hex')
    packet[24] = eventIdBuffer[0]
    packet[25] = eventIdBuffer[1]
    packet[26] = eventIdBuffer[2]
    packet[27] = eventIdBuffer[3]
    
    // Splice event cancel indicator
    packet[28] = 0x00 // Not cancelled
    
    // Out of network indicator
    packet[29] = outOfNetwork ? 0x01 : 0x00
    
    // Program splice flag
    packet[30] = 0x01 // Program splice
    
    // Duration flag
    packet[31] = 0x01 // Has duration
    
    // Splice immediate flag
    packet[32] = spliceImmediate ? 0x01 : 0x00
    
    // Reserved
    packet[33] = 0x3F // Reserved bits
    
    // Program splice time (if not immediate)
    if (!spliceImmediate) {
      // Convert startTime to 90kHz clock units
      const time90kHz = Math.floor(marker.startTime * 90000)
      packet[34] = (time90kHz >> 24) & 0xFF
      packet[35] = (time90kHz >> 16) & 0xFF
      packet[36] = (time90kHz >> 8) & 0xFF
      packet[37] = time90kHz & 0xFF
    }
    
    // Duration (in 90kHz clock units)
    const duration90kHz = Math.floor(marker.duration * 90000)
    const durationOffset = spliceImmediate ? 34 : 38
    packet[durationOffset] = (duration90kHz >> 24) & 0xFF
    packet[durationOffset + 1] = (duration90kHz >> 16) & 0xFF
    packet[durationOffset + 2] = (duration90kHz >> 8) & 0xFF
    packet[durationOffset + 3] = duration90kHz & 0xFF
    
    // Unique program ID
    packet[durationOffset + 4] = 0x00
    packet[durationOffset + 5] = 0x00
    
    // Avail num
    packet[durationOffset + 6] = availNum
    
    // Avails expected
    packet[durationOffset + 7] = availsExpected
    
    // Calculate section length
    const sectionLength = spliceImmediate ? 20 : 24
    packet[8] = (sectionLength >> 8) & 0xFF
    packet[9] = sectionLength & 0xFF
    
    // Calculate command length
    const commandLength = spliceImmediate ? 15 : 19
    packet[22] = commandLength
    
    return packet
  }

  static generateSpliceNull(): Buffer {
    const packet = Buffer.alloc(188)
    
    // TS Header
    packet[0] = 0x47 // Sync byte
    packet[1] = 0x40 // Payload unit start indicator
    packet[2] = 0x1F // PID low bits
    packet[3] = 0xFF // PID high bits
    
    // Adaptation field and payload
    packet[4] = 0x00 // No adaptation field
    
    // Pointer field
    packet[5] = 0x00 // No pointer field
    
    // Table ID (SCTE-35)
    packet[6] = 0xFC // SCTE-35 table ID
    
    // Section syntax indicator and private indicator
    packet[7] = 0x80 // Section syntax indicator
    
    // Section length
    packet[8] = 0x00
    packet[9] = 0x0B // 11 bytes
    
    // Protocol version
    packet[10] = 0x00 // Protocol version
    
    // Encrypted packet
    packet[11] = 0x00 // Not encrypted
    
    // Encryption algorithm
    packet[12] = 0x00 // No encryption
    
    // PTS adjustment
    packet[13] = 0x00
    packet[14] = 0x00
    packet[15] = 0x00
    packet[16] = 0x00
    packet[17] = 0x00
    packet[18] = 0x00
    packet[19] = 0x00
    
    // CW index
    packet[20] = 0x00 // No CW
    
    // Tier
    packet[21] = 0x00 // No tier
    
    // Splice command length
    packet[22] = 0x00 // 0 bytes
    
    // Splice command type (SPLICE_NULL)
    packet[23] = this.SPLICE_COMMAND_TYPES.SPLICE_NULL
    
    return packet
  }

  static generateTimeSignal(pts: number): Buffer {
    const packet = Buffer.alloc(188)
    
    // TS Header
    packet[0] = 0x47 // Sync byte
    packet[1] = 0x40 // Payload unit start indicator
    packet[2] = 0x1F // PID low bits
    packet[3] = 0xFF // PID high bits
    
    // Adaptation field and payload
    packet[4] = 0x00 // No adaptation field
    
    // Pointer field
    packet[5] = 0x00 // No pointer field
    
    // Table ID (SCTE-35)
    packet[6] = 0xFC // SCTE-35 table ID
    
    // Section syntax indicator and private indicator
    packet[7] = 0x80 // Section syntax indicator
    
    // Section length
    packet[8] = 0x00
    packet[9] = 0x0F // 15 bytes
    
    // Protocol version
    packet[10] = 0x00 // Protocol version
    
    // Encrypted packet
    packet[11] = 0x00 // Not encrypted
    
    // Encryption algorithm
    packet[12] = 0x00 // No encryption
    
    // PTS adjustment
    packet[13] = 0x00
    packet[14] = 0x00
    packet[15] = 0x00
    packet[16] = 0x00
    packet[17] = 0x00
    packet[18] = 0x00
    packet[19] = 0x00
    
    // CW index
    packet[20] = 0x00 // No CW
    
    // Tier
    packet[21] = 0x00 // No tier
    
    // Splice command length
    packet[22] = 0x05 // 5 bytes
    
    // Splice command type (TIME_SIGNAL)
    packet[23] = this.SPLICE_COMMAND_TYPES.TIME_SIGNAL
    
    // Time specification
    packet[24] = 0x01 // Has PTS
    
    // PTS (90kHz clock units)
    packet[25] = (pts >> 24) & 0xFF
    packet[26] = (pts >> 16) & 0xFF
    packet[27] = (pts >> 8) & 0xFF
    packet[28] = pts & 0xFF
    
    return packet
  }

  private static generateSpliceEventId(): string {
    // Generate a random 4-byte hex string
    const bytes = Buffer.alloc(4)
    for (let i = 0; i < 4; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
    return bytes.toString('hex')
  }

  static parseAdType(adType: string): number {
    switch (adType) {
      case 'PROGRAM':
        return 0x00
      case 'PROVIDER_ADVERTISEMENT':
        return 0x01
      case 'DISTRIBUTOR_ADVERTISEMENT':
        return 0x02
      case 'NETWORK_ADVERTISEMENT':
        return 0x03
      case 'LOCAL_ADVERTISEMENT':
        return 0x04
      default:
        return 0x00
    }
  }

  static formatHex(buffer: Buffer): string {
    return buffer.toString('hex').toUpperCase().match(/.{2}/g)?.join(' ') || ''
  }
}