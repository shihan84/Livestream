# 🔄 Complete Video and SCTE-35 Processing Flow

## 📋 Overview

This document provides a comprehensive explanation of the complete video and SCTE-35 processing flow for live streaming, designed specifically for content creators who need to push their streams to distributor-provided SRT servers with full SCTE-35 ad marker support.

**Based on industry best practices from Bitmovin and other leading streaming platforms.**

---

## 🎯 What is SCTE-35?

### Understanding SCTE-35 Markers

**SCTE-35** (Society of Cable Telecommunications Engineers - 35) is the industry standard for signaling ad insertion opportunities in video streams. It enables:

- **Ad Break Signaling**: Markers that indicate when ads should start and end
- **Program Boundary Identification**: Distinguishes between content and commercial breaks
- **Seamless Ad Insertion**: Allows for frame-accurate ad insertion without viewer disruption
- **Multi-Platform Compatibility**: Works across HLS, DASH, and other streaming formats

### Why Use SCTE-35?

1. **Industry Standard**: Adopted by all major broadcasters and streaming platforms
2. **Revenue Generation**: Enables dynamic ad insertion for monetization
3. **Viewer Experience**: Provides seamless transitions between content and ads
4. **Compliance**: Meets broadcaster and distributor requirements
5. **Flexibility**: Supports various ad types and insertion methods

---

## 🏗️ Complete Architecture Overview

### High-Level Flow Diagram
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OBS Studio    │    │  Local Server   │    │   Distributor    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Video Source │ │    │ │RTMP Server  │ │    │ │SRT Server   │ │
│ │(Camera/Screen)│ │───▶│ │             │ │───▶│ │             │ │
│ └─────────────┘ │    │ │             │ │    │ │             │ │
│                 │    │ │             │ │    │ │             │ │
│ ┌─────────────┐ │    │ │SCTE-35      │ │    │ │SSAI/Ad      │ │
│ │Audio Source │ │    │ │Injector     │ │    │ │Insertion    │ │
│ └─────────────┘ │    │ │             │ │    │ │System       │ │
│                 │    │ │             │ │    │ │             │ │
│ ┌─────────────┐ │    │ │WebSocket    │ │    │ │HLS/DASH     │ │
│ │Stream Output│ │    │ │Server       │ │    │ │Packager    │ │
│ └─────────────┘ │    │ │             │ │    │ │             │ │
└─────────────────┘    │ └─────────────┘ │    │ └─────────────┘ │
                       └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Dashboard     │    │   End Users     │
                       │                 │    │                 │
                       │ ┌─────────────┐ │    │ ┌─────────────┐ │
                       │ │Stream Mgmt  │ │    │ │Video Player │ │
                       │ │             │ │    │ │             │ │
                       │ │Ad Marker    │ │    │ │             │ │
                       │ │Control      │ │    │ │             │ │
                       │ │             │ │    │ │             │ │
                       │ │Analytics    │ │    │ │Analytics    │ │
                       │ │Dashboard    │ │    │ │Collection   │ │
                       │ └─────────────┘ │    │ └─────────────┘ │
                       └─────────────────┘    └─────────────────┘
```

---

## 📺 1. Video Input Stage

### Your Broadcasting Software (OBS Studio)
```
Video Source (Camera/Screen) → OBS Studio → Local RTMP Output
```

**Processing:**
- **Video Encoding**: OBS encodes video using H.264/H.265
- **Audio Encoding**: OBS encodes audio using AAC
- **Container**: Wraps in FLV container for RTMP transmission
- **Output**: Sends to local RTMP server

**Recommended OBS Settings for Live Streaming:**
```yaml
Video:
  Encoder: x264
  Rate Control: CBR
  Bitrate: 5000-8000 Kbps (1080p30)
  Keyframe Interval: 2 seconds
  Profile: high
  Tune: zerolatency

Audio:
  Bitrate: 128-192 Kbps
  Sample Rate: 48 kHz
  Channels: 2 (Stereo)
  Codec: AAC
