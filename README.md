### 👤 Author

**Drake Phillips**  
Electrical Engineering student @ Cal Poly SLO  
Exploring how AI and engineering design principles intersect to create faster, smarter app development workflows.

# ShowCase — AI-Enhanced App Creation Platform

## 🚀 Overview

**ShowCase** is a web application originally built with **Lovable**, then expanded into a cross-platform app using modern web technologies.  
The goal of this project is to streamline how creatives and clients connect, while exploring how **AI-assisted development** can accelerate real product creation.

This project demonstrates how I’m combining my **Electrical Engineering background** with **software design and AI tools** to:

- Rapidly prototype and deploy production-ready web apps.
- Automate repetitive UI, deployment, and configuration tasks using AI generation workflows.
- Integrate human design insight with AI-generated components for faster iteration and more consistent code.

ShowCase serves as both a **portfolio project** and a **proof of concept** for leveraging AI to reduce the barrier to app development.

---

## 🧠 Key Objectives

- **AI-Assisted Development:** Build, iterate, and deploy complete web experiences using natural-language prompts in Lovable and refine them in code.
- **Cross-Platform Integration:** Prepare the web app for use as a **PWA** and wrap it in **Capacitor** to publish to iOS and Android.
- **Design Consistency:** Use component libraries (shadcn-ui, TailwindCSS) and AI-generated assets to maintain a polished, responsive UI across devices.
- **Automation:** Sync all updates through GitHub for continuous deployment and version control.

---

## ⚙️ Tech Stack

- **Framework:** Vite + React + TypeScript
- **UI Components:** shadcn-ui
- **Styling:** Tailwind CSS
- **Deployment / Hosting:** Lovable + GitHub
- **Native Wrapper (planned):** Capacitor for iOS / Android
- **AI Integration:** Lovable’s AI builder for scaffolding pages, UI, and logic

---

## 💡 How to Edit and Run Locally

You can modify the project either directly in Lovable or locally using your IDE.

### Option 1 — Edit in Lovable

Visit the [Lovable Project](https://lovable.dev/projects/ba19f4f0-46f2-4ef2-be61-5809ed262a98).  
All changes made there automatically sync with this repository.

### Option 2 — Edit Locally

1. Clone the repository
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```
2. Install dependencies
   ```bash
   npm i
   ```
3. Start the development server
   ```bash
   npm run dev
   ```

### Option 3 — GitHub Codespaces

- Open your repo on GitHub.
- Click **Code → Codespaces → New Codespace**.
- Edit files directly in your browser IDE.

---

## 🌍 Deployment

Publish directly through [Lovable](https://lovable.dev/projects/ba19f4f0-46f2-4ef2-be61-5809ed262a98)  
→ **Share → Publish**  
or connect a custom domain via **Project → Settings → Domains**.

---

## 📈 Future Plans

- Integrate AI-powered recommendation and matching for clients and creators.
- Implement analytics to measure engagement and optimize design.
- Extend the build pipeline for direct mobile app store deployment.

---

## 🎯 Google AdSense Setup

This project is configured to support Google AdSense for monetization. Follow these steps to activate it:

### 1. Add Your AdSense Script

- **File:** `index.html` (lines 30-32)
- **What to do:** Replace the existing `<script>` tag with the AdSense code snippet from your [Google AdSense dashboard](https://www.google.com/adsense/).
- **Important:** Update the `client=ca-pub-XXXXXXXXXX` parameter with your actual AdSense publisher ID.

### 2. Update ads.txt

- **File:** `public/ads.txt`
- **What to do:** Replace `PUB-ID-GOES-HERE` with your real Google AdSense publisher ID (the number after `ca-pub-` in your AdSense account).
- **Example:** If your publisher ID is `ca-pub-1234567890123456`, the file should read:
  ```
  google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
  ```
- **Note:** This file will be accessible at `https://showcasewithus.org/ads.txt` after deployment. Google AdSense requires this file to verify site ownership.

### 3. Verify in AdSense

After deploying these changes:
1. Go to your [Google AdSense dashboard](https://www.google.com/adsense/)
2. Add your site (showcasewithus.org) if you haven't already
3. Google will check for the AdSense script in your HTML and the ads.txt file at the root
4. Once verified, ads will start serving on your site

---
