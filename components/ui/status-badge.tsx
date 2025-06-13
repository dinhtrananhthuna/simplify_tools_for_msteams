import { cn } from "@/lib/utils"

type StatusVariant = "active" | "inactive" | "setup-needed" | "error"

interface StatusBadgeProps {
  variant: StatusVariant
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", `status-${variant}`, className)}>
      {children}
    </span>
  )
} 