```

**Libraries Used:**
- **OBS Studio**: Uses `libx264` (H.264) or `libx265` (H.265) for video encoding
- **FFmpeg Integration**: OBS uses FFmpeg libraries for media processing
- **Audio Codecs**: `libfdk_aac` or `libfaac` for AAC audio encoding

---

## 🖥️ 2. Local RTMP Server Stage

### Node-Media-Server (Local Ingest)
```
RTMP Input → Node-Media-Server → Raw Video/Audio Buffers
```

**Processing:**
- **RTMP Protocol Handling**: Receives RTMP stream from OBS
- **Demuxing**: Extracts raw video and audio data from FLV container
- **Buffer Management**: Maintains circular buffers for smooth streaming
- **Event Emission**: Triggers WebSocket events for stream status

**Advanced Features:**
- **Stream Authentication**: Secure stream key validation
- **Multiple Bitrate Support**: Adaptive bitrate streaming preparation
- **Recording**: Optional local recording capability
- **Transcoding**: On-the-fly format conversion

**Libraries Used:**
- **Node-Media-Server**: `node-media-server` package
- **RTMP Parser**: Custom RTMP protocol implementation
- **Buffer Management**: Node.js Buffer API
- **Event System**: Node.js EventEmitter

---

## 🚀 3. FFmpeg SRT Pusher Stage

### Video Processing and Forwarding
```
Raw Video/Audio → FFmpeg Processing → SRT Protocol → Distributor Server
```

**Processing:**
- **Input Handling**: Reads from local RTMP or file source
- **Video Transcoding**: Optional re-encoding (bitrate, resolution, FPS)
- **Audio Processing**: Audio encoding and bitrate adjustment
- **SRT Packetization**: Wraps MPEG-TS in SRT packets
- **Error Correction**: SRT's built-in error recovery and retransmission

**SRT Protocol Advantages:**
- **Secure Reliable Transport**: Encrypted and reliable transmission
- **Low Latency**: Typically 2-5ms additional latency
- **Error Recovery**: Automatic packet retransmission
- **Network Resilience**: Handles packet loss and network congestion

**Libraries Used:**
- **FFmpeg**: `fluent-ffmpeg` wrapper with native FFmpeg binaries
- **Video Codecs**: `libx264`, `libx265`, `libvpx` (VP8/VP9)
- **Audio Codecs**: `libfdk_aac`, `libfaac`, `libopus`
- **SRT Protocol**: `libsrt` (via FFmpeg SRT support)
- **MPEG-TS Muxer**: FFmpeg's MPEG-TS muxer

**FFmpeg Command Structure:**
```bash
ffmpeg -i rtmp://localhost:1935/live/stream-key \
       -c:v libx264 -b:v 5000k -preset veryfast -tune zerolatency \
       -c:a aac -b:a 128k -ar 48000 \
       -f mpegts -mpegts_original_timestamps 1 \
       -muxrate 6000k \
       -flush_packets 1 \
       srt://distributor-server:9999?streamid=your-stream&passphrase=your-secret
```

**Advanced FFmpeg Options:**
```bash
# For SCTE-35 injection
ffmpeg -i rtmp://localhost:1935/live/stream-key \
       -c:v libx264 -b:v 5000k \
       -c:a aac -b:a 128k \
       -f mpegts \
       -mpegts_service_type digital_tv \
       -metadata service_provider="Your Service" \
       -metadata service_name="Your Stream" \
       srt://distributor-server:9999?streamid=your-stream
