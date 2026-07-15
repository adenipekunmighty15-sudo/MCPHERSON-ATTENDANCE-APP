# McPherson Attendance System — Complete Application Documentation

## 1. Overview

**McPherson Attendance** is a full-stack university management platform built for McPherson University. It handles attendance tracking (QR, NFC, geolocation, face verification), course/timetable management, a comprehensive AI-powered study hub with spaced repetition, real-time student chat, notifications, and role-based access control. The app is designed as a **monorepo** with a Node.js/Express backend and a Vue 3 + Vite frontend, styled with Tailwind CSS and DaisyUI, using Supabase (PostgreSQL) as the database.

---

## 2. Project Structure

```
mcpherson-attendance/
├── backend/
│   ├── server.js              # Express server entry point (~144 lines)
│   ├── src/
│   │   ├── config/            # AI configuration, database setup
│   │   ├── middleware/        # Auth middleware, rate limiting
│   │   ├── routes/            # Modular route handlers (auth, attendance, study, etc.)
│   │   ├── services/          # Business logic (AI service, storage, study packs)
│   │   └── migrations/        # Database migration scripts
│   ├── lib/                   # Database utilities, web search
│   ├── .env.example           # Environment variable template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── main.js            # Vue app entry point
│   │   ├── App.vue            # Root component (~45 lines)
│   │   ├── router/            # Vue Router config
│   │   ├── lib/
│   │   │   ├── api.js         # Axios HTTP client (+ token management)
│   │   │   ├── supabase.js    # Supabase client setup
│   │   │   └── departmentHelper.js  # Resolves dept codes to full names
│   │   ├── stores/             # Pinia stores (auth, mind, wallet, gamification, etc.)
│   │   ├── pages/
│   │   │   ├── Dashboard.vue          # Student/staff dashboard (~662 lines)
│   │   │   ├── Attendance.vue         # Attendance tracking & history
│   │   │   ├── Courses.vue            # Course management + enrollment
│   │   │   ├── Timetable.vue          # Class schedule + live sessions
│   │   │   ├── Profile.vue            # User profile & settings
│   │   │   ├── Chat.vue               # AI Council chat interface (~799 lines)
│   │   │   ├── Settings.vue           # User settings
│   │   │   ├── Login.vue              # Authentication
│   │   │   ├── Signup.vue             # Registration
│   │   │   ├── FaceRegistration.vue   # Face verification setup
│   │   │   ├── AdminDashboard.vue     # Admin console
│   │   │   └── NotFound.vue           # 404 page
│   │   ├── components/
│   │   │   ├── Layout.vue             # Main layout component
│   │   │   ├── LoadingScreen.vue      # Loading animation
│   │   │   ├── Toast.vue              # Notification toasts
│   │   │   ├── AiNavigator.vue        # AI assistant component
│   │   │   ├── CampusMind.vue         # Campus AI integration
│   │   │   ├── StudentIDCard.vue      # Digital student ID
│   │   │   └── [other UI components]
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── package.json
├── APP.md                      # This file
└── README.md                   # Original README
```

---

## 3. Database Schema (Supabase/PostgreSQL)

The database lives in `frontend/supabase-schema.sql` and defines **24 tables**:

### 3.1 Core Auth & Users
| Table | Purpose |
|-------|---------|
| `users` | Extends Supabase Auth with: name, role (student/lecturer/admin/super_admin), department, avatar, student_id, level, bio, phone, preferences (JSONB), settings (JSONB) |
| `departments` | Department definitions: code, name, description, head_of_department |

### 3.2 Attendance
| Table | Purpose |
|-------|---------|
| `attendance` | Core attendance records: user_id, course_id, course_name, status (present/absent/late/ooo), method (qr/manual/nfc/face), date, timestamp, location, session_id, location_lat, location_lng |
| `live_sessions` | Real-time class sessions: timetable_id, course_id, course_name, lecturer_id, venue_id, room, started_at, ended_at, status |
| `venues` | Room/venue GPS definitions: name, room_code, latitude, longitude, radius_meters (for geofencing) |

