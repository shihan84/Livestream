# 🔄 Complete Video and SCTE-35 Processing Flow

## 1. Video Input Stage

### Your Broadcasting Software (OBS Studio)
```
Video Source (Camera/Screen) → OBS Studio → Local RTMP Output
```

**Processing:**
- **Video Encoding**: OBS encodes video using H.264/H.265
- **Audio Encoding**: OBS encodes audio using AAC
- **Container**: Wraps in FLV container for RTMP transmission
- **Output**: Sends to local RTMP server

**Libraries Used:**
- **OBS Studio**: Uses `libx264` (H.264) or `libx265` (H.265) for video encoding
- **FFmpeg Integration**: OBS uses FFmpeg libraries for media processing
- **Audio Codecs**: `libfdk_aac` or `libfaac` for AAC audio encoding

---

## 2. Local RTMP Server Stage

### Node-Media-Server (Local Ingest)
```
RTMP Input → Node-Media-Server → Raw Video/Audio Buffers
```

**Processing:**
- **RTMP Protocol Handling**: Receives RTMP stream from OBS
- **Demuxing**: Extracts raw video and audio data from FLV container
- **Buffer Management**: Maintains circular buffers for smooth streaming
- **Event Emission**: Triggers WebSocket events for stream status

**Libraries Used:**
- **Node-Media-Server**: `node-media-server` package
- **RTMP Parser**: Custom RTMP protocol implementation
- **Buffer Management**: Node.js Buffer API
- **Event System**: Node.js EventEmitter

---

## 3. FFmpeg SRT Pusher Stage

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

**Libraries Used:**
- **FFmpeg**: `fluent-ffmpeg` wrapper with native FFmpeg binaries
- **Video Codecs**: `libx264`, `libx265`, `libvpx` (VP8/VP9)
- **Audio Codecs**: `libfdk_aac`, `libfaac`, `libopus`
- **SRT Protocol**: `libsrt` (via FFmpeg SRT support)
- **MPEG-TS Muxer**: FFmpeg's MPEG-TS muxer

**FFmpeg Command Structure:**
```bash
ffmpeg -i rtmp://localhost:1935/live/stream-key \
       -c:v libx264 -b:v 5000k -c:a aac -b:a 128k \
       -f mpegts -mpegts_original_timestamps 1 \
       srt://distributor-server:9999?streamid=your-stream
```

---

## 4. SCTE-35 Ad Marker System

### SCTE-35 Generation and Injection
```
Ad Marker Database → SCTE-35 Generator → MPEG-TS Injection → SRT Transmission
```

**Processing:**
- **Ad Marker Scheduling**: Time-based trigger system
- **SCTE-35 Packet Generation**: Creates binary SCTE-35 packets
- **MPEG-TS Injection**: Inserts SCTE-35 packets into transport stream
- **Timing Synchronization**: Ensures precise ad marker timing

**Libraries Used:**
- **SCTE-35 Generator**: Custom implementation (`/src/lib/scte35/index.ts`)
- **Binary Packet Creation**: Node.js Buffer API
- **Timing System**: JavaScript Date/Time APIs
- **MPEG-TS Manipulation**: Custom TS packet handling

**SCTE-35 Packet Structure:**
```typescript
// SCTE-35 Splice Insert Packet
{
  tableId: 0xFC,           // SCTE-35 table ID
  sectionLength: 20,       // Section length
  protocolVersion: 0,      // Protocol version
  encryptedPacket: 0,      // Not encrypted
  ptsAdjustment: 0,        // PTS adjustment
  cwIndex: 0,             // Control word index
  tier: 0,                // Tier
  spliceCommandLength: 15, // Command length
  spliceCommandType: 0x05, // SPLICE_INSERT
  spliceEventId: 0x12345678, // Event ID
  spliceImmediate: 0,     // Not immediate
  startTime: 900000,      // Start time (90kHz clock)
  duration: 2700000,     // Duration (30 seconds)
  uniqueProgramId: 0,     // Program ID
  availNum: 0,           // Availability number
  availsExpected: 0      // Expected availabilities
}
```

---

## 5. Real-time Monitoring and Control

### WebSocket Communication Layer
```
Stream Statistics → WebSocket → Dashboard Updates
```

**Processing:**
- **FFmpeg Output Parsing**: Extracts frame rate, bitrate, and timing
- **Stream Health Monitoring**: Tracks packet loss and latency
- **Real-time Updates**: Pushes statistics to dashboard via WebSocket
- **Event Handling**: Manages stream start/stop events

**Libraries Used:**
- **WebSocket**: `socket.io` client and server
- **Event System**: Node.js EventEmitter
- **Statistics Processing**: Custom regex parsing
- **Real-time Database**: Prisma with SQLite

---

## 6. Database and State Management

### Stream and Ad Marker Storage
```
Stream Configuration → Prisma ORM → SQLite Database
```

**Processing:**
- **Stream Metadata**: Stores stream configuration and status
- **Ad Marker Management**: Tracks SCTE-35 markers and insertion status
- **Analytics Storage**: Records stream performance metrics
- **State Synchronization**: Maintains real-time stream state

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
   └── SCTE-35 Injection
   ↓
6. SRT Protocol (libsrt via FFmpeg)
   ↓
7. Distributor SRT Server
   ↓
8. End User Viewing
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
9. Ad Insertion (Distributor Side)
```

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

## 🎯 Key Advantages of This Architecture:

1. **Professional Grade**: Uses industry-standard FFmpeg and SRT protocols
2. **SCTE-35 Compliant**: Full implementation of SCTE-35 standards
3. **Real-time Control**: WebSocket-based instant stream management
4. **Distributor Ready**: Designed specifically for external SRT server integration
5. **Scalable**: Can handle multiple simultaneous streams
6. **Reliable**: Error handling and recovery mechanisms built-in

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

### Database Schema:
```sql
-- Streams table stores stream configuration
CREATE TABLE streams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  streamKey TEXT UNIQUE,
  externalSrtUrl TEXT,           -- Distributor SRT URL
  externalRtmpUrl TEXT,          -- Optional RTMP fallback
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

-- Ad markers table stores SCTE-35 marker data
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
  networkLatency INTEGER
);
```

This architecture ensures that your video stream is processed efficiently while maintaining full SCTE-35 ad marker compatibility with your distributor's systems.