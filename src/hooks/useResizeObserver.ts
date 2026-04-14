import { useEffect, useState, type RefObject } from 'react'

export function useResizeObserver(ref: RefObject<HTMLElement | null>): {
  width: number
  height: number
} {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return dimensions
}
