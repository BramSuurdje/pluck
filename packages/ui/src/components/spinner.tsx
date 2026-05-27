import { RiLoaderLine } from "@remixicon/react"

import { cn } from "@workspace/ui/lib/utils"

function Spinner({ className }: { className?: string }) {
  return (
    <RiLoaderLine
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  )
}

export { Spinner }
