# Google OAuth Configuration Guide

## Error Details
The error "You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy" indicates that the redirect URI being used in production doesn't match what's registered in Google Cloud Console.

## How to Fix

1. **Log into Google Cloud Console**
   - Go to https://console.cloud.google.com/
   - Select the project you're using for Obsidian OAuth

2. **Update the OAuth Configuration**
   - Navigate to APIs & Services > Credentials
   - Find and edit the OAuth 2.0 Client ID used for Obsidian
   - Under "Authorized redirect URIs", add the following URI:
     ```
     https://obsidian-vokal.vercel.app/api/auth/callback/google
     ```
     (Note: Make sure there's only a single slash after the domain name)

3. **Check Existing URIs**
   - Remove any incorrect URIs (like ones with double slashes)
   - Ensure the format matches exactly what NextAuth.js expects
   - If you're using multiple domains, add each with the proper path

4. **Update Environment Variables**
   - Ensure `NEXTAUTH_URL` is properly set in your Vercel environment:
     ```
     NEXTAUTH_URL=https://obsidian-vokal.vercel.app
     ```
   - Make sure both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set

5. **Verify Domain Configuration**
   - Make sure your domain is verified in Google Cloud Console
   - Check that your app's OAuth consent screen is properly configured

## Testing
After making these changes, test the Google sign-in flow again. The error should be resolved.

## Additional Configuration
If needed, you can add the following authorized JavaScript origins to your Google Cloud Console OAuth 2.0 client:
```
https://obsidian-vokal.vercel.app
```

## Common Mistakes to Avoid
- Double slashes in redirect URIs (e.g., `//api/auth` instead of `/api/auth`)
- Forgetting to include the `/api/auth/callback/google` path
- Mismatched protocols (http vs https)
- Typos in domain names or paths 