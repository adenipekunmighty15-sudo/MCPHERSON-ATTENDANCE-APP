import Link from 'next/link'
import styles from './portal-nav.module.css'

export type PortalSection = 'overview' | 'chat' | 'university'

const sections: { id: PortalSection; label: string; href: string }[] = [
  { id: 'overview', label: 'Overview', href: '/dashboard' },
  { id: 'chat', label: 'AI Chat', href: '/chat' },
  { id: 'university', label: 'University', href: '/university' },
]

interface PortalNavProps {
  active: PortalSection
  /** Compact mode is used inside the chat workspace top bar. */
  compact?: boolean
}

export default function PortalNav({ active, compact = false }: PortalNavProps) {
  return (
    <nav className={`${styles.nav} ${compact ? styles.compact : ''}`.trim()} aria-label="Portal sections">
      {!compact ? (
        <Link href="/dashboard" className={styles.brand} aria-label="McPherson University portal">
          <span className={styles.mark}>M</span>
          <span className={styles.brandText}>
            <strong>McPherson</strong>
            <small>Campus portal</small>
          </span>
        </Link>
      ) : null}

      <div className={styles.links}>
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className={`${styles.link} ${active === section.id ? styles.linkActive : ''}`.trim()}
            aria-current={active === section.id ? 'page' : undefined}
          >
            {section.label}
          </Link>
        ))}
      </div>

      {!compact ? <span className={styles.badge}>One university · One app</span> : null}
    </nav>
  )
}
