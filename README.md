# Enterprise Freight Dispatch Management & TMS System

A full-featured, standalone Freight Dispatch Management System, TMS, Fleet Carrier CRM, Sales CRM, HR Hub, and Driver Settlement Platform.

---

## 🚀 Quick Download & Distribution Guide

### How to Download This Entire App as a Standalone ZIP:
1. In the **Google AI Studio** workspace:
2. Open the top-right **Project Settings / Export Menu**.
3. Click **"Export to ZIP"** (or **"Export to GitHub"**).
4. Save the ZIP file to your computer.
5. You can now send this ZIP to any client, business partner, or colleague.

> **Data Privacy Guarantee**: The downloaded package contains **zero private company data**. All personal records, client documents, and financial data stay strictly inside your own private account. Any recipient starts with a clean, ready-to-brand installation with sample placeholder settings.

---

## 💻 How to Run on a Local Computer (Windows / Mac / Linux)

### Requirements:
- **Node.js**: Version 18, 20, or newer ([Download Node.js](https://nodejs.org/))
- **NPM**: Bundled with Node.js

### 3-Step Setup:
```bash
# 1. Unzip the downloaded file and open a terminal in the folder
cd freight-dispatch-system

# 2. Install all required dependencies
npm install

# 3. Launch the application
npm run dev
```

Your app is now live at:
👉 **`http://localhost:3000`**

### Default Administrator Login:
- **Username**: `admin`
- **Password**: `admin123`
*(You can create new users and change passwords immediately inside the User Seats & Roles tab)*.

---

## 🐳 Option 2: Run with Docker (1-Command Start)

If you or your recipient prefer Docker:

```bash
# Start container in the background
docker compose up --build -d
```

The system will build and serve the production app at **`http://localhost:3000`**.

To stop the container:
```bash
docker compose down
```

---

## ☁️ Option 3: Deploy to a Cloud Server or Host

This system is built as a high-performance modern web application (React 19 + Vite + Tailwind CSS) and can be hosted anywhere:

### 1. Vercel / Netlify / Render (Recommended for Free or Cheap Cloud Hosting)
- Push code to GitHub.
- Connect your repository in Vercel or Netlify.
- Set **Build Command**: `npm run build`
- Set **Output Directory**: `dist`
- Deploy! Your app will have a live public HTTPS URL in under 2 minutes.

### 2. Google Cloud Run / AWS / DigitalOcean (Docker Container)
- Deploy using the provided `Dockerfile`.
- Port: `3000`

### 3. Traditional Linux VPS (Ubuntu / Debian / Nginx)
```bash
npm install
npm run build
```
Point Nginx or Apache to serve the static files in the `/dist` directory.

---

## 🏢 Setting Up for Your Own Company

When a new user launches the app for the first time:

1. **Company Branding**:
   - Click **Company Settings** in the top navigation bar.
   - Enter your company name, MC number, USDOT number, dispatch phone, email, and address.
   - Upload your company logo or letterhead.

2. **Add Your Team**:
   - Go to **Team Seats & Permissions**.
   - Add Dispatchers, Sales Representatives, and Managers.

3. **Add Your Fleet & Carriers**:
   - Use the **Carriers Hub** to enter owner-operators, factoring partners, insurance policies, and compliance docs.
   - Use the **Driver Directory** to assign trucks and equipment types.

4. **Optional Starter Data**:
   - A clean sample file named `sample-company-template.json` is included in the root folder.
   - Go to **Settings > System Backups > Import Backup** and select `sample-company-template.json` to load demonstration carriers, sample loads, and training scripts.

---

## 🔒 Cloud Database vs. Offline-First Mode

- **Zero-Cloud / Offline-First Mode**: By default, the app stores all operational records in the user's browser local database (`localStorage` / IndexedDB). No cloud database setup is required.
- **Optional Firebase Cloud Sync**: If you want multi-device cloud synchronization across multiple offices, you can add your own free Firebase credentials to `.env`:
  ```env
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
  ```

---

## 📦 Package Summary
- **Frontend Framework**: React 19, TypeScript, Vite, Motion, Lucide Icons
- **Styling**: Tailwind CSS v4
- **PDF Generation**: Built-in jsPDF engine for Driver Settlement Slips, Rate Cons, and HR Letters
- **Containerization**: Dockerfile & docker-compose.yml included
