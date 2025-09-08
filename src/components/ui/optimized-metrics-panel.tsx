import { React, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedMetricsPanelProps {
  value: string | number
  label: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  className?: string
}

export function OptimizedMetricsPanel({ 
  value, 
  label, 
  icon, 
  trend, 
  trendValue, 
  className 
}: OptimizedMetricsPanelProps) {
  const memoizedValue = useMemo(() => value, [value])
  const memoizedLabel = useMemo(() => label, [label])
  const memoizedTrend = useMemo(() => trend, [trend])
  const memoizedTrendValue = useMemo(() => trendValue, [trendValue])

  return (
    <div className={cn(
      "aws-theme metrics-panel animate-fade-in hardware-accelerated will-change-transform",
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-aws-primary opacity-60 transition-all duration-200 hover:opacity-100">
                {icon}
              </div>
            )}
            <div>
              <div className="metric-value hardware-accelerated will-change-transform">
                {memoizedValue}
              </div>
              <div className="metric-label flex items-center gap-2">
                <span>{memoizedLabel}</span>
                {memoizedTrend && memoizedTrendValue && (
                  <span className={cn(
                    "text-xs font-medium transition-all duration-200",
                    memoizedTrend === 'up' && 'text-aws-success',
                    memoizedTrend === 'down' && 'text-aws-danger',
                    memoizedTrend === 'stable' && 'text-aws-warning'
                  )}>
                    {memoizedTrend === 'up' && '↑'}
                    {memoizedTrend === 'down' && '↓'}
                    {memoizedTrend === 'stable' && '→'}
                    {memoizedTrendValue}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CompactMetricsPanelProps {
  value: string | number
  label: string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'accent'
  className?: string
}

export function CompactMetricsPanel({ 
  value, 
  label, 
  color = 'primary', 
  className 
}: CompactMetricsPanelProps) {
  const colorClasses = {
    primary: 'text-aws-primary',
    success: 'text-aws-success',
    warning: 'text-aws-warning',
    danger: 'text-aws-danger',
    accent: 'text-aws-accent'
  }

  const memoizedValue = useMemo(() => value, [value])
  const memoizedLabel = useMemo(() => label, [label])
  const memoizedColor = useMemo(() => color, [color])

  return (
    <div className={cn(
      "aws-theme bg-aws-surface border-aws-border rounded-lg p-3 transition-all duration-200 hover:border-aws-primary hover:shadow-aws-sm",
      className
    )}>
      <div className={cn(
        "text-2xl font-bold aws-font-mono hardware-accelerated will-change-transform",
        colorClasses[memoizedColor]
      )}>
        {memoizedValue}
      </div>
      <div className="text-xs text-aws-text-secondary uppercase tracking-wide font-medium">
        {memoizedLabel}
      </div>
    </div>
  )
}