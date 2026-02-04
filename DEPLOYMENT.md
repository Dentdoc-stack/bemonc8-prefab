# Google Cloud Run Deployment Guide

## Method 1: Deploy from Google Cloud Console (Easiest - No Installation)

If you don't want to install anything on your computer, you can use **Cloud Shell** directly in your browser:

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project.
3. Click the **Activate Cloud Shell** icon (>_) in the top right toolbar.
4. In the Cloud Shell terminal, click the **Three Dots Menu** -> **Upload**.
5. Upload your project folder (zip it first on your computer: `flood-dashboard.zip`).
6. In the terminal, unzip and deploy:
   ```bash
   unzip flood-dashboard.zip
   cd flood-dashboard-main  # or whatever the unzipped folder is named
   gcloud run deploy flood-dashboard --source . --region us-central1 --allow-unauthenticated
   ```

## Method 2: Deploy from Your Computer (CLI)

1. **Install Google Cloud CLI**: [Download Link](https://cloud.google.com/sdk/docs/install)
2. **Login**:
   ```powershell
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Deploy**:
   ```powershell
   cd c:\Users\User\Documents\Flooddashboard-main
   gcloud run deploy flood-dashboard --source . --region us-central1 --allow-unauthenticated
   ```

## Method 3: Connect to GitHub (Continuous Deployment)

Use this when you want Cloud Run to redeploy automatically on every push.

1. Push your code to GitHub (main branch recommended).
2. In Google Cloud Console, open **Cloud Run** → **Create service**.
3. Under **Source**, choose **Cloud Build** (not Developer Connect) and click **Set up Cloud Build**. Authorize if prompted.
4. Pick your GitHub repo and branch; choose build type **Dockerfile** (uses the repo’s Dockerfile at the root).
5. In **Configure**, set:
   - **Service name**: e.g., `flood-dashboard` (required).
   - **Region**: pick the target region (e.g., `asia-southeast1` to match the screenshot, or your preferred region close to users).
   - **Authentication**: check **Allow unauthenticated invocations** unless you plan to secure access.
6. Click **Create**. Cloud Build will run; the first deploy may take a few minutes. Future pushes to the selected branch will trigger new revisions automatically.

---

## Configuration Details

### Dockerfile
The included `Dockerfile` is optimized for production. Cloud Run will automatically use it to build your container.

### Environment Variables
If you need to set environment variables (api keys, etc):
```bash
gcloud run deploy flood-dashboard \
  --source . \
  --set-env-vars="KEY=VALUE,ANOTHER=VALUE"
```

### Custom Domain
After deployment, you can map a custom domain (e.g., dashboard.yourcomapny.com) in the "Manage Custom Domains" tab of your Cloud Run service.
