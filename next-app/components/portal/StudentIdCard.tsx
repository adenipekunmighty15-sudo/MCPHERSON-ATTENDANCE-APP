'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import styles from './StudentIdCard.module.css'

/** Display-only shape. Extra fields on an auth user are simply ignored. */
export type StudentIdCardUser = {
  name?: string
  matricNumber?: string
  department?: string
  role?: string
  avatarUrl?: string
  // Optional so unknown values render as an em dash rather than being guessed.
  level?: string
  validUntil?: string
}

/** Accepts either a nested `user` object or the fields spread at the top level. */
export type StudentIdCardProps = StudentIdCardUser & {
  user?: StudentIdCardUser
  className?: string
}

const DEFAULTS: Required<StudentIdCardUser> = {
  name: 'Student',
  matricNumber: 'MCU/—',
  department: 'Computer Science',
  role: 'student',
  avatarUrl: '',
  level: '—',
  validUntil: '—',
}

const STAFF_ROLES = new Set(['admin', 'super_admin', 'lecturer', 'staff'])
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type Tilt = { x: number; y: number; shineX: number; shineY: number; originX: number; originY: number }
const NEUTRAL_TILT: Tilt = { x: 0, y: 0, shineX: 50, shineY: 50, originX: 50, originY: 50 }

/** Decorative, deterministic matrix derived only from the supplied identity fields. */
function buildQrPattern(seedText: string): boolean[] {
  const seed = [...seedText].reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0)
  const size = 11
  const inFinder = (x: number, y: number, ox: number, oy: number) =>
    x >= ox && x < ox + 3 && y >= oy && y < oy + 3
  const finder = (x: number, y: number, ox: number, oy: number) => {
    const lx = x - ox
    const ly = y - oy
    return lx === 0 || ly === 0 || lx === 2 || ly === 2 || (lx === 1 && ly === 1)
  }

  return Array.from({ length: size * size }, (_, index) => {
    const x = index % size
    const y = Math.floor(index / size)
    if (inFinder(x, y, 0, 0)) return finder(x, y, 0, 0)
    if (inFinder(x, y, size - 3, 0)) return finder(x, y, size - 3, 0)
    if (inFinder(x, y, 0, size - 3)) return finder(x, y, 0, size - 3)
    return Math.sin(seed + index * 1.7) * 0.5 + 0.5 > 0.54
  })
}

function buildBarcode(value: string) {
  const seed = value.charCodeAt(0) || 77
  return Array.from({ length: 42 }, (_, index) => ({
    width: 1 + ((seed + index * 7) % 3),
    opacity: 0.45 + (((seed + index * 11) % 5) / 10),
  }))
}

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`${styles.logo}${small ? ` ${styles.logoSmall}` : ''}`} aria-hidden="true">
      <img src="/mcu-logo.png" alt="" />
    </span>
  )
}

function FlipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

