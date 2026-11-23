<template>
  <div class="hub">
    <!-- ───────────────── Workspace rail ───────────────── -->
    <aside class="rail">
      <div class="brand">
        <div class="brand-mark"><Sparkles :size="18" /></div>
        <div>
          <strong>Study Hub</strong>
          <span>McPherson Study Studio</span>
        </div>
      </div>

      <button class="new-pack" @click="goWorkspace">
        <Plus :size="16" />
        <span>New study pack</span>
      </button>

      <nav class="rail-nav">
        <p class="rail-label">WORKSPACE</p>
        <button v-for="item in railItems" :key="item.id" class="rail-item"
          :class="{ active: view === item.view && item.view }" @click="item.action()">
          <component :is="item.icon" :size="17" />
          <span>{{ item.label }}</span>
          <ChevronRight v-if="item.external" :size="14" class="rail-chevron" />
        </button>
      </nav>

      <div class="rail-recent">
        <p class="rail-label">RECENT PACKS</p>
        <button v-for="pack in packs.slice(0, 5)" :key="pack.id" class="recent-item" @click="openPack(pack.id)">
          <span class="recent-dot" />
          <span class="recent-title">{{ pack.title }}</span>
        </button>
        <p v-if="!packs.length" class="rail-empty">Nothing here yet.</p>
      </div>

      <div class="rail-foot">
        <div class="rail-foot-icon"><Zap :size="15" /></div>
        <div>
          <strong>{{ packs.length }} pack{{ packs.length === 1 ? '' : 's' }} saved</strong>
          <span>Your notes stay private</span>
        </div>
      </div>
    </aside>

    <!-- ───────────────── Main canvas ───────────────── -->
    <section class="main">
      <header class="topbar">
        <div class="crumbs">
          <span>Workspace</span>
          <ChevronRight :size="13" />
          <strong>{{ view === 'library' ? 'My Library' : view === 'pack' ? 'Study pack' : 'New pack' }}</strong>
        </div>
        <div class="topbar-actions">
          <span class="status-pill" :class="{ offline: aiChecked && aiOnlineCount === 0 }"><span class="status-dot" /> {{ aiChecked ? `${aiOnlineCount} AI online` : 'Checking AI…' }}</span>
          <button class="icon-btn" title="Study dashboard" @click="router.push({ name: 'StudyDashboard' })">
            <BarChart3 :size="17" />
          </button>
        </div>
      </header>

      <nav class="mobile-nav" aria-label="Study Hub navigation">
        <button v-for="item in railItems" :key="item.id" :class="{ active: !item.external && (item.view ? view === item.view : item.id === 'new' && view === 'workspace') }" @click="item.action()">
          <component :is="item.icon" :size="16" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="scroll">
        <Transition name="fade" mode="out-in">
          <!-- ═══════════ NEW PACK ═══════════ -->
          <div v-if="view === 'workspace'" key="workspace" class="workspace">
            <div class="hero">
              <div class="hero-pill"><Sparkles :size="13" /> POWERED BY NVIDIA · KIMI · PARAKEET</div>
              <h1>Anything can become<br /><em>a study pack.</em></h1>
              <p>Drop lecture slides, whiteboard photos, voice notes or a link. Get clean notes, flashcards, a quiz and an audio recap — in one pass.</p>
            </div>

            <div class="composer" :class="{ dragging: isDragging }"
              @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop">
              <div class="composer-head">
                <span class="composer-title"><WandSparkles :size="16" /> Build a study pack</span>
                <span class="composer-hint">PDF · DOCX · TXT · Images · Audio · YouTube link</span>
              </div>

              <textarea v-model="sourceText" class="composer-input"
                placeholder="Paste your lecture notes, summary, or anything you want to study…"
                rows="5" :disabled="generating" />

              <div class="composer-tools">
                <label class="tool-btn course-tool">
                  <BookOpen :size="15" />
                  <select v-model="selectedCourseId" :disabled="generating">
                    <option value="">General study pack</option>
                    <option v-for="course in courses" :key="course.id" :value="String(course.id)">
                      {{ course.code }} · {{ course.title }}
                    </option>
                  </select>
                  <div v-if="studentDepartment.value" class="dept-badge">
                    Department: {{ studentDepartment.value }}
                  </div>
                </label>
                <label class="tool-btn">
                  <Paperclip :size="15" /> Add files
                  <input ref="fileInput" type="file" multiple hidden
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.aac" @change="onFiles" />
                </label>
                <label class="tool-btn url-tool">
                  <Link2 :size="15" />
                  <input v-model="sourceUrl" type="url" placeholder="Paste a YouTube link…" :disabled="generating" />
                </label>
              </div>

              <details class="study-options">
                <summary>Customize your study pack</summary>
                <div class="options-grid">
                  <label>Flashcards
                    <select v-model.number="flashcardCount" :disabled="generating">
                      <option :value="8">8 cards</option><option :value="12">12 cards</option>
                      <option :value="20">20 cards</option><option :value="30">30 cards</option>
                    </select>
                  </label>
                  <label>Quiz questions
                    <select v-model.number="quizCount" :disabled="generating">
                      <option :value="5">5 questions</option><option :value="10">10 questions</option>
                      <option :value="15">15 questions</option><option :value="20">20 questions</option>
                    </select>
                  </label>
                  <label>Difficulty
                    <select v-model="quizDifficulty" :disabled="generating">
                      <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </label>
                  <label>Question types
                    <select v-model="quizFormat" :disabled="generating">
                      <option value="multiple_choice">Multiple choice</option><option value="true_false">True or false</option>
                      <option value="fill_blank">Fill in the blank</option><option value="mixed">Mixed</option>
                    </select>
                  </label>
                </div>
              </details>

              <div v-if="files.length" class="file-chips">
                <div v-for="(file, i) in files" :key="i" class="file-chip">
                  <component :is="fileIcon(file)" :size="13" />
                  <span>{{ file.name }}</span>
                  <button @click="files.splice(i, 1)" title="Remove"><X :size="12" /></button>
                </div>
              </div>

              <div v-if="error" class="inline-error"><AlertCircle :size="15" /> {{ error }}</div>

              <Transition name="slide">
                <div v-if="generating" class="generating">
                  <div class="gen-bar"><span :style="{ width: genProgress + '%' }" /></div>
                  <div class="gen-steps">
                    <span v-for="(step, i) in genSteps" :key="step"
                      :class="{ done: i < genStep, current: i === genStep }">
                      <Check v-if="i < genStep" :size="12" />
                      <Loader2 v-else-if="i === genStep" :size="12" class="spin" />
                      <span v-else class="num">{{ i + 1 }}</span>
                      {{ step }}
                    </span>
                  </div>
                </div>
              </Transition>

              <div class="composer-foot">
                <span class="composer-meta">Turns your material into notes, cards, quiz & audio</span>
                <button class="primary-btn" :disabled="generating || aiUnavailable || (!sourceText.trim() && !sourceUrl.trim() && !files.length)"
                  :title="aiUnavailable ? 'No AI provider is online' : undefined" @click="generatePack">
                  <Loader2 v-if="generating" :size="16" class="spin" />
                  <Sparkles v-else :size="16" />
                  {{ generating ? 'Building your pack…' : 'Generate study pack' }}
                </button>
              </div>
            </div>

            <div class="suggestions">
              <p>TRY AN EXAMPLE</p>
              <div>
                <button v-for="s in suggestions" :key="s.label" @click="sourceText = s.text">
                  <component :is="s.icon" :size="15" /> {{ s.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- ═══════════ LIBRARY ═══════════ -->
          <div v-else-if="view === 'library'" key="library" class="library">
            <div class="section-head">
              <div>
                <p class="eyebrow">YOUR COLLECTION</p>
                <h2>My Library</h2>
                <p class="sub">Every pack you have generated, ready to revisit.</p>
              </div>
              <button class="primary-btn small" @click="goWorkspace"><Plus :size="15" /> New pack</button>
            </div>
            <div v-if="packsError" class="inline-error library-error" role="alert">
              <AlertCircle :size="15" /> {{ packsError }}
              <button class="ghost-btn" @click="loadPacks">Retry</button>
            </div>
            <div v-else-if="packsLoading" class="library-loading" role="status">Loading your study packs…</div>
            <div v-if="!packsError" class="library-tools">
              <label class="library-filter">Show
                <select v-model="folderFilter" aria-label="Filter study packs by folder">
                  <option value="all">All study packs</option>
                  <option value="unfiled">Unfiled</option>
                  <option v-for="folder in folders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
                </select>
              </label>
              <form class="folder-create" @submit.prevent="createFolder">
                <input v-model="newFolderName" aria-label="New folder name" maxlength="60" placeholder="New folder name" />
                <button type="submit" :disabled="folderBusy || !newFolderName.trim()">Create folder</button>
              </form>
              <span v-if="folderNotice" class="folder-notice" role="status">{{ folderNotice }}</span>
            </div>
            <div v-if="folderError" class="inline-error library-error" role="alert"><AlertCircle :size="15" /> {{ folderError }}</div>
            <div v-if="!packsError && visiblePacks.length" class="pack-grid">
              <article v-for="pack in visiblePacks" :key="pack.id" class="pack-card">
                <div class="pack-card-top">
                  <span class="pack-icon"><FileText :size="18" /></span>
                  <span class="pack-date">{{ shortDate(pack.createdAt) }}</span>
                </div>
                <button class="pack-open" @click="openPack(pack.id)"><h3>{{ pack.title }}</h3></button>
                <p>{{ truncate(stripMarkdown(pack.summary || pack.sourceText || ''), 110) }}</p>
                <div class="pack-stats">
                  <span><Layers :size="13" /> {{ pack.flashcardCount || 0 }} cards</span>
                  <span><ListChecks :size="13" /> {{ Array.isArray(pack.quiz) ? pack.quiz.length : 0 }} quiz</span>
                  <span v-if="pack.podcastUrl"><Headphones :size="13" /> Audio</span>
                </div>
                <label class="pack-folder">Folder
                  <select :value="pack.folderId || ''" :disabled="folderBusy" @change="movePackToFolder(pack, $event)">
                    <option value="">Unfiled</option>
                    <option v-for="folder in folders" :key="folder.id" :value="folder.id">{{ folder.name }}</option>
                  </select>
                </label>
              </article>
            </div>
            <div v-else-if="!packsError && !packsLoading" class="empty-state">
              <Library :size="34" />
              <h3>{{ packs.length ? 'No packs in this folder' : 'Your library is empty' }}</h3>
              <p>{{ packs.length ? 'Choose another folder or move a pack here.' : 'Generate your first study pack and it will appear here.' }}</p>
              <button v-if="!packs.length" class="primary-btn small" @click="goWorkspace">Create a pack</button>
            </div>
          </div>

          <!-- ═══════════ ACTIVE PACK ═══════════ -->
          <div v-else key="pack" class="pack-view">
            <div class="pack-header">
              <button class="back-btn" @click="view = 'library'"><ChevronRight :size="15" class="flip" /> Library</button>
              <div class="pack-title-row">
                <div>
                  <p class="eyebrow">STUDY PACK</p>
                  <h2>{{ activePack?.title }}</h2>
                </div>
                <div class="pack-actions">
                  <button class="ghost-btn" @click="router.push({ name: 'flashcard-review', params: { materialId: activePack.id } })">
                    <Layers :size="15" /> Full review
                  </button>
                  <button class="ghost-btn" @click="router.push({ name: 'podcast-generator', params: { materialId: activePack.id } })">
                    <Headphones :size="15" /> Podcast studio
                  </button>
                </div>
              </div>
            </div>

            <div class="activity-tabs">
              <button v-for="a in activities" :key="a.id" :class="{ active: activity === a.id }" @click="activity = a.id">
                <component :is="a.icon" :size="15" /> {{ a.label }}
              </button>
            </div>

            <Transition name="fade" mode="out-in">
              <!-- NOTES -->
              <div v-if="activity === 'notes'" key="notes" class="activity-panel">
                <div class="notes-layout">
                  <article class="note-sheet">
                    <div class="note-toolbar">
                      <div class="sheet-kicker">SMART NOTES</div>
                      <div class="note-actions">
                        <button v-if="!editingNotes" class="ghost-btn" @click="startEditingNotes">Edit notes</button>
                        <template v-else>
                          <button class="ghost-btn" :disabled="noteSaving" @click="cancelEditingNotes">Cancel</button>
                          <button class="primary-btn small" :disabled="noteSaving || !noteDraft.trim()" @click="saveNotes">
                            <Loader2 v-if="noteSaving" :size="14" class="spin" />{{ noteSaving ? 'Saving...' : 'Save notes' }}
                          </button>
                        </template>
                      </div>
                    </div>
                    <textarea v-if="editingNotes" v-model="noteDraft" class="note-editor" aria-label="Edit study notes" rows="22" />
                    <div v-else class="markdown-body" v-safe-html="renderMarkdown(activePack?.improvedNote || activePack?.summary)"></div>
                    <div class="note-refine">
                      <label for="refine-instruction">Ask AI to improve these notes</label>
                      <div><input id="refine-instruction" v-model="noteInstruction" maxlength="500" placeholder="e.g. Make a one-page revision guide" :disabled="noteRefining" />
                        <button class="ghost-btn" :disabled="noteRefining || !noteInstruction.trim() || aiUnavailable" @click="refineNotes">
                          <Loader2 v-if="noteRefining" :size="14" class="spin" /><WandSparkles v-else :size="14" />{{ noteRefining ? 'Refining...' : 'Refine' }}
                        </button>
                      </div>
                      <p v-if="noteStatus" role="status">{{ noteStatus }}</p>
                      <p v-if="noteError" class="note-error" role="alert">{{ noteError }}</p>
                    </div>
                  </article>
                  <aside class="key-panel">
                    <h3><Sparkles :size="15" /> Key takeaways</h3>
                    <div v-if="keyPoints.length" class="keypoints">
                      <div v-for="(point, i) in keyPoints" :key="i" class="keypoint">
                        <span>{{ String(i + 1).padStart(2, '0') }}</span>
                        <p>{{ point.text || point }}</p>
                      </div>
                    </div>
                    <p v-else class="muted">No key points were extracted for this pack.</p>
                    <div class="source-box">
                      <h4><FileText :size="14" /> Source notes</h4>
                      <p>{{ truncate(stripMarkdown(activePack?.sourceText || ''), 600) }}</p>
                    </div>
                  </aside>
                </div>
              </div>

              <!-- FLASHCARDS -->
              <div v-else-if="activity === 'flashcards'" key="flashcards" class="activity-panel">
                <div class="panel-head">
                  <div><h3><Layers :size="16" /> Flashcards</h3><p>Tap a card to reveal the answer.</p></div>
                  <span class="count-pill">{{ flashcards.length }} cards</span>
                </div>
                <div v-if="flashcards.length" class="cards-grid">
                  <button v-for="(card, i) in flashcards" :key="i" class="flashcard"
                    :class="{ flipped: flippedCard === i }" @click="flippedCard = flippedCard === i ? -1 : i">
                    <span class="card-index">{{ String(i + 1).padStart(2, '0') }}</span>
                    <template v-if="flippedCard !== i">
                      <strong>{{ card.front || card.question }}</strong>
                      <span class="card-hint">Tap to reveal</span>
                    </template>
                    <template v-else>
                      <p>{{ card.back || card.answer }}</p>
                      <span class="card-hint">Answer</span>
                    </template>
                  </button>
                </div>
                <div v-else class="empty-state small"><Layers :size="28" /><p>No flashcards in this pack.</p></div>
              </div>

              <!-- QUIZ -->
              <div v-else-if="activity === 'quiz'" key="quiz" class="activity-panel">
                <div class="panel-head">
                  <div><h3><ListChecks :size="16" /> Quick quiz</h3><p>Test yourself on this material.</p></div>
                  <div class="quiz-summary"><span v-if="quizFinished" class="count-pill">{{ quizScore }}/{{ quiz.length }}</span>
                    <button v-if="quizFinished" class="ghost-btn" @click="resetQuiz">Try again</button></div>
                </div>
                <div v-if="quiz.length" class="quiz-wrap">
                  <div v-for="(q, qi) in quiz" :key="qi" class="quiz-card">
                    <p class="quiz-q"><span>{{ qi + 1 }}.</span> {{ q.question }}</p>
                    <template v-if="quizQuestionType(q) === 'fill_blank'">
                      <form class="fill-answer" @submit.prevent="answerQuiz(qi, quizDraft[qi])">
                        <input v-model="quizDraft[qi]" :disabled="quizAnswers[qi] !== undefined" placeholder="Type your answer" :aria-label="`Answer question ${qi + 1}`" />
                        <button class="primary-btn small" type="submit" :disabled="quizAnswers[qi] !== undefined || !quizDraft[qi]?.trim()">Check answer</button>
                      </form>
                      <p v-if="quizAnswers[qi] !== undefined" class="quiz-feedback" :class="{ correct: quizIsCorrect(q, quizAnswers[qi]), wrong: !quizIsCorrect(q, quizAnswers[qi]) }">
                        {{ quizIsCorrect(q, quizAnswers[qi]) ? 'Correct' : `Answer: ${quizCorrectAnswer(q)}` }}
                      </p>
                    </template>
                    <div v-else class="quiz-options">
                      <button v-for="(opt, oi) in quizOptions(q)" :key="oi"
                        :class="quizAnswers[qi] === oi ? (oi === quizCorrectOption(q) ? 'correct' : 'wrong') : ''"
                        :disabled="quizAnswers[qi] !== undefined" @click="answerQuiz(qi, oi)">
                        <span class="opt-letter">{{ String.fromCharCode(65 + oi) }}</span>
                        {{ opt }}
                        <Check v-if="quizAnswers[qi] !== undefined && oi === quizCorrectOption(q)" :size="15" />
                      </button>
                    </div>
                    <p v-if="quizAnswers[qi] !== undefined && q.explanation" class="quiz-explain">{{ q.explanation }}</p>
                  </div>
                </div>
                <div v-else class="empty-state small"><ListChecks :size="28" /><p>No quiz in this pack.</p></div>
              </div>

              <!-- PODCAST -->
              <div v-else-if="activity === 'podcast'" key="podcast" class="activity-panel">
                <div class="audio-hero">
                  <div class="audio-icon"><Headphones :size="30" /></div>
                  <div>
                    <h3>Listen to your notes</h3>
                    <p>Choose how long and detailed your audio review should be.</p>
                  </div>
                </div>
                <div class="podcast-options">
                  <label>Length<select v-model.number="podcastLength"><option :value="2500">Short</option><option :value="4500">Standard</option><option :value="7500">Extended</option></select></label>
                  <label>Depth<select v-model="podcastDepth"><option value="overview">Quick overview</option><option value="balanced">Balanced review</option><option value="deep_dive">Detailed deep dive</option></select></label>
                  <button class="primary-btn small" :disabled="podcastBusy || aiUnavailable" :title="aiUnavailable ? 'No AI provider is online' : undefined" @click="makePodcast">
                    <Loader2 v-if="podcastBusy" :size="15" class="spin" /><WandSparkles v-else :size="15" />
                    {{ activePack?.podcastUrl ? 'Regenerate audio' : 'Generate audio' }}
                  </button>
                </div>
                <audio v-if="activePack?.podcastUrl" :src="activePack.podcastUrl" controls class="audio-player" />
                <div v-if="activePack?.podcastUrl" class="podcast-actions"><a :href="activePack.podcastUrl" download>Download audio</a><details v-if="podcastScript"><summary>Read the audio script</summary><p>{{ podcastScript }}</p></details></div>
                <div v-if="audioError" class="inline-error"><AlertCircle :size="15" /> {{ audioError }}</div>
              </div>

              <!-- CHAT -->
              <div v-else key="chat" class="activity-panel chat-panel">
                <div class="chat-log">
                  <div v-if="!chatMessages.length" class="chat-empty">
                    <MessageCircle :size="28" />
                    <h3>Ask anything about this pack</h3>
                    <p>Clarify a concept, ask for an example, or go deeper.</p>
                  </div>
                  <div v-for="(msg, i) in chatMessages" :key="i" class="chat-msg" :class="msg.role">
                    <span class="chat-avatar">{{ msg.role === 'user' ? 'You' : 'AI' }}</span>
                    <div class="chat-bubble markdown-body" v-safe-html="renderMarkdown(msg.content)"></div>
                  </div>
                  <div v-if="chatBusy" class="chat-msg assistant">
                    <span class="chat-avatar">AI</span>
                    <div class="chat-bubble typing"><span /><span /><span /></div>
                  </div>
                </div>
                <form class="chat-input" @submit.prevent="sendChat">
                  <input v-model="chatInput" placeholder="Ask a question about your material…" :disabled="chatBusy" />
                  <button type="submit" :disabled="chatBusy || aiUnavailable || !chatInput.trim()" :title="aiUnavailable ? 'No AI provider is online' : 'Send'"><Send :size="16" /></button>
                </form>
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </section>

    <!-- ───────────────── Focus sidebar (preserved) ───────────────── -->
    <aside class="side">
      <div class="side-card">
        <div class="side-head"><h3><Clock :size="15" /> Focus timer</h3><span class="side-tag">POMODORO</span></div>
        <div class="timer-ring">
          <svg viewBox="0 0 120 120" class="-rotate-90">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E8ECF3" stroke-width="6" />
            <circle cx="60" cy="60" r="52" fill="none" :stroke="timerColor" stroke-width="6" stroke-linecap="round"
              :stroke-dasharray="circumference" :stroke-dashoffset="progressOffset" class="ring-progress" />
          </svg>
          <div class="timer-label">
            <strong>{{ formattedTime }}</strong>
            <span :style="{ color: timerColor }">{{ timerStateLabel }}</span>
          </div>
        </div>
        <div class="timer-controls">
          <button v-if="timerState !== 'running'" class="timer-main" @click="startTimer">Start</button>
          <button v-else class="timer-main pause" @click="pauseTimer">Pause</button>
          <button class="timer-icon" @click="resetTimer" title="Reset"><RotateCcw :size="14" /></button>
        </div>
        <div class="presets">
          <button v-for="p in presets" :key="p.label" :class="{ active: currentDuration === p.minutes }" @click="setDuration(p.minutes)">
            {{ p.label }}
          </button>
        </div>
      </div>

      <div class="side-card">
        <div class="side-head"><h3><Target :size="15" /> Weekly goals</h3><span class="side-tag">{{ completedGoals }}/{{ goals.length }}</span></div>
        <div class="goal-list">
          <div v-for="g in goals" :key="g.id" class="goal-row">
            <input type="checkbox" v-model="g.done" class="goal-check" />
            <input v-if="editingGoalId === g.id" v-model="g.text" @blur="editingGoalId = null" @keydown.enter="editingGoalId = null" class="goal-edit" />
            <span v-else class="goal-text" :class="{ done: g.done }" @dblclick="editingGoalId = g.id">{{ g.text }}</span>
            <button class="goal-del" @click="deleteGoal(g.id)" title="Delete"><Trash2 :size="13" /></button>
          </div>
          <form class="goal-add" @submit.prevent="addGoal">
            <input v-model="newGoalText" placeholder="Add a goal…" />
            <button type="submit"><Plus :size="14" /></button>
          </form>
        </div>
      </div>

      <div class="side-tip">
        <Sparkles :size="15" />
        <p><strong>Tip:</strong> Double-click a goal to edit it. Your focus sessions are saved automatically.</p>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import {
  AlertCircle, BarChart3, BookOpen, Check, ChevronRight, ClipboardList, Clock, FileText,
  Headphones, Image as ImageIcon, Layers, Library, Link2, ListChecks, Loader2, MessageCircle,
  Mic, Paperclip, Plus, RotateCcw, Send, Sparkles, Target, Trash2, Users, WandSparkles, X, Zap,
} from 'lucide-vue-next'
import api from '../lib/api'

const router = useRouter()
const authStore = useAuthStore()

/* ── Workspace state ── */
const view = ref('workspace')
const packs = ref([])
const folders = ref([])
const folderFilter = ref('all')
const newFolderName = ref('')
const folderBusy = ref(false)
const folderError = ref('')
const folderNotice = ref('')
const visiblePacks = computed(() => packs.value.filter(pack => {
  if (folderFilter.value === 'all') return true
  if (folderFilter.value === 'unfiled') return !pack.folderId
  return String(pack.folderId || '') === String(folderFilter.value)
}))
const courses = ref([])
const selectedCourseId = ref('')
const studentDepartment = computed(() => authStore.user?.department || '')
const packsLoading = ref(false)
const packsError = ref('')
const activePack = ref(null)
const activity = ref('notes')
const editingNotes = ref(false)
const noteDraft = ref('')
const noteInstruction = ref('')
const noteSaving = ref(false)
const noteRefining = ref(false)
const noteStatus = ref('')
const noteError = ref('')
const sourceText = ref('')
const sourceUrl = ref('')
const files = ref([])
const fileInput = ref(null)
const isDragging = ref(false)
const generating = ref(false)
const aiOnlineCount = ref(0)
const aiChecked = ref(false)
const aiUnavailable = computed(() => aiChecked.value && aiOnlineCount.value === 0)
const genStep = ref(0)
const error = ref('')
const genSteps = ['Reading your sources', 'Understanding the material', 'Writing notes & cards', 'Building quiz & audio recap']
const flashcardCount = ref(12)
const quizCount = ref(10)
const quizDifficulty = ref('intermediate')
const quizFormat = ref('multiple_choice')

const railItems = [
  { id: 'new', label: 'New pack', icon: Plus, view: 'workspace', action: goWorkspace },
  { id: 'library', label: 'My library', icon: Library, view: 'library', action: () => { view.value = 'library' } },
  { id: 'groups', label: 'Study groups', icon: Users, external: true, action: () => router.push({ name: 'StudyGroups' }) },
  { id: 'plan', label: 'Study plan', icon: ClipboardList, external: true, action: () => router.push({ name: 'StudyPlan' }) },
  { id: 'dashboard', label: 'Progress', icon: BarChart3, external: true, action: () => router.push({ name: 'StudyDashboard' }) },
]
const activities = [
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'quiz', label: 'Quiz', icon: ListChecks },
  { id: 'podcast', label: 'Podcast', icon: Headphones },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
]
const suggestions = [
  { label: 'Paste lecture notes', icon: FileText, text: 'Paste your own lecture notes into the box to turn them into a full study pack with notes, flashcards and a quiz.' },
  { label: 'Summarise a topic', icon: Sparkles, text: 'Cellular respiration is the process by which cells convert glucose and oxygen into ATP, carbon dioxide and water. It has four main stages: glycolysis, pyruvate oxidation, the Krebs cycle and the electron transport chain.' },
]

async function checkAIProviders() {
  try {
    const { data } = await api.get('/ai/models')
    aiOnlineCount.value = Number(data?.online ?? 0)
  } catch {
    aiOnlineCount.value = 0
  } finally {
    aiChecked.value = true
  }
}

onMounted(async () => {
  await Promise.all([loadPacks(), loadFolders(), loadGoals(), loadCourses(), checkAIProviders()])
})
onUnmounted(() => {
  if (interval) { clearInterval(interval); interval = null }
})

function goWorkspace() {
  view.value = 'workspace'
  sourceText.value = ''
  sourceUrl.value = ''
  files.value = []
  error.value = ''
}

const genProgress = computed(() => Math.min(92, (genStep.value / genSteps.length) * 100 + 8))

function fieldFor(file) {
  if ((file.type || '').startsWith('image/')) return 'image'
  if ((file.type || '').startsWith('audio/')) return 'audio'
  return 'document'
}
function fileIcon(file) {
  if ((file.type || '').startsWith('image/')) return ImageIcon
  if ((file.type || '').startsWith('audio/')) return Mic
  return FileText
}
function onFiles(event) {
  const incoming = Array.from(event.target.files || [])
  files.value = [...files.value, ...incoming].slice(0, 20)
  if (fileInput.value) fileInput.value.value = ''
}
function onDrop(event) {
  isDragging.value = false
  const incoming = Array.from(event.dataTransfer?.files || [])
  if (incoming.length) files.value = [...files.value, ...incoming].slice(0, 20)
}
function friendlyError(e) {
  const status = e?.response?.status
  if (status === 429) return 'You are going a little too fast. Give it a minute and try again.'
  if (status === 503) return 'The study assistant is warming up. Please try again shortly.'
  return e?.response?.data?.error || e?.message || 'Something went wrong. Please try again.'
}

async function loadPacks() {
  packsLoading.value = true
  packsError.value = ''
  try {
    const { data } = await api.get('/study-materials')
    packs.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.warn('[StudyHub] Load packs failed:', e)
    packsError.value = friendlyError(e)
  } finally {
    packsLoading.value = false
  }
}

async function loadFolders() {
  folderError.value = ''
  try {
    const { data } = await api.get('/study-folders')
    folders.value = Array.isArray(data) ? data : []
  } catch (e) {
    folderError.value = friendlyError(e)
  }
}

async function createFolder() {
  const name = newFolderName.value.trim()
  if (!name || folderBusy.value) return
  folderBusy.value = true
  folderError.value = ''
  folderNotice.value = ''
  try {
    const { data } = await api.post('/study-folders', { name })
    folders.value = [...folders.value, data].sort((a, b) => a.name.localeCompare(b.name))
    folderFilter.value = data.id
    newFolderName.value = ''
    folderNotice.value = `Created “${data.name}”. Move packs into it below.`
  } catch (e) {
    folderError.value = friendlyError(e)
  } finally {
    folderBusy.value = false
  }
}

async function movePackToFolder(pack, event) {
  const folderId = event.target.value || null
  const previousFolder = pack.folderId || ''
  if (String(folderId || '') === String(previousFolder)) return
  folderBusy.value = true
  folderError.value = ''
  folderNotice.value = ''
  try {
    await api.put(`/study-materials/${pack.id}/folder`, { folderId })
    pack.folderId = folderId
    folderNotice.value = folderId ? `Moved “${pack.title}” to ${folders.value.find(folder => folder.id === folderId)?.name || 'folder'}.` : `Removed “${pack.title}” from its folder.`
  } catch (e) {
    event.target.value = previousFolder
    folderError.value = friendlyError(e)
  } finally {
    folderBusy.value = false
  }
}

async function loadCourses() {
  try {
    const { data } = await api.get('/courses/enrolled')
    let result = Array.isArray(data) ? data.filter(course => course.id && course.code) : []
    // Auto-filter by student's department if available
    const dept = studentDepartment.value
    if (dept) {
      result = result.filter(c => String(c.departmentId) === String(dept) || String(c.department) === String(dept))
    }
    courses.value = result
    // Auto-select the first course from the student's department
    if (result.length > 0 && !selectedCourseId.value) {
      const deptCourse = result.find(c => String(c.departmentId) === String(dept) || String(c.department) === String(dept))
      if (deptCourse) selectedCourseId.value = String(deptCourse.id)
    }
  } catch (e) {
    console.warn('[StudyHub] Load courses failed:', e)
    courses.value = []
  }
}

async function generatePack() {
  if (!sourceText.value.trim() && !sourceUrl.value.trim() && !files.value.length) {
    error.value = 'Add some notes, a link, or at least one file first.'
    return
  }
  error.value = ''
  generating.value = true
  genStep.value = 0
  const ticker = setInterval(() => { if (genStep.value < genSteps.length - 1) genStep.value++ }, 4500)

  const form = new FormData()
  form.append('sourceText', sourceText.value.trim())
  form.append('title', deriveTitle())
  form.append('flashcardCount', String(flashcardCount.value))
  form.append('quizCount', String(quizCount.value))
  form.append('quizDifficulty', quizDifficulty.value)
  form.append('quizFormat', quizFormat.value)
  if (selectedCourseId.value) form.append('courseId', selectedCourseId.value)
  if (sourceUrl.value.trim()) form.append('youtubeUrl', sourceUrl.value.trim())
  for (const file of files.value) form.append(fieldFor(file), file)

  try {
    const { data } = await api.post('/study-materials/upload', form, { timeout: 180000 })
    genStep.value = genSteps.length
    activePack.value = data
    resetActivities()
    view.value = 'pack'
    await loadPacks()
  } catch (e) {
    error.value = friendlyError(e)
  } finally {
    clearInterval(ticker)
    generating.value = false
  }
}

function deriveTitle() {
  const text = sourceText.value.trim()
  if (text) return text.split(/\s+/).slice(0, 6).join(' ')
  if (files.value.length) return files.value[0].name.replace(/\.[^.]+$/, '')
  return 'My study pack'
}

async function openPack(id) {
  error.value = ''
  try {
    const { data } = await api.get(`/study-materials/${id}`)
    activePack.value = data
    resetActivities()
    view.value = 'pack'
  } catch (e) {
    error.value = friendlyError(e)
    view.value = 'library'
  }
}

function resetActivities() {
  activity.value = 'notes'
  editingNotes.value = false
  noteDraft.value = ''
  noteStatus.value = ''
  noteError.value = ''
  flippedCard.value = -1
  quizAnswers.value = {}
  quizDraft.value = {}
  audioError.value = ''
  podcastScript.value = ''
  chatMessages.value = Array.isArray(activePack.value?.chatHistory)
    ? activePack.value.chatHistory.slice(-20)
    : []
  chatInput.value = ''
}

function startEditingNotes() {
  noteDraft.value = activePack.value?.improvedNote || activePack.value?.summary || ''
  noteError.value = ''
  noteStatus.value = ''
  editingNotes.value = true
}
function cancelEditingNotes() {
  editingNotes.value = false
  noteDraft.value = ''
}
async function saveNotes() {
  if (!activePack.value?.id || !noteDraft.value.trim() || noteSaving.value) return
  noteSaving.value = true
  noteError.value = ''
  noteStatus.value = ''
  try {
    const { data } = await api.put(`/study-materials/${activePack.value.id}/notes`, { improvedNote: noteDraft.value })
    activePack.value = { ...activePack.value, improvedNote: data.improvedNote }
    editingNotes.value = false
    noteStatus.value = 'Your notes are saved.'
  } catch (e) {
    noteError.value = friendlyError(e)
  } finally {
    noteSaving.value = false
  }
}
async function refineNotes() {
  const instruction = noteInstruction.value.trim()
  if (!activePack.value?.id || !instruction || noteRefining.value) return
  noteRefining.value = true
  noteError.value = ''
  noteStatus.value = ''
  try {
    const { data } = await api.post(`/study-materials/${activePack.value.id}/notes/refine`, { instruction }, { timeout: 120000 })
    activePack.value = { ...activePack.value, improvedNote: data.improvedNote }
    noteDraft.value = data.improvedNote
    editingNotes.value = false
    noteStatus.value = 'AI refined your notes and saved the changes.'
  } catch (e) {
    noteError.value = friendlyError(e)
  } finally {
    noteRefining.value = false
  }
}

/* ── Derived pack data ── */
const keyPoints = computed(() => {
  const value = activePack.value?.keyPoints
  if (Array.isArray(value)) return value
  if (typeof value === 'string') { try { return JSON.parse(value) } catch { return [] } }
  return []
})
const flashcards = computed(() => {
  const value = activePack.value?.flashcards
  if (Array.isArray(value)) return value
  if (Array.isArray(activePack.value?.cards)) return activePack.value.cards
  return []
})
const quiz = computed(() => {
  const value = activePack.value?.quiz
  if (Array.isArray(value)) return value
  if (typeof value === 'string') { try { return JSON.parse(value) } catch { return [] } }
  return []
})
const flippedCard = ref(-1)
const quizAnswers = ref({})
const quizDraft = ref({})
const quizFinished = computed(() => Object.keys(quizAnswers.value).length >= quiz.value.length && quiz.value.length > 0)
const quizScore = computed(() => quiz.value.filter((q, i) => quizAnswers.value[i] !== undefined && quizIsCorrect(q, quizAnswers.value[i])).length)

function quizQuestionType(question) {
  const type = String(question?.type || '').toLowerCase().replace(/[^a-z]/g, '')
  if (['fillblank', 'fillintheblank', 'shortanswer'].includes(type)) return 'fill_blank'
  if (['truefalse', 'tf'].includes(type)) return 'true_false'
  return 'multiple_choice'
}
function quizOptions(question) {
  if (quizQuestionType(question) === 'true_false') return ['True', 'False']
  return Array.isArray(question?.options) ? question.options : []
}
function quizCorrectOption(question) {
  if (Number.isInteger(Number(question?.answerIndex))) return Number(question.answerIndex)
  const answer = String(question?.answer ?? question?.correctAnswer ?? '').trim().toLowerCase()
  if (quizQuestionType(question) === 'true_false') return ['true', 't', 'yes'].includes(answer) ? 0 : 1
  const options = quizOptions(question)
  return options.findIndex(option => String(option).trim().toLowerCase() === answer)
}
function quizCorrectAnswer(question) {
  const answer = question?.answer ?? question?.correctAnswer
  if (answer !== undefined && answer !== null && String(answer).trim()) return String(answer)
  const option = quizOptions(question)[quizCorrectOption(question)]
  return option === undefined ? 'See the study notes' : String(option)
}
function quizIsCorrect(question, answer) {
  if (quizQuestionType(question) === 'fill_blank') {
    const expected = quizCorrectAnswer(question).trim().toLocaleLowerCase().replace(/[.,!?;:]$/, '')
    const actual = String(answer || '').trim().toLocaleLowerCase().replace(/[.,!?;:]$/, '')
    return Boolean(actual) && actual === expected
  }
  return Number(answer) === quizCorrectOption(question)
}
function answerQuiz(qi, oi) {
  if (quizAnswers.value[qi] !== undefined) return
  quizAnswers.value = { ...quizAnswers.value, [qi]: oi }
  const answers = { ...quizAnswers.value, [qi]: oi }
  if (Object.keys(answers).length === quiz.value.length && activePack.value?.id) {
    const correctAnswers = quiz.value.filter((question, index) => quizIsCorrect(question, answers[index])).length
    api.post('/study-sessions', {
      materialId: activePack.value.id,
      sessionType: 'quiz',
      score: Math.round((correctAnswers / quiz.value.length) * 100),
      totalQuestions: quiz.value.length,
      correctAnswers,
      stats: { answers },
    }).catch(e => console.warn('[StudyHub] Save quiz result failed:', e))
  }
}
function resetQuiz() {
  quizAnswers.value = {}
  quizDraft.value = {}
}

/* ── Podcast ── */
const podcastBusy = ref(false)
const audioError = ref('')
const podcastLength = ref(4500)
const podcastDepth = ref('balanced')
const podcastScript = ref('')
async function makePodcast() {
  if (!activePack.value?.id) return
  podcastBusy.value = true
  audioError.value = ''
  try {
    const { data } = await api.post(`/study-materials/${activePack.value.id}/podcast`, {
      maxLength: podcastLength.value,
      depth: podcastDepth.value,
    }, { timeout: 180000 })
    const url = data?.url || data?.audioUrl || data?.data?.url || data?.data?.audioUrl
    if (url) {
      activePack.value = { ...activePack.value, podcastUrl: url }
      podcastScript.value = data?.script || data?.data?.script || ''
    }
    else audioError.value = 'The audio recap is not ready yet. Please try again.'
  } catch (e) {
    audioError.value = friendlyError(e)
  } finally {
    podcastBusy.value = false
  }
}

/* ── Pack chat ── */
const chatMessages = ref([])
const chatInput = ref('')
const chatBusy = ref(false)
async function sendChat() {
  const message = chatInput.value.trim()
  if (!message || !activePack.value?.id || chatBusy.value) return
  chatMessages.value = [...chatMessages.value, { role: 'user', content: message }]
  chatInput.value = ''
  chatBusy.value = true
  try {
    const { data } = await api.post(`/study-materials/${activePack.value.id}/chat`, { message }, { timeout: 120000 })
    chatMessages.value = Array.isArray(data?.history)
      ? data.history.slice(-20)
      : [...chatMessages.value, { role: 'assistant', content: data?.response || 'Done.' }]
  } catch (e) {
    chatMessages.value = [...chatMessages.value, { role: 'assistant', content: friendlyError(e) }]
  } finally {
    chatBusy.value = false
  }
}

/* ── Formatting helpers ── */
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
function renderMarkdown(text) {
  if (!text) return ''
  return escapeHtml(text)
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')
}
function stripMarkdown(text) {
  return String(text || '').replace(/[#*`>[\]]/g, '').replace(/\s+/g, ' ').trim()
}
function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text
}
function shortDate(value) {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/* ── Pomodoro Timer (contract preserved) ── */
const totalSeconds = ref(25 * 60)
const remainingSeconds = ref(25 * 60)
const timerState = ref('idle')
let interval = null
const presets = [{ label: '25m', minutes: 25 }, { label: '15m', minutes: 15 }, { label: '5m', minutes: 5 }]
const circumference = 2 * Math.PI * 52
const progressOffset = computed(() => circumference * (1 - remainingSeconds.value / totalSeconds.value))
const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60)
  const s = remainingSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})
