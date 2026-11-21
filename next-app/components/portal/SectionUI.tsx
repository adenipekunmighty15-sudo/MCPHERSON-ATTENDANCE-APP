'use client'

import type { ReactNode } from 'react'
import styles from './dashboard.module.css'

export function Panel({ title, copy, action, children }: { title: string; copy?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <div>
          <h2>{title}</h2>
          {copy ? <p>{copy}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function StateBlock({ loading, error, empty, onRetry }: { loading: boolean; error: string; empty?: string; onRetry?: () => void }) {
  if (loading) return <div className={styles.state} role="status">Loading…</div>
  if (error) {
    return (
      <div className={`${styles.state} ${styles.stateError}`} role="alert">
        <p>{error}</p>
        {onRetry ? <button type="button" className={styles.button} onClick={onRetry}>Try again</button> : null}
      </div>
    )
  }
  if (empty) return <div className={styles.state}>{empty}</div>
  return null
}

export function Stat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      {detail ? <span className={styles.statDetail}>{detail}</span> : null}
    </div>
  )
}
