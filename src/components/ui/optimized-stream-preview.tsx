import { React, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedStreamPreviewProps {
  isActive?: boolean
  resolution?: string
  fps?: number
  bitrate?: number
  className?: string
  showStats?: boolean
}

export function OptimizedStreamPreview({ 
  isActive = false, 
  resolution, 
  fps, 
  bitrate, 
  className,
  showStats = true
}: OptimizedStreamPreviewProps) {
  const memoizedIsActive = useMemo(() => isActive, [isActive])
  const memoizedResolution = useMemo(() => resolution, [resolution])
  const memoizedFps = useMemo(() => fps, [fps])
  const memoizedBitrate = useMemo(() => bitrate, [bitrate])
  const memoizedShowStats = useMemo(() => showStats, [showStats])

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "aws-theme stream-preview relative overflow-hidden transition-all duration-300",
        memoizedIsActive && "border-aws-danger shadow-aws-danger",
        !memoizedIsActive && "border-aws-border"
      )}>
        {/* Live Indicator */}
        {memoizedIsActive && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-aws-danger text-white px-3 py-1 rounded text-sm font-bold animate-pulse hardware-accelerated">
              LIVE
            </div>
          </div>
        )}

        {/* Signal Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className={cn(
            "text-center transition-all duration-300",
            memoizedIsActive ? "opacity-0 scale-90" : "opacity-100 scale-100"
          )}>
            <div className="text-aws-text-muted font-bold text-lg uppercase tracking-wider">
              No Signal
            </div>
            <div className="text-aws-text-secondary text-sm mt-2">
              Waiting for input...
            </div>
          </div>
        </div>

        {/* Animated Scan Lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-gradient-to-b from-transparent via-aws-primary/20 to-transparent animate-pulse"></div>
        </div>

        {/* Corner Brackets */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-aws-primary opacity-60"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-aws-primary opacity-60"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-aws-primary opacity-60"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-aws-primary opacity-60"></div>
      </div>

      {/* Stream Statistics */}
      {memoizedShowStats && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-aws-surface border-aws-border rounded-lg p-3 transition-all duration-200 hover:border-aws-primary">
            <p className="text-aws-text-secondary text-xs uppercase tracking-wide font-medium">
              Resolution
            </p>
            <p className="text-aws-primary font-bold text-lg">
              {memoizedResolution || 'N/A'}
            </p>
          </div>
          <div className="bg-aws-surface border-aws-border rounded-lg p-3 transition-all duration-200 hover:border-aws-primary">
            <p className="text-aws-text-secondary text-xs uppercase tracking-wide font-medium">
              FPS
            </p>
            <p className="text-aws-primary font-bold text-lg">
              {memoizedFps || 'N/A'}
            </p>
          </div>
          <div className="bg-aws-surface border-aws-border rounded-lg p-3 transition-all duration-200 hover:border-aws-primary">
            <p className="text-aws-text-secondary text-xs uppercase tracking-wide font-medium">
              Bitrate
            </p>
            <p className="text-aws-primary font-bold text-lg">
              {memoizedBitrate ? `${memoizedBitrate} kbps` : 'N/A'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

interface MiniStreamPreviewProps {
  isActive?: boolean
  title: string
  viewers?: number
  className?: string
}

export function MiniStreamPreview({ 
  isActive = false, 
  title, 
  viewers = 0, 
  className 
}: MiniStreamPreviewProps) {
  const memoizedIsActive = useMemo(() => isActive, [isActive])
  const memoizedTitle = useMemo(() => title, [title])
  const memoizedViewers = useMemo(() => viewers, [viewers])

  return (
    <div className={cn(
      "aws-theme bg-aws-surface border-aws-border rounded-lg p-3 transition-all duration-200 hover:border-aws-primary hover:shadow-aws-sm",
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-aws-primary font-semibold text-sm truncate">
          {memoizedTitle}
        </h4>
        <div className={cn(
          "status-indicator",
          memoizedIsActive ? "online status-pulse-green" : "offline"
        )} />
      </div>
      
      <div className="relative">
        <div className={cn(
          "bg-aws-secondary-dark rounded aspect-video relative overflow-hidden transition-all duration-300",
          memoizedIsActive && "border border-aws-danger"
        )}>
          {memoizedIsActive && (
            <div className="absolute top-1 left-1 bg-aws-danger text-white px-1 py-0.5 rounded text-xs font-bold">
              LIVE
            </div>
          )}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "text-center transition-all duration-300",
              memoizedIsActive ? "opacity-0 scale-90" : "opacity-100 scale-100"
            )}>
              <div className="text-aws-text-muted text-xs uppercase tracking-wider">
                No Signal
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-aws-text-secondary text-xs">
          Viewers: {memoizedViewers}
        </span>
        <span className="text-aws-text-secondary text-xs">
          {memoizedIsActive ? "Active" : "Offline"}
        </span>
      </div>
    </div>
  )
}