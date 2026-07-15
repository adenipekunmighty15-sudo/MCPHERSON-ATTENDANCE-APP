import { ref } from 'vue'

export function useSpeech() {
  const speaking = ref(false)
  const supported = ref('speechSynthesis' in window)

  function speak(text) {
    if (!supported.value) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.onstart = () => { speaking.value = true }
    utterance.onend = () => { speaking.value = false }
    utterance.onerror = () => { speaking.value = false }
    window.speechSynthesis.speak(utterance)
  }

  function stop() {
    window.speechSynthesis.cancel()
    speaking.value = false
  }

  return { speaking, supported, speak, stop }
}
