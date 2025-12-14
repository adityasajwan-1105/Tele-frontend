# Video Call Setup Guide

## Problem
You're seeing the error: "Video consultation is not configured. Please contact support."

This happens because ZEGOCLOUD credentials are not configured in your environment variables.

## Solution: Set Up ZEGOCLOUD (Free Tier Available)

### Step 1: Create a ZEGOCLOUD Account

1. Go to [ZEGOCLOUD Console](https://console.zegocloud.com/)
2. Sign up for a free account (no credit card required for free tier)
3. Verify your email address

### Step 2: Create a Project

1. After logging in, click **"Create Project"**
2. Enter a project name (e.g., "Telemedicine App")
3. Select **"Video Call"** as the product
4. Click **"Create"**

### Step 3: Get Your Credentials

1. In your project dashboard, you'll see:
   - **App ID** (a number like `1234567890`)
   - **Server Secret** (a long string)

2. Copy both values

### Step 4: Create `.env` File in Frontend Directory

1. Navigate to the `frontend` directory
2. Create a new file named `.env` (not `.env.example`)
3. Add the following content:

```env
VITE_ZEGO_APP_ID=your_app_id_here
VITE_ZEGO_SERVER_SECRET=your_server_secret_here
VITE_API_URL=http://localhost:5000
```

4. Replace `your_app_id_here` with your actual App ID
5. Replace `your_server_secret_here` with your actual Server Secret

**Example:**
```env
VITE_ZEGO_APP_ID=1234567890
VITE_ZEGO_SERVER_SECRET=abcdef1234567890abcdef1234567890
VITE_API_URL=http://localhost:5000
```

### Step 5: Restart the Frontend Dev Server

After creating the `.env` file:

1. Stop the frontend server (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   cd frontend
   npm start
   ```

### Step 6: Test the Video Call

1. Log in to your application
2. Create or join an appointment
3. Click the video call button
4. The video call should now work!

## Free Tier Limits

ZEGOCLOUD offers a free tier with:
- 10,000 minutes per month
- Up to 50 concurrent users
- Perfect for development and small-scale testing

## Troubleshooting

### Still seeing the error?

1. **Check the `.env` file location**: It must be in the `frontend` directory (same level as `package.json`)
2. **Check variable names**: They must start with `VITE_` for Vite to read them
3. **Restart the dev server**: Environment variables are only loaded when the server starts
4. **Check for typos**: Make sure there are no spaces around the `=` sign
5. **Verify credentials**: Double-check your App ID and Server Secret in the ZEGOCLOUD console

### Need Help?

- ZEGOCLOUD Documentation: https://docs.zegocloud.com/
- ZEGOCLOUD Support: Available in the console dashboard


