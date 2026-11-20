// Premium interaction directives shared across the portal.
//
// Every effect is progressive: it respects `prefers-reduced-motion`, avoids
// layout thrash by reading geometry once per frame, and cleans up observers and
// listeners when the host component unmounts.

const reduceMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const supportsHover = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(hover: hover) and (pointer: fine)').matches

function readOptions(value, fallback = {}) {
  if (typeof value === 'number') return { ...fallback, max: value }
  if (value && typeof value === 'object') return { ...fallback, ...value }
  return { ...fallback }
}

/* ── Scroll reveal ─────────────────────────────────────────────────────────
   Usage: v-reveal, v-reveal:left, v-reveal:scale="{ delay: 120 }"
   Variants: up (default), down, left, right, scale, blur. */
export const vReveal = {
  mounted(el, binding) {
    const { delay = 0, threshold = 0.14, once = true } = readOptions(binding.value)
    const variant = binding.arg || 'up'

    el.classList.add('reveal', `reveal-${variant}`)
    el.style.setProperty('--reveal-delay', `${Math.max(0, delay)}ms`)

    if (reduceMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-revealed')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          el.classList.add('is-revealed')
          if (once) observer.unobserve(el)
        })
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(el)
    el.__revealObserver = observer
  },
  unmounted(el) {
    el.__revealObserver?.disconnect()
    delete el.__revealObserver
  },
}

/* ── 3D tilt + pointer spotlight ───────────────────────────────────────────
   Usage: v-tilt, v-tilt="{ max: 9 }"
   The element receives --tilt-rx / --tilt-ry and --spot-x / --spot-y. */
export const vTilt = {
  mounted(el, binding) {
    const { max = 7 } = readOptions(binding.value)
    el.classList.add('tilt-surface')

    if (reduceMotion() || !supportsHover()) return

    let frame = 0
    let latest = null

    const render = () => {
      frame = 0
      if (!latest) return
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const px = Math.min(1, Math.max(0, (latest.clientX - rect.left) / rect.width))
      const py = Math.min(1, Math.max(0, (latest.clientY - rect.top) / rect.height))
      el.style.setProperty('--tilt-rx', `${((0.5 - py) * max).toFixed(2)}deg`)
      el.style.setProperty('--tilt-ry', `${((px - 0.5) * max).toFixed(2)}deg`)
      el.style.setProperty('--spot-x', `${(px * 100).toFixed(2)}%`)
      el.style.setProperty('--spot-y', `${(py * 100).toFixed(2)}%`)
    }

    const onMove = (event) => {
      if (event.pointerType === 'touch') return
      latest = event
      el.classList.add('is-tilting')
      if (!frame) frame = requestAnimationFrame(render)
    }

    const onEnter = () => el.classList.add('is-tilting')

    const onLeave = () => {
      el.classList.remove('is-tilting')
      el.style.setProperty('--tilt-rx', '0deg')
      el.style.setProperty('--tilt-ry', '0deg')
    }

    const onDown = () => el.classList.add('is-pressed')
    const onUp = () => el.classList.remove('is-pressed')

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)

    el.__tiltCleanup = () => {
      if (frame) cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  },
  unmounted(el) {
    el.__tiltCleanup?.()
    delete el.__tiltCleanup
  },
}

/* ── Scroll parallax ───────────────────────────────────────────────────────
   Usage: v-parallax, v-parallax="0.14" or { speed: 0.14, clamp: 60 }
   Works with window scrolling and nested scroll containers. */
