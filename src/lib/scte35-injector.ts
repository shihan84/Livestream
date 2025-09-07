import { spawn } from 'child_process'
import { EventEmitter } from 'events'
import { SCTE35Generator, SCTE35Marker } from './scte35'

export interface SCTE35InjectorConfig {
  inputUrl: string
  outputUrl: string
  markers: SCTE35Marker[]
}

export class SCTE35Injector extends EventEmitter {
  private process: any = null
  private config: SCTE35InjectorConfig
  private isRunning: boolean = false
  private markers: SCTE35Marker[]
  private startTime: number = 0

  constructor(config: SCTE35InjectorConfig) {
    super()
    this.config = config
    this.markers = [...config.markers]
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('SCTE-35 injector is already running')
    }

    this.startTime = Date.now()

    // Start FFmpeg with SCTE-35 injection
    const ffmpegArgs = this.buildFFmpegArgs()
    
    console.log('Starting SCTE-35 injector with args:', ffmpegArgs.join(' '))

    this.process = spawn('ffmpeg', ffmpegArgs)

    this.process.stdout?.on('data', (data: Buffer) => {
      console.log(`SCTE-35 injector stdout: ${data.toString()}`)
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      console.log(`SCTE-35 injector stderr: ${output}`)
      
      // Parse FFmpeg output
      if (output.includes('frame=')) {
        this.emit('stats', this.parseStats(output))
      }
      
      if (output.includes('error') || output.includes('Error')) {
        this.emit('error', new Error(output))
      }
    })

    this.process.on('close', (code: number) => {
      console.log(`SCTE-35 injector process exited with code ${code}`)
      this.isRunning = false
      this.emit('stopped', code)
    })

    this.process.on('error', (error: Error) => {
      console.error('SCTE-35 injector process error:', error)
      this.isRunning = false
      this.emit('error', error)
    })

    // Start marker injection timer
    this.startMarkerInjection()

    // Wait for FFmpeg to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.isRunning) {
          reject(new Error('SCTE-35 injector failed to start'))
        }
      }, 5000)

      this.once('stats', () => {
        clearTimeout(timeout)
        this.isRunning = true
        resolve(true)
      })

      this.once('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
  }

  stop(): void {
    if (this.process && this.isRunning) {
      console.log('Stopping SCTE-35 injector...')
      this.process.kill('SIGTERM')
      
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL')
        }
      }, 5000)
    }
  }

  private startMarkerInjection(): void {
    // Check for markers that need to be injected
    setInterval(() => {
      if (!this.isRunning) return

      const currentTime = (Date.now() - this.startTime) / 1000 // Current time in seconds
      
      for (const marker of this.markers) {
        if (!marker.isInserted && marker.startTime <= currentTime) {
          this.injectMarker(marker)
        }
      }
    }, 1000) // Check every second
  }

  private injectMarker(marker: SCTE35Marker): void {
    try {
      // Generate SCTE-35 packet
      const scte35Packet = SCTE35Generator.generateSpliceInsert(marker)
      
      // Here you would inject the SCTE-35 packet into the stream
      // This is a simplified version - in practice, you'd need to use
      // a more sophisticated method to inject SCTE-35 into the MPEG-TS stream
      
      console.log('Injecting SCTE-35 marker:', marker)
      console.log('SCTE-35 packet:', SCTE35Generator.formatHex(scte35Packet))
      
      // Mark as inserted
      marker.isInserted = true
      
      this.emit('markerInjected', {
        marker,
        packet: scte35Packet,
        timestamp: Date.now()
      })
      
    } catch (error) {
      console.error('Error injecting SCTE-35 marker:', error)
      this.emit('error', error)
    }
  }

  private buildFFmpegArgs(): string[] {
    const args: string[] = []

    // Input
    args.push('-i', this.config.inputUrl)

    // Enable SCTE-35 support
    args.push('-scte35', '1')
    
    // Copy streams to maintain original quality
    args.push('-c', 'copy')
    
    // MPEG-TS format for SRT
    args.push('-f', 'mpegts')
    args.push('-mpegts_original_timestamps', '1')
    args.push('-mpegts_copyts', '1')
    args.push('-flush_packets', '1')

    // Output
    args.push(this.config.outputUrl)

    return args
  }

  private parseStats(output: string): any {
    const stats: any = {
      fps: 0,
      bitrate: 0,
      frame: 0,
      time: '00:00:00',
      size: 0
    }

    const frameMatch = output.match(/frame=\s*(\d+)/)
    if (frameMatch) {
      stats.frame = parseInt(frameMatch[1])
    }

    const fpsMatch = output.match(/fps=\s*([\d.]+)/)
    if (fpsMatch) {
      stats.fps = parseFloat(fpsMatch[1])
    }

    const bitrateMatch = output.match(/bitrate=\s*([\d.]+kbits\/s)/)
    if (bitrateMatch) {
      stats.bitrate = parseFloat(bitrateMatch[1])
    }

    const timeMatch = output.match(/time=\s*([\d:.]+)/)
    if (timeMatch) {
      stats.time = timeMatch[1]
    }

    const sizeMatch = output.match(/size=\s*([\d]+kB)/)
    if (sizeMatch) {
      stats.size = sizeMatch[1]
    }

    return stats
  }

  addMarker(marker: SCTE35Marker): void {
    this.markers.push(marker)
  }

  removeMarker(markerId: string): void {
    this.markers = this.markers.filter(m => m.cueId !== markerId)
  }

  getMarkers(): SCTE35Marker[] {
    return [...this.markers]
  }

  isRunning(): boolean {
    return this.isRunning
  }
}