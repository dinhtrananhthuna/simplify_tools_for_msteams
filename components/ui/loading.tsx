import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  text?: string
}

export function Loading({ className, text = "Loading..." }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  )
}

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

export function LoadingSpinner({ className, size = "default" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    default: "w-6 h-6 border-2", 
    lg: "w-8 h-8 border-4"
  }

  return (
    <div className={cn(
      "border-teams-purple border-t-transparent rounded-full animate-spin",
      sizeClasses[size],
      className
    )} />
  )
} 