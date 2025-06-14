import { cn } from "@/lib/utils"

interface LoadingProps {
  className?: string
  text?: string
  size?: "sm" | "default" | "lg"
}

export function Loading({ className, text = "Loading...", size = "default" }: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    default: "w-6 h-6 border-2", 
    lg: "w-8 h-8 border-4"
  }

  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <div className="text-center">
        <div className={cn(
          "border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-4",
          sizeClasses[size]
        )}></div>
        <p className="text-gray-600 text-sm">{text}</p>
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

interface PageLoadingProps {
  title?: string
  description?: string
  text?: string
}

export function PageLoading({ title = "Loading", description, text = "Đang tải dữ liệu..." }: PageLoadingProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-12 h-12 border-4 border-teams-purple border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600 mb-4">{description}</p>}
        <p className="text-sm text-gray-500">{text}</p>
      </div>
    </div>
  )
}

interface InlineLoadingProps {
  text?: string
  size?: "sm" | "default"
}

export function InlineLoading({ text = "Loading...", size = "default" }: InlineLoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    default: "w-5 h-5 border-2"
  }

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        "border-teams-purple border-t-transparent rounded-full animate-spin",
        sizeClasses[size]
      )}></div>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
} 