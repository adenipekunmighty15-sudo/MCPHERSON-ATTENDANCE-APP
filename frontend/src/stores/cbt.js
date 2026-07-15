import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MOCK_SUBJECTS = [
  { id: 'gst101', code: 'GST 101', name: 'Use of English', icon: 'BookOpen', color: '#0066FF', questionCount: 40, duration: 20 },
  { id: 'gst102', code: 'GST 102', name: 'Philosophy & Logic', icon: 'Brain', color: '#7C3AED', questionCount: 30, duration: 15 },
  { id: 'gst103', code: 'GST 103', name: 'Nigerian People & Culture', icon: 'Globe', color: '#059669', questionCount: 30, duration: 15 },
  { id: 'csc201', code: 'CSC 201', name: 'Computer Programming I', icon: 'Code2', color: '#DC2626', questionCount: 35, duration: 20 },
  { id: 'csc203', code: 'CSC 203', name: 'Data Structures', icon: 'GitBranch', color: '#D97706', questionCount: 30, duration: 20 },
  { id: 'mth201', code: 'MTH 201', name: 'Linear Algebra', icon: 'Sigma', color: '#0891B2', questionCount: 25, duration: 15 },
  { id: 'mth202', code: 'MTH 202', name: 'Calculus II', icon: 'FunctionSquare', color: '#DB2777', questionCount: 25, duration: 15 },
  { id: 'phy201', code: 'PHY 201', name: 'Physics II', icon: 'Atom', color: '#65A30D', questionCount: 30, duration: 20 },
  { id: 'bus201', code: 'BUS 201', name: 'Principles of Management', icon: 'Briefcase', color: '#0D9488', questionCount: 35, duration: 20 },
  { id: 'acc201', code: 'ACC 201', name: 'Financial Accounting I', icon: 'Calculator', color: '#0066FF', questionCount: 30, duration: 20 },
]

