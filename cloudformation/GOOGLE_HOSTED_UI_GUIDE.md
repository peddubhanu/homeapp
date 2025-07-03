# Google Authentication with Cognito Hosted UI - Complete Guide

## 🎯 **What You Need to Know**

When using Google authentication with Cognito's hosted UI, there are several important customizations and considerations that are different from standard OAuth flows.

## 🔧 **Key Customizations Required**

### 1. **Google Cloud Console Configuration**

#### 1.1 OAuth Consent Screen
```
Application Type: Web application
Application Name: HomeOrder
Authorized Domains: howto-aws.com
```

#### 1.2 Authorized Redirect URIs
**CRITICAL**: This is NOT your app's callback URL!
```
https://homeorder-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
```

**Why this specific URL?**
- Cognito handles the OAuth flow internally
- Your app only receives the final tokens
- This URL is Cognito's internal endpoint

#### 1.3 Required Scopes
```
email - User's email address
profile - Basic profile information
openid - OpenID Connect standard
```

### 2. **Cognito User Pool Configuration**

#### 2.1 Attribute Mapping
```yaml
AttributeMapping:
  email: 'email'           # ✅ Always available from Google
  name: 'name'             # ✅ Usually available
  given_name: 'given_name' # ✅ Usually available
  family_name: 'family_name' # ✅ Usually available
  # phone_number: 'phone_number' # ❌ NOT available from Google
```

#### 2.2 Username Attributes
```yaml
UsernameAttributes:
  - phone_number  # For direct Cognito users
  - email         # For Google users
```

## 🚨 **Important Limitations & Solutions**

### **Problem 1: Phone Number Missing**
**Issue**: Google doesn't provide phone numbers, but your app requires them.

**Solutions**:

#### Option A: Make Phone Optional for Google Users
```yaml
Schema:
  - Name: phone_number
    AttributeDataType: String
    Mutable: true
    Required: false  # Changed from true
```

#### Option B: Prompt After Google Sign-In
Create a post-authentication flow to collect phone number:

```javascript
// After Google sign-in, check if phone exists
if (!user.phone_number) {
    // Redirect to phone collection page
    window.location.href = '/collect-phone.html';
}
```

#### Option C: Use Email as Primary Identifier
```yaml
UsernameAttributes:
  - email  # Primary identifier
  - phone_number  # Secondary
```

### **Problem 2: Attribute Synchronization**
**Issue**: Google attributes might not sync properly.

**Solution**: Use Lambda triggers

```javascript
// Pre-token generation trigger
exports.handler = async (event) => {
    const user = event.request.userAttributes;
    
    // Ensure required attributes exist
    if (!user.phone_number && user.email) {
        // Set a default or flag for phone collection
        event.response.claimsOverride = {
            phone_required: 'true'
        };
    }
    
    return event;
};
```

## 🔄 **Authentication Flow**

### **Standard Flow (Phone + Name)**
1. User visits hosted UI
2. Enters phone number and name
3. Receives SMS verification
4. Completes registration
5. Redirected to your app with tokens

### **Google Flow**
1. User visits hosted UI
2. Clicks "Sign in with Google"
3. Redirected to Google OAuth
4. Google redirects to Cognito's internal endpoint
5. Cognito creates/updates user in User Pool
6. User redirected to your app with tokens

## 🛠 **Implementation Steps**

### **Step 1: Google Cloud Console Setup**

1. **Create OAuth 2.0 Client**
   ```
   Application Type: Web application
   Name: HomeOrder
   Authorized JavaScript origins:
   - https://howto-aws.com
   - https://homeorder-auth.auth.us-east-1.amazoncognito.com
   
   Authorized redirect URIs:
   - https://homeorder-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```

2. **Enable APIs**
   ```
   - Google+ API
   - Google Identity API
   ```

3. **Configure OAuth Consent Screen**
   ```
   App name: HomeOrder
   User support email: your-email@domain.com
   Developer contact information: your-email@domain.com
   ```