```

---

## 🎬 4. SCTE-35 Ad Marker System

### SCTE-35 Generation and Injection
```
Ad Marker Database → SCTE-35 Generator → MPEG-TS Injection → SRT Transmission
```

### SCTE-35 Standards Compliance

Our implementation follows the **SCTE 35 2013** standard, which defines:

- **Splice Information Table (SIT)**: Contains ad insertion commands
- **Splice Commands**: Different types of ad insertion triggers
- **Time Signal Commands**: For precise timing control
- **Segmentation Descriptors**: For detailed ad break information

### SCTE-35 Command Types

| Command Type | Value | Description |
|--------------|-------|-------------|
| SPLICE_NULL | 0x00 | Null splice command (no operation) |
| SPLICE_SCHEDULE | 0x04 | Schedule a future splice event |
| SPLICE_INSERT | 0x05 | Insert an immediate splice event |
| TIME_SIGNAL | 0x06 | Time signal for synchronization |
| BANDWIDTH_RESERVATION | 0x07 | Reserve bandwidth for future splices |
| PRIVATE_COMMAND | 0xFF | Private command for custom use |

### Processing Flow:
1. **Ad Marker Scheduling**: Time-based trigger system
2. **SCTE-35 Packet Generation**: Creates binary SCTE-35 packets
3. **MPEG-TS Injection**: Inserts SCTE-35 packets into transport stream
4. **Timing Synchronization**: Ensures precise ad marker timing

**Libraries Used:**
- **SCTE-35 Generator**: Custom implementation (`/src/lib/scte35/index.ts`)
- **Binary Packet Creation**: Node.js Buffer API
- **Timing System**: JavaScript Date/Time APIs
- **MPEG-TS Manipulation**: Custom TS packet handling

### SCTE-35 Packet Structure:
```typescript
// SCTE-35 Splice Insert Packet
interface SCTE35SpliceInsert {
  tableId: number;           // 0xFC - SCTE-35 table ID
  sectionSyntaxIndicator: boolean;
  privateIndicator: boolean;
  sectionLength: number;     // Section length
  protocolVersion: number;   // 0 - Protocol version
  encryptedPacket: number;   // 0 - Not encrypted
  encryptionAlgorithm: number;
  ptsAdjustment: number;    // PTS adjustment (90kHz clock)
  cwIndex: number;          // Control word index
  tier: number;             // Tier
  spliceCommandLength: number; // Command length
  spliceCommandType: number; // 0x05 - SPLICE_INSERT
  spliceEventId: number;    // Unique event identifier
  spliceEventCancelIndicator: boolean;
  outOfNetworkIndicator: boolean;
  programSpliceFlag: boolean;
  durationFlag: boolean;
  spliceImmediateFlag: boolean;
  timeSignal?: {           // Present if not immediate
    timeSpecifiedFlag: boolean;
    ptsTime: number;       // Presentation time stamp
  };
  duration?: {             // Present if duration flag is set
    autoReturn: boolean;
    reserved: number;
    duration: number;      // Duration in 90kHz clock units
  };
  uniqueProgramId: number;
  availNum: number;
  availsExpected: number;
}
```

### SCTE-35 Descriptor Types:
```typescript
interface AvailDescriptor {
  tag: number;             // 0x00 - Avail descriptor
  length: number;
  identifier: number;     // 0x43554549 ('CUEI')
  providerAvailId: number;
}
```

### Advanced SCTE-35 Features:

**1. Segmentation Descriptors:**
```typescript
interface SegmentationDescriptor {
  tag: number;             // 0x02 - Segmentation descriptor
  length: number;
  identifier: number;     // 0x43554549 ('CUEI')
  segmentationEventId: number;
  segmentationEventCancelIndicator: boolean;
  programSegmentationFlag: boolean;
  segmentationDurationFlag: boolean;
  deliveryNotRestrictedFlag: boolean;
  componentCount: number;
  components?: Component[];
  segmentationTypeId: number;
  segmentNum: number;
  segmentsExpected: number;
  subSegmentNum?: number;
  subSegmentsExpected?: number;
}
```

**2. Time Signal Commands:**
```typescript
interface TimeSignalCommand {
  timeSpecifiedFlag: boolean;
  ptsTime: number;        // 90kHz clock units
}
```

---

## 📡 5. Distributor Integration

### SSAI (Server-Side Ad Insertion)
```
SRT Stream + SCTE-35 → Distributor SSAI → HLS/DASH with Ads
```

**Distributor Processing:**
- **SCTE-35 Parsing**: Extracts ad insertion cues from the stream
- **Ad Decision Server**: Determines which ads to insert
- **Manifest Manipulation**: Creates modified HLS/DASH manifests
- **Ad Stitching**: Seamlessly inserts ads into the stream
- **Multi-Platform Delivery**: Serves content to various devices

**HLS with SCTE-35:**
```m3u8
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

# Master playlist with SCTE-35 markers
#EXT-X-SCTE35:ID="cue-001",TIME=300.0,DURATION=30.0
#EXTINF:10.0,
segment_001.ts

#EXT-X-SCTE35:ID="cue-002",TIME=600.0,DURATION=60.0
#EXTINF:10.0,
segment_002.ts
```

**DASH with SCTE-35:**
```xml
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011">
  <Period>
    <AdaptationSet>
      <ContentComponent contentType="video"/>
      <Representation bandwidth="5000000">
        <SegmentTemplate>
          <!-- SCTE-35 markers embedded in segments -->
        </SegmentTemplate>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>