const MOCK_QUESTIONS = {
  gst101: [
    { id: 'gst101_1', question: 'Choose the correct spelling:', options: ['Accommodation', 'Acommodation', 'Accomodation', 'Acomodation'], answer: 0, explanation: '"Accommodation" has two c\'s and two m\'s.' },
    { id: 'gst101_2', question: 'The word "ubiquitous" means:', options: ['Rare', 'Present everywhere', 'Invisible', 'Temporary'], answer: 1, explanation: 'Ubiquitous means found or present everywhere.' },
    { id: 'gst101_3', question: 'Identify the correct sentence:', options: ['She don\'t like coffee.', 'She doesn\'t likes coffee.', 'She doesn\'t like coffee.', 'She don\'t likes coffee.'], answer: 2, explanation: 'With third-person singular, use "doesn\'t" + base verb.' },
    { id: 'gst101_4', question: 'A synonym for "benevolent" is:', options: ['Cruel', 'Kind', 'Weak', 'Angry'], answer: 1, explanation: 'Benevolent means well-meaning, kind, or generous.' },
    { id: 'gst101_5', question: 'Which is a compound sentence?', options: ['I went home.', 'I went home because I was tired.', 'I was tired, so I went home.', 'Being tired, I went home.'], answer: 2, explanation: 'A compound sentence joins two independent clauses with a conjunction.' },
    { id: 'gst101_6', question: 'The antonym of "ephemeral" is:', options: ['Fleeting', 'Permanent', 'Brief', 'Momentary'], answer: 1, explanation: 'Ephemeral means short-lived; permanent is its opposite.' },
    { id: 'gst101_7', question: 'Choose the correct preposition: "He is good ___ mathematics."', options: ['in', 'at', 'on', 'with'], answer: 1, explanation: '"Good at" is the correct collocation for skills.' },
    { id: 'gst101_8', question: 'The noun form of "strong" is:', options: ['Strongness', 'Strongth', 'Strength', 'Strongity'], answer: 2, explanation: 'The correct noun form of strong is strength.' },
    { id: 'gst101_9', question: '"The quick brown fox jumps over the lazy dog" contains:', options: ['All vowels', 'All consonants only', 'Every letter of the alphabet', 'No repeated letters'], answer: 2, explanation: 'This pangram contains every letter of the English alphabet.' },
    { id: 'gst101_10', question: 'Which is a correctly punctuated sentence?', options: ['What time is it?', 'What time is it.', 'What time is it!', 'What time is it,'], answer: 0, explanation: 'A direct question ends with a question mark.' },
  ],
  gst102: [
    { id: 'gst102_1', question: '"I think, therefore I am" was stated by:', options: ['Plato', 'Aristotle', 'Descartes', 'Socrates'], answer: 2, explanation: 'René Descartes famously stated "Cogito, ergo sum" (I think, therefore I am).' },
    { id: 'gst102_2', question: 'The study of the nature of reality is called:', options: ['Epistemology', 'Metaphysics', 'Ethics', 'Logic'], answer: 1, explanation: 'Metaphysics deals with the fundamental nature of reality.' },
    { id: 'gst102_3', question: 'If all men are mortal and Socrates is a man, then Socrates is mortal. This is an example of:', options: ['Inductive reasoning', 'Deductive reasoning', 'Abductive reasoning', 'Fallacy'], answer: 1, explanation: 'Deductive reasoning moves from general premises to a specific conclusion.' },
    { id: 'gst102_4', question: 'The branch of philosophy concerned with moral principles is:', options: ['Aesthetics', 'Epistemology', 'Ethics', 'Logic'], answer: 2, explanation: 'Ethics (moral philosophy) deals with concepts of right and wrong.' },
    { id: 'gst102_5', question: 'The Socratic method is primarily based on:', options: ['Lectures', 'Question and answer dialogue', 'Written essays', 'Experiments'], answer: 1, explanation: 'Socrates used dialectical questioning to arrive at truth.' },
    { id: 'gst102_6', question: 'A valid argument with true premises is called:', options: ['Sound', 'Strong', 'Cogent', 'Valid'], answer: 0, explanation: 'A sound argument is valid and has all true premises.' },
    { id: 'gst102_7', question: '"The unexamined life is not worth living" is attributed to:', options: ['Plato', 'Socrates', 'Aristotle', 'Confucius'], answer: 1, explanation: 'Socrates said this during his trial, as recorded in Plato\'s Apology.' },
    { id: 'gst102_8', question: 'The law of non-contradiction states:', options: ['Something cannot both be and not be at the same time', 'Everything that happens has a cause', 'A thing is identical to itself', 'Either a proposition is true or its negation is true'], answer: 0, explanation: 'The law of non-contradiction: A cannot be both A and not-A simultaneously.' },
  ],
  csc201: [
    { id: 'csc201_1', question: 'Which of the following is NOT a valid variable name in Python?', options: ['my_var', '_var', '2var', 'var2'], answer: 2, explanation: 'Variable names cannot start with a digit.' },
    { id: 'csc201_2', question: 'What does the expression 5 // 2 evaluate to in Python?', options: ['2.5', '2', '2.0', '1'], answer: 1, explanation: '// is floor division, giving 2 (integer result).' },
    { id: 'csc201_3', question: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Array', 'Linked List'], answer: 1, explanation: 'Stack follows Last-In-First-Out (LIFO).' },
    { id: 'csc201_4', question: 'Time complexity of accessing an element in an array by index is:', options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], answer: 0, explanation: 'Array access by index is constant time O(1).' },
    { id: 'csc201_5', question: 'In Python, which keyword is used to define a function?', options: ['func', 'define', 'def', 'function'], answer: 2, explanation: 'Python uses the "def" keyword to define functions.' },
    { id: 'csc201_6', question: 'What is the output of print(type([]))?', options: ['<class \'tuple\'>', '<class \'list\'>', '<class \'dict\'>', '<class \'array\'>'], answer: 1, explanation: '[] is an empty list in Python.' },
    { id: 'csc201_7', question: 'Which sorting algorithm has the best average-case time complexity?', options: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], answer: 2, explanation: 'Merge Sort runs in O(n log n) on average, better than O(n²) of Bubble/Selection/Insertion.' },
    { id: 'csc201_8', question: 'In object-oriented programming, what is encapsulation?', options: ['Inheriting from a parent class', 'Hiding internal data and methods', 'Creating multiple instances', 'Overriding methods'], answer: 1, explanation: 'Encapsulation binds data and methods together, hiding internal state.' },
  ],
  csc203: [
    { id: 'csc203_1', question: 'A linked list node contains:', options: ['Only data', 'Only pointer', 'Data and pointer', 'Index and data'], answer: 2, explanation: 'A linked list node stores data and a pointer/reference to the next node.' },
    { id: 'csc203_2', question: 'Which tree property ensures O(log n) search in a BST?', options: ['Height', 'Number of nodes', 'Balance', 'Depth of root'], answer: 2, explanation: 'A balanced BST guarantees O(log n) search time.' },
    { id: 'csc203_3', question: 'Hash table collision resolution method using linked lists is called:', options: ['Linear probing', 'Quadratic probing', 'Chaining', 'Double hashing'], answer: 2, explanation: 'Chaining uses linked lists at each bucket to handle collisions.' },
    { id: 'csc203_4', question: 'The worst-case time complexity of quicksort is:', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], answer: 2, explanation: 'Quicksort has O(n²) worst case (e.g., already sorted array with poor pivot choice).' },
  ],
  mth201: [
    { id: 'mth201_1', question: 'The determinant of a 2×2 matrix [[a,b],[c,d]] is:', options: ['ad + bc', 'ad - bc', 'ab - cd', 'ac - bd'], answer: 1, explanation: 'Determinant of [[a,b],[c,d]] = ad - bc.' },
    { id: 'mth201_2', question: 'A matrix with the same number of rows and columns is called:', options: ['Identity matrix', 'Square matrix', 'Diagonal matrix', 'Zero matrix'], answer: 1, explanation: 'A square matrix has equal numbers of rows and columns.' },
    { id: 'mth201_3', question: 'If v = [1,2] and w = [3,4], the dot product v · w is:', options: ['10', '11', '12', '13'], answer: 1, explanation: 'v·w = 1×3 + 2×4 = 3 + 8 = 11.' },
    { id: 'mth201_4', question: 'The rank of a matrix is the:', options: ['Number of rows', 'Number of columns', 'Number of linearly independent rows or columns', 'Determinant'], answer: 2, explanation: 'Rank is the dimension of the vector space spanned by its rows or columns.' },
  ],
  mth202: [
    { id: 'mth202_1', question: 'The derivative of x² is:', options: ['x', '2x', '2', 'x²'], answer: 1, explanation: 'd/dx(x²) = 2x by the power rule.' },
    { id: 'mth202_2', question: '∫ 2x dx =', options: ['x² + C', 'x²', '2x² + C', 'x + C'], answer: 0, explanation: '∫ 2x dx = x² + C' },
    { id: 'mth202_3', question: 'The limit of 1/x as x approaches infinity is:', options: ['0', '1', 'Infinity', 'Undefined'], answer: 0, explanation: 'As x → ∞, 1/x → 0.' },
    { id: 'mth202_4', question: 'The chain rule is used to differentiate:', options: ['Product of functions', 'Composite functions', 'Sum of functions', 'Quotient of functions'], answer: 1, explanation: 'The chain rule differentiates composite functions f(g(x)).' },
  ],
  phy201: [
    { id: 'phy201_1', question: 'Newton\'s second law states F =', options: ['mv', 'ma', 'm/v', 'v/m'], answer: 1, explanation: 'F = ma (force = mass × acceleration).' },
    { id: 'phy201_2', question: 'The SI unit of electric current is:', options: ['Volt', 'Ohm', 'Ampere', 'Watt'], answer: 2, explanation: 'The ampere (A) is the SI unit of electric current.' },
    { id: 'phy201_3', question: 'The speed of light in vacuum is approximately:', options: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '3 × 10⁴ m/s'], answer: 1, explanation: 'c ≈ 3 × 10⁸ m/s (300,000 km/s).' },
  ],
  bus201: [
    { id: 'bus201_1', question: 'The father of modern management theory is:', options: ['Adam Smith', 'Henry Fayol', 'Peter Drucker', 'Frederick Taylor'], answer: 2, explanation: 'Peter Drucker is widely regarded as the father of modern management.' },
    { id: 'bus201_2', question: 'SWOT analysis stands for:', options: ['Strengths, Weaknesses, Opportunities, Threats', 'Strategy, Work, Objectives, Tactics', 'System, Workflow, Operations, Technology', 'Structure, Workforce, Objectives, Targets'], answer: 0, explanation: 'SWOT = Strengths, Weaknesses, Opportunities, Threats.' },
    { id: 'bus201_3', question: 'Management by Objectives (MBO) was introduced by:', options: ['Henry Fayol', 'Peter Drucker', 'Max Weber', 'Elton Mayo'], answer: 1, explanation: 'Peter Drucker introduced MBO in his 1954 book The Practice of Management.' },
  ],
  acc201: [
    { id: 'acc201_1', question: 'The accounting equation is:', options: ['Assets = Liabilities + Equity', 'Assets + Liabilities = Equity', 'Assets = Liabilities - Equity', 'Assets + Equity = Liabilities'], answer: 0, explanation: 'Assets = Liabilities + Owner\'s Equity is the fundamental accounting equation.' },
    { id: 'acc201_2', question: 'Double-entry bookkeeping means:', options: ['Each entry is recorded twice', 'Every transaction affects at least two accounts', 'Two people must approve each entry', 'Entries are made in two different books'], answer: 1, explanation: 'Double-entry means each transaction has equal debits and credits in at least two accounts.' },
    { id: 'acc201_3', question: 'Depreciation is the:', options: ['Increase in asset value', 'Allocation of asset cost over useful life', 'Market value of an asset', 'Sale price of an asset'], answer: 1, explanation: 'Depreciation systematically allocates the cost of a tangible asset over its useful life.' },
  ],
}