const currentDuration = computed(() => presets.find(p => p.minutes === totalSeconds.value / 60)?.minutes || 25)
const timerColor = computed(() => timerState.value === 'running' ? 'var(--color-primary)' : timerState.value === 'paused' ? 'var(--color-accent)' : 'var(--color-text-quaternary)')
const timerStateLabel = computed(() => timerState.value === 'running' ? 'FOCUSING' : timerState.value === 'paused' ? 'PAUSED' : 'READY')

function setDuration(minutes) {
  if (timerState.value === 'running') return
  totalSeconds.value = minutes * 60
  remainingSeconds.value = minutes * 60
  timerState.value = 'idle'
}
function savePomodoroSession() {
  api.post('/pomodoro/sessions', { durationMinutes: currentDuration.value }).catch(() => {})
}
function startTimer() {
  if (timerState.value !== 'idle' && timerState.value !== 'paused') return
  timerState.value = 'running'
  interval = setInterval(() => {
    remainingSeconds.value--
    if (remainingSeconds.value <= 0) {
      clearInterval(interval); interval = null; timerState.value = 'idle'
      savePomodoroSession()
      remainingSeconds.value = totalSeconds.value
    }
  }, 1000)
}
function pauseTimer() {
  if (timerState.value === 'running') { clearInterval(interval); interval = null; timerState.value = 'paused' }
}
function resetTimer() {
  clearInterval(interval); interval = null
  remainingSeconds.value = totalSeconds.value
  timerState.value = 'idle'
}

