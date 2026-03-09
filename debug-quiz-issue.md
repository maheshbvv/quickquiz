# Quiz Vanishing Issue - Debug Guide

## Problem
Your quizzes disappear when you refresh the page because of Firebase UID regeneration issues.

## Root Cause Analysis

### 1. **Firebase Session Persistence**
- Firebase auth sessions weren't persisting across page refreshes
- Each refresh generates a new UID instead of preserving the existing one
- Quizzes are stored with the original UID but queried with the new UID

### 2. **Convex Client Inconsistency**
- Admin login was creating a new Convex client instead of using the configured one
- This could cause data inconsistency between login and dashboard

## Fixes Applied

### ✅ **Firebase Persistence Fix**
```typescript
// src/lib/firebase.ts
import { browserLocalPersistence, setPersistence } from "firebase/auth";

// Set persistence to LOCAL for session persistence across page refreshes
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
}
```

### ✅ **Convex Client Fix**
```typescript
// src/app/admin/page.tsx
// Use the configured convex client instead of creating new one
const adminData = await convex.mutation("admin:createOrUpdateAdmin" as any, {
  firebaseUid: result.user.uid,
  email: result.user.email || email,
});
```

## How to Verify the Fix

### 1. **Clear Browser Data**
1. Open browser DevTools (F12)
2. Go to Application tab → Storage → Clear Storage
3. Clear all site data
4. Refresh the page

### 2. **Test Login Flow**
1. Login to admin dashboard
2. Create a new quiz
3. Note the quiz ID and title
4. Refresh the page (Ctrl+R or Cmd+R)
5. Verify the quiz still appears

### 3. **Check Firebase UID Consistency**
Open browser DevTools → Console and run:
```javascript
// Check current Firebase user
firebase.auth().onAuthStateChanged(user => {
  console.log('Current UID:', user?.uid);
  console.log('Current email:', user?.email);
});
```

### 4. **Verify Database Records**
Check Convex dashboard to see:
1. Admin records with their Firebase UIDs
2. Quiz records with `createdBy` field
3. Ensure UIDs match between admin and quiz records

## Additional Debugging Steps

### If Issues Persist:

#### 1. **Check Firebase Console**
- Go to Firebase Console → Authentication
- Verify user accounts exist
- Check if email/password is enabled

#### 2. **Check Convex Dashboard**
- Go to Convex dashboard
- Verify `admins` table has records
- Verify `quizzes` table has records
- Check if `createdBy` field matches admin UIDs

#### 3. **Network Tab Debugging**
1. Open DevTools → Network tab
2. Login to admin
3. Check Convex API calls:
   - `admin:createOrUpdateAdmin`
   - `admin:getQuizzes`
4. Verify request/response data

#### 4. **Console Logging**
Add temporary logging to dashboard:
```typescript
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
    console.log('Auth state changed:', {
      uid: firebaseUser?.uid,
      email: firebaseUser?.email,
      isNull: !firebaseUser
    });
    // ... rest of code
  });
  return () => unsubscribe();
}, [router]);
```

## Common Scenarios & Solutions

### Scenario 1: "No Quizzes Created" Message
**Cause**: UID mismatch between admin and quiz records
**Solution**: Check if admin record exists with current UID

### Scenario 2: Login Redirect Loop
**Cause**: Firebase auth not persisting
**Solution**: Verify browser allows localStorage/cookies

### Scenario 3: Quiz Creation Works But Refresh Loses Data
**Cause**: Session persistence issue
**Solution**: Check browser storage settings

## Prevention Measures

### 1. **Regular Backups**
- Export quiz data regularly
- Use Convex dashboard to backup data

### 2. **Monitoring**
- Add error logging for UID mismatches
- Monitor auth state changes

### 3. **Testing**
- Test login flow in incognito mode
- Test across different browsers
- Test after clearing browser data

## Emergency Recovery

If all quizzes appear lost:

1. **Check Convex Dashboard**: Data might still be there
2. **UID Mapping**: Find old UID and map to new one
3. **Data Migration**: Update quiz records with correct UID
4. **Contact Support**: If using Convex, check their support

## Next Steps

After applying fixes:
1. Test thoroughly
2. Monitor for issues
3. Consider adding user-friendly error messages
4. Implement data backup strategies

This should resolve the quiz vanishing issue permanently.
