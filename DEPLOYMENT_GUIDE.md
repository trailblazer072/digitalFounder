# Deployment Guide — Axel (Digital Founder)

This project has two parts:
- **Backend**: FastAPI (Python) → deployed on **Render**
- **Frontend**: React + Vite (TypeScript) → deployed on **Vercel**

---

## Prerequisites

Before you start, make sure you have:
- [ ] Code pushed to GitHub (`trailblazer072/digitalFounder`)
- [ ] A [Render](https://render.com/) account (free tier works)
- [ ] A [Vercel](https://vercel.com/) account (free tier works)
- [ ] Your external service credentials ready (see `.env.example`):
  - Neon DB connection string
  - Gemini API key
  - Pinecone API key & index name
  - AWS S3 credentials

> ⚠️ **Security Notice**: If any secrets were ever committed to git (even briefly), rotate them immediately:
> - [Neon Console](https://console.neon.tech/) → Reset password
> - [Google AI Studio](https://aistudio.google.com/) → Regenerate key
> - [Pinecone Console](https://app.pinecone.io/) → Regenerate key
> - [AWS IAM](https://console.aws.amazon.com/iam/) → Deactivate & recreate access key

---

## Step 1 — Deploy the Backend on Render

### 1.1 Create a New Web Service

1. Go to [render.com](https://render.com/) → **New** → **Web Service**
2. Connect your GitHub account and select the `digitalFounder` repository
3. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `axel-backend` (or any name you like) |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app` |
| **Instance Type** | Free (or Starter for production) |

### 1.2 Add Environment Variables

In Render → **Environment** tab, add each of the following:

```
PROJECT_NAME=Axel
API_V1_STR=/api/v1
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>/neondb?ssl=require
GEMINI_API_KEY=<your-gemini-api-key>
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_INDEX_NAME=axel-index
AWS_ACCESS_KEY_ID=<your-aws-key-id>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_BUCKET_NAME=<your-bucket-name>
AWS_REGION=ap-south-1
BACKEND_CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

> 📝 Leave `BACKEND_CORS_ORIGINS` with a placeholder for now — you'll update it after deploying the frontend.

### 1.3 Deploy

Click **Create Web Service**. Render will:
1. Pull your code from GitHub
2. Run `pip install -r requirements.txt`
3. Start the server with gunicorn

**Verify**: Visit `https://axel-backend.onrender.com/` — you should see:
```json
{"message": "Welcome to Axel Backend"}
```

Also check the API docs: `https://axel-backend.onrender.com/api/v1/openapi.json`

---

## Step 2 — Deploy the Frontend on Vercel

### 2.1 Create a New Project

1. Go to [vercel.com](https://vercel.com/) → **Add New** → **Project**
2. Import the `digitalFounder` GitHub repository
3. Configure the project:

| Setting | Value |
|---|---|
| **Framework Preset** | `Vite` (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2.2 Add Environment Variables

In the Vercel project settings → **Environment Variables**, add:

```
VITE_API_URL=https://axel-backend.onrender.com/api/v1
```

> ⚠️ The variable **must** start with `VITE_` to be exposed to the browser by Vite.

### 2.3 Deploy

Click **Deploy**. Vercel will build and deploy the React app.

**Verify**: Visit your Vercel URL (e.g., `https://digital-founder.vercel.app`) — the login page should load.

---

## Step 3 — Wire Everything Together (Post-Deployment)

### 3.1 Update CORS on Render

Now that you have your Vercel URL:

1. Go to Render → your backend service → **Environment**
2. Update `BACKEND_CORS_ORIGINS`:
   ```
   ["https://digital-founder.vercel.app"]
   ```
3. Click **Save Changes** — Render will auto-redeploy.

### 3.2 Verify the Full Flow

1. Open your Vercel frontend URL
2. Sign up / Log in
3. Confirm the app connects to the backend correctly (no CORS errors in browser console)

---

## Auto-Deployments (GitHub → Render/Vercel)

Both Render and Vercel watch your `main` branch by default. Every `git push origin main` will automatically trigger a redeploy of both services. No manual action needed.

---

## Troubleshooting

### Backend won't start on Render
- Check **Logs** tab in Render dashboard
- Common causes: missing env variable, DB connection string wrong format
- Make sure `DATABASE_URL` uses `postgresql+asyncpg://` (not `postgresql://`)

### Frontend shows blank page or API errors
- Open browser DevTools → **Console** tab
- Check for CORS errors → update `BACKEND_CORS_ORIGINS` on Render
- Check for 404 errors → verify `VITE_API_URL` ends with `/api/v1` and no trailing slash

### Render free tier spins down
- Free Render instances sleep after 15 min of inactivity — first request after sleep takes ~30s
- Upgrade to **Starter** ($7/mo) to keep the service always-on for production use

### Database tables not created
- The app auto-creates tables on startup via `SQLModel.metadata.create_all`
- If tables are missing, check Render logs for startup errors
- Verify the Neon DB connection string is correct and the `ssl=require` parameter is included

---

## Environment Variable Reference

| Variable | Where | Description |
|---|---|---|
| `PROJECT_NAME` | Render | App name, shown in API docs |
| `API_V1_STR` | Render | API prefix (must be `/api/v1`) |
| `DATABASE_URL` | Render | Neon PostgreSQL async connection string |
| `GEMINI_API_KEY` | Render | Google Gemini LLM key |
| `PINECONE_API_KEY` | Render | Pinecone vector DB key |
| `PINECONE_INDEX_NAME` | Render | Pinecone index name (`axel-index`) |
| `AWS_ACCESS_KEY_ID` | Render | AWS S3 access key |
| `AWS_SECRET_ACCESS_KEY` | Render | AWS S3 secret |
| `AWS_BUCKET_NAME` | Render | S3 bucket name |
| `AWS_REGION` | Render | S3 region (e.g. `ap-south-1`) |
| `BACKEND_CORS_ORIGINS` | Render | JSON array of allowed frontend URLs |
| `VITE_API_URL` | Vercel | Full backend URL including `/api/v1` |
