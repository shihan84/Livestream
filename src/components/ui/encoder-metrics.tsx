import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Activity, Cpu, HardDrive, Wifi, Zap } from 'lucide-react'

interface EncoderMetricsProps {
  cpu?: number
  memory?: number
  network?: number
  bitrate?: number
  fps?: number
  droppedFrames?: number
  latency?: number
}

export function EncoderMetrics({
  cpu = 0,
  memory = 0,
  network = 0,
  bitrate = 0,
  fps = 0,
  droppedFrames = 0,
  latency = 0
}: EncoderMetricsProps) {
  const getMetricColor = (value: number, type: 'cpu' | 'memory' | 'network' | 'latency') => {
    if (type === 'latency') {
      return value > 100 ? 'text-red-500' : value > 50 ? 'text-yellow-500' : 'text-green-500'
    }
    return value > 80 ? 'text-red-500' : value > 60 ? 'text-yellow-500' : 'text-green-500'
  }

  const getProgressColor = (value: number) => {
    if (value > 80) return 'bg-red-500'
    if (value > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CPU Usage */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className={`text-2xl font-bold ${getMetricColor(cpu, 'cpu')}`}>
                {cpu}%
              </span>
              <span className="text-xs text-gray-500">of 100%</span>
            </div>
            <Progress value={cpu} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className={`text-2xl font-bold ${getMetricColor(memory, 'memory')}`}>
                {memory}%
              </span>
              <span className="text-xs text-gray-500">of 16GB</span>
            </div>
            <Progress value={memory} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Network Throughput */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Wifi className="w-4 h-4" />
            Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className={`text-2xl font-bold ${getMetricColor(network, 'network')}`}>
                {network}%
              </span>
              <span className="text-xs text-gray-500">utilization</span>
            </div>
            <Progress value={network} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Stream Health */}
      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Stream Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-green-500">
                {latency}ms
              </span>
              <span className="text-xs text-gray-500">latency</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>{fps} fps</span>
              <span>{bitrate} kbps</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}