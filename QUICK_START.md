# QuickQuiz Quick Start Guide

## 🚀 What to Do Now

### 1. Deploy Your Convex Functions
You need to deploy your schema and functions to the cloud:

```bash
# In your project directory
npx convex deploy
```

This will:
- ✅ Create your database tables automatically
- ✅ Deploy your admin and participant functions
- ✅ Set up the schema with proper indexes

### 2. Test the Login
After deployment:
1. Go to `http://localhost:3000/admin`
2. Create an account or log in
3. Check your browser console for "Admin saved to Convex" message
4. Check your Convex dashboard for the new admin data

### 3. What Should Happen
When you log in:
1. **Firebase** authenticates your email/password
2. **Convex** receives the user data
3. **Database** stores the admin record
4. **Dashboard** shows your admin data

## 🔧 If Data Still Doesn't Appear

### Check These Things:

**1. Convex Functions Deployed?**
- Run `npx convex deploy` again
- Look for "✓ Functions deployed" message

**2. Correct Project?**
- Make sure you're logged into your Convex project
- Check the URL in your Convex dashboard

**3. Console Errors?**
- Open browser dev tools
- Look for any Convex-related errors
- Check the "Admin saved to Convex" message

**4. Network Issues?**
- Check your internet connection
- Verify Convex URL is correct: `https://<your-project-name>.convex.cloud`

## 📋 Expected Database Tables

After deployment, you should see these tables in Convex:

```
admins
├── firebaseUid (string)
├── email (string)  
└── createdAt (number)

quizzes
├── title (string)
├── description (string)
├── startTime (number)
├── endTime (number)
├── duration (number)
├── createdBy (id)
└── createdAt (number)

questions
├── quizId (id)
├── questionText (string)
├── options (array)
└── correctAnswer (number)

participants
├── firebaseUid (string)
├── phoneNumber (string)
└── createdAt (number)

submissions
├── quizId (id)
├── participantId (id)
├── answers (array)
├── score (number)
└── submittedAt (number)
```

## 🎯 Next Steps After Login Works

1. **Create Quiz** - Build the quiz creation interface
2. **Add Questions** - Implement question management
3. **Participant Flow** - Build phone verification for participants
4. **Results Dashboard** - Show quiz results and analytics

## 🚨 Troubleshooting

### "Functions not found"
```bash
npx convex deploy
```

### "Schema not deployed"
```bash
npx convex deploy --schema-only
```

### "No data in tables"
- Check browser console for errors
- Verify Firebase auth is working
- Try logging in again after deployment

The setup is almost complete - just deploy your functions and test the login!
