# QuickQuiz Setup Instructions

## 🔧 Environment Setup

### 1. Create Environment Variables

Create a `.env.local` file in the root of your project:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Your `.env.local` should contain:
```env
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

### 2. Set Up Convex

Your Convex project should be configured with:
- **Cloud URL**: Found in your Convex dashboard
- **HTTP Actions URL**: Found in your Convex dashboard

### 3. Set Up Firebase

Firebase needs to be configured with your project details. You may need to:

1. Enable Authentication in your Firebase console
2. Enable Email/Password sign-in method
3. Enable Phone number sign-in method
4. Configure reCAPTCHA for phone authentication

### 4. Start Development

```bash
# Start Convex backend
npx convex dev

# Start Next.js frontend (in another terminal)
npm run dev
```

## 📋 Environment Variables

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=<your-convex-url>

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project-id>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project-id>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-messaging-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

## 🚀 Common Issues

### "Successfully authenticated, but failed to save user data"
- **Issue**: HTTP Actions are not enabled in your Convex deployment
- **Solution**: Enable HTTP Actions in your Convex dashboard or use local development
- **Current Status**: Firebase auth works, but Convex data storage is disabled

### "Client created with undefined deployment address"
- Solution: Set `NEXT_PUBLIC_CONVEX_URL` in your `.env.local` file
- ✅ Already configured with your Convex URL

### Firebase Authentication Issues
- Make sure Authentication is enabled in Firebase console
- Check that Email/Password and Phone sign-in methods are enabled
- Verify reCAPTCHA is configured for phone authentication

## 🔧 Enable Convex HTTP Actions

To enable full functionality:

1. **Go to your Convex Dashboard**
2. **Navigate to Settings**
3. **Enable HTTP Actions**
4. **Redeploy your functions**

**Alternative**: Use local development with `npx convex dev`

## 📚 Next Steps

Once environment is set up:

1. Visit `http://localhost:3000` to see the app
2. Go to `/admin` to create an admin account
3. Start creating quizzes and sharing them!
