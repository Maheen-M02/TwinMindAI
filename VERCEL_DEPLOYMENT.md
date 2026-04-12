# TwinMind AI - Vercel Deployment Guide

Complete guide to deploy TwinMind AI frontend to Vercel and backend to a cloud provider.

---

## Architecture Overview

```
Frontend (Vercel)
    ↓ HTTPS/WSS
Backend (Railway/Render/AWS)
    ↓
AWS DynamoDB + Polygon Mumbai
```

---

## Part 1: Deploy Frontend to Vercel

### Step 1: Prepare Frontend

1. **Update package.json** (add build script if missing):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

2. **Check .env.example**:
```env
VITE_API_URL=http://localhost:8000
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd twinmind-frontend
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? twinmind-frontend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/
2. Click "Add New" → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `twinmind-frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"

### Step 3: Configure Environment Variables

1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   ```
   Name: VITE_API_URL
   Value: https://your-backend-url.com
   Environment: Production, Preview, Development
   ```
3. Click "Save"
4. Redeploy: Deployments → Latest → "Redeploy"

---

## Part 2: Deploy Backend

Vercel doesn't support Python/WebSocket backends well. Use one of these alternatives:

### Option A: Railway (Recommended - Easiest)

1. **Go to Railway**: https://railway.app/
2. **Sign up** with GitHub
3. **New Project** → "Deploy from GitHub repo"
4. **Select** your repository
5. **Configure**:
   - Root Directory: `twinmind-backend`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Add Environment Variables**:
   ```
   GEMINI_API_KEY=your_key
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   DYNAMODB_TABLE_NAME=twinmind-events
   POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com/
   CONTRACT_ADDRESS=0x...
   WALLET_PRIVATE_KEY=0x...
   ```
7. **Deploy** - Railway will auto-deploy
8. **Get URL**: Settings → Domains → Generate Domain
9. **Update Vercel**: Add backend URL to `VITE_API_URL`

**Cost**: $5/month (includes 500 hours)

### Option B: Render

1. **Go to Render**: https://render.com/
2. **Sign up** with GitHub
3. **New** → "Web Service"
4. **Connect** your repository
5. **Configure**:
   - Name: `twinmind-backend`
   - Root Directory: `twinmind-backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. **Add Environment Variables** (same as Railway)
7. **Create Web Service**
8. **Get URL**: Copy the `.onrender.com` URL
9. **Update Vercel**: Add backend URL to `VITE_API_URL`

**Cost**: Free tier available (spins down after inactivity)

### Option C: AWS EC2 (Advanced)

See `AWS_SETUP.md` for full EC2 deployment guide.

---

## Part 3: Update Frontend to Use Production Backend

### Update Environment Variable

1. **In Vercel Dashboard**:
   - Settings → Environment Variables
   - Edit `VITE_API_URL`
   - Change to: `https://your-backend.railway.app` or `https://your-backend.onrender.com`
   - Save

2. **Redeploy**:
   - Deployments → Latest → "Redeploy"

### Update WebSocket URL

If your backend uses a different WebSocket URL, update:

`twinmind-frontend/src/hooks/useWebSocket.js`:
```javascript
const WS_URL = import.meta.env.VITE_WS_URL || 
               import.meta.env.VITE_API_URL?.replace('http', 'ws') + '/ws/factory' ||
               'ws://localhost:8000/ws/factory'
```

---

## Part 4: Configure CORS

Update `twinmind-backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://twinmind-frontend.vercel.app",  # Your Vercel URL
        "https://*.vercel.app",  # All Vercel preview deployments
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Part 5: Test Deployment

1. **Open your Vercel URL**: `https://twinmind-frontend.vercel.app`
2. **Check Console** (F12):
   - No CORS errors
   - WebSocket connected
   - Data streaming

3. **Test Features**:
   - ✅ Real-time machine data
   - ✅ AI Copilot
   - ✅ What-If simulator
   - ✅ Blockchain events
   - ✅ Proactive Agent

---

## Troubleshooting

### Frontend Issues

**"Failed to fetch"**
- Check `VITE_API_URL` is set correctly in Vercel
- Verify backend is running
- Check CORS configuration

**"WebSocket connection failed"**
- Ensure backend supports WebSocket
- Check if Railway/Render allows WebSocket (they do)
- Verify URL uses `wss://` for HTTPS

**"404 Not Found"**
- Check `vercel.json` routing configuration
- Ensure `dist` folder is being deployed
- Verify build command ran successfully

### Backend Issues

**"Application failed to start"**
- Check all environment variables are set
- Verify `requirements.txt` is in root directory
- Check logs for missing dependencies

**"Database connection failed"**
- Verify AWS credentials are correct
- Check DynamoDB table exists
- Ensure IAM permissions are set

**"Out of memory"**
- ML models are large (~200MB)
- Upgrade to paid tier on Railway/Render
- Or use AWS S3 to store models and load on demand

---

## Cost Summary

| Service | Free Tier | Paid |
|---------|-----------|------|
| Vercel (Frontend) | 100GB bandwidth | $20/month |
| Railway (Backend) | $5 credit | $5/month |
| Render (Backend) | 750 hours/month | $7/month |
| AWS DynamoDB | 25GB free | ~$3/month |
| Polygon Mumbai | Free testnet | Free |

**Total**: $0-$8/month depending on choices

---

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render
- [ ] Environment variables configured
- [ ] CORS updated with production URLs
- [ ] WebSocket connection working
- [ ] AWS DynamoDB connected
- [ ] Polygon contract deployed
- [ ] SSL/TLS enabled (automatic on Vercel/Railway)
- [ ] Custom domain configured (optional)
- [ ] Monitoring/logging enabled
- [ ] Error tracking setup (Sentry recommended)

---

## Custom Domain (Optional)

### Vercel Frontend

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `twinmind.yourdomain.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Railway Backend

1. Railway Dashboard → Your Project → Settings → Domains
2. Add custom domain: `api.yourdomain.com`
3. Add CNAME record to your DNS
4. SSL certificate auto-generated

---

## Monitoring & Logs

### Vercel Logs
- Dashboard → Your Project → Deployments → View Logs
- Real-time function logs
- Build logs

### Railway Logs
- Dashboard → Your Project → View Logs
- Real-time application logs
- Deployment logs

### AWS CloudWatch
- Monitor DynamoDB metrics
- Set up alarms for errors
- Track API usage

---

## Scaling

### Frontend (Vercel)
- Auto-scales globally
- CDN caching
- No configuration needed

### Backend
- **Railway**: Vertical scaling (upgrade plan)
- **Render**: Horizontal scaling (multiple instances)
- **AWS**: Auto-scaling groups with load balancer

---

## Security Best Practices

1. ✅ Use environment variables for all secrets
2. ✅ Enable HTTPS only (automatic on Vercel/Railway)
3. ✅ Restrict CORS to your domains only
4. ✅ Rotate API keys regularly
5. ✅ Use AWS IAM roles instead of access keys (if on AWS)
6. ✅ Enable rate limiting on backend
7. ✅ Monitor for suspicious activity
8. ✅ Keep dependencies updated

---

## Next Steps

1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Configure environment variables
4. Test all features
5. Set up custom domain (optional)
6. Enable monitoring
7. Share with users!

---

Need help? Check the logs first, then refer to the troubleshooting section above.
