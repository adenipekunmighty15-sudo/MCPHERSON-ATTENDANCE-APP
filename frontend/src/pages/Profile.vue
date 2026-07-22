<template>
  <div class="profile-page min-h-screen bg-[var(--color-bg)]" data-tour="profile">
    <div class="page page-wide">
      <div class="profile-cover">
        <div class="cover-gradient"></div>
        <div class="cover-actions">
          <button class="btn btn-primary btn-sm" @click="editMode = !editMode">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {{ editMode ? 'DONE' : 'EDIT PROFILE' }}
          </button>
        </div>
        <div class="profile-avatar-ring">
          <div class="profile-avatar" :class="{ clickable: editMode }" @click="handleAvatarClick">
            <img v-if="authStore.user?.avatar_url" :src="authStore.user.avatar_url" class="w-full h-full rounded-full object-cover" />
            <span v-else>{{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}</span>
          </div>
          <div class="status-badge"></div>
          <div v-if="editMode" class="avatar-edit-hint">Tap to change photo</div>
        </div>
      </div>

      <div class="profile-info-section">
        <h1 class="h2 text-[var(--color-text-primary)] text-center">{{ authStore.user?.name || 'User' }}</h1>
        <p class="text-body text-[var(--color-text-secondary)] text-center mb-3">{{ authStore.user?.email || '' }}</p>
        <div class="profile-tags">
          <span class="badge">{{ authStore.user?.role || 'Student' }}</span>
          <span class="badge">{{ authStore.user?.department || 'Computer Science' }}</span>
          <span class="badge">300 Level</span>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>

      <template v-if="!loading">
      <div class="stats-row card card-hover p-6">
        <div class="stat-item">
          <div class="stat-circle">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-primary)" stroke-width="4" stroke-linecap="round"
                stroke-dasharray="163.36" :stroke-dashoffset="163.36 * (1 - gpa / 5)" style="transform: rotate(-90deg); transform-origin: 30px 30px; transition: stroke-dashoffset 0.8s"/>
            </svg>
            <span class="stat-circle-value">{{ gpa.toFixed(2) }}</span>
          </div>
          <span class="stat-label">GPA</span>
        </div>
        <div class="stat-item">
          <div class="stat-circle">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="30" cy="30" r="26" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round"
                stroke-dasharray="163.36" :stroke-dashoffset="163.36 * (1 - attendanceRate / 100)" style="transform: rotate(-90deg); transform-origin: 30px 30px; transition: stroke-dashoffset 0.8s"/>
            </svg>
            <span class="stat-circle-value">{{ attendanceRate }}%</span>
          </div>
          <span class="stat-label">Attendance</span>
        </div>
        <div class="stat-item">
          <div class="stat-circle">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="30" cy="30" r="26" fill="none" stroke="#F59E0B" stroke-width="4" stroke-linecap="round"
                stroke-dasharray="163.36" :stroke-dashoffset="163.36 * (1 - Math.min(1, stats.xp / 5000))" style="transform: rotate(-90deg); transform-origin: 30px 30px; transition: stroke-dashoffset 0.8s"/>
            </svg>
            <span class="stat-circle-value">{{ stats.xp }}</span>
          </div>
          <span class="stat-label">XP</span>
        </div>
        <div class="stat-item">
          <div class="stat-circle">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-border)" stroke-width="4"/>
              <circle cx="30" cy="30" r="26" fill="none" stroke="#DC2626" stroke-width="4" stroke-linecap="round"
                stroke-dasharray="163.36" :stroke-dashoffset="163.36 * (1 - Math.min(1, stats.courses / 30))" style="transform: rotate(-90deg); transform-origin: 30px 30px; transition: stroke-dashoffset 0.8s"/>
            </svg>
            <span class="stat-circle-value">{{ stats.courses }}</span>
          </div>
          <span class="stat-label">Courses</span>
        </div>
      </div>

      <div class="profile-tabs">
        <button v-for="tab in tabs" :key="tab" class="btn btn-ghost" :class="{ active: activeTab === tab }" :style="activeTab === tab ? 'background:var(--color-primary);color:white' : ''" @click="activeTab = tab">{{ tab.toUpperCase() }}</button>
      </div>

      <div v-if="activeTab === 'Achievements'" class="achievements-grid">
        <div v-for="a in displayAchievements" :key="a.title" class="card card-hover achievement-card p-4">
          <div class="achievement-icon" :style="{ background: a.color + '18', color: a.color }">
            <span v-html="sanitizeHtml(a.icon)"></span>
          </div>
          <div>
            <p class="achievement-title">{{ a.title }}</p>
            <p class="achievement-desc">{{ a.desc }}</p>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'Activity'" class="activity-feed card p-4">
        <div v-for="act in displayActivities" :key="act.title" class="activity-item">
          <div class="activity-dot" :style="{ background: act.color }"></div>
          <div class="activity-content">
            <p class="activity-title">{{ act.title }}</p>
            <p class="activity-time">{{ act.time }}</p>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'Details'" class="details-grid">
        <div class="card card-hover details-card p-6">
          <h3 class="details-card-title">Personal Info</h3>
          <div v-if="!editMode">
            <div class="detail-row"><span>Name</span><span>{{ authStore.user?.name || 'N/A' }}</span></div>
            <div class="detail-row"><span>Email</span><span>{{ authStore.user?.email || 'N/A' }}</span></div>
            <div class="detail-row"><span>Department</span><span>{{ authStore.user?.department || 'N/A' }}</span></div>
            <div class="detail-row"><span>Level</span><span>{{ authStore.user?.level || 'N/A' }} Level</span></div>
            <div class="detail-row"><span>Role</span><span>{{ authStore.user?.role || 'Student' }}</span></div>
            <div class="detail-row"><span>Member Since</span><span>{{ authStore.user?.created_at ? new Date(authStore.user.created_at).toLocaleDateString() : 'N/A' }}</span></div>
          </div>
          <div v-else>
            <div class="form-group mb-4">
              <label class="form-label">Name</label>
              <input v-model="editForm.name" class="input w-full" />
            </div>
            <div class="form-group mb-4">
              <label class="form-label">Email</label>
              <input v-model="editForm.email" class="input w-full" disabled />
            </div>
            <div class="form-group mb-4">
              <label class="form-label">Department</label>
              <input v-model="editForm.department" class="input w-full" />
            </div>
            <div class="form-group mb-4">
              <label class="form-label">Level</label>
              <select v-model="editForm.level" class="input w-full">
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>
            <div class="flex gap-2 mt-4">
              <button class="btn btn-primary flex-1" @click="saveProfile">Save Changes</button>
              <button class="btn btn-secondary flex-1" @click="editMode = false">Cancel</button>
            </div>
          </div>
        </div>
        <div class="card details-card p-6">
          <h3 class="details-card-title">Quick Actions</h3>
          <button class="btn btn-secondary w-full mb-2" @click="$router.push('/settings')">Settings</button>
          <button class="btn btn-danger w-full" @click="handleLogout">Sign Out</button>
        </div>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMindStore } from '../stores/mind'
