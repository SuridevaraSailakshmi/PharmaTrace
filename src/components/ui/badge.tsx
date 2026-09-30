import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]",
    secondary: "border-transparent bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]",
    destructive: "border-transparent bg-[var(--color-error)] text-white hover:bg-red-700",
    outline: "text-[var(--color-text-primary)]",
    success: "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]",
    warning: "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
    info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
