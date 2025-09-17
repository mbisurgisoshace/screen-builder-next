import { cn } from "@/lib/utils"

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse";
}

export function Loader({ 
  className, 
  size = "md", 
  variant = "spinner" 
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  if (variant === "spinner") {
    return (
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)}>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "bg-blue-600 rounded animate-pulse",
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return null;
}

// Loading text component for when you need text with loader
export function LoadingText({ 
  text = "Loading...", 
  className,
  showLoader = true,
  loaderVariant = "spinner",
  loaderSize = "sm",
  centered = true
}: {
  text?: string;
  className?: string;
  showLoader?: boolean;
  loaderVariant?: "spinner" | "dots" | "pulse";
  loaderSize?: "sm" | "md" | "lg";
  centered?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-2",
      centered ? "justify-center" : "",
      className
    )}>
      {showLoader && <Loader variant={loaderVariant} size={loaderSize} />}
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  );
}
