# AWS Cognito Setup Guide for HomeOrder

This guide will help you set up AWS Cognito authentication with phone number verification for your HomeOrder app hosted on AWS Amplify.

## 🚀 Prerequisites

- AWS Account
- AWS Amplify app already deployed
- Basic knowledge of AWS services

## 📋 Step-by-Step Setup

### 1. Create AWS Cognito User Pool

#### Step 1.1: Navigate to Cognito
1. Go to AWS Console
2. Search for "Cognito"
3. Click on "Amazon Cognito"
4. Click "Create user pool"

#### Step 1.2: Configure User Pool
1. **Step 1: Configure sign-in experience**
   - Choose "Cognito user pool"
   - Click "Next"

2. **Step 2: Configure security requirements**
   - Password policy: Choose "Cognito defaults" or customize
   - Multi-factor authentication: Select "Required"
   - User account recovery: Select "Self-service recovery"
   - Click "Next"

3. **Step 3: Configure sign-up experience**
   - Self-service sign-up: **Enable**
   - Cognito-assisted verification and confirmation: **Enable**
   - Required attributes: Select **"Phone number"**
   - Optional attributes: Add any additional fields you want
   - Click "Next"

4. **Step 4: Configure message delivery**
   - Email provider: Choose "Send email with Cognito"
   - SMS provider: Choose "Send SMS with Cognito" (for phone verification)
   - Click "Next"

5. **Step 5: Integrate your app**
   - User pool name: `homeorder-user-pool`
   - Initial app client: Select "Public client"
   - App client name: `homeorder-client`
   - Client secret: **Do not generate a client secret**
   - Click "Next"

6. **Step 6: Review and create**
   - Review your settings
   - Click "Create user pool"

### 2. Configure User Pool Settings

#### Step 2.1: Message Customization
1. In your user pool, go to "Messaging"
2. Customize SMS messages:
   ```
   Your HomeOrder verification code is {####}
   ```
3. Customize email messages (if using email verification)