import api from '../lib/api'
import { sanitizeHtml } from '../lib/sanitize.js'

const router = useRouter()
const authStore = useAuthStore()
const mindStore = useMindStore()

const editMode = ref(false)
const activeTab = ref('Achievements')
const tabs = ['Achievements', 'Activity', 'Details']
const loading = ref(true)
const stats = ref({ gpa: 4.52, attendanceRate: 90.1, courses: 18, xp: 0, streak: 0 })
const achievements = ref([])
const activities = ref([])

const editForm = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  department: authStore.user?.department || 'Computer Science',
  level: authStore.user?.level || '300',
})

onMounted(async () => {
  try {
    const [statsRes, achRes] = await Promise.allSettled([
      api.get('/gamification/profile'),
      api.get('/students/profile'),
    ])
    if (statsRes.status === 'fulfilled') {
      const d = statsRes.value.data
      stats.value = { ...stats.value, ...d }
    }
    if (achRes.status === 'fulfilled') {
      achievements.value = achRes.value.data?.achievements || []
      activities.value = achRes.value.data?.activities || []
    }
  } catch (e) { console.warn('[Profile] Load stats failed:', e) }
  loading.value = false
})

const gpa = computed(() => stats.value.gpa)
const attendanceRate = computed(() => stats.value.attendanceRate)

