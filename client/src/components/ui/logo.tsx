
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <img 
      src="/logo.png"
      alt="PingBack Now Logo" 
      className={cn("w-auto", className)}
      width={150}
      height={40}
    />
  )
}
