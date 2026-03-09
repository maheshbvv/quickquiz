# Convex Setup Guide for QuickQuiz

## 🚀 Step-by-Step Convex Setup

### 1. Login to Convex
```bash
npx convex login
```
This will open a browser to authenticate with your Convex account.

### 2. Deploy Your Functions
```bash
npx convex deploy
```
This will:
- Deploy your schema (`convex/schema.ts`)
- Deploy your functions (`convex/admin.ts`, `convex/participant.ts`)
- Set up your database tables

### 3. Verify Deployment
After deployment, you should see:
```
✓ Schema deployed
✓ Functions deployed
✓ Database tables created
```

### 4. Enable HTTP Actions
1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project: `<your-project-name>`
3. Navigate to **Settings**
4. Find **HTTP Actions** section
5. **Enable HTTP Actions**
6. Save settings

### 5. Verify Tables Created
In your Convex dashboard, you should see these tables:
- `admins` (for admin users)
- `quizzes` (for quiz data)
- `questions` (for quiz questions)
- `participants` (for quiz participants)
- `submissions` (for quiz results)

### 6. Test the Integration
Once deployed:
1. Try logging in to your QuickQuiz app
2. Check the Convex dashboard
3. You should see data in the `admins` table

## 🔧 What Each File Does

### `convex/schema.ts`
Defines your database structure and indexes

### `convex/admin.ts`
Admin functions:
- `createOrUpdateAdmin` - Creates/updates admin users
- `getAdminByFirebaseUid` - Gets admin by Firebase UID
- `createQuiz` - Creates new quizzes
- `getQuizzes` - Gets admin's quizzes
- `addQuestion` - Adds questions to quizzes
- `getQuizResults` - Gets quiz results

### `convex/participant.ts`
Participant functions:
- `createOrUpdateParticipant` - Creates/updates participants
- `getParticipantByFirebaseUid` - Gets participant by Firebase UID
- `getQuiz` - Gets quiz information
- `startQuiz` - Starts a quiz for participant
- `submitQuiz` - Submits quiz answers

### `convex/http.ts`
HTTP routes for external API access

## 🚨 Common Issues

### "Functions not found"
- **Solution**: Run `npx convex deploy` to upload your functions

### "Schema not deployed"
- **Solution**: Make sure `schema.ts` is saved and run `npx convex deploy`

### "HTTP Actions not enabled"
- **Solution**: Enable in Convex dashboard settings

### "No data showing up"
- **Check**: Are you logged into the correct Convex project?
- **Check**: Did you deploy the functions after logging in?

## 📋 Next Steps After Setup

1. **Deploy functions**: `npx convex deploy`
2. **Enable HTTP Actions** in dashboard
3. **Test login** in your QuickQuiz app
4. **Check data** appears in Convex dashboard
5. **Start building** quiz features!

## 🎯 Expected Result

After proper setup, when you log in:
1. Firebase authenticates the user
2. Convex receives the user data
3. User appears in `admins` table
4. You can start creating quizzes!
