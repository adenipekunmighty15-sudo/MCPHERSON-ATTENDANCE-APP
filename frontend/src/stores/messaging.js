import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'mcu_messages'

const FACULTIES = [
  { id: 'sci-tech', name: 'Science & Technology', departments: ['Computer Science', 'Mathematics', 'Physics'] },
  { id: 'arts', name: 'Arts & Humanities', departments: ['English', 'History & International Studies'] },
  { id: 'business', name: 'Business & Economics', departments: ['Business Administration', 'Accounting', 'Economics'] },
]

const COURSES_BY_DEPT = {
  'Computer Science': ['CSC 201', 'CSC 203', 'CSC 205', 'CSC 301'],
  'Mathematics': ['MTH 201', 'MTH 203', 'MTH 301'],
  'Physics': ['PHY 201', 'PHY 203', 'PHY 301'],
  'English': ['ENG 201', 'ENG 203', 'ENG 301'],
  'History & International Studies': ['HIS 201', 'HIS 203', 'HIS 301'],
  'Business Administration': ['BUS 201', 'BUS 203', 'BUS 301'],
  'Accounting': ['ACC 201', 'ACC 203', 'ACC 301'],
  'Economics': ['ECO 201', 'ECO 203', 'ECO 301'],
}

const NAMES = [
  { name: 'Amara Okafor', dept: 'Computer Science' },
  { name: 'Chidi Eze', dept: 'Computer Science' },
  { name: 'Folake Adeyemi', dept: 'Computer Science' },
  { name: 'Ibrahim Bello', dept: 'Computer Science' },
  { name: 'Ngozi Okonkwo', dept: 'Computer Science' },
  { name: 'Tunde Balogun', dept: 'Computer Science' },
  { name: 'Zainab Yusuf', dept: 'Computer Science' },
  { name: 'Kofi Mensah', dept: 'Computer Science' },
  { name: 'Adaobi Nwosu', dept: 'Mathematics' },
  { name: 'Emeka Okafor', dept: 'Mathematics' },
  { name: 'Funmi Alabi', dept: 'Mathematics' },
  { name: 'Segun Adegoke', dept: 'Physics' },
  { name: 'Titi Adeleke', dept: 'Physics' },
  { name: 'Yemi Ogunbiyi', dept: 'Physics' },
  { name: 'Aisha Mohammed', dept: 'English' },
  { name: 'Chinwe Okafor', dept: 'English' },
  { name: 'Dapo Ogunlade', dept: 'History & International Studies' },
  { name: 'Efe Omorogbe', dept: 'Business Administration' },
  { name: 'Gloria Okoro', dept: 'Business Administration' },
  { name: 'Halima Abubakar', dept: 'Accounting' },
  { name: 'Ifeanyi Uche', dept: 'Accounting' },
  { name: 'Jide Ogunleye', dept: 'Economics' },
  { name: 'Lola Ogunlesi', dept: 'Economics' },
  { name: 'Dr. Adebayo', dept: 'Computer Science', role: 'lecturer' },
  { name: 'Prof. Okonkwo', dept: 'Mathematics', role: 'lecturer' },
]

