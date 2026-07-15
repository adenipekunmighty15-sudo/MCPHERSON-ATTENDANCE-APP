<template>
  <div class="min-h-screen p-4 md:p-6 bg-[var(--color-bg)]">
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Header & Actions -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div>
          <h1 class="h2 text-[var(--color-text-primary)]">Attendance Log</h1>
          <p class="text-[var(--color-text-secondary)] mt-1 text-body-sm">Track, filter, and review your course attendance</p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- Check In Methods Dropdown -->
          <div class="relative">
            <button @click="showCheckInMenu = !showCheckInMenu" class="btn btn-primary flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              <span>CHECK IN</span>
              <ChevronDown class="w-4 h-4 opacity-70" />
            </button>
            <div v-if="showCheckInMenu" class="absolute right-0 mt-2 w-44 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl z-50 overflow-hidden">
              <button @click="checkIn('QR Code')" class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors">
                <span class="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">QR</span>
                QR Code
              </button>
              <button @click="checkIn('NFC Tap')" class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors border-t border-[var(--color-border)]">
                <span class="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">NFC</span>
                NFC Tap
              </button>
              <button @click="checkIn('Face ID')" class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors border-t border-[var(--color-border)]">
                <span class="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">FD</span>
                Face ID
              </button>
              <button @click="checkIn('Manual')" class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors border-t border-[var(--color-border)]">
                <span class="w-7 h-7 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center text-xs font-bold text-[var(--color-text-primary)]">M</span>
                Manual Entry
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 animate-stagger">
        <div class="card card-hover p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:var(--color-primary-soft);color:var(--color-primary)">
            <Target class="w-6 h-6" />
          </div>
          <div>
            <p class="caption">Overall Rate</p>
            <p class="h3 text-[var(--color-text-primary)]">{{ overallRate }}%</p>
          </div>
        </div>
        
        <div class="card card-hover p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:var(--color-success)/12;color:var(--color-success)">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <div>
            <p class="caption">Present</p>
            <p class="h3 text-[var(--color-text-primary)]">{{ summary.present }}</p>
          </div>
        </div>

        <div class="card card-hover p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:var(--color-warning)/12;color:var(--color-warning)">
            <Clock class="w-6 h-6" />
          </div>
          <div>
            <p class="caption">Late</p>
            <p class="h3 text-[var(--color-text-primary)]">{{ summary.late }}</p>
          </div>
        </div>

        <div class="card card-hover p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background:var(--color-error)/12;color:var(--color-error)">
            <XCircle class="w-6 h-6" />
          </div>
          <div>
            <p class="caption">Absent</p>
            <p class="h3 text-[var(--color-text-primary)]">{{ summary.absent }}</p>
          </div>
        </div>
      </div>

      <!-- JUPEB Eligibility Alert -->
      <div class="card card-hover p-4 flex items-start gap-4"
        :class="jupebEligible ? 'border-[var(--color-success)]/30' : 'border-[var(--color-error)]/30'"
        :style="jupebEligible ? 'border-color:rgba(0,122,51,0.3)' : 'border-color:rgba(204,0,0,0.3)'"
      >
        <div class="p-2 rounded-xl shrink-0 mt-0.5" style="font-size:0;background:var(--color-primary-soft);color:var(--color-primary)">
          <ShieldAlert v-if="!jupebEligible" class="w-5 h-5" />
          <ShieldCheck v-else class="w-5 h-5" />
        </div>
        <div>
          <h3 class="h4 text-[var(--color-text-primary)] mb-1">JUPEB Exam Eligibility</h3>
          <p class="text-body-sm text-[var(--color-text-secondary)]">
            <span v-if="jupebEligible">You currently meet the mandatory 75% attendance threshold for the JUPEB final examinations. Keep it up!</span>
            <span v-else class="text-[var(--color-text-primary)]">Warning: Your attendance is below the mandatory 75% threshold required for JUPEB final examinations. Immediate improvement is required to remain eligible.</span>
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="card card-hover p-12 text-center">
        <Loader2 class="w-8 h-8 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
        <p class="text-body-sm text-[var(--color-text-secondary)]">Loading attendance records...</p>
      </div>

      <!-- Load Error State -->
      <div v-else-if="loadError" class="card card-hover p-6 text-center">
        <AlertCircle class="w-8 h-8 text-[var(--color-error)] mx-auto mb-3" />
        <p class="text-body-sm text-[var(--color-error)] mb-3">{{ loadError }}</p>
        <button @click="fetchAttendance" class="btn btn-primary btn-sm">RETRY</button>
      </div>

      <!-- Check-in Feedback -->
      <div v-if="checkInError" class="card p-3 text-body-sm text-[var(--color-error)] text-center" style="border-color:rgba(204,0,0,0.3)">
        {{ checkInError }}
      </div>
      <div v-if="checkInSuccess" class="card p-3 text-body-sm text-[var(--color-success)] text-center" style="border-color:rgba(0,122,51,0.3)">
        Checked in successfully!
      </div>

      <!-- Toolbar -->
      <div class="card card-hover p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <!-- Search -->
        <div class="relative w-full md:w-80">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
          <input 
            v-model="globalFilter"
            type="text" 
            placeholder="Search courses, dates..." 
            class="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <button @click="setFilter('All')" :class="[filterStatus === 'All' ? 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)] border border-[var(--color-border-accent)]' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]']" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
            All
          </button>
          <button @click="setFilter('Present')" :class="[filterStatus === 'Present' ? 'bg-[var(--color-primary-soft)] text-[var(--color-text-primary)] border border-[var(--color-success)]/30' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]']" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
            Present
          </button>
          <button @click="setFilter('Late')" :class="[filterStatus === 'Late' ? 'bg-[var(--color-gold-soft)] text-[var(--color-text-primary)] border border-[var(--color-warning)]/30' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]']" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
            Late
          </button>
          <button @click="setFilter('Absent')" :class="[filterStatus === 'Absent' ? 'bg-[var(--color-error-soft)] text-[var(--color-text-primary)] border border-[var(--color-error)]/30' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]']" class="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
            Absent
          </button>
        </div>
      </div>

      <!-- TanStack Table Wrapper -->
      <div class="card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr 
                v-for="headerGroup in table.getHeaderGroups()" 
                :key="headerGroup.id"
                class="bg-[var(--color-surface)]/50 border-b border-[var(--color-border)]"
              >
                <th 
                  v-for="header in headerGroup.headers" 
                  :key="header.id"
                  @click="header.column.getToggleSortingHandler()?.($event)"
                  class="p-4 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider whitespace-nowrap select-none group"
                  :class="{ 'cursor-pointer hover:text-white transition-colors': header.column.getCanSort() }"
                >
                  <div class="flex items-center gap-1.5">
                    <FlexRender 
                      v-if="!header.isPlaceholder"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                    />
                    <!-- Sorting Icons -->
                    <span class="inline-flex flex-col w-3 h-3 justify-center text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" :class="{'opacity-100 text-[var(--color-text-primary)]': header.column.getIsSorted()}">
                      <ChevronUp v-if="header.column.getIsSorted() === 'asc'" class="w-3 h-3 -mb-1" />
                      <ChevronDown v-else-if="header.column.getIsSorted() === 'desc'" class="w-3 h-3 -mt-1" />
                      <ArrowUpDown v-else-if="header.column.getCanSort()" class="w-3 h-3" />
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            
            <tbody class="divide-y divide-[var(--color-border)]">
              <tr 
                v-for="row in table.getRowModel().rows" 
                :key="row.id"
                class="hover:bg-[var(--color-surface-elevated)]/30 transition-colors"
              >
                <td 
                  v-for="cell in row.getVisibleCells()" 
                  :key="cell.id"
                  class="p-4 align-middle whitespace-nowrap text-sm text-[var(--color-text-primary)]"
                >
                  <FlexRender 
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </td>
              </tr>
              
              <tr v-if="table.getRowModel().rows.length === 0">
                <td :colspan="columns.length" class="p-12 text-center text-[var(--color-text-tertiary)]">
                  <div class="flex flex-col items-center justify-center">
                    <Search class="w-8 h-8 mb-3 opacity-20" />
                    <p>No attendance records found matching your filters.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="text-xs text-[var(--color-text-tertiary)]">
            Showing {{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }} to 
            {{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length) }} 
            of {{ table.getFilteredRowModel().rows.length }} results
          </div>
          
          <div class="flex items-center gap-2">
            <button 
              @click="table.setPageIndex(0)" 
              :disabled="!table.getCanPreviousPage()"
              class="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft class="w-4 h-4" />
            </button>
            <button 
              @click="table.previousPage()" 
              :disabled="!table.getCanPreviousPage()"
              class="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft class="w-4 h-4" />
            </button>
            <span class="text-xs font-medium text-[var(--color-text-primary)] mx-2">
              Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
            </span>
            <button 
              @click="table.nextPage()" 
              :disabled="!table.getCanNextPage()"
              class="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight class="w-4 h-4" />
            </button>
            <button 
              @click="table.setPageIndex(table.getPageCount() - 1)" 
              :disabled="!table.getCanNextPage()"
              class="p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Face ID Camera Modal -->
      <div v-if="showCamera" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" @click.self="closeCamera">
        <div class="card card-hover p-6 w-full max-w-md animate-scale-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="h4 text-[var(--color-text-primary)]">Face ID Verification</h3>
            <button @click="closeCamera" class="btn btn-ghost btn-icon btn-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="relative aspect-square rounded-2xl overflow-hidden bg-black border-2 border-[var(--color-border)] mb-4">
            <video ref="faceVideoEl" class="w-full h-full object-cover" autoplay playsinline muted></video>
            <div class="absolute inset-0 border-4 border-[var(--color-primary)]/40 rounded-2xl m-4 pointer-events-none">
              <div class="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-[var(--color-primary)] -mt-[1.5px] -ml-[1.5px]"></div>
              <div class="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-[var(--color-primary)] -mt-[1.5px] -mr-[1.5px]"></div>
              <div class="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-[var(--color-primary)] -mb-[1.5px] -ml-[1.5px]"></div>
              <div class="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-[var(--color-primary)] -mb-[1.5px] -mr-[1.5px]"></div>
            </div>
            <div v-if="faceVerifying" class="absolute left-0 right-0 h-0.5 bg-[var(--color-primary)] shadow-[0_0_20px_var(--color-primary)] animate-scan pointer-events-none" style="top:30%"></div>
            <div v-if="!cameraReady" class="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 class="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
          </div>
          <p class="text-body-sm text-[var(--color-text-tertiary)] text-center mb-4">Look directly into the camera and hold still</p>
          <div class="flex gap-3">
            <button @click="closeCamera" class="btn btn-secondary flex-1">Cancel</button>
            <button @click="verifyFaceAndCheckIn" :disabled="faceVerifying || !cameraReady" class="btn btn-primary flex-1 flex items-center justify-center gap-2">
              <Loader2 v-if="faceVerifying" class="w-4 h-4 animate-spin" />
              <ScanFace v-else class="w-4 h-4" />
              {{ faceVerifying ? 'Verifying...' : 'Verify & Check In' }}
            </button>
          </div>
          <p v-if="faceError" class="text-body-sm text-[var(--color-error)] text-center mt-3">{{ faceError }}</p>
          <p v-if="faceSuccess" class="text-body-sm text-[var(--color-text-primary)] text-center mt-3">{{ faceSuccess }}</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, h, onMounted, onUnmounted } from 'vue'
