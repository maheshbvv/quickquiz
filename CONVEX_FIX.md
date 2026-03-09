# Convex Integration Fix

## 🚨 Current Issue
The Convex HttpClient is expecting proper TypeScript function references, but we're trying to use string names. This causes the error:
```
Argument of type 'string' is not assignable to parameter of type 'FunctionReference<"mutation">'
```

## 🔧 Solution Steps

### 1. Generate Proper Convex Types
First, ensure the Convex types are generated:

```bash
npx convex dev --once
```

This will create the `convex/_generated/api.ts` file with proper function references.

### 2. Update Import Statement
Replace the current Convex calls with:

```typescript
import { api } from "../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Then use:
const convexClient = new ConvexHttpClient("https://<your-project-name>.convex.cloud");
const quizId = await convexClient.mutation(api.admin.createQuiz, {
  firebaseUid: user.uid,
  title: quizData.title,
  description: quizData.description,
  startTime,
  endTime,
  duration,
});
```

### 3. Alternative: Use Raw HTTP Calls
If types don't work, use direct HTTP calls:

```typescript
const response = await fetch('https://<your-project-name>.convex.cloud/api/admin/createQuiz', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    args: {
      firebaseUid: user.uid,
      title: quizData.title,
      description: quizData.description,
      startTime,
      endTime,
      duration,
    }
  })
});
```

## 📋 Current Status
- ✅ Convex functions deployed
- ✅ Database tables created
- ❌ TypeScript integration not working
- ✅ Form UI working perfectly

## 🎯 Next Steps
1. Run `npx convex dev --once` to generate types
2. Update the import to use `api` from generated types
3. Test quiz creation with real Convex integration

## 🚀 For Now
The quiz creation form works perfectly - it validates input, shows loading states, and redirects. The only missing piece is the Convex data persistence, which can be added once the types are properly generated.
