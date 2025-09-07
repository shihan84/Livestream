import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, Cpu, HardDrive, Wifi, Zap } from 'lucide-react'

interface MetricItemProps {
  label: string
  value: string
  unit?: string
  icon: React.ReactNode
  color?: string
  trend?: 'up' | 'down' | 'stable'
}

function MetricItem({ label, value, unit, icon, color = 'text-gray-600', trend = 'stable' }: MetricItemProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-red-500'
      case 'down': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
          {icon}
          {label}
        </span>
        {trend !== 'stable' && (
          <span className={`text-xs ${getTrendColor()}`}>
            {trend === 'up' ? '↗' : '↘'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-lg font-bold ${color}`}>{value}</span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}

interface MetricsPanelProps {
  cpu?: number
  memory?: number
  network?: number
  bitrate?: number
  viewers?: number
  uptime?: string
  className?: string
}

export function MetricsPanel({
  cpu = 45,
  memory = 62,
  network = 23,
  bitrate = 5000,
  viewers = 1250,
  uptime = '01:23:45',
  className
}: MetricsPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          System Metrics
        </CardTitle>
        <CardDescription>
          Real-time encoder performance and stream health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Usage */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-1">
                <Cpu className="w-4 h-4" />
                CPU Usage
              </span>
              <span className="text-sm font-medium">{cpu}%</span>
            </div>
            <Progress value={cpu} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                Memory Usage
              </span>
              <span className="text-sm font-medium">{memory}%</span>
            </div>
            <Progress value={memory} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-1">
                <Wifi className="w-4 h-4" />
                Network Latency
              </span>
              <span className="text-sm font-medium">{network}ms</span>
            </div>
            <Progress value={network} className="h-2" />
          </div>
        </div>

        {/* Stream Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <MetricItem
            label="Bitrate"
            value={bitrate.toString()}
            unit="kbps"
            icon={<Zap className="w-3 h-3" />}
            color="text-blue-600"
            trend="stable"
          />
          <MetricItem
            label="Viewers"
            value={viewers.toString()}
            icon={<Activity className="w-3 h-3" />}
            color="text-green-600"
            trend="up"
          />
        </div>

        {/* Uptime */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <MetricItem
            label="Encoder Uptime"
            value={uptime}
            icon={<Activity className="w-3 h-3" />}
            color="text-purple-600"
          />
        </div>
      </CardContent>
    </Card>
  )
}