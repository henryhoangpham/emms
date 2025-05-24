import * as React from "react"
import { cn } from "@/utils/cn"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {}

function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      {...props}
    />
  )
}

export { Spinner }
export type { SpinnerProps } 