import { React, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedBroadcastButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function OptimizedBroadcastButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  onClick,
  className
}: OptimizedBroadcastButtonProps) {
  const variantClasses = {
    primary: 'broadcast-button',
    secondary: 'broadcast-button secondary',
    danger: 'broadcast-button danger',
    success: 'broadcast-button bg-aws-success text-aws-text-primary hover:bg-aws-success-light'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const memoizedVariant = useMemo(() => variant, [variant])
  const memoizedSize = useMemo(() => size, [size])
  const memoizedDisabled = useMemo(() => disabled, [disabled])
  const memoizedLoading = useMemo(() => loading, [loading])

  return (
    <button
      className={cn(
        "aws-theme",
        variantClasses[memoizedVariant],
        sizeClasses[memoizedSize],
        "relative overflow-hidden transition-all duration-200",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
        "hover:transform hover:-translate-y-0.5",
        "active:transform active:translate-y-0",
        memoizedDisabled && "pointer-events-none",
        memoizedLoading && "cursor-wait",
        className
      )}
      onClick={memoizedDisabled || memoizedLoading ? undefined : onClick}
      disabled={memoizedDisabled || memoizedLoading}
    >
      <div className="relative z-10 flex items-center gap-2">
        {memoizedLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon && <span className="transition-transform duration-200 group-hover:scale-110">{icon}</span>
        )}
        <span>{children}</span>
      </div>
      
      {/* Ripple effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      </div>
    </button>
  )
}

interface BroadcastControlGroupProps {
  children: React.ReactNode
  className?: string
}

export function BroadcastControlGroup({ children, className }: BroadcastControlGroupProps) {
  return (
    <div className={cn(
      "aws-theme flex items-center gap-2 flex-wrap",
      className
    )}>
      {children}
    </div>
  )
}

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'warning' | 'error' | 'live'
  text?: string
  pulse?: boolean
  className?: string
}

export function StatusBadge({ 
  status, 
  text, 
  pulse = true, 
  className 
}: StatusBadgeProps) {
  const statusConfig = {
    online: { bg: 'bg-aws-success', text: 'Online' },
    offline: { bg: 'bg-aws-text-muted', text: 'Offline' },
    warning: { bg: 'bg-aws-warning', text: 'Warning' },
    error: { bg: 'bg-aws-danger', text: 'Error' },
    live: { bg: 'bg-aws-danger', text: 'LIVE' }
  }

  const config = statusConfig[status]
  const displayText = text || config.text
  const memoizedStatus = useMemo(() => status, [status])
  const memoizedPulse = useMemo(() => pulse, [pulse])

  return (
    <span className={cn(
      "aws-theme inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white",
      config.bg,
      memoizedPulse && memoizedStatus === 'live' && "animate-pulse",
      memoizedPulse && memoizedStatus === 'online' && "shadow-aws-success",
      memoizedPulse && memoizedStatus === 'warning' && "shadow-aws-orange",
      memoizedPulse && memoizedStatus === 'error' && "shadow-aws-danger",
      "transition-all duration-200 hover:scale-105",
      className
    )}>
      {displayText}
    </span>
  )
}