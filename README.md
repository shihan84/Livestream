# 🎥 LiveStream Pro - SRT Streaming with SCTE-35 Ad Markers

A professional-grade live streaming solution designed for broadcasters who need to push content to external SRT servers with full SCTE-35 ad marker support. Built with Next.js, FFmpeg, and industry-standard streaming protocols.

## 🌟 Features

### 📡 Streaming Infrastructure
- **SRT Protocol Support**: Secure Reliable Transport streaming for low-latency, high-quality video delivery
- **RTMP Ingest**: Real-time messaging protocol for stream ingestion from OBS and other broadcast software
- **External SRT Push**: Push streams to distributor-provided SRT servers with configurable parameters
- **Multi-protocol Support**: Simultaneous SRT and RTMP streaming capabilities

### 🎯 SCTE-35 Ad Marker System
- **SCTE-35 Generation**: Complete implementation of SCTE-35 packet generation compliant with industry standards
- **Ad Marker Types**: Support for multiple ad types:
  - Program Segments
  - Provider Advertisements
  - Distributor Advertisements
  - Network Advertisements
  - Local Advertisements
- **Real-time Injection**: Dynamic ad marker insertion during live streams
- **Scheduling**: Time-based ad marker scheduling with automatic insertion
- **Cue Management**: Comprehensive cue ID management and tracking

### 📊 Professional Dashboard
- **Stream Management**: Create, configure, start, stop, and monitor multiple streams
- **Real-time Metrics**: Live viewer count, bitrate, resolution, and FPS monitoring
- **Health Monitoring**: Stream health indicators with status tracking (Offline, Starting, Live, Stopping, Error)
- **Analytics Dashboard**: Comprehensive stream performance analytics and viewer engagement metrics
- **WebSocket Integration**: Real-time updates across all connected clients

### 🔧 Advanced Features
- **Database Integration**: Prisma ORM with SQLite for persistent storage
- **RESTful APIs**: Complete API suite for stream and ad marker management
- **Real-time Communication**: Socket.IO for live updates and notifications
- **Error Handling**: Robust error handling and recovery mechanisms
- **Responsive Design**: Mobile-first design with Tailwind CSS and shadcn/ui components

## 🚀 Quick Start

### System Requirements

#### Minimum Requirements
- **OS**: Linux, macOS, or Windows
- **Node.js**: v18.0 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free disk space
- **Network**: Stable internet connection for streaming

#### Recommended Requirements
- **OS**: Ubuntu 20.04+ or macOS 12+
- **Node.js**: v20.0 or higher
- **Memory**: 16GB RAM
- **Storage**: 10GB SSD
- **CPU**: 4+ cores for transcoding
- **Network**: 100+ Mbps upload bandwidth

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/shihan84/Livestream.git
cd Livestream
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npm run db:push
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the application**
Open your browser and navigate to `http://localhost:3000`

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# Streaming Configuration
RTMP_PORT=1935
HTTP_STREAMING_PORT=8000
SRT_PORT=9999

# External SRT Server (for distributor integration)
EXTERNAL_SRT_SERVER="srt://your-distributor-server:port"
EXTERNAL_SRT_STREAMID="your-stream-id"

# Application
NODE_ENV="development"
PORT=3000
```

## 📖 Usage Guide

### Creating a Stream

1. **Navigate to the Dashboard**
   - Open the application in your browser
   - Click the "Create Stream" button

2. **Configure Stream Settings**
   - **Stream Name**: Enter a descriptive name for your stream
   - **Description**: Add optional description
   - **Stream Key**: Leave empty for auto-generation or specify custom key

3. **Start Broadcasting**
   - Use OBS Studio or similar broadcast software
   - Configure with the provided SRT/RTMP URLs
   - Start streaming from your broadcast software

### OBS Studio Configuration

#### SRT Setup
1. **Settings** → **Stream**
2. **Service**: Custom
3. **Server**: `srt://localhost:9999?streamid=YOUR_STREAM_KEY`
4. **Stream Key**: Leave empty

#### RTMP Setup
1. **Settings** → **Stream**
2. **Service**: Custom
3. **Server**: `rtmp://localhost:1935/live`
4. **Stream Key**: `YOUR_STREAM_KEY`

### Managing SCTE-35 Ad Markers

1. **Create Ad Markers**
   - Click "Add Ad Marker" in the dashboard
   - Select the target stream
   - Configure timing, duration, and ad type
   - Add optional description and cue ID

2. **Ad Marker Types**
   - **Program**: Regular program content
   - **Provider Advertisement**: Ads from content provider
   - **Distributor Advertisement**: Ads from distribution network
   - **Network Advertisement**: Network-level advertisements
   - **Local Advertisement**: Local station advertisements

3. **Insertion Methods**
   - **Scheduled**: Automatic insertion based on stream timeline
   - **Manual**: Immediate insertion via dashboard controls