const STORAGE_KEY = 'mcu_cbt_attempts'

function loadAttempts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveAttempts(attempts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts))
}

export const useCbtStore = defineStore('cbt', () => {
  const attempts = ref(loadAttempts())
  const subjects = ref(MOCK_SUBJECTS)
  const questions = ref(MOCK_QUESTIONS)
  const currentSubjectId = ref(null)
  const currentQuestions = ref([])
  const currentAnswers = ref({})
  const timeRemaining = ref(0)
  const examActive = ref(false)
  const examFinished = ref(false)
  const examResult = ref(null)
  let timerInterval = null

  const stats = computed(() => {
    const total = attempts.value.length
    if (!total) return { totalAttempts: 0, totalQuestions: 0, totalCorrect: 0, accuracy: 0, bestScore: 0, bestSubject: null }
    const totalQ = attempts.value.reduce((s, a) => s + a.total, 0)
    const totalC = attempts.value.reduce((s, a) => s + a.score, 0)
    const best = attempts.value.reduce((b, a) => a.score > (b?.score || 0) ? a : b, null)
    return {
      totalAttempts: total,
      totalQuestions: totalQ,
      totalCorrect: totalC,
      accuracy: totalQ ? Math.round((totalC / totalQ) * 100) : 0,
      bestScore: best?.score || 0,
      bestSubject: best ? subjects.value.find(s => s.id === best.subjectId)?.code : null,
    }
  })

  const subjectAttempts = computed(() => {
    const grouped = {}
    attempts.value.forEach(a => {
      const subj = subjects.value.find(s => s.id === a.subjectId)
      const key = subj?.code || a.subjectId
      if (!grouped[key]) grouped[key] = { subjectCode: key, subjectName: subj?.name || key, count: 0, total: 0, correct: 0 }
      grouped[key].count++
      grouped[key].total += a.total
      grouped[key].correct += a.score
    })
    return Object.values(grouped).map(g => ({ ...g, accuracy: g.total ? Math.round((g.correct / g.total) * 100) : 0 }))
  })

  function startExam(subjectId, count) {
    const pool = questions.value[subjectId] || []
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const selected = shuffled.slice(0, Math.min(count, pool.length))
    const subject = subjects.value.find(s => s.id === subjectId)
    currentSubjectId.value = subjectId
    currentQuestions.value = selected
    currentAnswers.value = {}
    timeRemaining.value = (subject?.duration || 20) * 60
    examActive.value = true
    examFinished.value = false
    examResult.value = null
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (timeRemaining.value > 0) { timeRemaining.value-- }
      else { submitExam() }
    }, 1000)
  }

  function submitExam() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    examActive.value = false
    examFinished.value = true
    let score = 0
    const details = currentQuestions.value.map((q, i) => {
      const selected = currentAnswers.value[i]
      const correct = selected === q.answer
      if (correct) score++
      return { questionId: q.id, question: q.question, options: q.options, correct: q.answer, selected, isCorrect: correct, explanation: q.explanation }
    })
    examResult.value = { score, total: currentQuestions.value.length, subjectId: currentSubjectId.value, details, date: new Date().toISOString(), timeTaken: null }
    const record = { subjectId: currentSubjectId.value, score, total: currentQuestions.value.length, date: new Date().toISOString() }
    attempts.value.push(record)
    saveAttempts(attempts.value)
  }

  function cancelExam() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
    examActive.value = false
    examFinished.value = false
    currentQuestions.value = []
    currentAnswers.value = {}
    examResult.value = null
    currentSubjectId.value = null
  }

  function clearHistory() {
    attempts.value = []
    saveAttempts(attempts.value)
  }

  return {
    subjects, questions, attempts, currentSubjectId, currentQuestions, currentAnswers,
    timeRemaining, examActive, examFinished, examResult, stats, subjectAttempts,
    startExam, submitExam, cancelExam, clearHistory,
  }
})