const MSG_TEMPLATES = {
  'Computer Science': [
    'Hey, did you check the CSC 201 assignment?',
    'Yeah, the deadline is next Friday. Have you started?',
    'Working on it now. The recursion problems are tricky.',
    'I can help if you\'re stuck on question 3.',
    'That would be great! Want to meet at the library?',
    'Sure, see you at 2pm by CS lab 3.',
    'Perfect. I\'ll bring my laptop.',
    'Don\'t forget to submit the group project proposal too.',
    'Already submitted it this morning!',
    'The professor said our topic was the best in class 🎉',
    'New lecture slides are up on the portal.',
    'Did you see the email about the hackathon?',
    'We should form a team. I know Python and React.',
    'Count me in! Let\'s ask Chidi too.',
    'The lab this week is on machine learning basics.',
    'I\'m really enjoying this course. The prof is great.',
    'Same here. Best class this semester.',
  ],
  'general': [
    'Hi! How are you doing?',
    'Great, thanks! How about you?',
    'Doing well! Ready for the exams?',
    'Almost, still have some studying to do.',
    'Same here. We should form a study group.',
    'Good idea! What subjects are you focusing on?',
    'Mostly the core courses. You?',
    'Same. Let\'s plan a session this weekend.',
    'Sounds good. I know a quiet spot in the library.',
    'Perfect. See you there! 👋',
  ],
  'lecturer': [
    'Good morning, class. Please review chapters 5-7 for next week\'s test.',
    'The test will cover all material from chapters 3-7. Start preparing early.',
    'Office hours this week: Tuesday 2-4pm and Thursday 10-12pm.',
    'Excellent question in class today! Here are some additional resources...',
    'Reminder: Project submissions are due by midnight on Friday.',
  ],
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomTime(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(Math.floor(Math.random() * 14) + 8, Math.floor(Math.random() * 60))
  return d.toISOString()
}

function generateContacts() {
  let contacts = []
  let idx = 0
  for (const person of NAMES) {
    idx++
    const faculty = FACULTIES.find(f => f.departments.includes(person.dept))
    const contact = {
      id: `usr_${idx}`,
      name: person.name,
      department: person.dept,
      faculty: faculty?.name || 'Science & Technology',
      facultyId: faculty?.id || 'sci-tech',
      year: person.role === 'lecturer' ? null : Math.floor(Math.random() * 4) + 1,
      avatar: null,
      online: Math.random() > 0.5,
      lastSeen: randomTime(Math.random() * 2),
      role: person.role || 'student',
      courses: COURSES_BY_DEPT[person.dept]?.slice(0, Math.floor(Math.random() * 3) + 2) || [],
    }
    contacts.push(contact)
  }
  return contacts
}

function generateConversations(contacts) {
  const auth = useAuthStore()
  const currentDept = auth.user?.department || 'Computer Science'
  const convs = []
  const msgs = {}
  let convIdx = 0

  const sameDept = contacts.filter(c => c.department === currentDept && c.role === 'student')
  const sameFaculty = contacts.filter(c => c.facultyId === FACULTIES.find(f => f.departments.includes(currentDept))?.id && c.department !== currentDept && c.role === 'student')
  const otherDepts = contacts.filter(c => c.role === 'student' && c.department !== currentDept && c.facultyId !== FACULTIES.find(f => f.departments.includes(currentDept))?.id)
  const lecturers = contacts.filter(c => c.role === 'lecturer')

  const allStudents = [...sameDept, ...sameFaculty, ...otherDepts]

  for (let i = 0; i < Math.min(5, sameDept.length); i++) {
    convIdx++
    const contact = sameDept[i]
    const convId = `conv_${convIdx}`
    const msgCount = Math.floor(Math.random() * 6) + 3
    const msgList = []
    const templates = MSG_TEMPLATES['Computer Science']
    for (let j = 0; j < msgCount; j++) {
      const isMe = j % 2 === 0
      msgList.push({
        id: `msg_${convIdx}_${j}`,
        conversationId: convId,
        senderId: isMe ? 'me' : contact.id,
        content: j < templates.length ? templates[j] : pickRandom(MSG_TEMPLATES['general']),
        type: 'text',
        timestamp: randomTime(Math.max(0, msgCount - 1 - j)),
        status: isMe ? (j === msgCount - 1 ? 'read' : 'read') : 'delivered',
        reactions: j === 0 ? { '❤️': [contact.id] } : {},
        replyTo: null,
      })
    }
    msgs[convId] = msgList
    convs.push({
      id: convId,
      participants: [contact.id],
      type: 'individual',
      groupName: null,
      lastMessage: msgList[msgList.length - 1],
      unreadCount: Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0,
      pinned: Math.random() > 0.8,
      updatedAt: msgList[msgList.length - 1].timestamp,
    })
  }

  for (let i = 0; i < Math.min(2, sameFaculty.length); i++) {
    convIdx++
    const contact = sameFaculty[i]
    const convId = `conv_${convIdx}`
    const msgCount = Math.floor(Math.random() * 4) + 2
    const msgList = []
    for (let j = 0; j < msgCount; j++) {
      const isMe = j % 2 === 0
      msgList.push({
        id: `msg_${convIdx}_${j}`,
        conversationId: convId,
        senderId: isMe ? 'me' : contact.id,
        content: pickRandom(MSG_TEMPLATES['general']),
        type: 'text',
        timestamp: randomTime(Math.max(0, msgCount - 1 - j)),
        status: isMe ? 'read' : 'delivered',
        reactions: {},
        replyTo: null,
      })
    }
    msgs[convId] = msgList
    convs.push({
      id: convId,
      participants: [contact.id],
      type: 'individual',
      groupName: null,
      lastMessage: msgList[msgList.length - 1],
      unreadCount: 0,
      pinned: false,
      updatedAt: msgList[msgList.length - 1].timestamp,
    })
  }

  if (lecturers.length > 0) {
    convIdx++
    const lec = lecturers[0]
    const convId = `conv_${convIdx}`
    const msgList = [
      {
        id: `msg_${convIdx}_0`,
        conversationId: convId,
        senderId: lec.id,
        content: 'Good morning, class. Please review chapters 5-7 for next week\'s test.',
        type: 'text',
        timestamp: randomTime(3),
        status: 'delivered',
        reactions: {},
        replyTo: null,
      },
      {
        id: `msg_${convIdx}_1`,
        conversationId: convId,
        senderId: lec.id,
        content: 'Office hours this week: Tuesday 2-4pm and Thursday 10-12pm.',
        type: 'text',
        timestamp: randomTime(2),
        status: 'delivered',
        reactions: {},
        replyTo: null,
      },
    ]
    msgs[convId] = msgList
    convs.push({
      id: convId,
      participants: [lec.id],
      type: 'individual',
      groupName: null,
      lastMessage: msgList[msgList.length - 1],
      unreadCount: 1,
      pinned: true,
      updatedAt: msgList[msgList.length - 1].timestamp,
    })
  }

  const deptGroupId = `conv_dept_${currentDept.replace(/\s+/g, '_')}`
  const deptMembers = sameDept.map(c => c.id)
  const deptMsgs = [
    { id: `dmsg_0`, conversationId: deptGroupId, senderId: deptMembers[0] || '', content: 'Welcome to the Computer Science department group! 📚', type: 'system', timestamp: randomTime(7), status: 'delivered', reactions: {}, replyTo: null },
    { id: `dmsg_1`, conversationId: deptGroupId, senderId: deptMembers[1] || '', content: 'Has anyone started the group project yet?', type: 'text', timestamp: randomTime(5), status: 'delivered', reactions: { '🙋': [deptMembers[2]] }, replyTo: null },
    { id: `dmsg_2`, conversationId: deptGroupId, senderId: deptMembers[2] || '', content: 'I have! Let\'s coordinate this week.', type: 'text', timestamp: randomTime(4), status: 'delivered', reactions: {}, replyTo: 'dmsg_1' },
    { id: `dmsg_3`, conversationId: deptGroupId, senderId: deptMembers[3] || '', content: 'The hackathon registration is open until Friday!', type: 'text', timestamp: randomTime(1), status: 'delivered', reactions: { '🔥': [deptMembers[0], deptMembers[1]] }, replyTo: null },
  ]
  msgs[deptGroupId] = deptMsgs
  convs.push({
    id: deptGroupId,
    participants: deptMembers,
    type: 'group',
    groupName: `${currentDept} Department`,
    lastMessage: deptMsgs[deptMsgs.length - 1],
    unreadCount: 3,
    pinned: true,
    updatedAt: deptMsgs[deptMsgs.length - 1].timestamp,
  })

  convs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  return { conversations: convs, messages: msgs }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {}
}

export const useMessagingStore = defineStore('messaging', () => {
  const auth = useAuthStore()
  const contacts = ref([])
  const conversations = ref([])
  const messages = ref({})
  const activeConversationId = ref(null)
  const typingUsers = ref({})
  const loading = ref(true)
  const searchQuery = ref('')
  const filterMode = ref('all')

  const activeConversation = computed(() => {
    return conversations.value.find(c => c.id === activeConversationId.value) || null
  })

  const activeMessages = computed(() => {
    if (!activeConversationId.value) return []
    return messages.value[activeConversationId.value] || []
  })

  const contactMap = computed(() => {
    const map = {}
    for (const c of contacts.value) {
      map[c.id] = c
    }
    return map
  })

  const filteredConversations = computed(() => {
    let list = [...conversations.value]
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      list = list.filter(c => {
        if (c.type === 'group') return c.groupName?.toLowerCase().includes(q)
        const contact = contactMap.value[c.participants[0]]
        return contact?.name?.toLowerCase().includes(q) || contact?.department?.toLowerCase().includes(q)
      })
    }
    if (filterMode.value === 'department') {
      list = list.filter(c => {
        if (c.type === 'group') return c.groupName?.includes(auth.user?.department || '')
        const contact = contactMap.value[c.participants[0]]
        return contact?.department === auth.user?.department
      })
    }
    if (filterMode.value === 'faculty') {
      const userFacultyId = FACULTIES.find(f => f.departments.includes(auth.user?.department || ''))?.id
      list = list.filter(c => {
        if (c.type === 'group') return true
        const contact = contactMap.value[c.participants[0]]
        return contact?.facultyId === userFacultyId
      })
    }
    if (filterMode.value === 'courses') {
      list = list.filter(c => c.type === 'group' && c.groupName !== `${auth.user?.department} Department`)
    }
    return list
  })

  const unreadTotal = computed(() => {
    return conversations.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  })

  const contactsByGroup = computed(() => {
    const currentDept = auth.user?.department || ''
    const groups = []
    const sameDept = contacts.value.filter(c => c.department === currentDept && c.role === 'student' && !conversations.value.some(conv => conv.participants.includes(c.id) && conv.type === 'individual'))
    if (sameDept.length > 0) {
      groups.push({ label: `${currentDept} — Department`, contacts: sameDept })
    }
    const sameFaculty = contacts.value.filter(c => c.faculty === FACULTIES.find(f => f.departments.includes(currentDept))?.name && c.department !== currentDept && c.role === 'student' && !conversations.value.some(conv => conv.participants.includes(c.id) && conv.type === 'individual'))
    if (sameFaculty.length > 0) {
      groups.push({ label: 'Same Faculty', contacts: sameFaculty })
    }
    const lecturers = contacts.value.filter(c => c.role === 'lecturer' && !conversations.value.some(conv => conv.participants.includes(c.id) && conv.type === 'individual'))
    if (lecturers.length > 0) {
      groups.push({ label: 'Lecturers', contacts: lecturers })
    }
    const others = contacts.value.filter(c => {
      if (c.role !== 'student') return false
      if (c.department === currentDept) return false
      if (c.faculty === FACULTIES.find(f => f.departments.includes(currentDept))?.name) return false
      return !conversations.value.some(conv => conv.participants.includes(c.id) && conv.type === 'individual')
    })
    if (others.length > 0) {
      groups.push({ label: 'Other Departments', contacts: others })
    }
    return groups
  })

  function generateCourseGroups() {
    const currentDept = auth.user?.department || 'Computer Science'
    const courses = COURSES_BY_DEPT[currentDept] || []
    const deptContacts = contacts.value.filter(c => c.department === currentDept && c.role === 'student')
    for (const course of courses) {
      const cid = `conv_course_${course.replace(/\s+/g, '_')}`
      if (!conversations.value.some(c => c.id === cid)) {
        const members = deptContacts.slice(0, Math.min(6, deptContacts.length)).map(c => c.id)
        const msgList = [
          { id: `${cid}_welcome`, conversationId: cid, senderId: members[0] || '', content: `Welcome to the ${course} group! 📖`, type: 'system', timestamp: randomTime(10), status: 'delivered', reactions: {}, replyTo: null },
          { id: `${cid}_msg1`, conversationId: cid, senderId: members[1] || '', content: `Anyone doing the ${course} assignment?`, type: 'text', timestamp: randomTime(3), status: 'delivered', reactions: {}, replyTo: null },
        ]
        messages.value[cid] = msgList
        conversations.value.push({
          id: cid,
          participants: members,
          type: 'group',
          groupName: course,
          lastMessage: msgList[msgList.length - 1],
          unreadCount: Math.floor(Math.random() * 3),
          pinned: false,
          updatedAt: msgList[msgList.length - 1].timestamp,
        })
      }
    }
  }

  function init() {
    loading.value = true
    const saved = loadFromStorage()
    if (saved && saved.contacts && saved.conversations && saved.messages) {
      contacts.value = saved.contacts
      conversations.value = saved.conversations
      messages.value = saved.messages
      activeConversationId.value = saved.activeConversationId || null
    } else {
      contacts.value = generateContacts()
      const result = generateConversations(contacts.value)
      conversations.value = result.conversations
      messages.value = result.messages
      generateCourseGroups()
    }
    loading.value = false
  }

  function persist() {
    saveToStorage({
      contacts: contacts.value,
      conversations: conversations.value,
      messages: messages.value,
      activeConversationId: activeConversationId.value,
    })
  }

  function setActiveConversation(id) {
    activeConversationId.value = id
    const conv = conversations.value.find(c => c.id === id)
    if (conv) {
      conv.unreadCount = 0
    }
    persist()
  }

  function sendMessage(text, type = 'text') {
    if (!activeConversationId.value || !text.trim()) return
    const conv = conversations.value.find(c => c.id === activeConversationId.value)
    if (!conv) return
    const msgId = `msg_${Date.now()}`
    const msg = {
      id: msgId,
      conversationId: activeConversationId.value,
      senderId: 'me',
      content: text.trim(),
      type,
      timestamp: new Date().toISOString(),
      status: 'sent',
      reactions: {},
      replyTo: replyToId.value || null,
    }
    if (!messages.value[activeConversationId.value]) {
      messages.value[activeConversationId.value] = []
    }
    messages.value[activeConversationId.value].push(msg)
    conv.lastMessage = msg
    conv.updatedAt = msg.timestamp
    conversations.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    replyToId.value = null
    persist()
    simulateDelivery(msgId)
    simulateReply(conv, msg)
  }

  function simulateDelivery(msgId) {
    setTimeout(() => {
      const msg = findMessage(msgId)
      if (msg) msg.status = 'delivered'
      persist()
    }, 1000)
  }

  function simulateReply(conv, originalMsg) {
    if (conv.type === 'group') return
    const contact = contactMap.value[conv.participants[0]]
    if (!contact) return
    const isOnline = contact.online
    const delay = isOnline ? 3000 + Math.random() * 5000 : 20000 + Math.random() * 15000

    if (!typingUsers.value[conv.id]) typingUsers.value[conv.id] = []
    setTimeout(() => {
      if (activeConversationId.value === conv.id) {
        typingUsers.value[conv.id] = [contact.name]
      }
    }, delay * 0.6)

    setTimeout(() => {
      typingUsers.value[conv.id] = []
      const replies = MSG_TEMPLATES[contact.department] || MSG_TEMPLATES['general']
      const replyText = pickRandom(replies)
      const replyMsg = {
        id: `msg_${Date.now()}`,
        conversationId: conv.id,
        senderId: contact.id,
        content: replyText,
        type: 'text',
        timestamp: new Date().toISOString(),
        status: 'delivered',
        reactions: {},
        replyTo: originalMsg.id,
      }
      if (!messages.value[conv.id]) messages.value[conv.id] = []
      messages.value[conv.id].push(replyMsg)
      conv.lastMessage = replyMsg
      conv.updatedAt = replyMsg.timestamp
      if (conv.id !== activeConversationId.value) {
        conv.unreadCount = (conv.unreadCount || 0) + 1
      }
      messages.value[conv.id].forEach(m => {
        if (m.status === 'delivered') m.status = 'read'
      })
      conversations.value.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      persist()
    }, delay)
  }

  function findMessage(id) {
    for (const key in messages.value) {
      const found = messages.value[key].find(m => m.id === id)
      if (found) return found
    }
    return null
  }

  const replyToId = ref(null)
  const replyToMessage = computed(() => {
    if (!replyToId.value || !activeConversationId.value) return null
    const msgs = messages.value[activeConversationId.value] || []
    return msgs.find(m => m.id === replyToId.value) || null
  })

  function setReplyTo(id) {
    replyToId.value = id
  }

  function clearReplyTo() {
    replyToId.value = null
  }

  function toggleReaction(messageId, emoji) {
    for (const key in messages.value) {
      const msg = messages.value[key].find(m => m.id === messageId)
      if (msg) {
        if (!msg.reactions) msg.reactions = {}
        if (msg.reactions[emoji]) {
          const idx = msg.reactions[emoji].indexOf('me')
          if (idx > -1) {
            msg.reactions[emoji].splice(idx, 1)
            if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji]
          } else {
            msg.reactions[emoji].push('me')
          }
        } else {
          msg.reactions[emoji] = ['me']
        }
        persist()
        return
      }
    }
  }

  function startConversation(contactId) {
    const existing = conversations.value.find(c => c.type === 'individual' && c.participants.includes(contactId))
    if (existing) {
      setActiveConversation(existing.id)
      return existing.id
    }
    const convId = `conv_new_${Date.now()}`
    const contact = contactMap.value[contactId]
    const msgList = []
    messages.value[convId] = msgList
    conversations.value.unshift({
      id: convId,
      participants: [contactId],
      type: 'individual',
      groupName: null,
      lastMessage: null,
      unreadCount: 0,
      pinned: false,
      updatedAt: new Date().toISOString(),
    })
    setActiveConversation(convId)
    persist()
    return convId
  }

  function clearChat() {
    if (activeConversationId.value) {
      messages.value[activeConversationId.value] = []
      const conv = conversations.value.find(c => c.id === activeConversationId.value)
      if (conv) {
        conv.lastMessage = null
        conv.updatedAt = new Date().toISOString()
      }
      persist()
    }
  }

  function deleteChat(convId) {
    conversations.value = conversations.value.filter(c => c.id !== convId)
    delete messages.value[convId]
    if (activeConversationId.value === convId) {
      activeConversationId.value = null
    }
    persist()
  }

  function isTyping(convId) {
    const users = typingUsers.value[convId]
    return users && users.length > 0
  }

  function formatTime(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (mins < 1) return 'Now'
    if (mins < 60) return `${mins}m`
    if (hours < 24) return `${hours}h`
    if (days < 7) return `${days}d`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function formatTimestamp(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    const days = Math.floor(diff / 86400000)

    if (days === 0) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (days === 1) return 'Yesterday'
    if (days < 7) return d.toLocaleDateString('en-US', { weekday: 'long' })
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function getStatusIcon(status) {
    if (status === 'sent') return '✓'
    if (status === 'delivered') return '✓✓'
    if (status === 'read') return '✓✓'
    return '○'
  }

  function getStatusColor(status) {
    if (status === 'read') return 'var(--color-primary)'
    return 'var(--color-text-quaternary)'
  }

  return {
    contacts, conversations, messages, activeConversationId,
    typingUsers, loading, searchQuery, filterMode,
    activeConversation, activeMessages, contactMap,
    filteredConversations, unreadTotal, contactsByGroup,
    replyToId, replyToMessage,
    init, persist, setActiveConversation, sendMessage,
    toggleReaction, setReplyTo, clearReplyTo,
    startConversation, clearChat, deleteChat,
    isTyping, formatTime, formatTimestamp, getStatusIcon, getStatusColor,
  }
})
