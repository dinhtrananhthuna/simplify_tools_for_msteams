import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ 
  isLoading, 
  text = "Đang xử lý...", 
  className,
  children 
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-3" />
            <p className="text-sm text-gray-600">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface ButtonLoadingProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function ButtonLoading({ 
  isLoading, 
  children, 
  className,
  disabled,
  onClick,
  type = "button"
}: ButtonLoadingProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center space-x-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      <span>{children}</span>
    </button>
  );
} 