### 3.3 Courses & Scheduling
| Table | Purpose |
|-------|---------|
| `courses` | Course catalog: code, title, description, department, level, semester, credits, lecturer_id, lecturer_name, schedule |
| `enrollments` | Student → Course mapping |
| `timetable` | Scheduled classes: course_id, course_name, day_of_week, start_time, end_time, room, venue_id, lecturer_id, lecturer_name |
| `exam_timetable` | Exam schedule: course_id, course_name, date, start_time, end_time, venue, exam_type |

### 3.4 Study Hub (TurboLearn-inspired)
| Table | Purpose |
|-------|---------|
| `study_materials` | Study packs: title, summary, content (rich HTML), source_text, key_points (JSONB), flashcards (JSONB), quiz (JSONB), notes (HTML), folder_id, chat_history (JSONB), podcast_url, created_by |
| `study_folders` | Folder organization: name, color, icon, created_by |
| `flashcard_reviews` | SM-2 spaced repetition data: material_id, flashcard_id, user_id, ease_factor, interval_days, repetitions, next_review, last_reviewed |
| `study_sessions` | Session stats: material_id, user_id, session_type, score, total_questions, correct_answers, stats (JSONB) |

### 3.5 Communication
| Table | Purpose |
|-------|---------|
| `notifications` | Per-user notifications: type, title, message, data (JSONB), link, read |
| `general_chat_messages` | WhatsApp-style group chat: sender_id, message, file_url, file_type, file_name |
| `complaints` | User feedback/complaints: area, title, message, priority, status, admin_reply |
| `chat_conversations` | AI Q&A persistent conversations: title, model, context (JSONB) |
| `chat_messages` | Individual messages within AI conversations: conversation_id, role, content |

---

## 4. Backend Architecture

A modular Express server (~144 lines main entry point) running on port 5000.

### 4.1 Technology Stack
- **Runtime**: Node.js with ES modules (`import` syntax)
- **Framework**: Express.js
- **Database**: PostgreSQL via `pg` (direct SQL, no ORM)
- **Auth**: JWT via `jsonwebtoken` — middleware `authenticate` decodes Bearer token
- **File Upload**: Multer (memory storage with Supabase Storage integration)
- **AI**: Multi-provider support (OpenAI, Google Gemini, NVIDIA, Groq, etc.)
- **Rate Limiting**: `express-rate-limit` for API protection
- **Real-time**: Frontend uses Supabase Realtime directly

### 4.2 Modular Structure
- **`backend/src/config/`**: AI configuration, database setup
- **`backend/src/middleware/`**: Auth middleware, rate limiting
- **`backend/src/routes/`**: Modular route handlers (auth, attendance, study, chat, etc.)
- **`backend/src/services/`**: Business logic (AI service, storage service, study pack service)
- **`backend/src/migrations/`**: Database migration scripts
- **`backend/lib/`**: Database utilities, web search helpers

### 4.3 Middleware
- **`authenticate`**: Extracts JWT from `Authorization: Bearer <token>`, decodes with secret, attaches `req.user = { id, email, role, department }`
- **`rate limiting`**: Global limiter (200 req/15min) + AI-specific limiter (5 req/min)
- **`CORS`**: Allows configured origins from environment variable
- **`Body parsers`**: JSON + URL-encoded with compression

### 4.4 Key Design Patterns
- **Modular routing**: Separate route files for each domain (auth, attendance, study, etc.)
- **Service layer**: Business logic separated from route handlers
- **Direct SQL via `query()` helper**: `const { rows } = await query(sql, params)` — no query builder
- **UUID generation**: `randomUUID()` from Node.js `crypto`
- **AI model routing**: `getAiResponse(model, messages, opts)` → multi-provider support with fallback
- **Multi-model consensus ("AI Council")**: `aiChat(messages)` → spawns parallel AI calls with different personas, then synthesizes
- **Web search integration**: `webSearch()` + `fetchPage()` utilities for live data retrieval
- **AI Safe Mode**: Environment variable to bypass API calls during development

### 4.5 API Routes Summary