const defaultAchievements = [
  { title: 'Perfect Attendance', desc: '100% attendance for 1 month', icon: '&#9733;', color: 'var(--color-primary)' },
  { title: 'Quiz Master', desc: 'Scored 100% on 5 quizzes', icon: '&#9879;', color: '#2563EB' },
  { title: 'Study Streak', desc: '7-day consecutive study streak', icon: '&#128293;', color: '#F59E0B' },
  { title: 'Top Performer', desc: 'Top 10 in semester leaderboard', icon: '&#127942;', color: '#10B981' },
  { title: 'Course Complete', desc: 'Completed 18 courses total', icon: '&#9989;', color: 'var(--color-primary)' },
]

const defaultActivities = [
  { title: 'Submitted CSC 301 assignment', time: '2 hours ago', color: 'var(--color-primary)' },
  { title: 'Earned Perfect Attendance badge', time: '1 day ago', color: '#10B981' },
  { title: 'Scored 92% in Machine Learning quiz', time: '3 days ago', color: '#2563EB' },
  { title: 'Joined Study Group: Data Structures', time: '5 days ago', color: '#F59E0B' },
  { title: 'Updated profile picture', time: '1 week ago', color: 'var(--color-primary)' },
]

const displayAchievements = computed(() => achievements.value.length ? achievements.value : defaultAchievements)
const displayActivities = computed(() => activities.value.length ? activities.value : defaultActivities)

async function saveProfile() {
  try {
    await api.put('/auth/profile', { name: editForm.value.name, department: editForm.value.department })
    await authStore.refreshUser()
    editMode.value = false
  } catch (e) {
    alert('Failed to save profile: ' + (e.response?.data?.error || e.message))
  }
}

function handleAvatarClick() {
  if (!editMode.value) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('profile_picture', file)
    try {
      await api.post('/auth/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await authStore.refreshUser()
    } catch (e) {
      alert('Failed to upload avatar: ' + (e.response?.data?.error || e.message))
    }
  }
  input.click()
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-cover {
  position: relative;
  height: 200px;
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 60px;
  border: 3px solid var(--color-border-strong);
  box-shadow: var(--shadow-md);
}

.cover-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 30%, var(--color-primary) 60%, #dc2626 100%);
}

.cover-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.profile-avatar-ring {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
}

.profile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  color: var(--color-surface);
  font-size: 48px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid var(--color-surface);
  box-shadow: var(--shadow-md), 0 0 0 3px var(--color-border-strong);
  overflow: hidden;
}
.profile-avatar.clickable { cursor: pointer; }
.profile-avatar.clickable:hover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.3);
  border-radius: 50%;
}

.avatar-edit-hint {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: var(--color-primary);
  white-space: nowrap;
  font-weight: 500;
}

.status-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-success);
  border: 3px solid var(--color-surface);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.profile-info-section {
  text-align: center;
  margin-bottom: 28px;
}

.profile-tags { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

.stat-item { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 80px; }
.stat-circle { position: relative; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; }
.stat-circle-value { position: absolute; font-size: 14px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 12px; font-weight: 600; color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }

.profile-tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--color-border); padding-bottom: 4px; }
.profile-tabs .btn { font-size: 12px; padding: 8px 16px; }

.achievements-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.achievement-card { display: flex; align-items: center; gap: 14px; }
.achievement-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.achievement-title { font-size: 14px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 2px; }
.achievement-desc { font-size: 12px; color: var(--color-text-secondary); }

.activity-feed { display: flex; flex-direction: column; }
.activity-item { display: flex; gap: 14px; padding: 16px 0; border-bottom: 1px solid var(--color-border); align-items: flex-start; }
.activity-item:last-child { border-bottom: none; }
.activity-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.activity-title { font-size: 14px; font-weight: 600; color: var(--color-text-primary); margin-bottom: 2px; }
.activity-time { font-size: 12px; color: var(--color-text-tertiary); }

.details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.details-card-title { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin-bottom: 16px; }
.detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--color-border); font-size: 14px; }
.detail-row:last-child { border-bottom: none; }
.detail-row span:first-child { color: var(--color-text-tertiary); font-weight: 500; }
.detail-row span:last-child { color: var(--color-text-primary); font-weight: 700; }

@media (max-width: 768px) {
  .details-grid { grid-template-columns: 1fr; }
}
</style>