```

---

## 🔄 6. Real-time Monitoring and Control

### WebSocket Communication Layer
```
Stream Statistics → WebSocket → Dashboard Updates
```

**Processing:**
- **FFmpeg Output Parsing**: Extracts frame rate, bitrate, and timing
- **Stream Health Monitoring**: Tracks packet loss and latency
- **Real-time Updates**: Pushes statistics to dashboard via WebSocket
- **Event Handling**: Manages stream start/stop events

**Advanced Monitoring Metrics:**
```typescript
interface StreamMetrics {
  video: {
    bitrate: number;        // Video bitrate in kbps
    framerate: number;      // Video framerate
    resolution: string;     // Video resolution
    codec: string;          // Video codec
    keyframeInterval: number; // Keyframe interval
  };
  audio: {
    bitrate: number;        // Audio bitrate in kbps
    samplerate: number;     // Audio sample rate
    channels: number;       // Audio channels
    codec: string;          // Audio codec
  };
  network: {
    latency: number;        // Network latency in ms
    packetLoss: number;     // Packet loss percentage
    bandwidth: number;      // Available bandwidth
    srtStats: {             // SRT-specific statistics
      recvRate: number;    // Receive rate
      sendRate: number;    // Send rate
      retransmits: number; // Retransmissions
    };
  };
  system: {
    cpuUsage: number;      // CPU usage percentage
    memoryUsage: number;   // Memory usage percentage
    diskUsage: number;     // Disk usage percentage
  };
}
```

**Libraries Used:**
- **WebSocket**: `socket.io` client and server
- **Event System**: Node.js EventEmitter
- **Statistics Processing**: Custom regex parsing
- **Real-time Database**: Prisma with SQLite

---

## 💾 7. Database and State Management

### Stream and Ad Marker Storage
```
Stream Configuration → Prisma ORM → SQLite Database
```

**Processing:**
- **Stream Metadata**: Stores stream configuration and status
- **Ad Marker Management**: Tracks SCTE-35 markers and insertion status
- **Analytics Storage**: Records stream performance metrics
- **State Synchronization**: Maintains real-time stream state

**Enhanced Database Schema:**
```sql
-- Streams table stores stream configuration
CREATE TABLE streams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  streamKey TEXT UNIQUE,
  externalSrtUrl TEXT,           -- Distributor SRT URL
  externalRtmpUrl TEXT,          -- Optional RTMP fallback
  srtPassphrase TEXT,           -- SRT encryption passphrase
  status TEXT DEFAULT 'OFFLINE',
  isLive BOOLEAN DEFAULT FALSE,
  viewerCount INTEGER DEFAULT 0,
  bitrate INTEGER,
  resolution TEXT,
  fps INTEGER,
  startTime DATETIME,
  endTime DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced ad markers table with SCTE-35 compliance