/* ── Weekly Goals (contract preserved) ── */
const goals = ref([])
const completedGoals = computed(() => goals.value.filter(g => g.done).length)
const newGoalText = ref('')
const editingGoalId = ref(null)
function addGoal() {
  const text = newGoalText.value.trim()
  if (!text) return
  goals.value.push({ id: crypto.randomUUID?.() || Date.now().toString(36), text, done: false })
  newGoalText.value = ''
}
function deleteGoal(id) { goals.value = goals.value.filter(g => g.id !== id) }
async function loadGoals() {
  try {
    const { data } = await api.get('/pomodoro/goals')
    if (Array.isArray(data) && data.length > 0) goals.value = data.map(g => ({ id: g.id, text: g.text, done: g.done }))
  } catch (error) {
    console.warn('[StudyHub] Failed to load goals:', error)
    goals.value = []
  }
}
async function saveGoals() {
  try {
    await api.post('/pomodoro/goals', { goals: goals.value.map(g => ({ id: g.id, text: g.text, done: g.done })) })
  } catch (error) {
    console.warn('[StudyHub] Failed to save goals:', error)
  }
}
watch(goals, saveGoals, { deep: true })
</script>

<style scoped>
.hub { --navy: var(--color-deep); --gold: var(--color-accent); --ink: var(--color-text-primary); --muted: var(--color-text-tertiary); --line: var(--color-border); --bg: var(--color-bg); display: grid; grid-template-columns: 232px minmax(0, 1fr) 280px; min-height: 100vh; background: var(--bg); color: var(--ink); font-family: var(--font-sans); }
.rail, .side { background: #fff; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
.rail { border-right: 1px solid var(--line); padding: 24px 16px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 11px; padding: 0 6px 22px; }
.brand-mark { width: 36px; height: 36px; border-radius: 11px; background: var(--navy); color: var(--gold); display: grid; place-items: center; }
.brand strong { display: block; font-size: 14px; color: var(--navy); }
.brand span { display: block; font-size: 10px; color: var(--muted); margin-top: 2px; }
.new-pack { width: 100%; border: 0; border-radius: 10px; background: var(--navy); color: #fff; padding: 11px 13px; display: flex; align-items: center; gap: 9px; font-size: 12px; font-weight: 600; cursor: pointer; }
.new-pack:hover { background: #2d523b; }
.rail-nav { margin-top: 26px; }
.rail-label { font-size: 9px; font-weight: 700; letter-spacing: .16em; color: #929b8e; padding: 0 8px 9px; margin: 0; }
.rail-item { width: 100%; display: flex; align-items: center; gap: 11px; padding: 9px 10px; border: 0; background: transparent; color: #4c5b50; border-radius: 8px; font-size: 12px; cursor: pointer; text-align: left; margin-bottom: 3px; }
.rail-item:hover, .rail-item.active { background: #edf2e8; color: var(--navy); }
.rail-item.active { font-weight: 700; }
.rail-chevron { margin-left: auto; opacity: .5; }
.rail-recent { margin-top: 28px; }
.recent-item { width: 100%; display: flex; align-items: center; gap: 9px; padding: 7px 9px; border: 0; background: transparent; cursor: pointer; text-align: left; border-radius: 7px; }
.recent-item:hover { background: #faf7ef; }
.recent-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); flex: none; }
.recent-title { font-size: 11px; color: #4c5b50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rail-empty { font-size: 11px; color: #929b8e; padding: 0 9px; }
.rail-foot { margin-top: auto; display: flex; gap: 10px; align-items: center; padding: 13px 10px; border-radius: 10px; background: #faf7ef; }
.rail-foot-icon { color: var(--gold); }
.rail-foot strong { display: block; font-size: 11px; color: var(--navy); }
.rail-foot span { display: block; font-size: 9px; color: var(--muted); }

.main { min-width: 0; display: flex; flex-direction: column; }
.topbar { height: 62px; background: #fff; border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding: 0 30px; flex: none; }
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); }
.crumbs strong { color: var(--navy); }
.topbar-actions { display: flex; align-items: center; gap: 12px; }
.status-pill { display: inline-flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 600; color: #3F8F6B; background: #EDF8F2; padding: 6px 10px; border-radius: 99px; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #4CB888; }
.status-pill.offline { color: #b91c1c; background: #fef2f2; }
.status-pill.offline .status-dot { background: #b91c1c; }
.icon-btn { width: 32px; height: 32px; border: 1px solid var(--line); background: #fff; border-radius: 8px; color: #718074; display: grid; place-items: center; cursor: pointer; }
.scroll { flex: 1; overflow-y: auto; padding: 34px 38px 60px; }

.workspace { max-width: 860px; margin: 0 auto; }
.hero { text-align: center; margin-bottom: 30px; }
.hero-pill { display: inline-flex; align-items: center; gap: 7px; font-size: 9px; font-weight: 700; letter-spacing: .12em; color: #7d4a36; background: var(--color-accent-soft); border: 1px solid #EFE4BE; padding: 6px 12px; border-radius: 99px; }
.hero h1 { font-family: var(--font-display); font-size: 38px; line-height: 1.15; color: var(--navy); margin: 18px 0 10px; letter-spacing: -.02em; }
.hero h1 em { font-style: italic; color: var(--gold); }
.hero p { color: #68758E; font-size: 13px; line-height: 1.6; max-width: 600px; margin: 0 auto; }

.composer { background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 20px; box-shadow: 0 12px 40px rgba(36, 53, 42, .05); transition: border-color .2s, box-shadow .2s; }
.composer.dragging { border-color: var(--gold); box-shadow: 0 0 0 4px rgba(185, 100, 69, .12); }
.composer-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.composer-title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: var(--navy); }
.composer-hint { font-size: 10px; color: #929b8e; }
.composer-input { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 14px; font-size: 13px; line-height: 1.6; color: var(--ink); resize: vertical; outline: none; background: #fffdf8; }
.composer-input:focus { border-color: #b96445; }
.composer-tools { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.tool-btn { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--line); border-radius: 9px; padding: 9px 12px; font-size: 11px; font-weight: 600; color: #4c5b50; background: #fff; cursor: pointer; }
.tool-btn:hover { border-color: #cfc5b2; }
.study-options { margin-top: 14px; border-top: 1px solid var(--line); padding-top: 12px; }
.study-options summary { color: var(--navy); font-size: 11px; font-weight: 700; cursor: pointer; }
.options-grid { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 10px; padding-top: 12px; }
.options-grid label, .podcast-options label { display: grid; gap: 6px; color: var(--muted); font-size: 10px; font-weight: 600; }
.options-grid select, .podcast-options select, .library-filter select, .pack-folder select { width: 100%; min-width: 0; border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--ink); padding: 8px 9px; font: inherit; }
.course-tool select { min-width: 210px; max-width: 310px; border: 0; outline: 0; background: transparent; color: inherit; font: inherit; }
.library-error { justify-content: space-between; }
.library-loading { padding: 28px; text-align: center; color: #718074; font-size: 12px; }
.url-tool { flex: 1; min-width: 200px; }
.url-tool input { border: 0; outline: none; flex: 1; font-size: 11px; color: var(--ink); background: transparent; }
.file-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
.file-chip { display: inline-flex; align-items: center; gap: 6px; background: #edf2e8; border-radius: 7px; padding: 6px 9px; font-size: 10px; color: #4c5b50; max-width: 220px; }
.file-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-chip button { border: 0; background: transparent; color: #718074; cursor: pointer; display: grid; place-items: center; }
.inline-error { display: flex; align-items: center; gap: 8px; margin-top: 12px; background: #FEF2F0; color: #B4473A; border: 1px solid #F6D9D4; padding: 10px 12px; border-radius: 9px; font-size: 11px; }
.generating { margin-top: 14px; }
.gen-bar { height: 5px; border-radius: 99px; background: #eee8da; overflow: hidden; }
.gen-bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--navy), var(--gold)); transition: width .5s ease; }
.gen-steps { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 10px; }
.gen-steps > span { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #929b8e; }
.gen-steps .current { color: var(--navy); font-weight: 700; }
.gen-steps .done { color: #3F8F6B; }
.gen-steps .num { width: 14px; height: 14px; border: 1px solid #D5DBE5; border-radius: 50%; display: grid; place-items: center; font-size: 8px; }
.composer-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 15px; border-top: 1px solid var(--line); }
.composer-meta { font-size: 10px; color: #929b8e; }
.primary-btn { border: 0; border-radius: 9px; background: var(--navy); color: #fff; padding: 11px 18px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.primary-btn:hover:not(:disabled) { background: #2d523b; }
.primary-btn:disabled { opacity: .45; cursor: not-allowed; }
.primary-btn.small { padding: 9px 14px; font-size: 11px; }
.suggestions { margin-top: 26px; }
.suggestions p { font-size: 9px; font-weight: 700; letter-spacing: .14em; color: #929b8e; margin: 0 0 10px; }
.suggestions > div { display: flex; gap: 8px; flex-wrap: wrap; }
.suggestions button { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--line); background: #fff; padding: 8px 12px; border-radius: 8px; font-size: 11px; color: #4c5b50; cursor: pointer; }
.suggestions button:hover { border-color: var(--gold); color: var(--navy); }

.section-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.eyebrow { font-size: 9px; font-weight: 700; letter-spacing: .16em; color: var(--gold); margin: 0 0 6px; }
.section-head h2, .pack-header h2 { font-family: var(--font-display); font-size: 26px; color: var(--navy); margin: 0; }
.section-head .sub { font-size: 12px; color: var(--muted); margin: 6px 0 0; }
.library-tools { display: flex; align-items: end; gap: 12px; flex-wrap: wrap; margin: -6px 0 20px; }
.library-filter { display: grid; gap: 5px; color: var(--muted); font-size: 10px; font-weight: 600; min-width: 170px; }
.folder-create { display: flex; align-items: center; gap: 6px; }
.folder-create input { width: 180px; border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px; color: var(--ink); font-size: 11px; }
.folder-create button { border: 1px solid var(--line); border-radius: 8px; background: #fff; color: var(--navy); padding: 8px 10px; font-size: 10px; font-weight: 600; cursor: pointer; }
.folder-create button:disabled { opacity: .5; cursor: not-allowed; }
.folder-notice { color: #3f805f; font-size: 10px; }
.pack-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.pack-card { text-align: left; background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; transition: transform .18s, box-shadow .18s; }
.pack-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(36, 53, 42, .07); }
.pack-card-top { display: flex; justify-content: space-between; align-items: center; }
.pack-icon { width: 36px; height: 36px; border-radius: 10px; background: #eee8da; color: var(--gold); display: grid; place-items: center; }
.pack-date { font-size: 10px; color: #929b8e; }
.pack-card h3 { font-size: 14px; color: var(--navy); margin: 14px 0 7px; line-height: 1.3; }
.pack-open { border: 0; background: transparent; padding: 0; text-align: left; cursor: pointer; }
.pack-open h3 { margin-top: 14px; }
.pack-card p { font-size: 11px; color: var(--muted); line-height: 1.5; margin: 0 0 14px; }
.pack-stats { display: flex; gap: 12px; border-top: 1px solid var(--line); padding-top: 12px; }
.pack-stats span { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #718074; }
.pack-folder { display: grid; grid-template-columns: 44px 1fr; align-items: center; gap: 8px; margin-top: 12px; color: var(--muted); font-size: 10px; }
.empty-state { text-align: center; padding: 70px 20px; color: #929b8e; }
.empty-state h3 { color: var(--navy); font-size: 16px; margin: 14px 0 6px; }
.empty-state p { font-size: 12px; margin: 0 0 16px; }
.empty-state.small { padding: 40px 20px; }

.pack-header { margin-bottom: 20px; }
.back-btn { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: var(--muted); font-size: 11px; cursor: pointer; padding: 0 0 14px; }
.flip { transform: rotate(180deg); }
.pack-title-row { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
.pack-actions { display: flex; gap: 8px; }
.ghost-btn { display: inline-flex; align-items: center; gap: 7px; border: 1px solid var(--line); background: #fff; color: #4c5b50; padding: 9px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; }
.ghost-btn:hover { border-color: var(--gold); color: var(--navy); }
.activity-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 20px; overflow-x: auto; }
.activity-tabs button { display: inline-flex; align-items: center; gap: 7px; border: 0; background: transparent; color: #718074; padding: 11px 14px; font-size: 11px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; white-space: nowrap; }
.activity-tabs button.active { color: var(--navy); border-color: var(--gold); }
.activity-panel { min-height: 380px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.panel-head h3 { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--navy); margin: 0; }
.panel-head p { font-size: 11px; color: var(--muted); margin: 4px 0 0; }
.count-pill { font-size: 10px; font-weight: 700; color: #7d4a36; background: var(--color-accent-soft); padding: 6px 10px; border-radius: 99px; }

.notes-layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; gap: 20px; align-items: start; }
.note-sheet { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 26px 28px; }
.note-toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.note-actions { display: flex; align-items: center; gap: 7px; }
.note-editor { width: 100%; min-height: 480px; resize: vertical; border: 1px solid var(--line); border-radius: 10px; padding: 14px; color: var(--ink); background: #fffdf8; font: 12px/1.7 var(--font-sans); }
.note-editor:focus, .note-refine input:focus, .fill-answer input:focus { outline: 2px solid var(--gold); outline-offset: 1px; }
.note-refine { border-top: 1px solid var(--line); margin-top: 18px; padding-top: 14px; }
.note-refine > label { display: block; margin-bottom: 7px; color: var(--navy); font-size: 11px; font-weight: 700; }
.note-refine > div { display: flex; gap: 7px; }
.note-refine input { flex: 1; min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; font-size: 11px; }
.note-refine p { color: #3f805f; font-size: 10px; margin: 7px 0 0; }
.note-refine p.note-error { color: #b4473a; }
.sheet-kicker { font-size: 9px; font-weight: 700; letter-spacing: .16em; color: var(--gold); margin-bottom: 16px; }
.markdown-body :deep(h1) { font-family: var(--font-display); font-size: 22px; color: var(--navy); margin: 20px 0 10px; }
.markdown-body :deep(h2) { font-size: 16px; color: var(--navy); margin: 20px 0 8px; }
.markdown-body :deep(h3) { font-size: 13px; color: var(--navy); margin: 16px 0 6px; }
.markdown-body :deep(p) { font-size: 12px; line-height: 1.75; color: #4c5b50; margin: 0 0 10px; }
.markdown-body :deep(li) { font-size: 12px; line-height: 1.7; color: #4c5b50; }
.markdown-body :deep(strong) { color: var(--navy); }
.markdown-body :deep(code) { background: #edf2e8; padding: 1px 5px; border-radius: 4px; font-size: 11px; }
.markdown-body :deep(pre) { background: var(--navy); color: #f4f1e8; padding: 14px; border-radius: 9px; overflow-x: auto; }
.key-panel { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; }
.key-panel h3 { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--navy); margin: 0 0 14px; }
.keypoint { display: flex; gap: 9px; margin-bottom: 12px; }
.keypoint span { font-size: 10px; font-weight: 700; color: var(--gold); }
.keypoint p { font-size: 11px; line-height: 1.5; color: #4c5b50; margin: 0; }
.muted { font-size: 11px; color: #929b8e; }
.source-box { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.source-box h4 { display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--navy); margin: 0 0 8px; }
.source-box p { font-size: 10px; line-height: 1.6; color: #718074; margin: 0; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.flashcard { position: relative; min-height: 150px; text-align: left; border: 1px solid var(--line); background: #fff; border-radius: 13px; padding: 18px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; gap: 12px; transition: background .2s, border-color .2s; }
.flashcard:hover { border-color: #b38a4c; }
.flashcard.flipped { background: var(--navy); border-color: var(--navy); }
.card-index { position: absolute; top: 12px; right: 14px; font-size: 10px; color: #929b8e; }
.flashcard strong { font-size: 13px; color: var(--navy); line-height: 1.45; }
.flashcard p { font-size: 12px; color: #f4f1e8; line-height: 1.55; margin: 0; }
.card-hint { font-size: 9px; letter-spacing: .1em; text-transform: uppercase; color: #929b8e; }
.flashcard.flipped .card-hint { color: var(--gold); }

.quiz-wrap { display: grid; gap: 14px; }
.quiz-summary { display: flex; align-items: center; gap: 8px; }
.quiz-card { background: #fff; border: 1px solid var(--line); border-radius: 13px; padding: 18px; }
.quiz-q { font-size: 13px; font-weight: 600; color: var(--navy); margin: 0 0 14px; line-height: 1.5; }
.quiz-q span { color: var(--gold); margin-right: 6px; }
.quiz-options { display: grid; gap: 8px; }
.quiz-options button { display: flex; align-items: center; gap: 10px; text-align: left; border: 1px solid var(--line); background: #fffdf8; padding: 10px 12px; border-radius: 9px; font-size: 11px; color: #4c5b50; cursor: pointer; }
.quiz-options button:disabled { cursor: default; }
.opt-letter { width: 22px; height: 22px; border-radius: 6px; background: #eee8da; color: #718074; display: grid; place-items: center; font-size: 10px; font-weight: 700; flex: none; }
.quiz-options .correct { border-color: #8FC7A8; background: #F0FAF4; color: #2F7A52; }
.quiz-options .wrong { border-color: #E8B3AA; background: #FEF3F1; color: #B4473A; }
.quiz-explain { font-size: 11px; color: #718074; border-left: 2px solid var(--gold); padding-left: 10px; margin: 12px 0 0; line-height: 1.6; }
.fill-answer { display: flex; gap: 8px; }
.fill-answer input { flex: 1; min-width: 0; border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; font-size: 11px; }
.quiz-feedback { font-size: 11px; font-weight: 600; margin: 10px 0 0; }
.quiz-feedback.correct { color: #2f7a52; }
.quiz-feedback.wrong { color: #b4473a; }

.audio-hero { display: flex; align-items: center; gap: 18px; background: var(--navy); color: #fff; border-radius: 14px; padding: 24px; }
.audio-icon { width: 56px; height: 56px; border-radius: 14px; background: rgba(212,175,55,.15); color: var(--gold); display: grid; place-items: center; flex: none; }
.audio-hero h3 { margin: 0 0 5px; font-size: 15px; }
.audio-hero p { margin: 0; font-size: 11px; color: #A9B6CA; }
.audio-hero .primary-btn { margin-left: auto; background: var(--gold); color: var(--navy); flex: none; }
.podcast-options { display: flex; align-items: end; gap: 10px; margin-top: 14px; }
.podcast-options label { min-width: 145px; }
.podcast-options .primary-btn { margin-left: auto; }
.audio-player { width: 100%; margin-top: 18px; }
.podcast-actions { display: flex; gap: 16px; align-items: baseline; margin-top: 9px; font-size: 11px; }
.podcast-actions a, .podcast-actions summary { color: var(--navy); cursor: pointer; }
.podcast-actions details p { color: var(--muted); line-height: 1.6; white-space: pre-wrap; }

.chat-panel { display: flex; flex-direction: column; min-height: 480px; }
.chat-log { flex: 1; background: #fff; border: 1px solid var(--line); border-radius: 14px 14px 0 0; padding: 18px; max-height: 460px; overflow-y: auto; }
.chat-empty { text-align: center; color: #929b8e; padding: 70px 20px; }
.chat-empty h3 { color: var(--navy); font-size: 14px; margin: 12px 0 5px; }
.chat-empty p { font-size: 11px; margin: 0; }
.chat-msg { display: flex; gap: 10px; margin-bottom: 16px; align-items: flex-start; }
.chat-msg.user { flex-direction: row-reverse; }
.chat-avatar { width: 26px; height: 26px; border-radius: 7px; background: var(--navy); color: var(--gold); display: grid; place-items: center; font-size: 9px; font-weight: 700; flex: none; }
.chat-msg.user .chat-avatar { background: #eee8da; color: #718074; }
.chat-bubble { background: #faf7ef; border-radius: 10px; padding: 11px 14px; max-width: 82%; }
.chat-msg.user .chat-bubble { background: var(--color-accent-soft); }
.chat-input { display: flex; gap: 8px; border: 1px solid var(--line); border-top: 0; background: #fff; border-radius: 0 0 14px 14px; padding: 12px; }
.chat-input input { flex: 1; border: 1px solid var(--line); border-radius: 9px; padding: 10px 12px; font-size: 12px; outline: none; }
.chat-input button { width: 38px; border: 0; border-radius: 9px; background: var(--navy); color: #fff; display: grid; place-items: center; cursor: pointer; }
.typing { display: flex; gap: 4px; align-items: center; }
.typing span { width: 6px; height: 6px; border-radius: 50%; background: #929b8e; animation: bounce 1s infinite; }
.typing span:nth-child(2) { animation-delay: .15s; }
.typing span:nth-child(3) { animation-delay: .3s; }
@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

.side { border-left: 1px solid var(--line); padding: 24px 18px; }
.side-card { background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 18px; margin-bottom: 16px; }
.side-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.side-head h3 { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--navy); margin: 0; }
.side-tag { font-size: 8px; font-weight: 700; letter-spacing: .1em; color: #929b8e; }
.timer-ring { position: relative; width: 150px; height: 150px; margin: 0 auto 14px; }
.timer-ring svg { width: 100%; height: 100%; }
.ring-progress { transition: stroke-dashoffset .3s ease; }
.timer-label { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.timer-label strong { font-size: 26px; font-family: 'Inter', monospace; color: var(--navy); }
.timer-label span { font-size: 8px; font-weight: 700; letter-spacing: .12em; margin-top: 3px; }
.timer-controls { display: flex; justify-content: center; gap: 8px; }
.timer-main { border: 0; background: var(--color-primary); color: #fff; padding: 8px 22px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; }
.timer-main.pause { background: var(--color-accent); }
.timer-icon { width: 32px; border: 1px solid var(--line); background: #fff; border-radius: 8px; color: #718074; display: grid; place-items: center; cursor: pointer; }
.presets { display: flex; gap: 6px; margin-top: 14px; }
.presets button { flex: 1; border: 1px solid var(--line); background: #faf7ef; color: #718074; border-radius: 7px; padding: 6px; font-size: 10px; font-weight: 600; cursor: pointer; }
.presets button.active { background: var(--navy); color: #fff; border-color: var(--navy); }
.goal-list { display: grid; gap: 8px; }
.goal-row { display: flex; align-items: center; gap: 8px; }
.goal-check { width: 14px; height: 14px; accent-color: #3F8F6B; cursor: pointer; }
.goal-text { flex: 1; font-size: 11px; color: #4c5b50; cursor: pointer; }
.goal-text.done { text-decoration: line-through; color: #929b8e; }
.goal-edit { flex: 1; min-width: 0; border: 1px solid var(--gold); border-radius: 5px; padding: 3px 5px; font-size: 11px; outline: none; }
.goal-del { border: 0; background: transparent; color: #929b8e; cursor: pointer; opacity: 0; }
.goal-row:hover .goal-del { opacity: 1; }
.goal-add { display: flex; gap: 6px; margin-top: 8px; }
.goal-add input { flex: 1; min-width: 0; border: 1px solid var(--line); border-radius: 7px; padding: 7px 9px; font-size: 11px; outline: none; }
.goal-add button { width: 30px; border: 0; border-radius: 7px; background: var(--navy); color: #fff; display: grid; place-items: center; cursor: pointer; }
.side-tip { display: flex; gap: 9px; background: #faf7ef; border-radius: 11px; padding: 13px; color: #7d4a36; }
.side-tip p { font-size: 10px; line-height: 1.5; margin: 0; color: #7d4a36; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: all .2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-6px); }

.mobile-nav { display: none; }
@media (max-width: 1180px) { .hub { grid-template-columns: 200px minmax(0, 1fr); } .side { display: none; } }
@media (max-width: 780px) {
  .hub { grid-template-columns: 1fr; } .rail { display: none; }
  .mobile-nav { display: flex; gap: 4px; overflow-x: auto; padding: 10px 16px; border-bottom: 1px solid var(--line); background: #fff; }
  .mobile-nav button { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; padding: 8px 12px; border: 1px solid var(--line); border-radius: 99px; background: #fff; color: #4c5b50; font-size: 11px; font-weight: 600; cursor: pointer; }
  .mobile-nav button.active { background: var(--navy); color: #fff; border-color: var(--navy); }
  .scroll { padding: 22px 16px 50px; } .notes-layout { grid-template-columns: 1fr; } .hero h1 { font-size: 30px; }
}
@media (max-width: 560px) {
  .options-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .library-tools, .folder-create { align-items: stretch; }
  .folder-create { width: 100%; }
  .folder-create input { flex: 1; width: auto; min-width: 0; }
  .pack-title-row, .audio-hero { align-items: flex-start; flex-direction: column; }
  .pack-actions { flex-wrap: wrap; }
  .note-sheet { padding: 18px; }
  .note-toolbar { flex-direction: column; }
  .note-actions { width: 100%; }
  .note-actions > * { flex: 1; justify-content: center; }
  .podcast-options { align-items: stretch; flex-direction: column; }
  .podcast-options label { min-width: 0; }
  .podcast-options .primary-btn { margin-left: 0; justify-content: center; }
  .fill-answer { flex-direction: column; }
}
</style>