### **Step 2: Update CloudFormation Parameters**

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

### **Step 3: Deploy the Stack**

```bash
aws cloudformation create-stack \
  --stack-name homeorder-cognito-stack \
  --template-body file://cognito-user-pool.yaml \
  --parameters file://parameters-fixed.json \
  --capabilities CAPABILITY_NAMED_IAM
```

### **Step 4: Test the Flow**

1. **Visit Hosted UI**: `https://homeorder-auth.auth.us-east-1.amazoncognito.com/login`
2. **Click "Sign in with Google"**
3. **Complete Google OAuth**
4. **Verify redirect to your app**

## 🎨 **UI Customization for Google**

### **Hosted UI Customization**
1. Go to Cognito Console → User Pools → App integration → UI customization
2. **Add Google branding**:
   - Upload your logo
   - Set primary color
   - Customize text

### **Custom CSS for Google Button**
```css
/* Style the Google sign-in button */
.google-signin-button {
    background-color: #4285f4;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: 500;
}

.google-signin-button:hover {
    background-color: #357abd;
}
```

## 🔍 **Testing & Debugging**

### **Test Commands**
```bash
# Check User Pool configuration
aws cognito-idp describe-user-pool --user-pool-id YOUR_USER_POOL_ID

# Check Identity Provider
aws cognito-idp describe-identity-provider \
  --user-pool-id YOUR_USER_POOL_ID \
  --provider-name Google

# Check App Client
aws cognito-idp describe-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID
```

### **Common Issues & Solutions**

#### Issue 1: "Invalid redirect URI"
**Cause**: Wrong redirect URI in Google Console
**Solution**: Use `https://homeorder-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse`

#### Issue 2: "Google sign-in button not showing"
**Cause**: Identity provider not properly configured
**Solution**: Check `SupportedIdentityProviders` in App Client

#### Issue 3: "User attributes not syncing"
**Cause**: Attribute mapping issues
**Solution**: Verify `AttributeMapping` in Identity Provider

#### Issue 4: "Phone number missing for Google users"
**Cause**: Google doesn't provide phone numbers
**Solution**: Implement post-authentication phone collection

## 📱 **Mobile Considerations**

### **React Native / Flutter**
```javascript
// Use AWS Amplify for mobile
import { Amplify, Auth } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: 'us-east-1',
    userPoolId: 'YOUR_USER_POOL_ID',
    userPoolWebClientId: 'YOUR_CLIENT_ID',
    oauth: {
      domain: 'homeorder-auth.auth.us-east-1.amazoncognito.com',
      scope: ['email', 'profile', 'openid', 'phone'],
      redirectSignIn: 'myapp://',
      redirectSignOut: 'myapp://',
      responseType: 'code'
    }
  }
});
```

### **Native iOS/Android**
```swift
// iOS - Use AWS SDK
let configuration = AWSCognitoIdentityUserPoolConfiguration(
    clientId: "YOUR_CLIENT_ID",
    clientSecret: nil,
    poolId: "YOUR_USER_POOL_ID"
)
```

## 🔒 **Security Best Practices**

1. **HTTPS Only**: Always use HTTPS for production
2. **Token Validation**: Validate tokens on server-side
3. **Scope Limitation**: Only request necessary scopes
4. **Audit Logging**: Enable CloudTrail for audit logs
5. **Rate Limiting**: Configure rate limits for authentication

## 🎉 **Success Checklist**

- ✅ Google OAuth credentials configured
- ✅ Redirect URI set correctly
- ✅ Identity provider added to User Pool
- ✅ App client supports Google
- ✅ Attribute mapping configured
- ✅ Hosted UI customized
- ✅ Phone number handling strategy implemented
- ✅ Testing completed

## 📞 **Support Resources**

- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Cognito Hosted UI Guide](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-configuring-app-integration.html)

---

**Remember**: The key difference with hosted UI is that Cognito handles the OAuth flow internally, so your redirect URI is Cognito's endpoint, not your app's callback URL! 