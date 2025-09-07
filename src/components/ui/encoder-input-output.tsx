import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface InputOutputConfig {
  inputUrl: string
  outputUrl: string
  inputType: 'rtmp' | 'srt' | 'file'
  outputType: 'srt' | 'rtmp' | 'hls' | 'dash'
  videoCodec: 'h264' | 'h265' | 'av1'
  audioCodec: 'aac' | 'opus' | 'mp3'
  bitrate: number
  resolution: string
  fps: number
}

interface EncoderInputOutputProps {
  config: InputOutputConfig
  onConfigChange: (config: InputOutputConfig) => void
  onTestConnection?: () => void
  onSave?: () => void
}

export function EncoderInputOutput({
  config,
  onConfigChange,
  onTestConnection,
  onSave
}: EncoderInputOutputProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const updateConfig = (key: keyof InputOutputConfig, value: any) => {
    onConfigChange({ ...config, [key]: value })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Input Configuration */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            Input Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="inputType">Input Type</Label>
            <Select value={config.inputType} onValueChange={(value) => updateConfig('inputType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rtmp">RTMP</SelectItem>
                <SelectItem value="srt">SRT</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="inputUrl">Input URL</Label>
            <div className="relative">
              <Input
                id="inputUrl"
                value={config.inputUrl}
                onChange={(e) => updateConfig('inputUrl', e.target.value)}
                placeholder="rtmp://localhost:1935/live/stream"
                className="pr-10"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => copyToClipboard(config.inputUrl, 'input')}
              >
                {copied === 'input' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="videoCodec">Video Codec</Label>
              <Select value={config.videoCodec} onValueChange={(value) => updateConfig('videoCodec', value)}>
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
              <Label htmlFor="audioCodec">Audio Codec</Label>
              <Select value={config.audioCodec} onValueChange={(value) => updateConfig('audioCodec', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aac">AAC</SelectItem>
                  <SelectItem value="opus">Opus</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Output Configuration */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Output Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="outputType">Output Type</Label>
            <Select value={config.outputType} onValueChange={(value) => updateConfig('outputType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="srt">SRT</SelectItem>
                <SelectItem value="rtmp">RTMP</SelectItem>
                <SelectItem value="hls">HLS</SelectItem>
                <SelectItem value="dash">DASH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="outputUrl">Output URL</Label>
            <div className="relative">
              <Input
                id="outputUrl"
                value={config.outputUrl}
                onChange={(e) => updateConfig('outputUrl', e.target.value)}
                placeholder="srt://distributor-server:9999?streamid=your-stream"
                className="pr-10"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => copyToClipboard(config.outputUrl, 'output')}
              >
                {copied === 'output' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="bitrate">Bitrate (kbps)</Label>
              <Input
                id="bitrate"
                type="number"
                value={config.bitrate}
                onChange={(e) => updateConfig('bitrate', parseInt(e.target.value) || 0)}
                placeholder="5000"
              />
            </div>
            <div>
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={config.resolution} onValueChange={(value) => updateConfig('resolution', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1920x1080">1920x1080</SelectItem>
                  <SelectItem value="1280x720">1280x720</SelectItem>
                  <SelectItem value="854x480">854x480</SelectItem>
                  <SelectItem value="640x360">640x360</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fps">FPS</Label>
              <Select value={config.fps} onValueChange={(value) => updateConfig('fps', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* External Link Indicator */}
          {config.outputUrl && (config.outputUrl.includes('srt://') || config.outputUrl.includes('rtmp://')) && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-800 dark:text-blue-200">
                External destination configured
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onTestConnection && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onTestConnection}
                className="flex-1"
              >
                Test Connection
              </Button>
            )}
            {onSave && (
              <Button 
                size="sm" 
                onClick={onSave}
                className="flex-1"
              >
                Save Config
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}