import { 
  useVueTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, 
  getPaginationRowModel, FlexRender 
} from '@tanstack/vue-table'
import { 
  MapPin, ChevronDown, Search, ArrowUpDown, ChevronUp,
  Target, CheckCircle2, Clock, XCircle, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, BookOpen, UserCheck, ShieldAlert, ShieldCheck,
  ScanFace, Loader2, AlertCircle
} from 'lucide-vue-next'
import { loadFaceModels, verifyFace } from '../lib/face'
import api from '../lib/api'
import { locationTracker } from '../services/LocationService.js'

const data = ref([])
const loading = ref(true)
const loadError = ref('')

async function fetchAttendance() {
  loading.value = true
  loadError.value = ''
  try {
    const { data: records } = await api.get('/attendance')
    data.value = (records || []).map(r => ({
      id: r.id || Date.now(),
      course: r.courseName || r.courseId || 'Unknown',
      date: r.date || r.timestamp?.slice(0, 10) || '-',
      timeIn: r.timestamp ? new Date(r.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      timeOut: '-',
      duration: '-',
      status: (r.status || 'Present').charAt(0).toUpperCase() + (r.status || 'Present').slice(1),
      method: r.method || '-',
    }))
  } catch (err) {
    loadError.value = err?.response?.data?.error || err?.message || 'Failed to load attendance records.'
  } finally {
    loading.value = false
  }
}
onMounted(fetchAttendance)

const summary = computed(() => {
  const p = data.value.filter(r => r.status === 'Present').length
  const l = data.value.filter(r => r.status === 'Late').length
  const a = data.value.filter(r => r.status === 'Absent').length
  return { present: p, late: l, absent: a, total: data.value.length }
})

const overallRate = computed(() => {
  const { present, late, total } = summary.value
  if (total === 0) return 0
  return Math.round(((present + late * 0.5) / total) * 100)
})

const showCheckInMenu = ref(false)

const checkInError = ref('')
const checkInSuccess = ref(false)

function checkIn(method) {
  showCheckInMenu.value = false
  checkInError.value = ''
  checkInSuccess.value = false
  if (method === 'Face ID') {
    openFaceCamera()
    return
  }
  doCheckIn(method)
}

async function doCheckIn(method) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const record = {
    id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    course: 'JUPEB 001 Physics',
    date: now.toISOString().slice(0, 10),
    timeIn: timeStr,
    timeOut: '-',
    duration: '-',
    status: 'Present',
    method,
  }
  data.value.unshift(record)

  let locationLat = null
  let locationLng = null
  if (locationTracker.currentPosition) {
    locationLat = locationTracker.currentPosition.lat
    locationLng = locationTracker.currentPosition.lng
  } else if ('geolocation' in navigator) {
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
      )
      locationLat = pos.coords.latitude
      locationLng = pos.coords.longitude
    } catch {}
  }

  try {
    await api.post('/attendance', {
      courseId: 'JUPEB 001',
      courseName: 'JUPEB 001 Physics',
      status: 'Present',
      method,
      locationLat,
      locationLng,
    })
    checkInSuccess.value = true
    setTimeout(() => { checkInSuccess.value = false }, 3000)
  } catch (err) {
    const msg = err?.response?.data?.error || err?.message || 'Check-in failed'
    checkInError.value = msg
    data.value = data.value.filter(r => r.id !== record.id)
  }
}

