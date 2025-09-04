# 🌐 Making Your Application Publicly Accessible

This guide will help you make your Real Estate ERP application accessible to your friend.

## 🚀 Quick Start (Recommended)

### Option 1: Using the Automated Script

1. **Make sure both applications are running:**
   ```bash
   # Terminal 1: Start Backend
   uvicorn material_intelligence_api:app --host 0.0.0.0 --port 5001
   
   # Terminal 2: Start Frontend
   npm start
   ```

2. **Run the public access script:**
   ```bash
   ./start-public.sh
   ```

3. **Follow the instructions** - the script will:
   - Check if your apps are running
   - Start ngrok tunnels
   - Provide you with public URLs
   - Give you next steps

### Option 2: Manual ngrok Setup

1. **Start ngrok for frontend:**
   ```bash
   ngrok http 3000
   ```

2. **Start ngrok for backend (new terminal):**
   ```bash
   ngrok http 5001
   ```

3. **Get the URLs:**
   - Frontend: http://localhost:4040
   - Backend: http://localhost:4041

4. **Update frontend configuration:**
   - Edit `public-config.js`
   - Replace `API_URL` with your backend ngrok URL

## 🔧 Configuration Steps

### Step 1: Update Frontend API Configuration

After getting your ngrok URLs, update the frontend to use the public backend URL:

1. **Edit `public-config.js`:**
   ```javascript
   window.PUBLIC_CONFIG = {
     API_URL: 'https://your-backend-url.ngrok.io', // Replace with your ngrok URL
     ENVIRONMENT: 'production'
   };
   ```

2. **Restart the frontend:**
   ```bash
   npm start
   ```

### Step 2: Test the Setup

1. **Test backend access:**
   ```bash
   curl https://your-backend-url.ngrok.io/api/health
   ```

2. **Test frontend access:**
   - Open your frontend ngrok URL in a browser
   - Check if it can connect to the backend

## 📱 Sharing with Your Friend

1. **Share the frontend URL** (e.g., `https://abc123.ngrok.io`)
2. **Make sure your computer stays on** and connected to internet
3. **Keep the terminal windows open** (ngrok tunnels)

## 🛠️ Alternative Options

### Option A: Deploy to Vercel (Free)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy frontend:**
   ```bash
   vercel --prod
   ```

3. **Deploy backend:**
   ```bash
   vercel --prod
   ```

### Option B: Deploy to Railway (Free)

1. **Connect your GitHub repository**
2. **Deploy both frontend and backend**
3. **Get permanent URLs**

### Option C: Use Cloudflare Tunnel

1. **Install cloudflared:**
   ```bash
   brew install cloudflared
   ```

2. **Create tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

## 🔒 Security Notes

- **ngrok URLs are temporary** and change each time you restart
- **For production use**, consider proper deployment
- **Don't expose sensitive data** in public URLs
- **Use HTTPS** for production deployments

## 🆘 Troubleshooting

### Common Issues:

1. **"Connection refused"**
   - Make sure both applications are running
   - Check if ports 3000 and 5001 are available

2. **"CORS errors"**
   - Backend should allow all origins for testing
   - Check if CORS is properly configured

3. **"ngrok not found"**
   - Install ngrok: `brew install ngrok/ngrok/ngrok`
   - Or download from: https://ngrok.com/download

### Getting Help:

- Check ngrok dashboard: http://localhost:4040
- Check application logs in terminal
- Verify both applications are running

## 📞 Quick Commands

```bash
# Check if apps are running
curl http://localhost:3000
curl http://localhost:5001/api/health

# Start public access
./start-public.sh

# Stop ngrok tunnels
pkill ngrok
```

---

**🎉 Once set up, your friend can access your application from anywhere in the world!**
