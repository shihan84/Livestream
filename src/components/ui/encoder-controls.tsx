import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Pause, Square, RotateCcw, Settings, Save } from 'lucide-react'

interface EncoderControlsProps {
  isRunning?: boolean
  isStarting?: boolean
  isStopping?: boolean
  onStart?: () => void
  onStop?: () => void
  onPause?: () => void
  onRestart?: () => void
  onSave?: () => void
  onConfigure?: () => void
}

export function EncoderControls({
  isRunning = false,
  isStarting = false,
  isStopping = false,
  onStart,
  onStop,
  onPause,
  onRestart,
  onSave,
  onConfigure
}: EncoderControlsProps) {
  return (
    <Card className="border-gray-200 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Encoder Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Control Buttons */}
        <div className="flex flex-wrap gap-2">
          {!isRunning && !isStarting && (
            <Button 
              onClick={onStart}
              className="bg-green-600 hover:bg-green-700 text-white flex-1 min-w-[120px]"
              disabled={isStarting || isStopping}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Encoder
            </Button>
          )}
          
          {isRunning && (
            <Button 
              onClick={onPause}
              variant="outline"
              className="flex-1 min-w-[120px]"
              disabled={isStarting || isStopping}
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          {isRunning && (
            <Button 
              onClick={onStop}
              variant="destructive"
              className="flex-1 min-w-[120px]"
              disabled={isStarting || isStopping}
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          )}
          
          <Button 
            onClick={onRestart}
            variant="outline"
            className="flex-1 min-w-[120px]"
            disabled={isStarting || isStopping}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restart
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isRunning ? 'bg-green-500' : 
              isStarting ? 'bg-yellow-500' : 
              isStopping ? 'bg-orange-500' : 'bg-gray-500'
            }`} />
            <span className="text-sm font-medium">
              {isRunning ? 'Encoder Running' : 
               isStarting ? 'Encoder Starting...' : 
               isStopping ? 'Encoder Stopping...' : 'Encoder Idle'}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {isRunning ? 'ACTIVE' : 'INACTIVE'}
          </Badge>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={onSave}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Config
          </Button>
          <Button 
            onClick={onConfigure}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}