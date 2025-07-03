# Dual Authentication Setup: Phone OTP + Google Gmail

This guide sets up Cognito hosted UI with **two authentication options**:
1. **Phone Number + OTP** (SMS verification)
2. **Existing Gmail** (Google sign-in)

## 🎯 What Users Will See

### Option 1: Phone Login
- Enter phone number
- Receive SMS OTP
- Enter OTP to verify
- Enter name to complete registration

### Option 2: Gmail Login
- Click "Sign in with Google"
- Choose existing Gmail account
- Automatically get name and email from Google
- No phone number required

## 🚀 Quick Setup

### Step 1: Deploy Without Google (Phone Only)
```bash
aws cloudformation create-stack \
  --stack-name homeorder-cognito-stack \
  --template-body file://cognito-user-pool.yaml \
  --parameters file://parameters-fixed.json \
  --capabilities CAPABILITY_NAMED_IAM
```

### Step 2: Add Google OAuth (Optional)
1. **Get Google Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 Client ID
   - **Important**: Set redirect URI to:
     ```
     https://homeorder-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```

2. **Update Parameters**:
   ```json
   {
     "ParameterKey": "GoogleClientId",
     "ParameterValue": "YOUR_GOOGLE_CLIENT_ID"
   },
   {
     "ParameterKey": "GoogleClientSecret",
     "ParameterValue": "YOUR_GOOGLE_CLIENT_SECRET"
   }
   ```

3. **Update Stack**:
   ```bash
   aws cloudformation update-stack \
     --stack-name homeorder-cognito-stack \
     --template-body file://cognito-user-pool.yaml \
     --parameters file://parameters-fixed.json \
     --capabilities CAPABILITY_NAMED_IAM
   ```

## 🎨 Customize Hosted UI

### Access UI Customization
1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Select your User Pool: `homeorder-user-pool`
3. Go to **App integration** → **UI customization**

### Customize Text
- **Sign-in page**: "Sign in with phone or Google"
- **Sign-up page**: "Create account with phone or Google"
- **Phone tab**: "Phone Number"
- **Google tab**: "Gmail Account"

### Customize Appearance
- Upload your logo
- Set brand colors
- Add custom CSS if needed

## 🔗 Integration with Your App

### Get Hosted UI URL
After deployment, your hosted UI will be:
```
https://homeorder-auth.auth.us-east-1.amazoncognito.com/login?client_id=YOUR_CLIENT_ID&response_type=code&scope=openid+profile+email+phone&redirect_uri=https://howto-aws.com/auth.html
```

### Redirect Users
```javascript
function loginWithHostedUI() {
    const hostedUIUrl = 'https://homeorder-auth.auth.us-east-1.amazoncognito.com/login?client_id=YOUR_CLIENT_ID&response_type=code&scope=openid+profile+email+phone&redirect_uri=https://howto-aws.com/auth.html';
    window.location.href = hostedUIUrl;
}

// Add login button
document.getElementById('login-btn').addEventListener('click', loginWithHostedUI);
```

## 🧪 Test Both Flows

### Test Phone Authentication
1. Visit hosted UI
2. Click "Phone Number" tab
3. Enter phone number
4. Enter SMS OTP
5. Enter name
6. Complete registration

### Test Google Authentication
1. Visit hosted UI
2. Click "Gmail Account" tab
3. Choose Google account
4. Grant permissions
5. Redirected back to your app

## 🔧 Important Notes

### Phone Number Handling
- **Phone users**: Must provide phone number
- **Google users**: Phone number is optional
- **Mixed users**: Can link phone to Google account later

### User Attributes
- **Phone users**: name, phone_number
- **Google users**: name, email, given_name, family_name
- **Both**: Can have all attributes

### Security
- Both methods are secure
- Google users get additional security from Google
- Phone users get SMS verification

## 🚨 Troubleshooting

### Google Sign-in Issues
- Check redirect URI in Google Console
- Ensure Google+ API is enabled
- Verify OAuth credentials

### Phone OTP Issues
- Check IAM role permissions
- Verify phone number format
- Check AWS SMS limits

### Hosted UI Issues
- Ensure domain is available
- Check callback URLs match exactly
- Verify User Pool is active

## 🎉 Success!

Your users will now have:
- ✅ **Phone OTP**: Traditional SMS verification
- ✅ **Gmail Login**: Quick Google sign-in
- ✅ **Hosted UI**: Beautiful, branded login page
- ✅ **Seamless Experience**: Works with `howto-aws.com`

---

**Ready to deploy?** Start with phone-only authentication, then add Google later! 