| Method | Route | Purpose |
|--------|-------|---------|
| **Auth** | | |
| POST | `/api/auth/register` | Register new user (inserts into `public.users`) |
| POST | `/api/auth/login` | Verify credentials, return JWT + user profile |
| GET | `/api/auth/profile` | Get current user profile |
| | | |
| **Users** | | |
| GET | `/api/users` | List users (admin/lecturer) |
| GET | `/api/users/:id` | Get specific user |
| PUT | `/api/users/:id` | Update user (admin) |
| GET | `/api/users/students/active` | Active students (has attendance in last 30 days) |
| | | |
| **Departments** | | |
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department (admin) |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |
| | | |
| **Courses** | | |
| GET | `/api/courses` | List courses (with enrollment status) |
| POST | `/api/courses` | Create course (admin) |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| POST | `/api/enroll` | Student enroll in course |
| DELETE | `/api/enroll/:courseId` | Unenroll from course |
| GET | `/api/enrollments/:courseId` | List students in course |
| | | |
| **Timetable** | | |
| GET | `/api/timetable` | Get user's timetable (courses enrolled + lecturer's courses) |
| GET | `/api/timetable/all` | Get all timetable entries (for admin) |
| POST | `/api/timetable` | Create/update timetable entry |
| DELETE | `/api/timetable/:id` | Delete timetable entry |
| | | |
| **Exams** | | |
| GET | `/api/exams` | User's exam timetable |
| GET | `/api/exams/all` | All exams (admin) |
| POST | `/api/exams` | Schedule exam (admin) |
| PUT | `/api/exams/:id` | Update exam |
| DELETE | `/api/exams/:id` | Delete exam |
| | | |
| **Attendance** | | |
| POST | `/api/attendance` | Check in (QR/manual/NFC/face + GPS geofence check) |
| GET | `/api/attendance` | User's attendance records |
| GET | `/api/attendance/today` | Today's attendance |
| | | |
| **Live Sessions** | | |
| GET | `/api/sessions/active` | List active sessions |
| POST | `/api/sessions/start` | Start a live session (lecturer) — auto-notifies department |
| POST | `/api/sessions/end/:id` | End a session |
| GET | `/api/sessions/:id/attendees` | List attendees of a session |
| | | |
| **Venues** | | |
| GET | `/api/venues` | List venues |
| POST | `/api/venues` | Create venue (lecturer+) |
| PUT | `/api/venues/:id` | Update venue |
| | | |
| **Study Materials (Study Hub)** | | |
| GET | `/api/study-materials` | List user's study packs |
| POST | `/api/study-materials` | Create study pack (from text/file/audio) |
| GET | `/api/study-materials/:id` | Get single pack |
| PUT | `/api/study-materials/:id` | Update pack (notes, folder, title, etc.) |
| DELETE | `/api/study-materials/:id` | Delete pack |
| POST | `/api/study-materials/generate` | AI-generate a full study pack from text/URL |
| POST | `/api/study-materials/:id/chat` | AI Q&A on a specific study pack |
| POST | `/api/study-materials/chat` | General AI chat (multi-model council) |
| POST | `/api/study-materials/:id/podcast` | Generate TTS podcast from summary |
| POST | `/api/study-materials/:id/flashcards/review` | Submit flashcard review (SM-2) |
| GET | `/api/study-materials/:id/flashcards/due` | Get due flashcards |
| GET | `/api/study-materials/:id/study-stream` | Get combined review data |
| | | |
| **Study Folders** | | |
| GET | `/api/study-folders` | List folders |
| POST | `/api/study-folders` | Create folder |
| PUT | `/api/study-folders/:id` | Update folder |
| DELETE | `/api/study-folders/:id` | Delete folder |
| PUT | `/api/study-materials/:id/folder` | Assign pack to folder |
| | | |
| **Study Sessions** | | |
| POST | `/api/study-sessions` | Save session stats |
| GET | `/api/study-sessions` | Get user's session history |
| | | |
| **Chat Conversations (AI)** | | |
| GET | `/api/chats` | List conversations |
| POST | `/api/chats` | Create conversation |
| PUT | `/api/chats/:id` | Rename conversation |
| DELETE | `/api/chats/:id` | Delete conversation |
| GET | `/api/chats/:id/messages` | Get messages |
| POST | `/api/chats/:id/messages` | Add message (auto-titles after first exchange) |
| | | |
| **General Chat** | | |
| GET | `/api/general-chat/messages` | Get messages (paginated, before cursor) |
| POST | `/api/general-chat/messages` | Send message (text OR file upload) — auto-reply Neural Assistant on mention |
| DELETE | `/api/general-chat/messages/:id` | Delete own message |
| | | |
| **Notifications** | | |
| GET | `/api/notifications` | List user's notifications |
| PUT | `/api/notifications/read-all` | Mark all read |
| PUT | `/api/notifications/:id/read` | Mark single read |
| POST | `/api/notifications/test` | Send test notification |
| | | |
| **Complaints** | | |
| GET | `/api/complaints` | List complaints (own or all if admin) |
| POST | `/api/complaints` | Submit complaint |
| PUT | `/api/complaints/:id/reply` | Admin reply |
| | | |
| **Reports & Insights** | | |
| GET | `/api/reports` | Attendance reports |
| GET | `/api/insights` | Analytics: course breakdown, at-risk students |
| GET | `/api/stats` | Dashboard summary stats |
| | | |
| **AI Extras** | | |
| GET | `/api/ai-brain/analysis` | Neural Core synthesis of user's data |
| POST | `/api/ai/web-search` | Web search utility |
| POST | `/api/ai/fetch-page` | Fetch & extract web page content |
| POST | `/api/generate-image` | DALL-E 3 image generation |
| POST | `/api/navigator/chat` | AI Navigator chat (separate from Study Hub) |
| POST | `/api/ai-tutor/chat` | AI Tutor chat |
| | | |
| **Static Files** | | |
| GET | `/uploads/*` | Serve uploaded files (images, audio) |