### External SRT Push Configuration

For pushing streams to distributor servers:

1. **Configure External Server**
   ```typescript
   // In src/lib/srt-pusher.ts
   const externalSrtConfig = {
     server: "srt://distributor-server:port",
     streamId: "your-distributor-stream-id",
     passphrase: "optional-passphrase",
     latency: 2000,
     maxbw: 10000000
   }
   ```

2. **Start External Push**
   - Enable external push in stream configuration
   - Monitor push status in the dashboard
   - Handle connection errors and reconnection

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Broadcast     │    │   Streaming     │    │   External      │
│   Software      │───▶│   Server        │───▶│   SRT Server    │
│   (OBS/FFmpeg)  │    │   (Node.js)     │    │   (Distributor) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Dashboard     │
                       │   (Next.js)     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │   (SQLite)      │
                       └─────────────────┘
```

### Data Flow

1. **Stream Ingest**: Broadcast software pushes stream to local RTMP/SRT server
2. **Processing**: Server processes stream and injects SCTE-35 markers
3. **Distribution**: Stream is pushed to external SRT server
4. **Monitoring**: Dashboard provides real-time monitoring and control
5. **Storage**: Stream and ad marker data stored in database

### SCTE-35 Processing

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ad Marker     │    │   SCTE-35       │    │   Transport     │
│   Configuration │───▶│   Generator     │───▶│   Stream        │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 API Documentation

### Stream Management

#### Create Stream
```http
POST /api/streams
Content-Type: application/json

{
  "name": "Main Live Stream",
  "description": "Primary broadcast channel",
  "streamKey": "main-stream-123"
}
```

#### Get All Streams
```http
GET /api/streams
```

#### Start Stream
```http
PATCH /api/streams/{id}
Content-Type: application/json

{
  "action": "start"
}
```

#### Stop Stream
```http
PATCH /api/streams/{id}
Content-Type: application/json

{
  "action": "stop"
}
```

### Ad Marker Management

#### Create Ad Marker
```http
POST /api/ad-markers
Content-Type: application/json

{
  "streamId": "stream-id",
  "startTime": 300,
  "duration": 30,
  "adType": "PROVIDER_ADVERTISEMENT",
  "description": "Mid-roll commercial break",
  "cueId": "cue-001"
}
```

#### Get Ad Markers
```http
GET /api/ad-markers?streamId=stream-id
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 🚀 Deployment

### Docker Deployment

1. **Build Docker Image**
```bash
docker build -t livestream-pro .
```

2. **Run Container**
```bash
docker run -d \
  --name livestream-pro \
  -p 3000:3000 \
  -p 1935:1935 \
  -p 8000:8000 \
  -p 9999:9999 \
  -v $(pwd)/data:/app/data \
  livestream-pro
```

### Production Deployment

1. **Environment Setup**
```bash
NODE_ENV=production
npm run build
npm start
```

2. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start ecosystem.config.js
```

## 🛠️ Development

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main dashboard
│   └── api/               # API routes
├── lib/                   # Core libraries
│   ├── scte35/            # SCTE-35 implementation
│   ├── streaming/         # Streaming server
│   ├── srt-pusher.ts      # External SRT push
│   └── db.ts              # Database connection
├── hooks/                 # React hooks
├── components/ui/          # UI components
└── styles/                # Stylesheets
```

### Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed exclusively to **Morus Broadcasting Pvt Ltd**. All rights reserved.

### License Terms
- **Ownership**: Morus Broadcasting Pvt Ltd holds all intellectual property rights
- **Usage**: Licensed for internal use by Morus Broadcasting Pvt Ltd only
- **Distribution**: No distribution or sharing allowed without explicit written permission
- **Modification**: Modifications must be approved by Morus Broadcasting Pvt Ltd
- **Commercial Use**: Commercial use requires separate licensing agreement

### Contact
For licensing inquiries, please contact:
**Morus Broadcasting Pvt Ltd**
[Contact Information]

## 📞 Support

For technical support and inquiries:
- **Email**: support@morusbroadcasting.com
- **Documentation**: [Project Wiki]
- **Issues**: [GitHub Issues]

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ SRT streaming with external push support
- ✅ SCTE-35 ad marker generation and injection
- ✅ Real-time dashboard with monitoring
- ✅ Database integration and API

### Phase 2 (Future)
- 🚧 Multi-bitrate adaptive streaming
- 🚧 Advanced analytics and reporting
- 🚧 User authentication and authorization
- 🚧 Cloud deployment templates

### Phase 3 (Advanced)
- 📋 AI-powered ad optimization
- 📋 Advanced error recovery
- 📋 Multi-tenant architecture
- 📋 CDN integration

---

**Built with ❤️ by Morus Broadcasting Pvt Ltd**