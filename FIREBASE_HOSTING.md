# Firebase Hosting Setup Guide

## 🚀 Deploy QuickQuiz to Firebase Hosting

### Prerequisites
- ✅ Firebase CLI installed
- ✅ Logged into Firebase
- ✅ Project initialized

### Step 1: Install Firebase CLI (if not installed)
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```bash
firebase login
```

### Step 3: Initialize Firebase Hosting
```bash
firebase init hosting
```

**Answer these prompts:**
- **Project setup**: Use existing project → select "<your-project-id>"
- **Public directory**: `out` (Next.js build output)
- **Configure as single-page app**: Yes
- **Set up automatic builds**: Yes
- **Overwrite index.html**: Yes

### Step 4: Update Next.js Config
Add to `next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Add this for Firebase hosting
  assetPrefix: './',
};

export default nextConfig;
```

### Step 5: Update Package.json Scripts
Add these scripts to `package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "export": "next export",
    "deploy": "npm run export && firebase deploy --only hosting",
    "deploy:preview": "npm run export && firebase hosting:channel:deploy preview"
  }
}
```

### Step 6: Deploy to Firebase
```bash
npm run deploy
```

## 🎯 Deployment URLs

After deployment:
- **Production**: https://<your-project-id>.web.app
- **Preview**: https://<your-project-id>.web.app (preview channel)

## 🔧 Configuration Files

### firebase.json (auto-generated)
```json
{
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### .firebaserc (auto-generated)
```json
{
  "projects": ["<your-project-id>"]
}
```

## 🌟 Benefits of Firebase Hosting

### ✅ **Free Tier Features**
- **10GB storage** free
- **360MB/month bandwidth** free
- **99.99% uptime** SLA
- **Global CDN** included
- **SSL certificate** included
- **Custom domain** support

### 🚀 **Performance**
- **Edge caching** for static assets
- **Automatic HTTPS** everywhere
- **Fast loading** globally
- **Zero config** needed

### 🔒 **Security**
- **Firebase security rules** protection
- **DDoS protection** included
- **Secure by default**

## 📱 Mobile & Desktop Support

Firebase hosting provides:
- **Responsive design** works perfectly
- **PWA support** possible
- **Offline functionality** with service workers
- **Fast loading** on all devices

## 🔄 Deployment Workflow

### Development
```bash
npm run dev          # Local development
```

### Production
```bash
npm run deploy        # Deploy to production
```

### Preview
```bash
npm run deploy:preview # Deploy to preview channel
```

## 🎉 After Deployment

1. **Visit**: https://kankolians.web.app
2. **Test**: All features work perfectly
3. **Share**: Live URL with anyone
4. **Monitor**: Firebase console for usage

## 🔍 Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Deploy Errors
```bash
# Check Firebase status
firebase projects:list
firebase deploy --debug
```

### Domain Issues
- **Propagation**: Wait 5-10 minutes for DNS
- **SSL**: Auto-provided by Firebase
- **Custom domain**: Add in Firebase console

## 📊 Analytics Integration

Your app will automatically get:
- **Page views** tracking
- **User analytics** 
- **Performance metrics**
- **Geographic data**

---

**This will give you a live, secure, and fast hosting for your QuickQuiz app!**
