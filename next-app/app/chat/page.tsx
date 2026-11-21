import type { Metadata } from 'next'
import AuthGuard from '@/components/auth/AuthGuard'
import AIChatWorkspace from '@/components/chat/AIChatWorkspace'

export const metadata: Metadata = {
  title: 'AI Chat | McPherson University',
  description: 'Ask real, verified AI models for help with coursework, research and study planning.',
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <AIChatWorkspace />
    </AuthGuard>
  )
}
