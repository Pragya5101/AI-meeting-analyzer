# AI Meeting Summarizer

A complete, production-ready full-stack web application that allows users to upload meeting transcripts (PDF/TXT) or paste text notes, and automatically generates AI-powered summaries, key discussion points, decisions, and follow-up action items using the Google Gemini API.

The UI is designed to look like a clean, practical, internal developer-oriented tool using standard CSS grids, forms, and solid layouts (strictly no heavy landing pages, Tailwind, or complex animations).

---

## Technical Architecture

* **Frontend**: React.js (Vite, Axios API layer, React Router)
* **Backend**: Django REST Framework (simplejwt auth, psycopg2 database driver, django-storages S3 adapter)
* **Database**: PostgreSQL (Dockerized or Amazon RDS)
* **AI Integration**: Google Gemini API via official `google-genai` SDK (`gemini-2.5-flash` model)
* **Cloud Storage**: AWS S3 (for uploaded transcripts) with local storage fallback
* **Containerization**: Docker & Docker Compose
* **Host**: AWS EC2

---

## Repository Structure

```text
├── backend/
│   ├── core/               # Django project configurations
│   ├── meetings/           # Meeting management (Models, Views, Gemini Services)
│   ├── users/              # Authentication and JWT profiles
│   ├── Dockerfile          # Backend container configurations
│   └── requirements.txt    # Python package dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # Protected route wrappers
│   │   ├── pages/          # Login, Register, Dashboard, Create Meeting, Details
│   │   ├── api.js          # Axios configured client with JWT auto-refresh
│   │   └── App.jsx         # Main router entrypoint
│   │   └── index.css       # Core design styles (internal developer layout)
│   ├── nginx.conf          # Nginx production configurations
│   └── Dockerfile          # Frontend multi-stage container
├── docker-compose.yml      # Service orchestration configuration
├── .env                    # System-wide environment variables template
└── README.md               # Deployment and Setup Guide
```

---

## Local Installation (Development)

### Backend Setup

1. **Create and Activate Virtual Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   DJANGO_SECRET_KEY=dev-secret-key-123
   DJANGO_DEBUG=True
   DJANGO_ALLOWED_HOSTS=*

   # Optional (leave blank to fall back to SQLite locally):
   DB_HOST=
   DB_NAME=
   DB_USER=
   DB_PASSWORD=

   # Google Gemini Credentials:
   GEMINI_API_KEY=your_actual_gemini_api_key

   # Optional S3 Storage Configuration (leave blank to fall back to Local Storage):
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_STORAGE_BUCKET_NAME=
   ```

4. **Run Migrations**:
   ```bash
   python backend/manage.py makemigrations
   python backend/manage.py migrate
   ```

5. **Start Dev Server**:
   ```bash
   python backend/manage.py runserver
   ```
   The backend will be available at `http://localhost:8000`.

### Frontend Setup

1. **Navigate to folder**:
   ```bash
   cd frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`. Open it in your browser.

---

## Docker Deployment (Compose)

The application can be built and orchestrated in a single command using Docker Compose. This automatically spins up three containers: PostgreSQL database, Django backend (running migrations on startup), and Nginx frontend acting as an API proxy.

1. Configure `.env` in the root folder (ensure `GEMINI_API_KEY` is set).
2. Start containers:
   ```bash
   docker-compose up --build -d
   ```
3. The React app is available on port `80` (`http://localhost`). The backend is proxied behind `/api/` (and directly accessible at `http://localhost:8000`).

---

## Step-by-Step AWS EC2 Deployment Guide

Follow these steps to deploy the application in production on an AWS EC2 instance.

### Step 1: Launch an EC2 Instance
1. Log in to the **AWS Management Console** and navigate to the EC2 Dashboard.
2. Click **Launch Instance**.
3. **OS**: Choose **Ubuntu Server 24.04 LTS (HVM)** or **Ubuntu Server 22.04 LTS**.
4. **Instance Type**: Select **t3.micro** or **t3.small** (1-2 GB RAM is sufficient for this application).
5. **Key Pair**: Create or select an existing SSH key pair and download the `.pem` file.
6. **Network Settings (Security Group)**:
   Configure the inbound rules to allow traffic:
   * **SSH**: Port `22` (restrict to your IP for security).
   * **HTTP**: Port `80` (Anywhere `0.0.0.0/0`) - for React frontend.
   * **Custom TCP**: Port `8000` (optional, if you want to inspect backend APIs directly).

### Step 2: Install Docker and Docker Compose on EC2
Connect to your EC2 instance via SSH:
```bash
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

Run the following commands to install Docker and Docker Compose:
```bash
# Update package index
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Docker dependencies
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add Ubuntu user to docker group (removes the need for sudo when executing docker commands)
sudo usermod -aG docker ubuntu

# Install Docker Compose (V2 plugin)
sudo apt-get install -y docker-compose-plugin
```
*Note: Log out and log back in to apply the docker group changes:*
```bash
exit
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Deploy the Code to EC2
You can either clone the repository from GitHub or upload it from your local machine.

Using `rsync` from your local workspace:
```bash
rsync -avz -e "ssh -i /path/to/your-key.pem" --exclude "venv" --exclude "node_modules" --exclude ".git" ./ ubuntu@your-ec2-public-ip:~/meeting-summarizer
```

### Step 4: Configure Environments on EC2
On the EC2 shell, navigate to the uploaded folder:
```bash
cd ~/meeting-summarizer
```

Create a production `.env` file:
```bash
nano .env
```
Paste and fill in the production configurations:
```env
DJANGO_SECRET_KEY=insert-a-very-long-secure-random-string
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-ec2-public-ip,your-custom-domain.com

# PostgreSQL Credentials (corresponds to docker-compose.yml values)
DB_HOST=db
DB_NAME=meetings_db
DB_USER=postgres_admin
DB_PASSWORD=choose_a_strong_password_for_prod
DB_PORT=5432

# Google Gemini API Credentials
GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere

# AWS S3 Storage Credentials (to upload files to AWS S3 rather than local storage)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_STORAGE_BUCKET_NAME=your-production-s3-bucket-name
AWS_S3_REGION_NAME=us-east-1
```
Press `Ctrl + O` and `Enter` to save, and `Ctrl + X` to exit.

**Ensure values match `docker-compose.yml`**:
Open `docker-compose.yml` and make sure database variables (`DB_PASSWORD`, `DB_USER`) align with the new credentials set in `.env`.

### Step 5: Start the Application Containers
Build and run the production docker services:
```bash
docker compose up -d --build
```

You can view running container statuses:
```bash
docker compose ps
```

And inspect execution logs:
```bash
docker compose logs -f
```

---

## AWS S3 Bucket CORS Configuration
If you choose to use AWS S3 storage for files and retrieve them from the frontend, add the following CORS policy on your S3 Bucket:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": [],
        "MaxAgeSeconds": 3000
    }
]
```
*(You may restrict `AllowedOrigins` to your specific domain for production launch).*
