import { supabase } from './supabase'

export function subscribeNotifications(userId, callback) {
  if (!supabase) return null
  try {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        if (callback && payload.new) {
          callback({
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
            link: payload.new.link,
            createdAt: payload.new.created_at,
            read: payload.new.is_read || false,
          })
        }
      })
      .subscribe()
    return channel
  } catch (e) {
    console.warn('[Realtime] Subscription failed:', e)
    return null
  }
}

export function unsubscribeChannel(channel) {
  if (channel) {
    supabase?.removeChannel(channel)
  }
}
