import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

const CanvasRenderer = forwardRef(function CanvasRenderer({ images, style }, ref) {
  const canvasRef = useRef(null)
  const currentFrameRef = useRef(0)
  const rafRef = useRef(null)

  // Expose drawFrame to parent
  useImperativeHandle(ref, () => ({
    drawFrame(index) {
      const clamped = Math.max(0, Math.min(images.length - 1, Math.round(index)))
      if (clamped === currentFrameRef.current) return
      currentFrameRef.current = clamped
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const canvas = canvasRef.current
        if (!canvas || !images[clamped]?.complete) return
        const ctx = canvas.getContext('2d')
        const img = images[clamped]
        // Cover-fit the image
        const cw = canvas.width, ch = canvas.height
        const iw = img.naturalWidth, ih = img.naturalHeight
        const scale = Math.max(cw / iw, ch / ih)
        const sw = iw * scale, sh = ih * scale
        const ox = (cw - sw) / 2, oy = (ch - sh) / 2
        ctx.clearRect(0, 0, cw, ch)
        ctx.drawImage(img, ox, oy, sw, sh)
      })
    }
  }), [images])

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      // Redraw current frame after resize
      const img = images[currentFrameRef.current]
      if (!img?.complete) return
      const ctx = canvas.getContext('2d')
      const cw = canvas.width, ch = canvas.height
      const iw = img.naturalWidth, ih = img.naturalHeight
      const scale = Math.max(cw / iw, ch / ih)
      const sw = iw * scale, sh = ih * scale
      ctx.drawImage(img, (cw - sw) / 2, (ch - sh) / 2, sw, sh)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [images])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        display: 'block',
        ...style,
      }}
    />
  )
})

export default CanvasRenderer