export const vParallax = {
  mounted(el, binding) {
    const { speed = 0.12, clamp = 60 } = readOptions(binding.value)
    el.classList.add('parallax-layer')

    if (reduceMotion()) return

    let frame = 0

    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const centre = rect.top + rect.height / 2
      const offset = Math.max(-clamp, Math.min(clamp, (centre - viewport / 2) * -speed))
      el.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`)
    }

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    document.addEventListener('scroll', schedule, { passive: true, capture: true })
    window.addEventListener('resize', schedule, { passive: true })
    schedule()

    el.__parallaxCleanup = () => {
      if (frame) cancelAnimationFrame(frame)
      document.removeEventListener('scroll', schedule, true)
      window.removeEventListener('resize', schedule)
    }
  },
  unmounted(el) {
    el.__parallaxCleanup?.()
    delete el.__parallaxCleanup
  },
}

/* ── Magnetic pull ─────────────────────────────────────────────────────────
   Usage: v-magnetic, v-magnetic="0.22"
   Uses the CSS `translate` property so it composes with hover transforms. */
export const vMagnetic = {
  mounted(el, binding) {
    const strength = typeof binding.value === 'number' ? binding.value : 0.22
    el.classList.add('magnetic-surface')

    if (reduceMotion() || !supportsHover()) return

    const onMove = (event) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const x = (event.clientX - (rect.left + rect.width / 2)) * strength
      const y = (event.clientY - (rect.top + rect.height / 2)) * strength
      el.style.setProperty('--mag-x', `${Math.max(-12, Math.min(12, x)).toFixed(2)}px`)
      el.style.setProperty('--mag-y', `${Math.max(-12, Math.min(12, y)).toFixed(2)}px`)
    }

    const onLeave = () => {
      el.style.setProperty('--mag-x', '0px')
      el.style.setProperty('--mag-y', '0px')
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)

    el.__magneticCleanup = () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  },
  unmounted(el) {
    el.__magneticCleanup?.()
    delete el.__magneticCleanup
  },
}

/* ── Touch ripple ──────────────────────────────────────────────────────────
   Usage: v-ripple. Adds a tactile ink response to buttons and cards. */
export const vRipple = {
  mounted(el) {
    el.classList.add('touchable')

    const onDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const size = Math.max(rect.width, rect.height) * 1.7
      const ripple = document.createElement('span')
      ripple.className = 'touch-ripple'
      ripple.setAttribute('aria-hidden', 'true')
      ripple.style.width = `${size}px`
      ripple.style.height = `${size}px`
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`
      el.appendChild(ripple)
      window.setTimeout(() => ripple.remove(), 680)
    }

    el.addEventListener('pointerdown', onDown)
    el.__rippleCleanup = () => el.removeEventListener('pointerdown', onDown)
  },
  unmounted(el) {
    el.__rippleCleanup?.()
    delete el.__rippleCleanup
  },
}

/* ── Pointer spotlight ─────────────────────────────────────────────────────
   Usage: v-spotlight. Adds a soft light that follows the cursor across glass
   and card surfaces without replacing existing ::before/::after styles. */
