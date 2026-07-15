import { defineStore } from 'pinia'
import api from '../lib/api'

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    balance: 0,
    transactions: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchWallet() {
      this.loading = true
      this.error = null
      try {
        const [{ data: balData }, { data: txData }] = await Promise.all([
          api.get('/wallet/balance'),
          api.get('/wallet/transactions')
        ])
        this.balance = balData.balance
        this.transactions = txData
      } catch (err) {
        this.error = err.message
      } finally {
        this.loading = false
      }
    },
    async fundWallet(amount, source) {
      this.loading = true
      try {
        await api.post('/wallet/fund', { amount, source })
        await this.fetchWallet()
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to fund wallet')
      } finally {
        this.loading = false
      }
    },
    async pay(amount, description) {
      this.loading = true
      try {
        await api.post('/wallet/pay', { amount, description })
        await this.fetchWallet()
      } catch (err) {
        throw new Error(err.response?.data?.error || 'Failed to process payment')
      } finally {
        this.loading = false
      }
    }
  }
})
