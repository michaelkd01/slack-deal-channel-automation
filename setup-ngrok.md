# Setting up HTTPS for Slack OAuth

Since Slack requires HTTPS for OAuth redirect URLs, you need to set up ngrok:

## Steps:

1. **Sign up for ngrok** (free account):
   - Go to https://dashboard.ngrok.com/signup
   - Create a free account

2. **Get your authtoken**:
   - After signing in, go to https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Configure ngrok**:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN_HERE
   ```

4. **Start ngrok tunnel**:
   ```bash
   ngrok http 3000
   ```

5. **Copy the HTTPS URL** from ngrok output (looks like: https://abc123.ngrok-free.app)

6. **Update your Slack app**:
   - Go to https://api.slack.com/apps
   - Select your app
   - Go to OAuth & Permissions
   - Add the redirect URL: `https://YOUR_NGROK_URL.ngrok-free.app/api/slack/oauth_redirect`
   - Save URLs

7. **Update .env file**:
   - Change APP_URL to your ngrok HTTPS URL
   - Keep FRONTEND_URL as http://localhost:3001

8. **Restart the backend server** to pick up the new environment variables

## Alternative: Use a self-signed certificate

If you prefer not to use ngrok, you can create a self-signed SSL certificate for local development, though ngrok is simpler for testing.