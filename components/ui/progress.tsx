"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"         // Progress library components like Root, Indicator etc.

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root                             // Outer progress bar track
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator                    // Actual filled part
      className="h-full w-full flex-1 bg-green-500 transition-all"              // "transition-all" for a smooth animation on the change
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}          // Illusion of progress increasing left to right, but actually element moving left by (100-value)
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
