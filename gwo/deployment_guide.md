# Production Deployment Guide: AI Global Wealth Optimizer

## 🌐 1. Deploying the React Frontend on Vercel

Vercel is the optimal hosting platform for Vite/React applications.

1. Create a GitHub repository for your project and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Global Wealth Optimizer"
   git branch -M main
   git remote add origin https://github.com/YourUsername/wealth-optimizer.git
   git push -u origin main
   ```
2. Navigate to [vercel.com](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Vercel will auto-detect **Vite**. Leave build commands as default (`npm run build`).
5. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-url.onrender.com` 
     *(Replace `your-backend-url` after deploying Render)*
6. Click **Deploy**. Your stunning glassmorphic frontend is now live!

---

## 🚀 2. Deploying the Python FastAPI MCP Backend on Render (or Railway)

Render provides seamless free/paid tiers for Python backend applications relying on ML.

1. In your `fastapi_backend/` folder, ensure your `requirements.txt` is up-to-date:
   - Contains: `fastapi, uvicorn, motor, langchain, scikit-learn`, etc.
2. Sign into [Render.com](https://render.com/).
3. Click **New +** -> **Web Service**.
4. Connect the GitHub repository containing your FastAPI code.
5. Setup the Runtime settings:
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add your required **Environment Variables**:
   - `MONGO_URI` = `mongodb+srv://your_username:password@cluster.mongodb.net/wealth_db`
   - `JWT_SECRET` = `your-super-strong-jwt-secret-string`
7. Click **Create Web Service**. 
8. Render will compile your pip libraries (including FAISS & PyTorch strings). Once fully deployed, it will provide your live API URL (e.g., `https://wealth-api.onrender.com`).

*(Ensure you copy this URL and drop it into your Frontend's `VITE_API_URL` locally or on Vercel!)*
