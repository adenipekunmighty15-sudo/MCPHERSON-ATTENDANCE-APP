'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type ComponentProps } from 'react'

type ShimmerImageProps = Omit<ComponentProps<typeof Image>, 'onLoad' | 'onError'> & {
  /** Wrapper modifier, e.g. for a hero image that must fill its parent. */
  wrapperClassName?: string
  /** Light skeletons suit logos; dark skeletons suit hero photography. */
  tone?: 'light' | 'dark'
}

export default function ShimmerImage({
  wrapperClassName = '',
  tone = 'light',
  className,
  fill,
  loading = 'eager',
  src,
  ...props
}: ShimmerImageProps) {
  const [loaded, setLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Priority images can finish before hydration, so onLoad may never fire.
  useEffect(() => {
    if (imageRef.current?.complete) setLoaded(true)
  }, [src])

  return (
    <span className={`shimmer-wrap ${fill ? 'shimmer-fill' : ''} ${wrapperClassName}`.trim()}>
      <span
        className={`shimmer-skeleton shimmer-${tone} ${loaded ? 'is-hidden' : ''}`.trim()}
        aria-hidden="true"
      />
      <Image
        {...props}
        ref={imageRef}
        src={src}
        fill={fill}
        loading={loading}
        className={className}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </span>
  )
}
