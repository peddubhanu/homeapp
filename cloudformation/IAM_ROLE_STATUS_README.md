# IAM Role Status Check

This document explains how to check the status of the IAM role created by the HomeOrder Cognito CloudFormation stack.

## Overview

The CloudFormation template creates an IAM role named `homeorder-user-pool-sms-role` that allows Cognito to send SMS messages for phone number verification. This script helps you verify that the role was created correctly and has the proper permissions.

## What the Script Checks

### 1. CloudFormation Stack Status
- Verifies the stack exists and is in a healthy state
- Shows stack creation and update times
- Lists any recent failed events

### 2. IAM Role Status
- Confirms the role exists with the correct name
- Shows role ARN, creation date, and path
- Lists attached and inline policies
- Displays the trust relationship (who can assume the role)

### 3. Cognito SMS Configuration
- Verifies the User Pool is configured to use the IAM role
- Checks that the SNS Caller ARN matches the expected role ARN
- Shows MFA configuration status

### 4. SNS Permissions Test
- Tests basic SNS access
- Attempts to send a test SMS (may fail if not configured, which is expected)

## Prerequisites

1. **AWS CLI installed** and in your PATH
2. **AWS credentials configured** (`aws configure`)
3. **CloudFormation stack deployed** using `deploy-cognito.ps1`

## Usage

### Quick Check (Basic)
```bash
# Using PowerShell
.\check-iam-role.ps1

# Using Batch file
.\check-iam-role.bat
```

### Detailed Check
```bash
# Get more detailed information including role usage
.\check-iam-role.ps1 -Detailed
```

### Custom Parameters
```bash
# Check with custom stack name and region
.\check-iam-role.ps1 -StackName "my-custom-stack" -Region "us-west-2"

# Check with custom user pool name
.\check-iam-role.ps1 -UserPoolName "my-custom-pool"
```

## Expected Output

When everything is working correctly, you should see output like this:

```
HomeOrder IAM Role Status Check
=================================

✅ AWS CLI and authentication verified

=== CLOUDFORMATION STACK STATUS ===
Stack Name: homeorder-cognito-stack
Stack Status: CREATE_COMPLETE
Creation Time: 2024-01-15T10:30:00.000Z
Last Updated: 2024-01-15T10:30:00.000Z

Checking for recent stack events...
✅ No recent failed events found

=== IAM ROLE STATUS ===
Checking IAM Role: homeorder-user-pool-sms-role
✅ IAM Role exists!
Role Name: homeorder-user-pool-sms-role
Role ARN: arn:aws:iam::123456789012:role/homeorder-user-pool-sms-role
Create Date: 2024-01-15T10:30:00.000Z
Path: /

Checking attached policies...
✅ Attached Policies:
  - AmazonCognitoIdpSmsRole (ARN: arn:aws:iam::aws:policy/service-role/AmazonCognitoIdpSmsRole)

Trust Relationship:
Version: 2012-10-17
Effect: Allow
Principal: cognito-idp.amazonaws.com
Actions: sts:AssumeRole

=== COGNITO SMS CONFIGURATION ===
User Pool ID: us-east-1_xxxxxxxxx
✅ SMS Configuration found!
SNS Region: us-east-1
External ID: homeorder-user-pool-sms-external-id
SNS Caller ARN: arn:aws:iam::123456789012:role/homeorder-user-pool-sms-role
✅ SNS Caller ARN matches expected role!

MFA Configuration: ON

=== SNS PERMISSIONS TEST ===
✅ SNS access confirmed - No topics found

Testing SMS sending permissions...
⚠️  SMS sending test failed (this may be expected if not configured):
An error occurred (OptInRequired) when calling the Publish operation: 
The phone number is not opted in to receive SMS messages.

=== SUMMARY ===
✅ Stack status check completed
✅ IAM role status check completed
✅ Cognito SMS configuration check completed
✅ SNS permissions test completed

Check completed!
```

## Troubleshooting

### Common Issues

1. **Stack Not Found**
   ```
   ❌ Stack 'homeorder-cognito-stack' not found!
   ```
   **Solution**: Deploy the stack first using `.\deploy-cognito.ps1`

2. **IAM Role Not Found**
   ```
   ❌ IAM Role 'homeorder-user-pool-sms-role' not found!
   ```
   **Solution**: Check if the CloudFormation stack deployment completed successfully

3. **AWS Authentication Failed**
   ```
   ❌ AWS authentication failed. Please run 'aws configure' first
   ```
   **Solution**: Run `aws configure` and enter your AWS credentials

4. **SNS Caller ARN Mismatch**
   ```
   ⚠️  SNS Caller ARN does not match expected role
   ```
   **Solution**: This usually indicates the stack was deployed with different parameters. Check the stack parameters.

### Error Messages

- **"OptInRequired"**: This is expected for SMS testing unless you have opted in to receive SMS messages
- **"AccessDenied"**: Your AWS credentials don't have sufficient permissions
- **"ResourceNotFoundException"**: The resource doesn't exist, check if the stack was deployed

## Role Details

The IAM role created by the CloudFormation template has:

- **Name**: `{UserPoolName}-sms-role` (default: `homeorder-user-pool-sms-role`)
- **Trust Policy**: Allows `cognito-idp.amazonaws.com` to assume the role
- **Attached Policy**: `AmazonCognitoIdpSmsRole` (AWS managed policy for SMS sending)
- **Purpose**: Enables Cognito to send SMS verification codes

## Security Notes

- The role only allows Cognito to assume it
- It uses the AWS managed policy `AmazonCognitoIdpSmsRole`
- The role is scoped to SMS sending only
- External ID is used for additional security

## Next Steps

After confirming the IAM role is working correctly:

1. Test the authentication flow in your application
2. Verify SMS delivery works with real phone numbers
3. Monitor CloudWatch logs for any SMS-related errors
4. Consider setting up SMS spending limits in AWS Console

## Support

If you encounter issues:

1. Check the CloudFormation stack events in AWS Console
2. Verify your AWS credentials have the necessary permissions
3. Ensure the stack was deployed with the correct parameters
4. Check CloudWatch logs for detailed error messages 