// Lightweight in-process pub/sub for authenticated message streams.
// A single backend instance pushes updates to open messaging sessions; polling
// remains the fallback for multi-instance deployments or dropped connections.
const subscribers = new Map()

export function subscribeToMessages(userId, send) {
  if (!subscribers.has(userId)) subscribers.set(userId, new Set())
  const listeners = subscribers.get(userId)
  listeners.add(send)

  return () => {
    const current = subscribers.get(userId)
    if (!current) return
    current.delete(send)
    if (!current.size) subscribers.delete(userId)
  }
}

export function emitMessageEvent(userIds, payload) {
  const chunk = `event: message\ndata: ${JSON.stringify(payload)}\n\n`
  const recipients = new Set((userIds || []).filter(Boolean))

  for (const userId of recipients) {
    const listeners = subscribers.get(userId)
    if (!listeners) continue
    for (const send of listeners) {
      try {
        send(chunk)
      } catch {
        // The connection close handler removes dead writers.
      }
    }
  }
}