export default function StudentIdCard({
  user,
  className,
  name,
  matricNumber,
  department,
  role,
  avatarUrl,
  level,
  validUntil,
}: StudentIdCardProps) {
  const profile = useMemo<Required<StudentIdCardUser>>(() => {
    const source: StudentIdCardUser = user ?? {}
    return {
      name: name || source.name || DEFAULTS.name,
      matricNumber: matricNumber || source.matricNumber || DEFAULTS.matricNumber,
      department: department || source.department || DEFAULTS.department,
      role: role || source.role || DEFAULTS.role,
      avatarUrl: avatarUrl || source.avatarUrl || DEFAULTS.avatarUrl,
      level: level || source.level || DEFAULTS.level,
      validUntil: validUntil || source.validUntil || DEFAULTS.validUntil,
    }
  }, [user, name, matricNumber, department, role, avatarUrl, level, validUntil])

  const [flipped, setFlipped] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [tilt, setTilt] = useState<Tilt>(NEUTRAL_TILT)
  const cardRef = useRef<HTMLDivElement | null>(null)

  const isStaff = STAFF_ROLES.has((profile.role || '').toLowerCase())
  const cardLabel = isStaff ? 'Staff Identity Card' : 'Student Identity Card'

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/).filter(Boolean)
    return parts.slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase() || 'MCU'
  }, [profile.name])

  const registrationCode = useMemo(() => {
    const raw = profile.matricNumber.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()
    return `MCU-${raw || 'CARD'}`
  }, [profile.matricNumber])

  const qrPattern = useMemo(
    () => buildQrPattern(`${profile.matricNumber}${profile.name}`),
    [profile.matricNumber, profile.name],
  )
  const barcodeBars = useMemo(() => buildBarcode(profile.matricNumber || 'MCU'), [profile.matricNumber])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduceMotion(query.matches)
    update()
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update)
      return () => query.removeEventListener('change', update)
    }
    if (typeof query.addListener === 'function') {
      query.addListener(update)
      return () => query.removeListener(update)
    }
    return undefined
  }, [])

  // Gentle scroll drift, eased back to the same resting point.
  useEffect(() => {
    if (reduceMotion || typeof window === 'undefined') return undefined
    const raf = typeof window.requestAnimationFrame === 'function'
      ? window.requestAnimationFrame.bind(window)
      : null
    const caf = typeof window.cancelAnimationFrame === 'function'
      ? window.cancelAnimationFrame.bind(window)
      : null

    let target = 0
    let current = 0
    let scrollFrame = 0
    let lerpFrame = 0

    const measure = () => {
      const node = cardRef.current
      if (!node) return
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const centre = rect.top + rect.height / 2
      target = clamp((centre - viewport / 2) * 0.07, -46, 46)
    }
    const step = () => {
      const diff = target - current
      current += diff * 0.14
      setScrollOffset(Math.abs(diff) > 0.2 ? current : target)
      if (raf && Math.abs(diff) > 0.2) lerpFrame = raf(step)
      else lerpFrame = 0
    }
    const runLerp = () => {
      if (!raf) {
        current = target
        setScrollOffset(target)
        return
      }
      if (!lerpFrame) lerpFrame = raf(step)
    }
    const onScroll = () => {
      if (scrollFrame || !raf) return
      scrollFrame = raf(() => {
        scrollFrame = 0
        measure()
        runLerp()
      })
    }

    measure()
    current = target
    setScrollOffset(target)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (scrollFrame && caf) caf(scrollFrame)
      if (lerpFrame && caf) caf(lerpFrame)
    }
  }, [reduceMotion])

  const toggleFlip = () => {
    setFlipped((value) => !value)
    setTilt(NEUTRAL_TILT)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      toggleFlip()
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType === 'touch') return
    const node = cardRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    setHovering(true)
    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1)
    setTilt({
      x: (0.5 - py) * 17,
      y: (px - 0.5) * 21,
      shineX: px * 100,
      shineY: py * 100,
      originX: px * 100,
      originY: py * 100,
    })
  }

  const handlePointerLeave = () => {
    setHovering(false)
    setPressed(false)
    setTilt(NEUTRAL_TILT)
  }

  const rootStyle = {
    '--origin-x': `${tilt.originX.toFixed(1)}%`,
    '--origin-y': `${tilt.originY.toFixed(1)}%`,
  } as CSSProperties

  const floatStyle: CSSProperties = reduceMotion
    ? { transform: 'translate3d(0, -20px, 0)' }
    : { transform: `translate3d(0, ${(-30 + scrollOffset).toFixed(2)}px, 0)` }

  // Flip stays in CSS so reduced-motion users still see the back instantly.
  const innerStyle: CSSProperties =
    !reduceMotion && !flipped && (hovering || pressed)
      ? {
          transform: `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(${pressed ? 4 : 11}px)`,
          transition: pressed ? 'transform 120ms ease' : 'transform 90ms ease-out',
        }
      : {}

  const shineStyle: CSSProperties =
    !reduceMotion && hovering && !flipped
      ? {
          opacity: 0.65,
          background: `radial-gradient(circle at ${tilt.shineX.toFixed(1)}% ${tilt.shineY.toFixed(1)}%, rgba(255,255,255,0.34), rgba(249,172,138,0.16) 38%, transparent 70%)`,
        }
      : { opacity: 0 }

  return (
    <div
      ref={cardRef}
      className={[
        styles.campusIdCard,
        hovering ? styles.isHovered : '',
        pressed ? styles.isPressed : '',
        className,
      ].filter(Boolean).join(' ')}
      style={rootStyle}
      onPointerMove={handlePointerMove}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        setPressed(true)
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={handlePointerLeave}
    >
      <div className={styles.cardFloat} style={floatStyle}>
        <div className={styles.cardShell}>
          <div
            className={`${styles.inner}${flipped ? ` ${styles.isFlipped}` : ''}`}
            style={innerStyle}
            role="button"
            tabIndex={0}
            aria-label={`${cardLabel} for ${profile.name}. Press Enter or Space to flip the card.`}
            aria-pressed={flipped}
            onClick={toggleFlip}
            onKeyDown={handleKeyDown}
          >
            {/* FRONT */}
            <section className={`${styles.cardFace} ${styles.cardFront}`} aria-hidden={flipped}>
              <img className={styles.campusWatermark} src="/mcu-campus.jpg" alt="" aria-hidden="true" />
              <div className={styles.cardWash} aria-hidden="true" />
              <div className={styles.cardTexture} aria-hidden="true" />
              <div className={styles.cardShine} style={shineStyle} aria-hidden="true" />
              <div className={styles.cardGlare} aria-hidden="true" />

              <header className={styles.cardHeader}>
                <BrandMark />
                <div className={styles.headerCopy}>
                  <strong>McPherson University</strong>
                  <span>{cardLabel}</span>
                </div>
                <span className={styles.activePill}>
                  <i className={styles.activeDot} /> ACTIVE
                </span>
              </header>

              <div className={styles.cardMain}>
                <div className={styles.portrait}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={`${profile.name} portrait`} />
                  ) : (
                    <span>{initials}</span>
                  )}
                  <small>{isStaff ? 'STAFF' : 'MCU'}</small>
                </div>
                <div className={styles.identity}>
                  <span className={styles.identityLabel}>CARDHOLDER</span>
                  <h3 title={profile.name}>{profile.name}</h3>
                  <div className={styles.identityId}>{profile.matricNumber}</div>
                  <dl className={styles.identityDetails}>
                    <div>
                      <dt>Department</dt>
                      <dd title={profile.department}>{profile.department}</dd>
                    </div>
                    <div>
                      <dt>Level</dt>
                      <dd>{profile.level}</dd>
                    </div>
                    <div>
                      <dt>Valid until</dt>
                      <dd>{profile.validUntil}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <footer className={styles.cardFooter}>
                <span className={styles.cardTech} aria-hidden="true">
                  <i className={styles.cardChip} />
                  <i className={styles.cardHologram} />
                  <i className={styles.cardNfc} />
                </span>
                <span className={styles.cardPlace}>Seriki Sotayo · mcu.edu.ng</span>
              </footer>
            </section>

            {/* BACK */}
            <section className={`${styles.cardFace} ${styles.cardBack}`} aria-hidden={!flipped}>
              <div className={`${styles.cardWash} ${styles.cardWashBack}`} aria-hidden="true" />
              <div className={styles.cardTexture} aria-hidden="true" />
              <div className={styles.cardShine} style={shineStyle} aria-hidden="true" />
              <div className={styles.cardGlare} aria-hidden="true" />

              <header className={styles.backHeader}>
                <BrandMark small />
                <div>
                  <strong>McPherson University</strong>
                  <span>Citadel of Champions</span>
                </div>
              </header>

              <div className={styles.backBody}>
                <div className={styles.qrTile} role="img" aria-label="Card reference code">
                  <div className={styles.qrGrid} aria-hidden="true">
                    {qrPattern.map((filled, index) => (
                      <span key={index} className={filled ? styles.filled : undefined} />
                    ))}
                  </div>
                  <small>{registrationCode}</small>
                </div>
                <div className={styles.backCopy}>
                  <span className={styles.backLabel}>CAMPUS SUPPORT</span>
                  <p>ICT Helpdesk</p>
                  <a
                    href="mailto:ict@mcu.edu.ng"
                    tabIndex={flipped ? 0 : -1}
                    onClick={(event) => event.stopPropagation()}
                  >
                    ict@mcu.edu.ng
                  </a>
                  <p className={styles.backNote}>
                    This card remains university property and is valid only while the holder is actively registered.
                  </p>
                </div>
              </div>

              <div className={styles.barcode} aria-hidden="true">
                {barcodeBars.map((bar, index) => (
                  <span key={index} style={{ width: `${bar.width}px`, opacity: bar.opacity }} />
                ))}
              </div>
            </section>
          </div>

          <button
            type="button"
            className={styles.flipButton}
            aria-label={flipped ? 'Show front of ID card' : 'Show back of ID card'}
            aria-pressed={flipped}
            onClick={(event) => {
              event.stopPropagation()
              toggleFlip()
            }}
          >
            <FlipIcon />
            {flipped ? 'Front' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  )
}
