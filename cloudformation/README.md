# HomeOrder Cognito User Pool - CloudFormation Deployment

This folder contains CloudFormation templates and deployment scripts to automatically create and configure AWS Cognito User Pool for the HomeOrder application with phone number authentication.

## 📁 Files Overview

- `cognito-user-pool.yaml` - CloudFormation template for Cognito User Pool
- `deploy-cognito.ps1` - PowerShell deployment script
- `README.md` - This documentation file

## 🚀 Quick Start

### Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   # Install AWS CLI (if not already installed)
   # Windows: Download from https://aws.amazon.com/cli/
   # macOS: brew install awscli
   # Linux: sudo apt-get install awscli
   ```

2. **AWS Credentials** configured
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your default region (e.g., us-east-1)
   ```

3. **PowerShell** (Windows) or **PowerShell Core** (cross-platform)

### Deployment Steps

1. **Navigate to the cloudformation directory**
   ```powershell
   cd homeapp/cloudformation
   ```

2. **Run the deployment script**
   ```powershell
   # Deploy with default settings
   .\deploy-cognito.ps1

   # Or deploy with custom settings
   .\deploy-cognito.ps1 -StackName "my-homeorder-cognito" -Region "us-west-2"
   ```

3. **Wait for deployment to complete**
   The script will automatically wait for the CloudFormation stack to complete and display the outputs.

## ⚙️ Configuration Options

### Deployment Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `StackName` | `homeorder-cognito-stack` | CloudFormation stack name |
| `Region` | `us-east-1` | AWS region for deployment |
| `UserPoolName` | `homeorder-user-pool` | Cognito User Pool name |
| `AppClientName` | `homeorder-client` | Cognito App Client name |
| `DomainName` | `homeorder-auth` | Cognito domain name |
| `CallbackURLs` | `https://localhost:3000/auth.html,http://localhost:3000/auth.html` | OAuth callback URLs |
| `LogoutURLs` | `https://localhost:3000/,http://localhost:3000/` | OAuth logout URLs |
| `MFAConfiguration` | `ON` | MFA setting (OFF, ON, OPTIONAL) |

### Example Custom Deployments

```powershell
# Production deployment
.\deploy-cognito.ps1 -StackName "homeorder-prod-cognito" `
                     -Region "us-east-1" `
                     -DomainName "homeorder-prod-auth" `
                     -CallbackURLs "https://yourdomain.com/auth.html" `
                     -LogoutURLs "https://yourdomain.com/"

# Development deployment
.\deploy-cognito.ps1 -StackName "homeorder-dev-cognito" `
                     -Region "us-west-2" `
                     -DomainName "homeorder-dev-auth" `
                     -MFAConfiguration "OPTIONAL"

