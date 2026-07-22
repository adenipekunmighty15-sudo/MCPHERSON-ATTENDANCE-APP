<template>
  <div class="min-h-screen relative overflow-hidden bg-[var(--color-bg)]">
    <div class="page page-wide">
      <div class="content-header">
        <h1 class="h2">Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div v-if="loading" class="space-y-4 animate-fade-in">
        <div class="card p-6 space-y-4">
          <div class="skeleton-box" style="width:40px;height:40px"></div>
          <div class="skeleton-text" style="width:30%"></div>
          <div class="skeleton-text-sm" style="width:20%"></div>
          <div class="skeleton-box" style="width:100%;height:44px"></div>
          <div class="skeleton-text-sm" style="width:20%"></div>
          <div class="skeleton-box" style="width:100%;height:44px"></div>
        </div>
      </div>
      <template v-else>
        <div v-if="errorMsg" class="card border-[var(--color-error)]/30 text-[var(--color-error)] text-body-sm p-4 animate-slide-up">{{ errorMsg }}</div>

        <div class="settings-sections">
          <!-- Profile Settings -->
          <section class="card card-hover p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl card flex items-center justify-center" style="background:var(--color-primary-soft);color:var(--color-primary)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <h2 class="h4 text-[var(--color-text-primary)]">Profile Settings</h2>
            </div>
            <div class="divider" />
            <div class="form-group"><label class="form-label">Full Name</label><input v-model="profile.name" class="input w-full" /></div>
            <div class="form-group"><label class="form-label">Email</label><input v-model="profile.email" class="input w-full" type="email" /></div>
            <div class="form-group"><label class="form-label">Phone</label><input v-model="profile.phone" class="input w-full" type="tel" /></div>
            <button class="btn btn-primary" :disabled="saving.profile" @click="saveProfile">{{ saving.profile ? 'Saving...' : 'Save Changes' }}</button>
          </section>

          <!-- Notifications -->
          <section class="card p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl card flex items-center justify-center" style="background:var(--color-primary-soft);color:var(--color-primary)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <h2 class="h4 text-[var(--color-text-primary)]">Notifications</h2>
            </div>
            <div class="divider" />
            <div class="setting-row"><div><div class="setting-label">Push Notifications</div><div class="setting-desc">Receive real-time push alerts</div></div><label class="toggle-3d" :class="{ active: notifications.push }"><input type="checkbox" v-model="notifications.push" /><div class="toggle-inner"><div class="toggle-face toggle-off"></div><div class="toggle-face toggle-on"></div></div></label></div>
            <div class="setting-row"><div><div class="setting-label">Email Notifications</div><div class="setting-desc">Email updates about events</div></div><label class="toggle-3d" :class="{ active: notifications.email }"><input type="checkbox" v-model="notifications.email" /><div class="toggle-inner"><div class="toggle-face toggle-off"></div><div class="toggle-face toggle-on"></div></div></label></div>
            <div class="setting-row"><div><div class="setting-label">SMS Alerts</div><div class="setting-desc">SMS for urgent updates</div></div><label class="toggle-3d" :class="{ active: notifications.sms }"><input type="checkbox" v-model="notifications.sms" /><div class="toggle-inner"><div class="toggle-face toggle-off"></div><div class="toggle-face toggle-on"></div></div></label></div>
          </section>

          <!-- Security -->
          <section class="card p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl card flex items-center justify-center" style="background:var(--color-primary-soft);color:var(--color-primary)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h2 class="h4 text-[var(--color-text-primary)]">Security</h2>
            </div>
            <div class="divider" />
            <div class="form-group"><label class="form-label">Current Password</label><input v-model="passwordForm.current" class="input w-full" type="password" /></div>
            <div class="form-group"><label class="form-label">New Password</label><input v-model="passwordForm.new" class="input w-full" type="password" /></div>
            <div class="form-group"><label class="form-label">Confirm New Password</label><input v-model="passwordForm.confirm" class="input w-full" type="password" /></div>
            <button class="btn btn-primary" :disabled="saving.password" @click="savePassword">{{ saving.password ? 'Updating...' : 'Change Password' }}</button>
          </section>

          <!-- App Preferences -->
          <section class="card p-6 space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl card flex items-center justify-center" style="background:var(--color-primary-soft);color:var(--color-primary)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
              <h2 class="h4 text-[var(--color-text-primary)]">App Preferences</h2>
            </div>
            <div class="divider" />
            <div class="form-group"><label class="form-label">Language</label><select v-model="preferences.language" class="select w-full"><option value="en">English</option><option value="fr">French</option><option value="es">Spanish</option><option value="ar">Arabic</option></select></div>
            <div class="form-group"><label class="form-label">Theme</label><div class="theme-selector"><div class="theme-card card card-hover" :class="{ active: preferences.theme === 'light' }" @click="preferences.theme = 'light'"><div class="theme-preview theme-preview-light"></div><span>Light</span></div><div class="theme-card card card-hover" :class="{ active: preferences.theme === 'dark' }" @click="preferences.theme = 'dark'"><div class="theme-preview theme-preview-dark"></div><span>Dark</span></div></div></div>
            <div class="form-group"><label class="form-label">Font Size: {{ preferences.fontSize }}px</label><div class="font-size-control"><button class="btn btn-ghost size-btn" :disabled="preferences.fontSize <= 12" @click="preferences.fontSize = Math.max(12, preferences.fontSize - 2)">–</button><div class="font-size-display"><span :style="{ fontSize: '12px', fontWeight: preferences.fontSize <= 13 ? 700 : 400 }">A</span><span :style="{ fontSize: '16px', fontWeight: preferences.fontSize > 13 && preferences.fontSize <= 18 ? 700 : 400 }">A</span><span :style="{ fontSize: '20px', fontWeight: preferences.fontSize > 18 ? 700 : 400 }">A</span></div><button class="btn btn-ghost size-btn" :disabled="preferences.fontSize >= 24" @click="preferences.fontSize = Math.min(24, preferences.fontSize + 2)">+</button></div></div>
            <button class="btn btn-primary" :disabled="saving.preferences" @click="savePreferences">{{ saving.preferences ? 'Saving...' : 'Save Preferences' }}</button>
          </section>

          <!-- Danger Zone -->
          <section class="card p-6 space-y-4" style="border-color:var(--color-error);border-width:1.5px">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl card flex items-center justify-center" style="background:var(--color-error)/12;color:var(--color-error)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><path d="M3.07 8.05A10 10 0 0 0 12 22a10 10 0 0 0 8.93-5.95M9.09 3.58A10 10 0 0 1 12 2a10 10 0 0 1 8.2 4.5"/><path d="M22 2 2 22"/></svg>
              </div>
              <h2 class="h4" style="color:var(--color-error)">Danger Zone</h2>
            </div>
            <div class="divider" />
            <p class="text-body-sm text-[var(--color-text-secondary)]">Once you delete your account, there is no going back. All your data will be permanently removed.</p>
            <button class="btn btn-danger" @click="openDeleteModal">Delete Account</button>
          </section>
        </div>
      </template>

      <div v-if="successMsg" class="toast-success">{{ successMsg }}</div>

      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" @click.self="closeDeleteModal">
        <div class="card card-hover p-8 max-w-sm w-full animate-scale-in">
          <h3 class="h3 text-[var(--color-text-primary)] mb-2">Delete Account</h3>
          <p class="text-body-sm text-[var(--color-text-secondary)] mb-4">This action is permanent and cannot be undone.</p>
          <p class="text-body-sm text-[var(--color-error)] font-semibold mb-2">Type <strong>DELETE</strong> to confirm</p>
          <input v-model="deleteConfirmText" class="input w-full mb-4" placeholder="Type DELETE here" @keyup.enter="deleteAccount" />
          <div class="flex gap-3"><button class="btn btn-danger flex-1" :disabled="deleting" @click="deleteAccount">{{ deleting ? 'Deleting...' : 'Confirm Delete' }}</button><button class="btn btn-secondary flex-1" @click="closeDeleteModal">Cancel</button></div>
          <div v-if="deleteError" class="text-body-sm text-[var(--color-error)] mt-3">{{ deleteError }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useTheme } from '../composables/useTheme'
