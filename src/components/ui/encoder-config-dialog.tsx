import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, X } from 'lucide-react'

interface EncoderConfig {
  name: string
  description: string
  inputUrl: string
  outputUrl: string
  videoCodec: 'h264' | 'h265' | 'av1'
  audioCodec: 'aac' | 'mp3' | 'opus'
  bitrate: number
  resolution: string
  fps: number
  keyframeInterval: number
  bFrames: number
  profile: 'baseline' | 'main' | 'high'
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
}

interface EncoderConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: EncoderConfig) => void
  initialConfig?: Partial<EncoderConfig>
  title?: string
}

export function EncoderConfigDialog({
  isOpen,
  onClose,
  onSave,
  initialConfig,
  title = "Configure Encoder"
}: EncoderConfigDialogProps) {
  const [config, setConfig] = useState<EncoderConfig>({
    name: '',
    description: '',
    inputUrl: '',
    outputUrl: '',
    videoCodec: 'h264',
    audioCodec: 'aac',
    bitrate: 5000,
    resolution: '1920x1080',
    fps: 30,
    keyframeInterval: 2,
    bFrames: 3,
    profile: 'high',
    preset: 'medium',
    ...initialConfig
  })

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')

  const handleSave = () => {
    onSave(config)
    onClose()
  }

  const resolutions = [
    '3840x2160', // 4K
    '2560x1440', // 1440p
    '1920x1080', // 1080p
    '1280x720',  // 720p
    '854x480',   // 480p
    '640x360',   // 360p
  ]

  const frameRates = [24, 25, 30, 50, 60]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Configure encoder settings for your live stream
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Settings
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Advanced Settings
            </button>
          </div>

          {/* Basic Settings */}
          {activeTab === 'basic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Stream Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Encoder Name</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) => setConfig({ ...config, name: e.target.value })}
                      placeholder="Main Encoder"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig({ ...config, description: e.target.value })}
                      placeholder="Primary broadcast encoder"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Input/Output</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="inputUrl">Input URL</Label>
                    <Input
                      id="inputUrl"
                      value={config.inputUrl}
                      onChange={(e) => setConfig({ ...config, inputUrl: e.target.value })}
                      placeholder="rtmp://localhost:1935/live/stream-key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="outputUrl">Output URL</Label>
                    <Input
                      id="outputUrl"
                      value={config.outputUrl}
                      onChange={(e) => setConfig({ ...config, outputUrl: e.target.value })}
                      placeholder="srt://distributor-server:9999?streamid=your-stream"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Video Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="videoCodec">Video Codec</Label>
                    <Select value={config.videoCodec} onValueChange={(value: any) => setConfig({ ...config, videoCodec: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h264">H.264</SelectItem>
                        <SelectItem value="h265">H.265</SelectItem>
                        <SelectItem value="av1">AV1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                    <Input
                      id="bitrate"
                      type="number"
                      value={config.bitrate}
                      onChange={(e) => setConfig({ ...config, bitrate: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="resolution">Resolution</Label>
                    <Select value={config.resolution} onValueChange={(value) => setConfig({ ...config, resolution: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resolutions.map((res) => (
                          <SelectItem key={res} value={res}>{res}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fps">Frame Rate</Label>
                    <Select value={config.fps.toString()} onValueChange={(value) => setConfig({ ...config, fps: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frameRates.map((fps) => (
                          <SelectItem key={fps} value={fps.toString()}>{fps} fps</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Audio Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="audioCodec">Audio Codec</Label>
                    <Select value={config.audioCodec} onValueChange={(value: any) => setConfig({ ...config, audioCodec: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="opus">Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Encoding Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="profile">Profile</Label>
                    <Select value={config.profile} onValueChange={(value: any) => setConfig({ ...config, profile: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baseline">Baseline</SelectItem>
                        <SelectItem value="main">Main</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preset">Preset</Label>
                    <Select value={config.preset} onValueChange={(value: any) => setConfig({ ...config, preset: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ultrafast">Ultrafast</SelectItem>
                        <SelectItem value="superfast">Superfast</SelectItem>
                        <SelectItem value="veryfast">Veryfast</SelectItem>
                        <SelectItem value="faster">Faster</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="slower">Slower</SelectItem>
                        <SelectItem value="veryslow">Veryslow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="keyframeInterval">Keyframe Interval (seconds)</Label>
                    <Input
                      id="keyframeInterval"
                      type="number"
                      value={config.keyframeInterval}
                      onChange={(e) => setConfig({ ...config, keyframeInterval: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bFrames">B-Frames</Label>
                    <Input
                      id="bFrames"
                      type="number"
                      value={config.bFrames}
                      onChange={(e) => setConfig({ ...config, bFrames: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuration Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {config.videoCodec.toUpperCase()}
                </Badge>
                <Badge variant="secondary">
                  {config.resolution}
                </Badge>
                <Badge variant="secondary">
                  {config.fps}fps
                </Badge>
                <Badge variant="secondary">
                  {config.bitrate}kbps
                </Badge>
                <Badge variant="secondary">
                  {config.profile.toUpperCase()}
                </Badge>
                <Badge variant="secondary">
                  {config.preset}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}