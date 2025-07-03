# Deploy Cognito Stack via AWS Console

Due to encoding issues with the CLI, please deploy the stack using the AWS Console:

## Steps:

1. **Open AWS CloudFormation Console**
   - Go to: https://console.aws.amazon.com/cloudformation/
   - Make sure you're in the `us-east-1` region

2. **Create Stack**
   - Click "Create stack"
   - Choose "With new resources (standard)"

3. **Specify Template**
   - Select "Upload a template file"
   - Click "Choose file" and select `cognito-user-pool.yaml`
   - Click "Next"

4. **Specify Stack Details**
   - Stack name: `homeorder-cognito-stack`
   - Parameters:
     - UserPoolName: `homeorder-user-pool`
     - AppClientName: `homeorder-client`
     - DomainName: `homeorder-auth`
     - AllowedOAuthFlows: `code`
     - AllowedOAuthScopes: `phone,email,openid,profile`
     - CallbackURLs: `https://howto-aws.com/auth.html,http://howto-aws.com/auth.html`
     - LogoutURLs: `https://howto-aws.com/,http://howto-aws.com/`
     - SMSRoleArn: (leave empty)
     - MFAConfiguration: `ON`
     - GoogleClientId: (leave empty for now)
     - GoogleClientSecret: (leave empty for now)
     - AllowedOAuthFlowsUserPoolClient: `true`
   - Click "Next"

5. **Configure Stack Options**
   - Leave defaults
   - Click "Next"

6. **Review**
   - Check the configuration
   - Acknowledge the IAM capabilities
   - Click "Create stack"

## After Deployment:

1. **Get the outputs** from the stack:
   - UserPoolId
   - AppClientId
   - DomainName
   - HostedUIDomain

2. **Update your auth.html** with the correct values

3. **For Google Sign-in** (optional):
   - Create a Google OAuth app
   - Update the GoogleClientId and GoogleClientSecret parameters
   - Update the stack

## Alternative: Use AWS CLI with JSON file

If you want to try CLI again, create a JSON file with this exact content:

```json
[
  {
    "ParameterKey": "UserPoolName",
    "ParameterValue": "homeorder-user-pool"
  },
  {
    "ParameterKey": "AppClientName",
    "ParameterValue": "homeorder-client"
  },
  {
    "ParameterKey": "DomainName",
    "ParameterValue": "homeorder-auth"
  },
  {
    "ParameterKey": "AllowedOAuthFlows",
    "ParameterValue": "code"
  },
  {
    "ParameterKey": "AllowedOAuthScopes",
    "ParameterValue": "phone,email,openid,profile"
  },
  {
    "ParameterKey": "CallbackURLs",
    "ParameterValue": "https://howto-aws.com/auth.html,http://howto-aws.com/auth.html"
  },
  {
    "ParameterKey": "LogoutURLs",
    "ParameterValue": "https://howto-aws.com/,http://howto-aws.com/"
  },
  {
    "ParameterKey": "SMSRoleArn",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "MFAConfiguration",
    "ParameterValue": "ON"
  },
  {
    "ParameterKey": "GoogleClientId",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "GoogleClientSecret",
    "ParameterValue": ""
  },
  {
    "ParameterKey": "AllowedOAuthFlowsUserPoolClient",
    "ParameterValue": "true"
  }
]
```

Save it as `parameters-manual.json` and run:
```bash
aws cloudformation create-stack --stack-name homeorder-cognito-stack --template-body file://cognito-user-pool.yaml --parameters file://parameters-manual.json --capabilities CAPABILITY_NAMED_IAM
``` 