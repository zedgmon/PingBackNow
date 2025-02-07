
import logo from '@/assets/logo.png'

export function Logo({ className }: { className?: string }) {
  return (
    <img 
      src={logo} 
      alt="PingBack Now Logo" 
      className={className}
      width={150}
      height={40}
    />
  )
}