### 4.6 AI Architecture

The AI system uses a **multi-model consensus** architecture called the "McPherson AI Council":

1. **Multi-provider support**: OpenAI, Google Gemini, NVIDIA, Groq, and other providers
2. **Council Mode**: 3-4 parallel AI calls with different personas, then synthesis
3. **Fast Mode**: Single optimized model for quick responses
4. **Fallback chain**: Automatic provider failover for reliability
5. **Web search capability**: AI can request live web data by emitting `<web_search>query</web_search>` tags
6. **Safe Mode**: Development mode to bypass API calls and save costs
7. **Rate limiting**: 5 requests per minute on AI endpoints to control costs

---

## 5. Frontend Architecture

### 5.1 Technology Stack
- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build tool**: Vite
- **Routing**: Vue Router 4 (history mode)
- **State management**: Pinia (auth, mind, wallet, gamification, cbt, toast, loading stores)
- **HTTP client**: Axios (wrapped in `src/lib/api.js`)
- **CSS framework**: Tailwind CSS + custom CSS
- **Animation**: VueUse Motion, GSAP
- **Markdown rendering**: `marked` library
- **Syntax highlighting**: `highlight.js`
- **Icons**: Lucide Vue Next
- **PDF parsing**: `pdfjs-dist`
- **Face recognition**: @vladmandic/face-api
- **Chart visualization**: Chart.js + vue-chartjs
- **3D graphics**: Three.js
- **Audio recording**: Web Audio API + MediaRecorder
- **TTS**: Web Speech API

### 5.2 Route Structure
```
/                 → redirects to /dashboard
/dashboard        → Dashboard.vue
/attendance       → Attendance.vue
/courses          → Courses.vue
/timetable        → Timetable.vue
/profile          → Profile.vue
/settings         → Settings.vue
/chat             → Chat.vue (AI Council)
/face-registration → FaceRegistration.vue
/admin            → AdminDashboard.vue
/login            → Login.vue
/signup           → Signup.vue
/forgot-password  → ForgotPassword.vue
/:pathMatch(.*)*  → NotFound.vue
```

### 5.3 Key Frontend Features

#### Dashboard (`Dashboard.vue`)
- Animated gradient hero with live attendance stats
- Student ID card with holographic effects
- Course cards with enrollment counts
- Active live session cards with "Check-in" button
- Study streak counter, XP points, and level system
- Department-themed color scheme

#### Chat (`Chat.vue`)
- AI Council interface with multi-model deliberation
- Fast mode for quick responses
- Chat history management
- Markdown rendering with syntax highlighting
- Real-time response streaming
- Council mode toggle for comprehensive answers