export const vSpotlight = {
  mounted(el) {
    if (!supportsHover()) return

    const glow = document.createElement('span')
    glow.className = 'spotlight-glow'
    glow.setAttribute('aria-hidden', 'true')
    el.appendChild(glow)
    el.classList.add('spotlight-surface')

    const onMove = (event) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      el.style.setProperty('--spot-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`)
      el.style.setProperty('--spot-y', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`)
    }

    el.addEventListener('pointermove', onMove)
    el.__spotlightCleanup = () => {
      el.removeEventListener('pointermove', onMove)
      glow.remove()
    }
  },
  unmounted(el) {
    el.__spotlightCleanup?.()
    delete el.__spotlightCleanup
  },
}

/* ── Motion principles ──────────────────────────────────────────────────────
   These directives express the animation/UX principles requested for the
   redesign. Every effect is interruptible: a new trigger cancels the previous
   animation instead of queueing it, so rapid input never feels stuck.
   All of them become static under prefers-reduced-motion. */

/* Squash & stretch + rubber banding + Doherty-threshold feedback.
   Press feedback is applied synchronously on pointerdown; the release is a
   cancelable spring rather than a queued transition. */
export const vSquash = {
  mounted(el, binding) {
    const { amount = 0.045 } = readOptions(binding.value)
    el.classList.add('ux-squash')
    let release = null

    const cancelRelease = () => {
      if (!release) return
      release.cancel()
      release = null
    }

    const down = () => {
      if (reduceMotion()) return
      cancelRelease()
      el.style.setProperty('--squash-x', (1 + amount * 0.5).toFixed(3))
      el.style.setProperty('--squash-y', (1 - amount).toFixed(3))
      el.classList.add('is-squashing')
    }

    const up = () => {
      if (reduceMotion()) return
      if (!el.classList.contains('is-squashing')) return
      el.classList.remove('is-squashing')
      el.style.removeProperty('--squash-x')
      el.style.removeProperty('--squash-y')
      cancelRelease()
      release = el.animate(
        [
          { scale: `${(1 + amount * 0.45).toFixed(3)} ${(1 - amount).toFixed(3)}` },
          { scale: `${(1 - amount * 0.28).toFixed(3)} ${(1 + amount * 0.5).toFixed(3)}`, offset: 0.55 },
          { scale: '1 1' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      )
      release.finished.then(() => { release = null }).catch(() => {})
    }

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('pointerleave', up)

    el.__squashCleanup = () => {
      cancelRelease()
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('pointerleave', up)
    }
  },
  unmounted(el) {
    el.__squashCleanup?.()
    delete el.__squashCleanup
  },
}

/* Anticipation: a tiny wind-up in the opposite direction before the action
   settles. Uses the independent `translate` property so it composes with
   v-magnetic and with existing hover transforms. */
export const vAnticipate = {
  mounted(el, binding) {
    const { distance = 5 } = readOptions(binding.value)
    el.classList.add('ux-anticipate')
    let timer = 0

    const windUp = () => {
      if (reduceMotion()) return
      window.clearTimeout(timer)
      el.style.setProperty('--anti-y', `${distance}px`)
      timer = window.setTimeout(() => el.style.setProperty('--anti-y', '0px'), 110)
    }
    const settle = () => {
      window.clearTimeout(timer)
      el.style.setProperty('--anti-y', '0px')
    }

    el.addEventListener('pointerenter', windUp)
    el.addEventListener('focus', windUp)
    el.addEventListener('pointerleave', settle)
    el.addEventListener('blur', settle)

    el.__anticipateCleanup = () => {
      window.clearTimeout(timer)
      el.removeEventListener('pointerenter', windUp)
      el.removeEventListener('focus', windUp)
      el.removeEventListener('pointerleave', settle)
      el.removeEventListener('blur', settle)
    }
  },
  unmounted(el) {
    el.__anticipateCleanup?.()
    delete el.__anticipateCleanup
  },
}

/* Origin awareness: transforms grow from where the pointer actually entered,
   so motion reads as physically connected to the user's action. */
export const vOrigin = {
  mounted(el) {
    el.classList.add('ux-origin')
    const update = (event) => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      el.style.setProperty('--origin-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`)
      el.style.setProperty('--origin-y', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`)
    }
    const reset = () => {
      el.style.setProperty('--origin-x', '50%')
      el.style.setProperty('--origin-y', '50%')
    }

    el.addEventListener('pointerenter', update)
    el.addEventListener('pointermove', update)
    el.addEventListener('pointerleave', reset)

    el.__originCleanup = () => {
      el.removeEventListener('pointerenter', update)
      el.removeEventListener('pointermove', update)
      el.removeEventListener('pointerleave', reset)
    }
  },
  unmounted(el) {
    el.__originCleanup?.()
    delete el.__originCleanup
  },
}

/* Staggering: children enter in a deliberate rhythm instead of all at once. */
export const vStagger = {
  mounted(el, binding) {
    const { step = 80, selector = '', variant = 'up' } = readOptions(binding.value)
    el.classList.add('ux-stagger')
    const items = selector
      ? Array.from(el.querySelectorAll(selector))
      : Array.from(el.children)
    const revealClass = `reveal-${variant}`

    items.forEach((item, index) => {
      item.classList.add('reveal', revealClass)
      item.style.setProperty('--reveal-delay', `${index * step}ms`)
    })

    if (reduceMotion() || typeof IntersectionObserver === 'undefined') {
      items.forEach((item) => item.classList.add('is-revealed'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-revealed')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    )
    items.forEach((item) => observer.observe(item))

    el.__staggerCleanup = () => {
      observer.disconnect()
      items.forEach((item) => {
        item.classList.remove('reveal', revealClass, 'is-revealed')
        item.style.removeProperty('--reveal-delay')
      })
    }
  },
  unmounted(el) {
    el.__staggerCleanup?.()
    delete el.__staggerCleanup
  },
}

/* Arcs: motion travels on a curved path rather than a straight line. */
export const vArc = {
  mounted(el, binding) {
    const { lift = 18, distance = 26 } = readOptions(binding.value)
    el.classList.add('ux-arc')
    let animation = null

    const play = () => {
      if (reduceMotion()) return
      if (animation) animation.cancel()
      // `translate` is independent of `transform`, so arcs layer over parallax
      // and tilt instead of replacing their transforms mid-flight.
      animation = el.animate(
        [
          { translate: '0 0' },
          { translate: `${distance}px -${lift}px`, offset: 0.46 },
          { translate: '0 0' },
        ],
        { duration: 720, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      )
      animation.finished.then(() => { animation = null }).catch(() => {})
    }

    el.addEventListener('pointerenter', play)
    el.addEventListener('focus', play)

    el.__arcCleanup = () => {
      if (animation) animation.cancel()
      el.removeEventListener('pointerenter', play)
      el.removeEventListener('focus', play)
    }
  },
  unmounted(el) {
    el.__arcCleanup?.()
    delete el.__arcCleanup
  },
}

/* Follow-through + secondary action: a supporting glow keeps moving after the
   primary interaction has already settled. */
export const vFollow = {
  mounted(el) {
    el.classList.add('ux-follow')
    const trail = document.createElement('span')
    trail.className = 'motion-trail'
    trail.setAttribute('aria-hidden', 'true')
    el.appendChild(trail)

    const on = () => el.classList.add('is-following')
    const off = () => el.classList.remove('is-following')
    el.addEventListener('pointerenter', on)
    el.addEventListener('focus', on)
    el.addEventListener('pointerleave', off)
    el.addEventListener('blur', off)

    el.__followCleanup = () => {
      el.removeEventListener('pointerenter', on)
      el.removeEventListener('focus', on)
      el.removeEventListener('pointerleave', off)
      el.removeEventListener('blur', off)
      trail.remove()
    }
  },
  unmounted(el) {
    el.__followCleanup?.()
    delete el.__followCleanup
  },
}

/* Von Restorff effect + peak-end rule: the single most important item on a
   surface gets one restrained coral emphasis pulse when it appears. */
export const vPeak = {
  mounted(el) {
    el.classList.add('ux-peak')
    const halo = document.createElement('span')
    halo.className = 'peak-halo'
    halo.setAttribute('aria-hidden', 'true')
    el.appendChild(halo)

    if (reduceMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-peaked')
      return
    }

    let timer = 0
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          el.classList.add('is-peaking')
          observer.unobserve(entry.target)
          timer = window.setTimeout(() => el.classList.add('is-peaked'), 1100)
        })
      },
      { threshold: 0.35 }
    )
    observer.observe(el)

    el.__peakCleanup = () => {
      observer.disconnect()
      window.clearTimeout(timer)
      halo.remove()
    }
  },
  unmounted(el) {
    el.__peakCleanup?.()
    delete el.__peakCleanup
  },
}

/* Doherty threshold: keep interactive response under ~100 ms by using short,
   interruptible transitions on frequently used controls. */
export const vInstant = {
  mounted(el) {
    el.classList.add('ux-instant')
  },
}

export const premiumDirectives = {
  reveal: vReveal,
  tilt: vTilt,
  parallax: vParallax,
  magnetic: vMagnetic,
  ripple: vRipple,
  spotlight: vSpotlight,
  squash: vSquash,
  anticipate: vAnticipate,
  origin: vOrigin,
  stagger: vStagger,
  arc: vArc,
  follow: vFollow,
  peak: vPeak,
  instant: vInstant,
}
