# HomeOrder Cognito Hosted UI Setup Guide

This guide will help you set up AWS Cognito hosted UI with phone number authentication and Google sign-in for your `howto-aws.com` domain.

## 🎯 What We're Building

- **Phone Number + Name Authentication**: Users can sign up/sign in with their phone number and name
- **Google Sign-In**: Users can authenticate using their existing Google account
- **Hosted UI**: Beautiful, customizable login page hosted by AWS Cognito
- **Seamless Integration**: Works with your `howto-aws.com` domain

## 📋 Prerequisites

1. **AWS CLI** installed and configured
2. **Google Cloud Console** access (for Google OAuth)
3. **Domain**: `howto-aws.com` (already configured)

## 🚀 Step 1: Deploy the CloudFormation Stack

### Option A: Deploy without Google (Phone only)
```bash
cd homeapp/cloudformation
aws cloudformation create-stack \
  --stack-name homeorder-cognito-stack \
  --template-body file://cognito-user-pool.yaml \
  --parameters file://parameters-fixed.json \
  --capabilities CAPABILITY_NAMED_IAM
```

### Option B: Deploy with Google OAuth
1. Get Google OAuth credentials (see Step 2)
2. Update parameters with your Google credentials
3. Deploy the stack

## 🔐 Step 2: Set Up Google OAuth (Optional)

### 2.1 Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Configure OAuth consent screen:
   - **Application type**: Web application
   - **Name**: HomeOrder
   - **Authorized redirect URIs**: 
     ```
     https://homeorder-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
     ```
6. Copy the **Client ID** and **Client Secret**

### 2.2 Update Parameters with Google Credentials

Edit `parameters-fixed.json`:
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

### 2.3 Deploy with Google Support
```bash
aws cloudformation update-stack \
  --stack-name homeorder-cognito-stack \
  --template-body file://cognito-user-pool.yaml \
  --parameters file://parameters-fixed.json \
  --capabilities CAPABILITY_NAMED_IAM
```

## 🎨 Step 3: Customize the Hosted UI

### 3.1 Access Cognito Console
1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito/)
2. Select your User Pool: `homeorder-user-pool`
3. Go to **App integration** → **UI customization**

### 3.2 Customize Appearance
- **Logo**: Upload your company logo (recommended: 200x200px)
- **Primary color**: Choose your brand color
- **Background color**: Set background color
- **CSS**: Add custom CSS for advanced styling

### 3.3 Customize Text
- **Sign-in page**: Customize welcome message
- **Sign-up page**: Customize registration text
- **Error messages**: Customize error handling

## 🔗 Step 4: Integration with Your App

### 4.1 Get Configuration Details
After deployment, get these values from CloudFormation outputs:
```bash
aws cloudformation describe-stacks \
  --stack-name homeorder-cognito-stack \
  --query 'Stacks[0].Outputs'
```

### 4.2 Update Your Auth Script
Update `homeapp/auth-script.js` with the configuration:
```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_xxxxxxxxx',
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    Region: 'us-east-1',
    Domain: 'homeorder-auth',
    HostedUIUrl: 'https://homeorder-auth.auth.us-east-1.amazoncognito.com/login?client_id=xxxxxxxxxxxxxxxxxxxxxxxxxx&response_type=code&scope=openid+profile+email+phone&redirect_uri=https://howto-aws.com/auth.html'
};
```

### 4.3 Redirect to Hosted UI
Add this to your login page:
```javascript
function redirectToHostedUI() {
    const hostedUIUrl = COGNITO_CONFIG.HostedUIUrl;
    window.location.href = hostedUIUrl;
}

// Add login button
document.getElementById('login-btn').addEventListener('click', redirectToHostedUI);
```

## 🧪 Step 5: Test the Authentication Flow

### 5.1 Test Phone Number Authentication
1. Visit your hosted UI URL
2. Click "Sign up"
3. Enter phone number and name
4. Verify with SMS code
5. Complete registration

### 5.2 Test Google Sign-In (if configured)
1. Visit your hosted UI URL
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify redirect to your app

### 5.3 Test Callback Handling
1. Ensure your `auth.html` page handles the authorization code
2. Exchange code for tokens
3. Store user session

## 🔧 Step 6: Advanced Configuration

### 6.1 Custom Domain (Optional)
If you want to use a custom domain instead of Cognito's default:
1. Purchase a domain or use existing one
2. Configure DNS records
3. Update CloudFormation template with custom domain

### 6.2 Multi-Factor Authentication
- **SMS**: Already configured
- **TOTP**: Can be enabled for additional security
- **Email**: Can be configured as backup

### 6.3 User Pool Triggers
Configure Lambda functions for:
- **Pre-authentication**: Custom validation
- **Post-authentication**: User data processing
- **Pre-sign-up**: Registration validation

## 📱 Step 7: Mobile Integration

### 7.1 React Native / Flutter
Use AWS Amplify libraries:
```bash
npm install aws-amplify @aws-amplify/ui-react
```

### 7.2 Native iOS/Android
Use AWS SDK for mobile:
```bash
# iOS
pod 'AWSCognitoIdentityProvider'

# Android
implementation 'com.amazonaws:aws-android-sdk-cognitoidentityprovider:2.x.x'
```

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure callback URLs match exactly
   - Check for trailing slashes

2. **"Google sign-in not working"**
   - Verify Google OAuth credentials
   - Check redirect URI in Google Console
   - Ensure Google+ API is enabled

3. **"SMS not sending"**
   - Check IAM role permissions
   - Verify phone number format
   - Check AWS SMS spending limits

4. **"Hosted UI not loading"**
   - Verify domain name is available
   - Check CloudFormation stack status
   - Ensure User Pool is active

### Debug Commands
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name homeorder-cognito-stack

# Check User Pool
aws cognito-idp describe-user-pool --user-pool-id YOUR_USER_POOL_ID

# Check App Client
aws cognito-idp describe-user-pool-client --user-pool-id YOUR_USER_POOL_ID --client-id YOUR_CLIENT_ID
```

## 📊 Monitoring and Analytics

### CloudWatch Metrics
- **Sign-in attempts**
- **Sign-up success rate**
- **Authentication failures**
- **SMS delivery rates**

### User Analytics
- **User registration trends**
- **Authentication method preferences**
- **Session duration**
- **Geographic distribution**

## 🔒 Security Best Practices

1. **HTTPS Only**: Always use HTTPS for production
2. **Token Validation**: Validate tokens on server-side
3. **Session Management**: Implement proper session handling
4. **Rate Limiting**: Configure rate limits for authentication
5. **Audit Logging**: Enable CloudTrail for audit logs

## 🎉 Success!

Once deployed, your users will have:
- ✅ Beautiful hosted login page
- ✅ Phone number + name authentication
- ✅ Google sign-in option
- ✅ Seamless integration with `howto-aws.com`
- ✅ Secure token-based authentication

## 📞 Support

If you encounter issues:
1. Check CloudFormation stack events
2. Review CloudWatch logs
3. Verify AWS credentials and permissions
4. Test with AWS CLI commands

---

**Next Steps**: Deploy the stack and test the authentication flow! 