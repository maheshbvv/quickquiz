# Firebase Unauthorized Domain Fix

## 🚨 Error: Firebase: Error (auth/unauthorized-domain)

This error occurs because localhost domains are not authorized in your Firebase Authentication settings.

## 🔧 Quick Fix (5 minutes)

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com/
2. Sign in with your Google account
3. Select project: **<your-project-id>**

### Step 2: Navigate to Authentication Settings
1. Click **Authentication** in the left sidebar
2. Click the **Settings** gear icon ⚙️ in the top right
3. Select the **Sign-in method** tab

### Step 3: Add Authorized Domains
1. Scroll down to **"Authorized domains"** section
2. Click **"Add domain"** button
3. Add these domains one by one:

```
localhost:3000
localhost:3001
127.0.0.1:3000
127.0.0.1:3001
```

4. Click **"Save"** after adding each domain

### Step 4: Verify the Setup
Your authorized domains should look like:
- ✅ <your-project-id>.firebaseapp.com (already there)
- ✅ localhost:3000 (add this)
- ✅ localhost:3001 (add this)
- ✅ 127.0.0.1:3000 (add this)
- ✅ 127.0.0.1:3001 (add this)

### Step 5: Test the Fix
1. Refresh your browser
2. Try to sign in with Google again
3. The error should be gone!

## 🎯 Why This Happens

Firebase Authentication requires explicit authorization of domains for security reasons. This prevents:
- Unauthorized websites from using your Firebase credentials
- Cross-site request forgery attacks
- Authentication abuse

## 🚀 Additional Tips

### For Development
- Always add both `localhost` and `127.0.0.1` versions
- Include all ports you might use (3000, 3001, 8080, etc.)

### For Production
When you deploy, add your production domain:
```
yourdomain.com
www.yourdomain.com
app.yourdomain.com
```

### For Testing
If you use different ports during development, add them all:
```
localhost:3000
localhost:3001
localhost:8080
localhost:5173  (Vite default)
```

## 🔍 Troubleshooting

### Still Getting the Error?
1. **Clear browser cache** and cookies
2. **Check exact URL** in browser (match exactly what you added)
3. **Wait 2-3 minutes** for Firebase settings to propagate
4. **Restart your dev server**

### Different Port?
If you're using a different port (like 3001), add that specific port to authorized domains.

### Still Not Working?
Check the browser console for the exact domain that's failing and add it to the list.

## ✅ Success Confirmation

After fixing, you should see:
- ✅ No more "auth/unauthorized-domain" errors
- ✅ Google sign-in popup opens successfully
- ✅ Authentication completes without errors
- ✅ User is redirected properly

## 📱 Mobile Testing

For mobile testing, you might also need:
```
192.168.1.100:3000  (your local IP)
```

---

**This fix is required for local development only. Production domains will need to be added separately when you deploy.**