# Dry run (validate template without deploying)
.\deploy-cognito.ps1 -DryRun
```

## 📋 What Gets Created

The CloudFormation template creates the following AWS resources:

### 1. Cognito User Pool
- **Phone number authentication** enabled
- **Email verification** enabled
- **MFA configuration** (SMS)
- **Password policy** with security requirements
- **User attributes**: phone_number, email, name, address
- **Auto-verified attributes**: phone_number, email

### 2. Cognito User Pool Client
- **OAuth flows**: Authorization code
- **OAuth scopes**: phone, email, openid, profile
- **Token configuration**: 1-hour access/ID tokens, 30-day refresh tokens
- **Security features**: Token revocation, user existence error prevention

### 3. Cognito User Pool Domain
- **Custom domain** for hosted UI
- **OAuth endpoints** for authentication

### 4. IAM Role
- **SMS permissions** for sending verification codes
- **Cognito service role** for SMS operations

### 5. CloudWatch Log Group
- **User pool logs** for monitoring and debugging
- **30-day retention** policy

## 📤 Output Files

After successful deployment, the script creates:

### 1. `cognito-config.json`
```json
{
  "UserPoolId": "us-east-1_xxxxxxxxx",
  "ClientId": "xxxxxxxxxxxxxxxxxxxxxxxxxx",
  "Region": "us-east-1",
  "Domain": "homeorder-auth",
  "DomainUrl": "https://homeorder-auth.auth.us-east-1.amazoncognito.com"
}
```

### 2. `cognito-config.js`
```javascript
// HomeOrder Cognito Configuration
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_xxxxxxxxx',
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
    Region: 'us-east-1',
    Domain: 'homeorder-auth',
    DomainUrl: 'https://homeorder-auth.auth.us-east-1.amazoncognito.com'
};
```

## 🔧 Integration with Your App

### 1. Update `auth-script.js`
Replace the placeholder configuration with the generated values:

```javascript
// Replace this in auth-script.js
const COGNITO_CONFIG = {
    UserPoolId: 'YOUR_USER_POOL_ID', // From cognito-config.json
    ClientId: 'YOUR_CLIENT_ID',      // From cognito-config.json
    Region: 'YOUR_REGION'            // From cognito-config.json
};
```

### 2. Update Callback URLs
If your app is hosted on a different domain, update the callback URLs in the AWS Console or redeploy with new URLs.

### 3. Test Authentication
1. Open your app in a browser
2. Navigate to the login page
3. Enter a phone number
4. Verify the SMS code
5. Check that authentication works correctly

## 🛠️ Management Commands

### View Stack Status
```bash
aws cloudformation describe-stacks --stack-name homeorder-cognito-stack
```

### Update Stack
```powershell
# Modify parameters and redeploy
.\deploy-cognito.ps1 -StackName "homeorder-cognito-stack"
```

### Delete Stack
```powershell
# Remove all resources
.\deploy-cognito.ps1 -DeleteStack
```

### View Stack Outputs
```bash
aws cloudformation describe-stacks --stack-name homeorder-cognito-stack --query 'Stacks[0].Outputs'
```

## 🔍 Troubleshooting

### Common Issues

#### 1. AWS CLI Not Found
```
Error: AWS CLI is not installed
```
**Solution**: Install AWS CLI from https://aws.amazon.com/cli/

#### 2. Authentication Failed
```
Error: You are not authenticated with AWS
```
**Solution**: Run `aws configure` and enter your credentials

#### 3. Domain Name Already Exists
```
Error: Domain name already exists
```
**Solution**: Choose a different domain name or delete the existing one

#### 4. Stack Creation Failed
```
Error: Stack deployment failed
```
**Solution**: 
1. Check CloudFormation console for detailed error messages
2. Verify IAM permissions
3. Check if resources already exist

#### 5. SMS Not Working
```
Error: SMS delivery failed
```
**Solution**:
1. Verify phone number format (+1234567890)
2. Check SMS spending limit in AWS Console
3. Ensure IAM role has SMS permissions

### Debug Commands

```bash
# Check AWS identity
aws sts get-caller-identity

# Validate template
aws cloudformation validate-template --template-body file://cognito-user-pool.yaml

# Check stack events
aws cloudformation describe-stack-events --stack-name homeorder-cognito-stack

# Check user pool
aws cognito-idp describe-user-pool --user-pool-id YOUR_USER_POOL_ID
```

## 🔒 Security Best Practices

### 1. IAM Permissions
- Use least privilege principle
- Create dedicated IAM user for deployment
- Rotate access keys regularly

### 2. Cognito Configuration
- Enable MFA for production
- Set appropriate token expiration times
- Use HTTPS for all callback URLs
- Enable advanced security features

### 3. Monitoring
- Set up CloudWatch alarms
- Monitor authentication failures
- Review logs regularly

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review CloudFormation console for error details
3. Check AWS Cognito documentation
4. Verify your AWS account has the necessary permissions

## 🔄 Updates and Maintenance

### Updating the Template
1. Modify `cognito-user-pool.yaml`
2. Test with dry run: `.\deploy-cognito.ps1 -DryRun`
3. Deploy updates: `.\deploy-cognito.ps1`

### Backup Configuration
Always backup your `cognito-config.json` file before making changes.

### Version Control
Consider versioning your CloudFormation templates and configuration files.

---

**Note**: This deployment creates production-ready Cognito resources. For development, consider using the `-MFAConfiguration OPTIONAL` parameter to make testing easier. 