// Face ID verification
const faceVideoEl = ref(null)
const showCamera = ref(false)
const cameraReady = ref(false)
const faceVerifying = ref(false)
const faceError = ref('')
const faceSuccess = ref('')
let faceStream = null
let storedDescriptor = null

async function openFaceCamera() {
  faceError.value = ''
  faceSuccess.value = ''
  showCamera.value = true
  cameraReady.value = false
  const modelsOk = await loadFaceModels()
  if (!modelsOk) {
    faceError.value = 'Failed to load face recognition models. Check your connection.'
    return
  }
  try {
    const { data } = await api.get('/auth/face')
    if (!data?.descriptor) {
      faceError.value = 'No face registered. Go to Face ID Setup first.'
      return
    }
    storedDescriptor = JSON.parse(data.descriptor)
  } catch {
    faceError.value = 'Could not load your face profile.'
    return
  }
  try {
    faceStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
    if (faceVideoEl.value) {
      faceVideoEl.value.srcObject = faceStream
      await new Promise(resolve => setTimeout(resolve, 500))
      cameraReady.value = true
    }
  } catch {
    faceError.value = 'Camera access denied.'
  }
}

function closeCamera() {
  showCamera.value = false
  cameraReady.value = false
  faceVerifying.value = false
  faceError.value = ''
  faceSuccess.value = ''
  if (faceStream) { faceStream.getTracks().forEach(t => t.stop()); faceStream = null }
}