import api from '../lib/api'

const { setTheme } = useTheme()

const loading = ref(true)
const errorMsg = ref('')
const successMsg = ref('')
const showDeleteModal = ref(false)
const deleteConfirmText = ref('')
const deleting = ref(false)
const deleteError = ref('')

const profile = reactive({ name: '', email: '', phone: '' })
const notifications = reactive({ push: true, email: true, sms: false })
const passwordForm = reactive({ current: '', new: '', confirm: '' })
const preferences = reactive({ language: 'en', theme: 'light', fontSize: 16 })
const saving = reactive({ profile: false, password: false, preferences: false })

watch(() => { return preferences.theme }, setTheme, { immediate: true })

watch(notifications, (val) => {
  api.put('/settings', { notifications: { ...val } }).catch(() => {})
}, { deep: true })

onMounted(async () => {
  loading.value = true
  try {
    const res = await api.get('/settings')
    const data = res.data
    if (data.profile) Object.assign(profile, data.profile)
    if (data.notifications) Object.assign(notifications, data.notifications)
    if (data.preferences) Object.assign(preferences, data.preferences)
  } catch (e) { if (e.response?.status !== 404) errorMsg.value = 'Failed to load settings.' }
  finally { loading.value = false }
})

async function saveProfile() {
  if (!profile.name.trim()) { errorMsg.value = 'Name is required'; return }
  if (!profile.email.trim()) { errorMsg.value = 'Email is required'; return }
  saving.value.profile = true; errorMsg.value = ''
  try { await api.put('/settings', { profile: { ...profile } }); successMsg.value = 'Profile updated'; setTimeout(() => successMsg.value = '', 3000) }
  catch (e) { errorMsg.value = e.response?.data?.error || 'Failed to save.' }
  finally { saving.value.profile = false }
}