CREATE TABLE ad_markers (
  id TEXT PRIMARY KEY,
  streamId TEXT NOT NULL,
  cueId TEXT,
  startTime REAL NOT NULL,        -- Seconds from stream start
  duration REAL NOT NULL,         -- Duration in seconds
  adType TEXT DEFAULT 'PROGRAM',
  description TEXT,
  isInserted BOOLEAN DEFAULT FALSE,
  insertionTime DATETIME,
  spliceEventId TEXT,             -- SCTE-35 splice event ID
  segmentationEventId TEXT,        -- SCTE-35 segmentation event ID
  providerAvailId TEXT,           -- Provider availability ID
  autoReturn BOOLEAN DEFAULT TRUE, -- Auto-return after ad break
  availNum INTEGER DEFAULT 0,      -- Availability number
  availsExpected INTEGER DEFAULT 0, -- Expected availabilities
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table stores stream performance data
CREATE TABLE stream_analytics (
  id TEXT PRIMARY KEY,
  streamId TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  viewerCount INTEGER DEFAULT 0,
  bitrate INTEGER,
  bandwidth INTEGER,
  cpuUsage REAL,
  memoryUsage REAL,
  networkLatency INTEGER,
  packetLoss REAL,
  srtRetransmits INTEGER,
  srtRecvRate INTEGER,
  srtSendRate INTEGER
);

-- SCTE-35 packet log for debugging
CREATE TABLE scte35_logs (
  id TEXT PRIMARY KEY,
  streamId TEXT NOT NULL,
  cueId TEXT,
  packetData TEXT,               -- Hex representation of SCTE-35 packet
  insertionTime DATETIME,
  success BOOLEAN DEFAULT TRUE,
  errorMessage TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Libraries Used:**
- **Database**: SQLite with Prisma ORM
- **Query Builder**: Prisma Client
- **Type Safety**: TypeScript integration
- **Migrations**: Prisma migration system

---

## 🏗️ Detailed Processing Architecture

### Video Processing Pipeline:
```
1. Video Capture (OBS)
   ↓
2. Encoding (libx264/libx265)
   ↓
3. RTMP Wrapping (FLV Container)
   ↓
4. Local RTMP Server (Node-Media-Server)
   ↓
5. FFmpeg Processing (fluent-ffmpeg)
   ├── Video Transcoding (Optional)
   ├── Audio Processing
   ├── Format Conversion (MPEG-TS)
   ├── SCTE-35 Injection
   └── SRT Packetization
   ↓
6. SRT Protocol (libsrt)
   ↓
7. Distributor SRT Server
   ↓
8. SSAI Processing (Distributor Side)
   ↓
9. HLS/DASH Packaging
   ↓
10. End User Viewing
```

### SCTE-35 Processing Pipeline:
```
1. Ad Marker Creation (Dashboard)
   ↓
2. Database Storage (Prisma + SQLite)
   ↓
3. Timing Scheduler (Node.js Timers)
   ↓
4. SCTE-35 Generator (Custom Implementation)
   ↓
5. Binary Packet Creation (Node.js Buffer)
   ↓
6. MPEG-TS Injection (FFmpeg)
   ↓
7. SRT Transmission (libsrt)
   ↓
8. Distributor Processing
   ↓
9. SSAI Ad Insertion
   ↓
10. End User Ad Experience
```

---

## 📚 Key Libraries and Their Roles:

### Core Video Processing:
- **FFmpeg**: The backbone of all video processing
  - Video encoding/decoding
  - Format conversion (RTMP → MPEG-TS)
  - SRT protocol support
  - SCTE-35 packet injection

- **Node-Media-Server**: Local RTMP ingestion
  - RTMP protocol handling
  - Stream management
  - Event generation

### SCTE-35 Processing:
- **Custom SCTE-35 Generator** (`/src/lib/scte35/index.ts`)
  - Binary SCTE-35 packet creation
  - Splice insert command generation
  - Time synchronization
  - MPEG-TS packet formatting
  - Standards compliance (SCTE 35 2013)

### Communication and Control:
- **Socket.IO**: Real-time communication
  - Dashboard updates
  - Stream control commands
  - Statistics broadcasting

- **Prisma ORM**: Database management
  - Stream configuration storage
  - Ad marker persistence
  - Analytics data storage

### Stream Pushing:
- **SRT Pusher** (`/src/lib/srt-pusher.ts`)
  - FFmpeg process management
  - Stream health monitoring
  - Error handling and recovery

---

## ⚡ Performance Considerations:

### Video Processing:
- **CPU Usage**: FFmpeg transcoding requires significant CPU resources
- **Memory Usage**: Buffer management for smooth streaming
- **Network Latency**: SRT adds minimal overhead (typically 2-5ms)
- **Quality Preservation**: Lossless transcoding when possible

### SCTE-35 Injection:
- **Timing Precision**: JavaScript timers (±1ms precision)
- **Packet Size**: SCTE-35 packets are very small (~20 bytes)
- **Processing Overhead**: Minimal CPU impact
- **Synchronization**: PTS-based timing ensures frame accuracy

### Network Optimization:
- **SRT Settings**: Optimal SRT parameters for different network conditions
- **Buffer Management**: Proper buffer sizes for smooth streaming
- **Error Recovery**: Automatic retransmission and error correction
- **Bandwidth Management**: Adaptive bitrate and quality adjustment

---

## 🎯 Key Advantages of This Architecture:

1. **Professional Grade**: Uses industry-standard FFmpeg and SRT protocols
2. **SCTE-35 Compliant**: Full implementation of SCTE-35 standards (2013)
3. **Real-time Control**: WebSocket-based instant stream management
4. **Distributor Ready**: Designed specifically for external SRT server integration
5. **SSAI Compatible**: Works with Server-Side Ad Insertion systems
6. **Scalable**: Can handle multiple simultaneous streams
7. **Reliable**: Error handling and recovery mechanisms built-in
8. **Standards-Based**: Follows industry best practices from Bitmovin and others

---

## 🔧 Advanced Configuration Options:

### SRT Configuration:
```typescript
interface SRTConfig {
  port: number;              // SRT port (default: 9999)
  maxbitrate: number;        // Maximum bitrate
  pbkeylen: number;         // Passphrase length (16, 24, or 32)
  passphrase?: string;      // Encryption passphrase
  latency: number;          // SRT latency in ms
  maxbw: number;            // Maximum bandwidth
  packetfilter: string;     // Packet filter settings
  streamid: string;         // Stream identifier
}
```

### SCTE-35 Configuration:
```typescript
interface SCTE35Config {
  autoInsert: boolean;       // Automatic insertion
  timeThreshold: number;    // Timing threshold in ms
  retryAttempts: number;    // Retry attempts on failure
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableSegmentation: boolean; // Enable segmentation descriptors
  providerId: string;      // Provider identifier
}
```

### FFmpeg Configuration:
```typescript
interface FFmpegConfig {
  videoCodec: string;       // Video codec (libx264, libx265)
  audioCodec: string;       // Audio codec (aac, libfdk_aac)
  videoBitrate: string;     // Video bitrate
  audioBitrate: string;     // Audio bitrate
  preset: string;           // FFmpeg preset
  tune: string;             // FFmpeg tune option
  keyframeInterval: number; // Keyframe interval in seconds
}
```

---

## 📖 Implementation Details

### File Structure:
```
src/
├── lib/
│   ├── scte35/
│   │   └── index.ts              # SCTE-35 packet generation
│   ├── streaming/
│   │   └── server.ts              # Streaming server logic
│   ├── srt-pusher.ts             # SRT pusher implementation
│   ├── scte35-injector.ts        # SCTE-35 injection system
│   ├── socket.ts                 # WebSocket event handlers
│   └── db.ts                     # Database connection
├── hooks/
│   └── use-streaming.ts          # React hook for streaming
└── app/
    ├── page.tsx                   # Main dashboard
    └── api/
        ├── streams/
        │   └── route.ts            # Stream API endpoints
        └── ad-markers/
            └── route.ts            # Ad marker API endpoints
```

### Key Implementation Files:

1. **SCTE-35 Generator** (`/src/lib/scte35/index.ts`):
   - Complete SCTE-35 packet generation
   - Support for all command types
   - Segmentation descriptor support
   - Standards compliance

2. **SRT Pusher** (`/src/lib/srt-pusher.ts`):
   - FFmpeg process management
   - SRT connection handling
   - Stream health monitoring
   - Error recovery

3. **Streaming Server** (`/src/lib/streaming/server.ts`):
   - Node-Media-Server integration
   - WebSocket event handling
   - Stream lifecycle management
   - Real-time statistics

4. **Dashboard** (`/src/app/page.tsx`):
   - Stream management interface
   - Ad marker control
   - Real-time monitoring
   - Analytics dashboard

---

## 🚀 Deployment and Usage

### Quick Start:
1. **Install Dependencies**: `npm install`
2. **Set Up Database**: `npm run db:push`
3. **Start Development**: `npm run dev`
4. **Configure OBS**: Set up OBS with provided RTMP URL
5. **Create Stream**: Use dashboard to create and configure streams
6. **Start Broadcasting**: Begin streaming to your distributor

### OBS Configuration:
```
Service: Custom
Server: rtmp://localhost:1935
Stream Key: [your-stream-key]
```

### Distributor Configuration:
```
SRT URL: srt://localhost:9999?streamid=[your-stream-id]
Passphrase: [your-srt-passphrase]
```

### Monitoring:
- **Dashboard**: Real-time stream monitoring and control
- **WebSocket Events**: Live updates and notifications
- **Analytics**: Performance metrics and statistics
- **Logs**: Detailed logging for debugging

---

## 🔮 Future Enhancements

### Planned Features:
1. **Multi-Bitrate Support**: Adaptive bitrate streaming
2. **Advanced Analytics**: More detailed performance metrics
3. **Cloud Integration**: AWS MediaLive, Azure Media Services
4. **Mobile App**: React Native mobile dashboard
5. **AI Integration**: Automated ad optimization
6. **Advanced SCTE-35**: More complex ad break scenarios
7. **CDN Integration**: Multi-CDN support
8. **DRM Support**: Digital rights management

### Integration Opportunities:
- **AWS Elemental MediaLive**: Cloud-based live encoding
- **Azure Media Services**: Microsoft's media platform
- **Google Cloud Media**: Google's cloud media solution
- **Mux**: Modern video streaming API
- **Cloudflare Stream**: Cloudflare's video platform

---

This architecture ensures that your video stream is processed efficiently while maintaining full SCTE-35 ad marker compatibility with your distributor's systems, following industry best practices from leading streaming platforms like Bitmovin.