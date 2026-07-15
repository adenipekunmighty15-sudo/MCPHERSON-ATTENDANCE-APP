import { defineStore } from 'pinia'
import api from '../lib/api'

export const useGamificationStore = defineStore('gamification', {
  state: () => ({
    xp: 0,
    currentStreak: 0,
    longestStreak: 0,
    badges: [],
    loading: false,
    lastAward: null
  }),
  getters: {
    level: (state) => Math.floor(state.xp / 500) + 1,
    nextLevelXp: (state) => (Math.floor(state.xp / 500) + 1) * 500,
    progressPercent: (state) => {
      const currentLevelBase = Math.floor(state.xp / 500) * 500
      const xpIntoLevel = state.xp - currentLevelBase
      return (xpIntoLevel / 500) * 100
    }
  },
  actions: {
    async fetchProfile() {
      this.loading = true
      try {
        const { data } = await api.get('/gamification/profile')
        this.xp = data.xp || 0
        this.currentStreak = data.current_streak || 0
        this.longestStreak = data.longest_streak || 0
        this.badges = data.badges || []
      } catch (err) {
        console.error('Failed to fetch gamification profile', err)
      } finally {
        this.loading = false
      }
    },
    async awardXp(amount, reason) {
      try {
        const { data } = await api.post('/gamification/award-xp', { amount, reason })
        this.xp = data.totalXp
        this.currentStreak = data.streak
        if (data.newBadges && data.newBadges.length > 0) {
          await this.fetchProfile() // refresh to get full badge details
        }
        
        // Store last award for UI animations
        this.lastAward = {
          amount: data.xpAdded,
          reason,
          timestamp: Date.now()
        }
        
        // Clear last award after 3 seconds
        setTimeout(() => {
          if (this.lastAward?.timestamp === data.timestamp) {
            this.lastAward = null
          }
        }, 3000)
        
        return data
      } catch (err) {
        console.error('Failed to award XP', err)
      }
    }
  }
})
