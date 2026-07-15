# 🚀 Quick Start Guide - Study Hub TurboLearn AI Integration

## What You Need to Know

Your Study Hub has been completely revamped with **TurboLearn AI** features! Here's what was added and how to use it.

## 📦 What's New

### 🎬 For Users (Students)
1. **Personalized Study Dashboard** - See what to study each day
2. **Podcast Generation** - Convert notes to audio
3. **Smart Flashcards** - Better quality questions with AI
4. **Study Groups** - Collaborate with classmates
5. **Weak Area Detection** - Know what needs improvement

### 🔧 For Developers
1. **TurboLearn AI Service** - Reusable business logic
2. **6 New API Endpoints** - Podcast, flashcards, groups, analytics
3. **Database Tables** - Podcasts, study groups, shared materials
4. **Vue Components** - Dashboard and group manager UIs
5. **Complete Documentation** - API reference and architecture

## ⚡ Quick Setup (5 minutes)

### Step 1: Run Database Migration
```bash
cd backend
npm run migrate
```

This creates:
- `podcasts` table
- `study_groups` table  
- `study_group_members` table
- `group_shared_materials` table
- Enhanced fields on `study_materials` and `flashcards`

### Step 2: Restart Backend
```bash
npm run dev
```

You should see no errors. If you see errors about TurboLearn service, check the imports in `study.routes.js`.

### Step 3: Test the API
Open your terminal and run:
```bash
# Get your study plan for today
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:5000/api/study/spaced-repetition-plan

# Expected response:
# {
#   "cardsReady": 24,
#   "weakAreas": [...],
#   "recommendedDaily": {
#     "minutes": 45,
#     "cardsPerSession": 12
#   }
# }
```

## 📱 Frontend Integration (Next Steps)

### 1. Add Router Links
**File**: `frontend/src/router/index.js`

Add these routes:
```javascript
{
  path: '/study-hub/dashboard',
  component: () => import('../components/study/StudyDashboard.vue'),
  name: 'StudyDashboard'
},
{
  path: '/study-hub/groups',
  component: () => import('../components/study/StudyGroupManager.vue'),
  name: 'StudyGroupManager'
}
```

### 2. Update StudyHub Navigation
**File**: `frontend/src/pages/StudyHub.vue`

Add navigation buttons:
```vue
<div class="hub-tabs">
  <button @click="$router.push('/study-hub')">Notes</button>
  <button @click="$router.push('/study-hub/dashboard')">📊 Dashboard</button>
  <button @click="$router.push('/study-hub/groups')">👥 Groups</button>
</div>
```

### 3. Import Components
**File**: `frontend/src/pages/StudyHub.vue`

Add to script:
```javascript
import StudyDashboard from '../components/study/StudyDashboard.vue'
import StudyGroupManager from '../components/study/StudyGroupManager.vue'
```

## 📊 API Endpoints Reference

### Study Materials (Enhanced)
```
POST   /api/study-materials/:id/podcast
       Generate podcast from study material
       
POST   /api/study-materials/:id/enhanced-flashcards
       Generate AI-powered flashcards
```

### Study Analytics (New)
```
GET    /api/study/spaced-repetition-plan
       Get personalized study recommendations
       
GET    /api/study-materials/stats
       Get overall learning statistics
```

### Study Groups (New)
```
POST   /api/study-groups
       Create a new study group
       
POST   /api/study-groups/:groupId/share/:materialId
       Share a material with study group
       
GET    /api/study-groups/:groupId/materials
       Get all materials shared in group
```

## 🎯 Common Use Cases

### Use Case 1: Student Views Study Dashboard
```javascript
// Frontend: Load dashboard on page mount
const { data: plan } = await api.get('/api/study/spaced-repetition-plan')

// Shows:
// - 24 cards ready to review
// - Weak areas: "Photosynthesis" (65% strength)
// - Recommended: 45 minutes per day
```

### Use Case 2: Generate Podcast
```javascript
// User has a study material and wants audio version
const podcast = await api.post('/api/study-materials/abc123/podcast')

// Returns podcast script ready for TTS
// { id, script, status: 'pending', materialId }
```

### Use Case 3: Create Study Group
```javascript
// Students want to study together
const group = await api.post('/api/study-groups', {
  name: "Data Science Exam Prep",
  description: "June final exam preparation",
  courseId: "cs-101"
})

// Share materials with group
await api.post(`/api/study-groups/${group.id}/share/${material.id}`)
```

## 🧪 Testing Your Changes

### Test 1: Verify Database
```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public';

-- Should see: podcasts, study_groups, study_group_members, group_shared_materials
```

### Test 2: API Endpoint
```bash
# Test enhanced flashcard generation
curl -X POST http://localhost:5000/api/study-materials/test-id/enhanced-flashcards \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"count": 5}'
```

### Test 3: Frontend Component
```javascript
// In frontend DevTools console
import StudyDashboard from './components/study/StudyDashboard.vue'
// Should import without errors
```

## 🐛 Troubleshooting

### Problem: Migration Fails
**Solution:**
```bash
# Check if tables already exist
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='podcasts');

# If tables exist, migration is actually successful
# If not, check database connection
```

### Problem: Import Error - turboLearnService not found
**Solution:**
Check that file exists:
```bash
ls -la backend/src/services/turboLearnService.js
```

If missing, file wasn't created. Check file creation steps above.

### Problem: API Returns 500 Error
**Solution:**
```bash
# Check backend logs for actual error
tail -100 backend/server.log

# Common issues:
# 1. Database not connected
# 2. Missing required parameters
# 3. User not authenticated
```

### Problem: Frontend Component Won't Load
**Solution:**
```javascript
// Check console for errors
// Common issues:
// 1. Component path incorrect
// 2. API endpoint returns error
// 3. Authentication token missing
```

## 📚 Documentation Files

**Read these files for detailed information:**

1. **`TURBOLEARN_AI_INTEGRATION.md`** - Complete feature guide
   - All features explained
   - API reference
   - Usage examples
   - Architecture diagrams

2. **`STUDY_HUB_IMPLEMENTATION_SUMMARY.md`** - Implementation details
   - What was changed
   - Files modified/created
   - Deployment checklist
   - Testing recommendations

3. **`study.routes.js`** - API endpoint code
   - Route definitions
   - Request/response examples
   - Error handling

4. **`turboLearnService.js`** - Service implementation
   - Business logic
   - Database queries
   - Function documentation

## ✅ Verification Checklist

- [ ] Database migration ran successfully
- [ ] Backend starts without errors (`npm run dev`)
- [ ] API endpoints respond to requests
- [ ] New tables visible in database
- [ ] Frontend components import correctly
- [ ] Router links added
- [ ] Study dashboard loads without errors
- [ ] Study groups page loads without errors

## 🎓 Next Steps

1. **Run migration** - Create database tables
2. **Test APIs** - Verify endpoints work
3. **Integrate frontend** - Add components to UI
4. **Test UI** - Verify components display correctly
5. **User testing** - Have students try features
6. **Deploy** - Push to production

## 🆘 Need Help?

### Check These First
1. Read the error message carefully
2. Check the documentation files
3. Review the API examples
4. Check the console logs

### Then Try
1. Backend logs: `tail -100 backend/server.log`
2. Database check: Query the new tables directly
3. API test: Use curl to test endpoint
4. Browser console: Check for JavaScript errors

## 🚀 You're Ready!

Everything is set up. Follow the quick setup steps above and you'll have a powerful AI-enhanced Study Hub ready to go! 

**Questions?** Check the documentation files or review the code comments.

---

**Last Updated**: January 2026  
**Status**: Ready for Deployment
