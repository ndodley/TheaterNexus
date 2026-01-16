import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export type HeroSlide = {
  src?: string | null
  alt: string
  caption?: string
  onClick?: () => void
}

export type HeroCarouselRenderArgs = {
  activeIndex: number
  activeSlide: HeroSlide
  isPaused: boolean
}

type Props = {
  slides: HeroSlide[]
  intervalMs?: number
  children?: React.ReactNode | ((args: HeroCarouselRenderArgs) => React.ReactNode)
  height?: number
  showProgress?: boolean
  variant?: 'overlay' | 'stacked'
  onActiveIndexChange?: (activeIndex: number) => void
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function HeroCarousel({
  slides,
  intervalMs = 6500,
  children,
  height = 380,
  showProgress = true,
  variant = 'overlay',
  onActiveIndexChange,
}: Props) {
  const safeSlides = useMemo(() => (slides?.length ? slides : [{ src: null, alt: 'Featured', caption: '' }]), [slides])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = useRef(prefersReducedMotion())

  const rootRef = useRef<HTMLElement | null>(null)
  const dragState = useRef<{ active: boolean; startX: number; lastX: number }>({ active: false, startX: 0, lastX: 0 })
  const didDrag = useRef(false)
  const [dragPx, setDragPx] = useState(0)

  useEffect(() => {
    // Clamp index if slides length changes
    setIndex((prev) => {
      if (safeSlides.length <= 0) return 0
      return Math.min(prev, safeSlides.length - 1)
    })
  }, [safeSlides.length])

  useEffect(() => {
    onActiveIndexChange?.(index)
  }, [index, onActiveIndexChange])

  useEffect(() => {
    if (reduced.current) return
    if (paused) return
    if (safeSlides.length < 2) return

    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length)
    }, intervalMs)

    return () => window.clearInterval(id)
  }, [intervalMs, paused, safeSlides.length])

  const goPrev = useCallback(() => setIndex((prev) => (prev - 1 + safeSlides.length) % safeSlides.length), [safeSlides.length])
  const goNext = useCallback(() => setIndex((prev) => (prev + 1) % safeSlides.length), [safeSlides.length])

  const showControls = safeSlides.length > 1

  const activeSlide = safeSlides[Math.min(index, safeSlides.length - 1)]
  const content = typeof children === 'function' ? children({ activeIndex: index, activeSlide, isPaused: paused }) : children

  const dragPercent = useMemo(() => {
    const w = rootRef.current?.clientWidth || 1
    return (dragPx / w) * 100
  }, [dragPx])

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (showControls && e.key === 'ArrowLeft') {
      e.preventDefault()
      goPrev()
    }
    if (showControls && e.key === 'ArrowRight') {
      e.preventDefault()
      goNext()
    }

    if (e.key === 'Enter' || e.key === ' ') {
      if (activeSlide?.onClick) {
        e.preventDefault()
        activeSlide.onClick()
      }
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!showControls && !activeSlide?.onClick) return

    // If the user is clicking an interactive control (buttons/links/dots),
    // don't start a drag gesture. Otherwise pointer-capture can swallow clicks.
    const target = e.target as HTMLElement | null
    const interactive = target?.closest?.('button, a, input, textarea, select, [role="button"], [role="tab"]')
    if (interactive) return

    // Only left-click drags (when applicable)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyEvent = e as any
    if (typeof anyEvent.button === 'number' && anyEvent.button !== 0) return

    dragState.current.active = true
    didDrag.current = false
    dragState.current.startX = e.clientX
    dragState.current.lastX = e.clientX
    setPaused(true)
    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!dragState.current.active) return
    dragState.current.lastX = e.clientX
    const dx = dragState.current.lastX - dragState.current.startX
    if (Math.abs(dx) > 8) didDrag.current = true
    setDragPx(dx)
  }

  const endDrag = (e: PointerEvent<HTMLElement>) => {
    if (!dragState.current.active) return
    dragState.current.active = false

    const dx = dragState.current.lastX - dragState.current.startX
    const w = rootRef.current?.clientWidth || 1
    const threshold = Math.max(60, w * 0.12)

    setDragPx(0)
    if (Math.abs(dx) >= threshold) {
      if (dx < 0) goNext()
      else goPrev()
    } else {
      // Treat as a tap/click if the user didn't drag.
      if (!didDrag.current && activeSlide?.onClick) activeSlide.onClick()
    }

    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
  }

  return (
    <section
      ref={rootRef as any}
      className={`hero ${variant === 'stacked' ? 'hero--stacked' : ''} ${showControls ? 'hero--draggable' : ''} ${activeSlide?.onClick ? 'hero--clickable' : ''} ${dragPx ? 'is-dragging' : ''}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      tabIndex={0}
      aria-label="Featured movies"
    >
      {variant === 'stacked' && content ? (
        <div key={index} className="hero__stackedContent">{content}</div>
      ) : null}

      <div className="hero__viewport" style={{ height }}>
        <div
          className={`hero__track ${dragPx ? 'is-dragging' : ''}`}
          style={{
            transform: `translateX(${-(index * 100) + dragPercent}%)`,
            transition: dragPx ? 'none' : undefined,
          }}
        >
          {safeSlides.map((s, i) => (
            <div
              key={`${s.alt}-${i}`}
              className={`hero__slide ${i === index ? 'is-active' : ''} ${s.onClick ? 'is-clickable' : ''}`}
              aria-hidden={i !== index}
            >
              {s.src ? (
                <img className="hero__img" src={s.src} alt={s.alt} loading={i === 0 ? 'eager' : 'lazy'} />
              ) : (
                <div className="hero__img hero__img--placeholder" role="img" aria-label={s.alt} />
              )}
              <div className="hero__shade" />
            </div>
          ))}
        </div>

        {variant === 'overlay' && content ? (
          <div className="hero__content">
            <div key={index} className="hero__contentInner">{content}</div>
          </div>
        ) : null}

        {showControls && (
          <>
            <button className="hero__nav hero__nav--prev" type="button" aria-label="Previous slide" onClick={goPrev}>
              ‹
            </button>
            <button className="hero__nav hero__nav--next" type="button" aria-label="Next slide" onClick={goNext}>
              ›
            </button>

            <div className="hero__dots" role="tablist" aria-label="Choose slide">
              {safeSlides.map((s, i) => (
                <button
                  key={`${s.alt}-dot-${i}`}
                  className={`hero__dot ${i === index ? 'is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                />
              ))}
            </div>

            {showProgress && !reduced.current && (
              <div className="hero__progress" aria-hidden="true">
                <div
                  key={`${index}-${intervalMs}`}
                  className="hero__progressBar"
                  style={{
                    animationDuration: `${intervalMs}ms`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