async function verifyFaceAndCheckIn() {
  if (!cameraReady.value || !faceVideoEl.value || !storedDescriptor) return
  faceVerifying.value = true
  faceError.value = ''
  try {
    const result = await verifyFace(faceVideoEl.value, storedDescriptor)
    if (result.match) {
      faceSuccess.value = `Face matched! (${((1 - result.distance) * 100).toFixed(1)}% confidence)`
      closeCamera()
      doCheckIn('Face ID')
    } else {
      faceError.value = `Face did not match. (${((1 - result.distance) * 100).toFixed(1)}% confidence — need >50%)`
    }
  } catch (err) {
    faceError.value = err?.message || 'Face verification failed.'
  } finally {
    faceVerifying.value = false
  }
}

function onClickOutside(e) {
  if (showCheckInMenu.value && !e.target.closest('.relative')) showCheckInMenu.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

// JUPEB Eligibility
const jupebEligible = computed(() => overallRate.value >= 75)

// Column Definitions for TanStack Table
const columns = [
  {
    accessorKey: 'course',
    header: 'Course',
    cell: (info) => h('div', { class: 'font-semibold text-[var(--color-text-primary)]' }, info.getValue())
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: (info) => h('div', { class: 'text-[var(--color-text-secondary)]' }, info.getValue())
  },
  {
    accessorKey: 'timeIn',
    header: 'Clock In',
    cell: (info) => h('div', { class: 'text-[var(--color-text-secondary)] font-mono text-xs' }, info.getValue())
  },
  {
    accessorKey: 'timeOut',
    header: 'Clock Out',
    cell: (info) => h('div', { class: 'text-[var(--color-text-secondary)] font-mono text-xs' }, info.getValue())
  },
  {
    accessorKey: 'duration',
    header: 'Duration',
    cell: (info) => {
      const val = info.getValue()
      return h('div', { class: 'text-[var(--color-text-primary)] font-mono text-xs bg-[var(--color-surface)]/50 px-2 py-1 rounded inline-block' }, val)
    }
  },
  {
    accessorKey: 'method',
    header: 'Method',
    cell: (info) => {
      const method = info.getValue()
      return h('div', { class: 'text-[var(--color-text-tertiary)] text-xs font-medium bg-[var(--color-surface)] border border-[var(--color-border)] px-2 py-1 rounded inline-flex items-center gap-1.5' }, [
        method !== '-' ? h(UserCheck, { class: 'w-3 h-3' }) : null,
        method
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => {
      const status = info.getValue()
      let badgeClass = 'badge-neutral'
      let dotColor = 'var(--color-primary)'
      
      if (status === 'Present') {
        badgeClass = 'badge-success'
        dotColor = 'var(--color-success)'
      } else if (status === 'Late') {
        badgeClass = 'badge-warning'
        dotColor = 'var(--color-warning)'
      } else {
        badgeClass = 'badge-error'
        dotColor = 'var(--color-error)'
      }
      
      return h('div', { class: `inline-flex items-center gap-1.5 ${badgeClass}` }, [
        h('span', { class: 'w-1.5 h-1.5 rounded-full', style: { background: dotColor } }),
        status
      ])
    }
  }
]

// State
const sorting = ref([])
const globalFilter = ref('')
const filterStatus = ref('All')

// Custom filter function for the status
const customGlobalFilter = (row, columnId, filterValue) => {
  if (filterStatus.value !== 'All') {
    if (row.original.status !== filterStatus.value) return false
  }
  
  if (!globalFilter.value) return true
  
  const search = globalFilter.value.toLowerCase()
  return (
    row.original.course.toLowerCase().includes(search) ||
    row.original.date.includes(search) ||
    row.original.method.toLowerCase().includes(search)
  )
}

// Table Instance
const table = useVueTable({
  get data() { return data.value },
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    get sorting() { return sorting.value },
    get globalFilter() { return `${globalFilter.value}_${filterStatus.value}` }, // Force dependency updates
  },
  onSortingChange: updaterOrValue => {
    sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  globalFilterFn: customGlobalFilter,
  initialState: {
    pagination: { pageSize: 8 }
  }
})

// Filter action
const setFilter = (status) => {
  filterStatus.value = status
}
</script>

<style scoped>
@keyframes scan {
  0%, 100% { top: 10%; }
  50% { top: 90%; }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
</style>