async function savePassword() {
  if (!passwordForm.current) { errorMsg.value = 'Current password required'; return }
  if (!passwordForm.new || passwordForm.new.length < 6) { errorMsg.value = 'New password (6+ chars) required'; return }
  if (passwordForm.new !== passwordForm.confirm) { errorMsg.value = 'Passwords do not match'; return }
  saving.value.password = true; errorMsg.value = ''
  try { await api.put('/auth/change-password', { ...passwordForm }); successMsg.value = 'Password changed'; passwordForm.current = ''; passwordForm.new = ''; passwordForm.confirm = ''; setTimeout(() => successMsg.value = '', 3000) }
  catch (e) { errorMsg.value = e.response?.data?.error || 'Failed to change password.' }
  finally { saving.value.password = false }
}

async function savePreferences() {
  saving.value.preferences = true; errorMsg.value = ''
  try { await api.put('/settings', { preferences: { ...preferences } }); successMsg.value = 'Preferences saved'; setTimeout(() => successMsg.value = '', 3000) }
  catch (e) { errorMsg.value = e.response?.data?.error || 'Failed to save.' }
  finally { saving.value.preferences = false }
}

function openDeleteModal() { deleteConfirmText.value = ''; deleteError.value = ''; showDeleteModal.value = true }
function closeDeleteModal() { showDeleteModal.value = false; deleteError.value = ''; deleteConfirmText.value = '' }

async function deleteAccount() {
  if (deleteConfirmText.value !== 'DELETE') { deleteError.value = 'Type DELETE exactly'; return }
  deleting.value = true; deleteError.value = ''
  try { await api.delete('/auth/account'); window.location.href = '/login' }
  catch (e) { deleteError.value = e.response?.data?.error || 'Failed to delete account.' }
  finally { deleting.value = false }
}
</script>

<style scoped>
.settings-sections { display: flex; flex-direction: column; gap: 20px; }

.setting-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--color-border); }
.setting-row:last-child { border-bottom: none; }
.setting-label { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
.setting-desc { font-size: 12px; color: var(--color-text-tertiary); }

.toggle-3d { position: relative; display: inline-block; width: 48px; height: 28px; perspective: 200px; cursor: pointer; flex-shrink: 0; }
.toggle-3d input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
.toggle-inner { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 0.3s; border-radius: 28px; }
.toggle-3d.active .toggle-inner { transform: rotateY(180deg); }
.toggle-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 28px; display: flex; align-items: center; }
.toggle-off { background: var(--color-border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); }
.toggle-off::after { content: ''; width: 20px; height: 20px; background: var(--color-surface); border-radius: 50%; position: absolute; left: 4px; top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }
.toggle-on { background: var(--color-primary); transform: rotateY(180deg); box-shadow: 0 2px 8px var(--color-primary-glow); }
.toggle-on::after { content: ''; width: 20px; height: 20px; background: var(--color-surface); border-radius: 50%; position: absolute; right: 4px; top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); }

.theme-selector { display: flex; gap: 12px; }
.theme-card { flex: 1; cursor: pointer; text-align: center; }
.theme-card span { display: block; font-size: 13px; font-weight: 600; color: var(--color-text-primary); margin-top: 8px; }
.theme-preview { width: 100%; height: 50px; border-radius: 8px; border: 1px solid var(--color-border); }
.theme-preview-light { background: linear-gradient(135deg, var(--color-surface), var(--color-surface-elevated)); }
.theme-preview-dark { background: linear-gradient(135deg, #1E293B, #0F172A); }

.font-size-control { display: flex; align-items: center; gap: 12px; }
.size-btn { width: 40px; height: 40px; padding: 0 !important; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; }
.font-size-display { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 8px 16px; background: var(--color-surface-elevated); border-radius: 12px; color: var(--color-text-primary); }

.toast-success { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; background: var(--color-success); color: var(--color-surface); border-radius: 12px; font-weight: 600; font-size: 14px; z-index: 1000; box-shadow: 0 8px 32px var(--color-primary-glow); animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }

@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
