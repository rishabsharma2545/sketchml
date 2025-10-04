# Deployment Guide

This guide will help you deploy SKETCHML to the cloud so others can access it.

## Option 1: Render (Easiest - Free Tier Available)

### Backend Deployment

1. Create a `render.yaml` file in your project root:

```yaml
services:
  - type: web
    name: sketchml-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
```

2. Push to GitHub
3. Go to [Render.com](https://render.com)
4. Click "New +" → "Web Service"
5. Connect your GitHub repository
6. Render will auto-detect the `render.yaml` and deploy

### Frontend Deployment

1. Update `src/App.jsx` WebSocket URL:
```javascript
const wsUrl = import.meta.env.PROD 
  ? 'wss://your-backend.onrender.com/ws/' 
  : 'ws://localhost:8000/ws/';
const ws = new WebSocket(`${wsUrl}${connectionId.current}`);
```

2. Update prediction URL:
```javascript
const apiUrl = import.meta.env.PROD
  ? 'https://your-backend.onrender.com'
  : 'http://localhost:8000';
const response = await fetch(`${apiUrl}/predict/${connectionId.current}`, ...);
```

3. Build the frontend:
```bash
npm run build
```

4. Deploy to Render Static Site:
   - Click "New +" → "Static Site"
   - Connect repository
   - Build Command: `npm run build`
   - Publish Directory: `dist`

## Option 2: Vercel (Frontend) + Railway (Backend)

### Backend on Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Python and runs `main.py`
5. Add environment variables if needed
6. Get your backend URL from Railway dashboard

### Frontend on Vercel

1. Update WebSocket URLs as shown above
2. Push to GitHub
3. Go to [Vercel.com](https://vercel.com)
4. Click "Import Project"
5. Connect your GitHub repository
6. Vercel auto-detects Vite configuration
7. Deploy!

## Option 3: Docker (Self-hosted or Cloud)

Create a `Dockerfile` for backend:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Create a `Dockerfile` for frontend:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Deploy with:
```bash
docker-compose up -d
```

## Option 4: GitHub Pages (Frontend Only - Static Demo)

If you want to create a demo version with pre-recorded data:

1. Create a static version that doesn't require backend
2. Build: `npm run build`
3. Push `dist/` folder to `gh-pages` branch
4. Enable GitHub Pages in repository settings

## Post-Deployment Checklist

- [ ] Update README.md with live demo URL
- [ ] Test WebSocket connection in production
- [ ] Verify CORS settings allow frontend domain
- [ ] Test all algorithms work correctly
- [ ] Add analytics (optional - Google Analytics, Plausible)
- [ ] Set up error monitoring (Sentry)
- [ ] Add SSL certificate (most platforms do this automatically)

## Updating Your Deployment

### For Render/Vercel/Railway:
Just push to GitHub - auto-deploys!

```bash
git add .
git commit -m "Update SKETCHML"
git push origin main
```

### For Docker:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

## Custom Domain (Optional)

1. Buy a domain from Namecheap, Google Domains, etc.
2. In your hosting platform (Render/Vercel/Railway):
   - Go to Settings → Custom Domains
   - Add your domain
   - Update DNS records as instructed
3. SSL is usually automatic

## Monitoring

### Backend Health Check
Your backend already has a health endpoint:
```
GET https://your-backend.com/
Response: {"message": "SKETCHML Backend API"}
```

### Frontend Monitoring
Add this to your frontend to track errors:

```javascript
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);
  // Send to monitoring service
});
```

## Cost Estimates

| Platform | Backend | Frontend | Total/month |
|----------|---------|----------|-------------|
| Render Free Tier | Free | Free | $0 |
| Railway | $5 | N/A | $5 |
| Vercel + Railway | $5 | Free | $5 |
| AWS/GCP/Azure | $10-20 | $5 | $15-25 |

## Troubleshooting

**WebSocket Connection Fails:**
- Check if backend allows CORS from frontend domain
- Ensure using `wss://` (secure) not `ws://` in production
- Verify firewall/security groups allow WebSocket connections

**Frontend Shows Blank Page:**
- Check browser console for errors
- Verify API URLs are correct
- Ensure backend is running and accessible

**Models Train Slowly:**
- Consider adding caching
- Optimize scikit-learn parameters
- Use a more powerful server instance

## Support

If you run into issues, please:
1. Check the issues tab on GitHub
2. Open a new issue with detailed description
3. Include error logs and screenshots

Happy deploying! 🚀