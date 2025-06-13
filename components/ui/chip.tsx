import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline"
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "default"
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Chip.displayName = "Chip"

export { Chip }