#### Step 2.2: App Integration Settings
1. Go to "App integration" tab
2. Note down:
   - **User Pool ID** (e.g., `us-east-1_xxxxxxxxx`)
   - **App client ID** (e.g., `xxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Region** (e.g., `us-east-1`)

### 3. Configure App Client Settings

#### Step 3.1: App Client Configuration
1. In "App integration" → "App client list"
2. Click on your app client
3. Under "Authentication flows":
   - Enable "ALLOW_USER_PASSWORD_AUTH"
   - Enable "ALLOW_REFRESH_TOKEN_AUTH"
4. Under "OAuth 2.0":
   - Select "Authorization code grant"
   - Add callback URLs: `https://your-amplify-domain.com/auth.html`
   - Add sign-out URLs: `https://your-amplify-domain.com/`

### 4. Update Your Application Code

#### Step 4.1: Update Cognito Configuration
Edit `auth-script.js` and replace the placeholder values:

```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_xxxxxxxxx', // Your User Pool ID
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Your App Client ID
    Region: 'us-east-1' // Your AWS Region
};
```

#### Step 4.2: Add Authentication to Main App
The authentication is already integrated into your main app. The system will:
- Check authentication status on page load
- Show login button for unauthenticated users
- Show user profile for authenticated users
- Require login for checkout

### 5. Test the Authentication

#### Step 5.1: Test Phone Number Registration
1. Open your app
2. Click "Login"
3. Enter a phone number with country code
4. Verify the SMS code
5. Check if user is redirected to main app

#### Step 5.2: Test User Session
1. Refresh the page
2. Verify user remains logged in
3. Test logout functionality

## 🔧 Advanced Configuration

### 1. Custom User Attributes

To add custom user attributes (like name, address):

1. Go to User Pool → "Sign-up experience"
2. Add custom attributes
3. Update the sign-up code in `auth-script.js`:

```javascript
const attributeList = [
    new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: 'phone_number',
        Value: fullPhoneNumber
    }),
    new AmazonCognitoIdentity.CognitoUserAttribute({
        Name: 'custom:name',
        Value: userName
    })
];
```

### 2. Password Policy Customization

1. Go to User Pool → "Security"
2. Customize password requirements
3. Set minimum length, complexity, etc.

### 3. MFA Configuration

1. Go to User Pool → "Security"
2. Configure MFA settings
3. Choose between SMS, TOTP, or both

## 📱 Mobile Integration

### React Native Setup
If you want to create a mobile app:

```bash
npm install amazon-cognito-identity-js
```

```javascript
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
    UserPoolId: 'YOUR_USER_POOL_ID',
    ClientId: 'YOUR_CLIENT_ID'
});
```

### Flutter Setup
```yaml
dependencies:
  amazon_cognito_identity_dart: ^3.0.0
```

## 🔒 Security Best Practices

### 1. Environment Variables
Store sensitive configuration in environment variables:

```javascript
const COGNITO_CONFIG = {
    UserPoolId: process.env.COGNITO_USER_POOL_ID,
    ClientId: process.env.COGNITO_CLIENT_ID,
    Region: process.env.AWS_REGION
};
```

### 2. HTTPS Only
Ensure your app runs on HTTPS in production.

### 3. Token Management
- Store tokens securely
- Implement token refresh
- Clear tokens on logout

### 4. Rate Limiting
Configure rate limits in Cognito to prevent abuse.

## 🚨 Troubleshooting

### Common Issues

#### 1. "User does not exist" Error
- Check if user pool ID is correct
- Verify app client configuration
- Ensure user pool is in the correct region

#### 2. SMS Not Received
- Check SMS configuration in Cognito
- Verify phone number format
- Check AWS SNS limits

#### 3. Token Expiration
- Implement automatic token refresh
- Handle session expiration gracefully
- Redirect to login when tokens expire

#### 4. CORS Issues
- Configure allowed origins in Cognito
- Add your domain to callback URLs
- Check browser console for CORS errors

### Debug Mode
Enable debug logging:

```javascript
// Add to auth-script.js
console.log('Cognito Config:', COGNITO_CONFIG);
console.log('User Pool:', userPool);
```

## 📊 Monitoring and Analytics

### 1. CloudWatch Logs
- Enable user pool logging
- Monitor authentication events
- Set up alerts for failed logins

### 2. Cognito Analytics
- Track user sign-ups
- Monitor authentication success rates
- Analyze user behavior

### 3. Custom Metrics
```javascript
// Track authentication events
function trackAuthEvent(event, success) {
    // Send to your analytics service
    console.log(`Auth Event: ${event}, Success: ${success}`);
}
```

## 🔄 Deployment Checklist

### Pre-Deployment
- [ ] Update Cognito configuration with real values
- [ ] Test authentication flow
- [ ] Verify SMS delivery
- [ ] Check error handling
- [ ] Test session management

### Post-Deployment
- [ ] Monitor authentication logs
- [ ] Test with real phone numbers
- [ ] Verify HTTPS configuration
- [ ] Check mobile responsiveness
- [ ] Monitor error rates

## 📞 Support

### AWS Support
- AWS Cognito Documentation
- AWS Support Center
- AWS Forums

### Common Resources
- [AWS Cognito Developer Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/)
- [Cognito Identity JS Documentation](https://github.com/amazon-archives/amazon-cognito-identity-js)
- [AWS Amplify Documentation](https://docs.amplify.aws/)

---

## 🎯 Quick Reference

### Configuration Values
```javascript
// Replace these in auth-script.js
UserPoolId: 'us-east-1_xxxxxxxxx'
ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
Region: 'us-east-1'
```

### Test Phone Numbers
- Use real phone numbers for testing
- AWS provides test phone numbers in some regions
- Consider using SMS testing services

### Environment Variables
```bash
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
```

---

**Your HomeOrder app is now ready with secure phone number authentication! 🍕📱🔐** 