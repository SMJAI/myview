import Image from 'next/image'

interface AvatarProps {
  avatarUrl: string | null | undefined
  name: string
  size?: number
  className?: string
}

export function Avatar({ avatarUrl, name, size = 32, className = '' }: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) }

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold shrink-0 ${className}`}
      style={style}
    >
      {initial}
    </div>
  )
}
