import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Play, Square, Settings, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface EncoderCardProps {
  title: string
  description?: string
  status: 'IDLE' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'ERROR'
  inputUrl?: string
  outputUrl?: string
  bitrate?: number
  fps?: number
  resolution?: string
  uptime?: string
  onStart?: () => void
  onStop?: () => void
  onConfigure?: () => void
  className?: string
}

export function EncoderCard({
  title,
  description,
  status,
  inputUrl,
  outputUrl,
  bitrate,
  fps,
  resolution,
  uptime,
  onStart,
  onStop,
  onConfigure,
  className
}: EncoderCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-500'
      case 'STARTING': return 'bg-yellow-500'
      case 'STOPPING': return 'bg-orange-500'
      case 'ERROR': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RUNNING': return <CheckCircle className="w-4 h-4" />
      case 'STARTING': return <Clock className="w-4 h-4" />
      case 'STOPPING': return <Clock className="w-4 h-4" />
      case 'ERROR': return <AlertTriangle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'IDLE': return 'Idle'
      case 'STARTING': return 'Starting'
      case 'RUNNING': return 'Running'
      case 'STOPPING': return 'Stopping'
      case 'ERROR': return 'Error'
      default: return status
    }
  }

  return (
    <Card className={`border-gray-200 dark:border-gray-800 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {title}
              <Badge 
                className={`${getStatusColor(status)} text-white border-0 flex items-center gap-1`}
              >
                {getStatusIcon(status)}
                {getStatusText(status)}
              </Badge>
            </CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {status === 'IDLE' && onStart && (
              <Button 
                onClick={onStart}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            )}
            {status === 'RUNNING' && onStop && (
              <Button 
                onClick={onStop}
                variant="destructive"
                size="sm"
              >
                <Square className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}
            {onConfigure && (
              <Button 
                onClick={onConfigure}
                variant="outline"
                size="sm"
              >
                <Settings className="w-4 h-4 mr-1" />
                Configure
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input/Output URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">INPUT</p>
            <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 break-all">
              {inputUrl || 'Not configured'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">OUTPUT</p>
            <p className="text-xs font-mono bg-green-50 dark:bg-green-950 p-2 rounded border border-green-200 dark:border-green-800 break-all">
              {outputUrl || 'Not configured'}
            </p>
          </div>
        </div>

        {/* Stream Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">BITRATE</p>
            <p className="text-sm font-semibold">
              {bitrate ? `${bitrate} kbps` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">RESOLUTION</p>
            <p className="text-sm font-semibold">
              {resolution || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">FRAME RATE</p>
            <p className="text-sm font-semibold">
              {fps ? `${fps} fps` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">UPTIME</p>
            <p className="text-sm font-semibold">
              {uptime || '00:00:00'}
            </p>
          </div>
        </div>

        {/* Status Progress Bar */}
        {status === 'STARTING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Starting encoder...</span>
              <span>75%</span>
            </div>
            <Progress value={75} className="h-2" />
          </div>
        )}

        {status === 'STOPPING' && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Stopping encoder...</span>
              <span>40%</span>
            </div>
            <Progress value={40} className="h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}