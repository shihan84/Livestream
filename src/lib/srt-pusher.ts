import { spawn } from 'child_process'
import { EventEmitter } from 'events'

export interface SrtPusherConfig {
  inputUrl: string
  outputUrl: string
  bitrate?: number
  resolution?: string
  fps?: number
  audioBitrate?: string
  videoCodec?: string
  audioCodec?: string
}

export class SrtPusher extends EventEmitter {
  private process: any = null
  private config: SrtPusherConfig
  private isRunning: boolean = false

  constructor(config: SrtPusherConfig) {
    super()
    this.config = config
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('SRT pusher is already running')
    }

    const ffmpegArgs = this.buildFFmpegArgs()
    
    console.log('Starting FFmpeg with args:', ffmpegArgs.join(' '))

    this.process = spawn('ffmpeg', ffmpegArgs)

    this.process.stdout?.on('data', (data: Buffer) => {
      console.log(`FFmpeg stdout: ${data.toString()}`)
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      const output = data.toString()
      console.log(`FFmpeg stderr: ${output}`)
      
      // Parse FFmpeg output for stream info
      if (output.includes('frame=')) {
        this.emit('stats', this.parseStats(output))
      }
      
      if (output.includes('error') || output.includes('Error')) {
        this.emit('error', new Error(output))
      }
    })

    this.process.on('close', (code: number) => {
      console.log(`FFmpeg process exited with code ${code}`)
      this.isRunning = false
      this.emit('stopped', code)
    })

    this.process.on('error', (error: Error) => {
      console.error('FFmpeg process error:', error)
      this.isRunning = false
      this.emit('error', error)
    })

    // Wait a bit to see if FFmpeg starts successfully
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.isRunning) {
          reject(new Error('FFmpeg failed to start'))
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
      console.log('Stopping FFmpeg process...')
      this.process.kill('SIGTERM')
      
      // Force kill if it doesn't stop gracefully
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL')
        }
      }, 5000)
    }
  }

  private buildFFmpegArgs(): string[] {
    const args: string[] = []

    // Input
    args.push('-i', this.config.inputUrl)

    // Video codec
    if (this.config.videoCodec) {
      args.push('-c:v', this.config.videoCodec)
    } else {
      args.push('-c:v', 'libx264') // Default H.264
    }

    // Audio codec
    if (this.config.audioCodec) {
      args.push('-c:a', this.config.audioCodec)
    } else {
      args.push('-c:a', 'aac') // Default AAC
    }

    // Bitrate
    if (this.config.bitrate) {
      args.push('-b:v', `${this.config.bitrate}k`)
    }

    // Audio bitrate
    if (this.config.audioBitrate) {
      args.push('-b:a', this.config.audioBitrate)
    } else {
      args.push('-b:a', '128k')
    }

    // Resolution
    if (this.config.resolution) {
      args.push('-s', this.config.resolution)
    }

    // FPS
    if (this.config.fps) {
      args.push('-r', this.config.fps.toString())
    }

    // SRT specific options
    args.push('-f', 'mpegts') // MPEG-TS format for SRT
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

    // Parse frame info
    const frameMatch = output.match(/frame=\s*(\d+)/)
    if (frameMatch) {
      stats.frame = parseInt(frameMatch[1])
    }

    // Parse FPS
    const fpsMatch = output.match(/fps=\s*([\d.]+)/)
    if (fpsMatch) {
      stats.fps = parseFloat(fpsMatch[1])
    }

    // Parse bitrate
    const bitrateMatch = output.match(/bitrate=\s*([\d.]+kbits\/s)/)
    if (bitrateMatch) {
      stats.bitrate = parseFloat(bitrateMatch[1])
    }

    // Parse time
    const timeMatch = output.match(/time=\s*([\d:.]+)/)
    if (timeMatch) {
      stats.time = timeMatch[1]
    }

    // Parse size
    const sizeMatch = output.match(/size=\s*([\d]+kB)/)
    if (sizeMatch) {
      stats.size = sizeMatch[1]
    }

    return stats
  }

  isPushing(): boolean {
    return this.isRunning
  }

  getConfig(): SrtPusherConfig {
    return { ...this.config }
  }
}