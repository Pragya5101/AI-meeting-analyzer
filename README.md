# AI Meeting Summarizer

A complete, production-ready full-stack web application that allows users to upload meeting transcripts (PDF/TXT) or paste text notes, and automatically generates AI-powered summaries, key discussion points, decisions, and follow-up action items using the Google Gemini API.

The UI is designed to look like a clean, practical, internal developer-oriented tool using standard CSS grids, forms, and solid layouts.

---

## Technical Architecture

* **Frontend**: React.js (Vite, Axios API layer, React Router)
* **Backend**: Django REST Framework (SimpleJWT, psycopg2 database driver, django-storages S3 adapter)
* **Database**: PostgreSQL (Dockerized or Neon.tech / AWS RDS) with local SQLite fallback
* **AI Integration**: Google Gemini API via official `google-genai` SDK (`gemini-2.5-flash` model)
* **Cloud Storage**: AWS S3 (for uploaded transcripts) with local filesystem fallback
* **Containerization**: Docker & Docker Compose
* **Hosting Options**: Vercel (Frontend) + Render.com (Backend) OR AWS EC2

---

## Local Installation (Development)

### 1. Configure Environment Variables
Create a file named `.env` in the root folder of your project:
```env
# Django Settings
DJANGO_SECRET_KEY=django-insecure-meeting-summarizer-key-12345
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=*

# Database Configuration (Leave blank to use local SQLite)
DB_HOST=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_PORT=5432

# Cloud Storage (Leave blank to use local filesystem)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=
AWS_S3_REGION_NAME=us-east-1

# Gemini AI Credentials (Required)
GEMINI_API_KEY=your_actual_google_gemini_api_key
```

### 2. Run the Backend
From the project root:
```bash
# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install requirements
pip install -r backend/requirements.txt

# Run migrations to initialize the database
python backend/manage.py migrate

# Start backend server
python backend/manage.py runserver
```
*The API is now running locally at `http://127.0.0.1:8000`.*

### 3. Run the Frontend
Open a **new, separate** terminal window:
```bash
# Navigate to frontend folder
cd frontend

# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
*The React app is now running locally at `http://localhost:5173`.*

---

## Option A: Deployment on Vercel + Render + Neon (Recommended & Free)

This is the easiest way to deploy the app for free without configuring virtual servers.

### Step 1: Create a PostgreSQL Database (Neon.tech)
1. Sign up at [Neon.tech](https://neon.tech/) and create a free project.
2. Copy your connection details (Host, Database Name, Username, and Password).

### Step 2: Deploy the Backend (Render.com)
1. Sign up on [Render.com](https://render.com/) and click **New +** &rarr; **Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Python`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `python manage.py migrate && gunicorn core.wsgi:application --bind 0.0.0.0:10000`
4. Add **Environment Variables**:
   * `GEMINI_API_KEY`: *Your Google Gemini API Key*
   * `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: *Your Neon connection details*
   * `DJANGO_SECRET_KEY`: *Any random secure string*
   * `DJANGO_DEBUG`: `False`
   * `DJANGO_ALLOWED_HOSTS`: `*`
5. Click **Create Web Service**. Once deployed, copy your backend URL (e.g. `https://your-backend.onrender.com`).

### Step 3: Deploy the Frontend (Vercel)
1. Sign up on [Vercel.com](https://vercel.com/) and import your GitHub repository.
2. Configure settings:
   * **Root Directory**: Select **`frontend`**
   * **Framework Preset**: Vite
3. Add **Environment Variables**:
   * **Key**: `VITE_API_URL`
   * **Value**: *Your Render URL (e.g. `https://your-backend.onrender.com` without a trailing `/`)*
4. Click **Deploy**. (React Router client-side rewrites are handled automatically by `frontend/vercel.json`).

---

## Option B: Deploying with Docker Compose (Local or Cloud Server)

To build and run the entire stack (PostgreSQL, Django, React, and Nginx proxy) in one command:

1. Configure `.env` in the root folder.
2. Start the services:
   ```bash
   docker compose up --build -d
   ```
3. Open `http://localhost` to access the application.

---

## Option C: Deploying to AWS EC2

### Step 1: Spin up Instance
1. Launch an EC2 Instance with **Ubuntu**.
2. Open ports **`22` (SSH)** and **`80` (HTTP)** in the Security Group.

### Step 2: Set up Environment
SSH into your instance and install Docker:
```bash
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
# Log out and log back in to apply docker group
```

### Step 3: Deploy and Start
1. Clone the project onto the EC2 instance.
2. Create a `.env` file at the root folder containing your credentials.
3. Start the containers:
   ```bash
   docker compose up --build -d
   ```
