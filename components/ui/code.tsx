import * as React from "react"
import { cn } from "@/utils/cn"

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {}

function Code({ className, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "bg-zinc-100 font-mono text-sm dark:bg-zinc-800",
        className
      )}
      {...props}
    />
  )
}

export { Code }
export type { CodeProps } 