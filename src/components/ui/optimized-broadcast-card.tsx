import { React, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedBroadcastCardProps {
  title: string
  description?: string
  status: 'online' | 'offline' | 'warning' | 'error'
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
  animated?: boolean
}

export function OptimizedBroadcastCard({
  title,
  description,
  status,
  children,
  actions,
  className,
  animated = true
}: OptimizedBroadcastCardProps) {
  const statusColors = {
    online: 'status-indicator online',
    offline: 'status-indicator offline',
    warning: 'status-indicator warning',
    error: 'status-indicator error'
  }

  const memoizedTitle = useMemo(() => title, [title])
  const memoizedDescription = useMemo(() => description, [description])
  const memoizedStatus = useMemo(() => status, [status])
  const memoizedAnimated = useMemo(() => animated, [animated])

  return (
    <div className={cn(
      "aws-theme broadcast-card animate-fade-in hardware-accelerated will-change-transform",
      memoizedAnimated && "hover:scale-[1.02]",
      className
    )}>
      <div className="broadcast-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("status-indicator", statusColors[memoizedStatus])} />
            <div>
              <h3 className="text-lg font-semibold text-aws-primary hardware-accelerated will-change-transform">
                {memoizedTitle}
              </h3>
              {memoizedDescription && (
                <p className="text-sm text-aws-text-secondary hardware-accelerated will-change-transform">
                  {memoizedDescription}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

interface StreamInfoProps {
  streamKey: string
  viewers: number
  quality?: string
  bitrate?: number
  className?: string
}

export function StreamInfo({ 
  streamKey, 
  viewers, 
  quality, 
  bitrate, 
  className 
}: StreamInfoProps) {
  const memoizedStreamKey = useMemo(() => streamKey, [streamKey])
  const memoizedViewers = useMemo(() => viewers, [viewers])
  const memoizedQuality = useMemo(() => quality, [quality])
  const memoizedBitrate = useMemo(() => bitrate, [bitrate])

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6", className)}>
      <div className="space-y-1">
        <p className="text-sm text-aws-text-secondary mb-1">Stream Key</p>
        <p className="font-mono text-sm text-aws-primary hardware-accelerated will-change-transform">
          {memoizedStreamKey}
        </p>
      </div>
      <div>
        <p className="text-sm text-aws-text-secondary mb-1">Viewers</p>
        <p className="metric-value text-lg hardware-accelerated will-change-transform">
          {memoizedViewers}
        </p>
      </div>
      <div>
        <p className="text-sm text-aws-text-secondary mb-1">Quality</p>
        <p className="text-aws-primary font-semibold hardware-accelerated will-change-transform">
          {memoizedQuality || 'N/A'}
        </p>
      </div>
      <div>
        <p className="text-sm text-aws-text-secondary mb-1">Bitrate</p>
        <p className="text-aws-primary font-semibold hardware-accelerated will-change-transform">
          {memoizedBitrate ? `${memoizedBitrate} kbps` : 'N/A'}
        </p>
      </div>
    </div>
  )
}

interface UrlConfigProps {
  srtUrl?: string
  rtmpUrl?: string
  className?: string
}

export function UrlConfig({ srtUrl, rtmpUrl, className }: UrlConfigProps) {
  const memoizedSrtUrl = useMemo(() => srtUrl, [srtUrl])
  const memoizedRtmpUrl = useMemo(() => rtmpUrl, [rtmpUrl])

  return (
    <div className={cn("space-y-3", className)}>
      {memoizedSrtUrl && (
        <div>
          <p className="text-sm text-aws-text-secondary mb-2">SRT URL</p>
          <div className="bg-aws-card border-aws-border rounded p-3 transition-all duration-200 hover:border-aws-primary hover:shadow-aws-sm">
            <code className="text-aws-primary text-sm font-mono hardware-accelerated will-change-transform">
              {memoizedSrtUrl}
            </code>
          </div>
        </div>
      )}
      {memoizedRtmpUrl && (
        <div>
          <p className="text-sm text-aws-text-secondary mb-2">RTMP URL</p>
          <div className="bg-aws-card border-aws-border rounded p-3 transition-all duration-200 hover:border-aws-primary hover:shadow-aws-sm">
            <code className="text-aws-primary text-sm font-mono hardware-accelerated will-change-transform">
              {memoizedRtmpUrl}
            </code>
          </div>
        </div>
      )}
    </div>
  )
}