#### Attendance (`Attendance.vue`)
- QR code scanning (camera-based or file upload)
- Manual check-in with course search
- NFC tap support (Web NFC API)
- Face verification (real-time video capture + verification)
- Auto-detection via geolocation proximity to venues
- Attendance history and analytics

#### Other Key Pages
- **Courses**: Course management, enrollment, instructor info
- **Timetable**: Weekly calendar grid, day view for mobile
- **Profile**: User profile, settings, preferences
- **Settings**: App configuration, theme toggle
- **Face Registration**: Face verification setup

#### Key Components
- **Layout.vue**: Main layout with navigation and structure
- **LoadingScreen.vue**: Animated loading screen
- **Toast.vue**: Notification system
- **AiNavigator.vue**: AI assistant component
- **CampusMind.vue**: Campus AI integration
- **StudentIDCard.vue**: Digital student ID with holographic effects

#### State Management (Pinia Stores)
- **auth.js**: User authentication and profile management
- **mind.js**: AI chat history and preferences
- **wallet.js**: Virtual wallet system
- **gamification.js**: XP, levels, and achievements
- **cbt.js**: Computer-based test functionality
- **toast.js**: Toast notification management
- **loading.js**: Loading state management

---

## 6. Security & Performance

### 6.1 Security Measures
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Global (200 req/15min) and AI-specific (5 req/min) limits
- **CORS Protection**: Configurable allowed origins
- **API Key Security**: Environment variable management with `.env.example`
- **SQL Injection Prevention**: Parameterized queries throughout
- **AI Safe Mode**: Development mode to bypass API calls

### 6.2 Performance Optimizations
- **Modular Architecture**: Separated concerns for better maintainability
- **Rate Limiting**: Prevents API abuse and controls costs
- **Database Connection Pooling**: Supabase transaction pooler
- **Static File Caching**: Proper cache headers for frontend assets
- **Compression**: Gzip compression enabled
- **Lazy Loading**: Vue Router lazy loading for pages

---

## 7. Development Setup

### 7.1 Prerequisites
- Node.js (v18+)
- PostgreSQL database (Supabase recommended)
- API keys for AI services (optional, see `.env.example`)

### 7.2 Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 7.3 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 7.4 Environment Variables
Key environment variables (see `.env.example` for complete list):
- `DATABASE_URL`: PostgreSQL connection string
- `AI_SAFE_MODE`: Set to `true` for development (bypasses AI APIs)
- `SUPABASE_SERVICE_KEY`: Supabase service role key
- Various AI API keys (OpenAI, Gemini, etc.)

---

## 8. Deployment Considerations

### 8.1 Production Checklist
- [ ] Set `AI_SAFE_MODE=false` in production
- [ ] Use strong, randomly generated secrets
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS
- [ ] Set up monitoring and logging
- [ ] Configure database backups
- [ ] Implement proper error tracking
- [ ] Use Supabase Storage instead of local file storage

### 8.2 Scaling Considerations
- Implement Redis caching for frequently accessed data
- Consider CDN for static assets
- Monitor AI API costs and adjust rate limits
- Normalize JSONB columns if performance degrades
- Implement horizontal scaling for backend

---

## 9. Future Enhancements

Potential areas for future development:
- Mobile app via Capacitor.js
- Enhanced testing framework
- Real-time notifications via WebSockets
- Advanced analytics dashboard
- Offline support via service workers
- Enhanced accessibility features
- Integration with university systems

---

## 10. Conclusion

The McPherson Attendance System represents a comprehensive university management platform with advanced features including:

- **Modern Architecture**: Modular backend with separated concerns, clean frontend components
- **AI Integration**: Multi-provider AI system with cost controls and development modes
- **Security**: JWT authentication, rate limiting, and proper API key management
- **Scalability**: Designed for growth with proper separation of concerns and performance optimizations
- **User Experience**: Rich, responsive interface with advanced features like face verification and AI-powered study tools

The system is well-positioned for production deployment and continued development, with a solid foundation that supports the complex requirements of a modern university attendance and learning management system.
