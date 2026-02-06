# Deployment Guide

This guide covers deploying the **AI Chatbot Widget** system, which consists of two parts:

1. **Backend & Widget** (Hono/Bun) - Deployed via Docker.
2. **Dashboard** (Next.js) - Deployed to Vercel.

---

## 1. Prerequisites (Database)

We use **Turso** (LibSQL) for the database because it's serverless and easy to use. SQLite files won't persist on standard container deployments (like Railway) without volumes.

1. Create a database on [Turso](https://turso.tech/).
2. Get your `Database URL` and `Auth Token`.
3. You will need these for the **Backend** environment variables.

---

## 2. Deploy Backend & Widget

The backend serves the API and the compiled `widget.js` file.

### Option A: Railway (Recommended)

1. Fork/Clone this repo.
2. Login to [Railway](https://railway.app/).
3. create a **New Project** -> **GitHub Repo** -> Select this repo.
4. **Configure Variables** in Railway:
   - `TURSO_DATABASE_URL`: `libsql://...`
   - `TURSO_AUTH_TOKEN`: `...`
   - `OPENAI_API_KEY`: `sk-...` (if using OpenAI)
   - `PINECONE_API_KEY`: `...` (if and when using Pinecone)
   - `DASHBOARD_SECRET`: `...` (Generate a random secret string, e.g., `openssl rand -hex 32`. You will need this for the dashboard too).
5. Railway will automatically detect the `Dockerfile` and build it.
6. Once deployed, copy your **Backend URL** (e.g., `https://my-chatbot-backend.up.railway.app`).

### Option B: Render

1. Login to [Render](https://render.com/).
2. New **Web Service** -> Connect GitHub repo.
3. Select **Docker** runtime.
4. Add Environment Variables (same as above).
5. Deploy.

### Verification

Visit `https://YOUR_BACKEND_URL/widget.js`. You should see the minified JavaScript code.

---

## 3. Deploy Dashboard

The dashboard is a Next.js app used to manage chatbots.

### Vercel

1. Login to [Vercel](https://vercel.com/).
2. **Add New...** -> **Project** -> Select this repo.
3. **Framework Preset**: Next.js (default).
4. **Root Directory**: Select `dashboard` (Important! The dashboard is in a subdirectory).
5. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://YOUR_BACKEND_URL` (The URL from Step 2, **no trailing slash**).
   - `NEXT_PUBLIC_DASHBOARD_SECRET`: `...` (Must match `DASHBOARD_SECRET` from Step 2).
   - `NEXTAUTH_SECRET`: `...` (Generate a random string for auth encryption).
   - `NEXTAUTH_URL`: `https://YOUR_DASHBOARD_URL.vercel.app` (or `http://localhost:3000` for local dev).
6. Click **Deploy**.

---

## 4. Embedding the Widget

Once both are deployed, you can embed the widget on any website (or send the instructions to your users).

Add this code to the `<body>` of your HTML:

```html
<script>
  window.KioskSettings = {
    tenantId: "YOUR_TENANT_ID", // Copy this from the Dashboard
    apiUrl: "https://YOUR_BACKEND_URL", // Your deployed backend URL
  };
</script>
<script src="https://YOUR_BACKEND_URL/widget.js" defer></script>
```

### Customization

You can control the widget appearance via the Dashboard or by passing optional config in `KioskSettings`:

```js
window.KioskSettings = {
  tenantId: "...",
  apiUrl: "...",
  theme: "dark", // or "light", "system"
  primaryColor: "#E11D48",
  position: "bottom-right",
};
```
