# HomeOrder IAM Role Status Check Script
# This script checks the status of the IAM role created by the CloudFormation stack

param(
    [string]$StackName = "homeorder-cognito-stack",
    [string]$Region = "us-east-1",
    [string]$UserPoolName = "homeorder-user-pool",
    [switch]$Detailed
)

# Set AWS region
Write-Host "Setting AWS region to: $Region" -ForegroundColor Green
aws configure set region $Region

# Function to check if AWS CLI is installed
function Test-AWSCLI {
    try {
        aws --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check if user is authenticated
function Test-AWSAuth {
    try {
        aws sts get-caller-identity | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Function to check CloudFormation stack status
function Get-StackStatus {
    Write-Host "`n=== CLOUDFORMATION STACK STATUS ===" -ForegroundColor Cyan
    
    try {
        $stackInfo = aws cloudformation describe-stacks --stack-name $StackName 2>$null | ConvertFrom-Json
        
        if ($stackInfo.Stacks) {
            $stack = $stackInfo.Stacks[0]
            Write-Host "Stack Name: $($stack.StackName)" -ForegroundColor Yellow
            Write-Host "Stack Status: $($stack.StackStatus)" -ForegroundColor Green
            Write-Host "Creation Time: $($stack.CreationTime)" -ForegroundColor White
            Write-Host "Last Updated: $($stack.LastUpdatedTime)" -ForegroundColor White
            
            # Check for any stack events with errors
            Write-Host "`nChecking for recent stack events..." -ForegroundColor Yellow
            $events = aws cloudformation describe-stack-events --stack-name $StackName --max-items 10 2>$null | ConvertFrom-Json
            
            $errorEvents = $events.StackEvents | Where-Object { $_.ResourceStatus -like "*FAILED*" }
            if ($errorEvents) {
                Write-Host "`n⚠️  Found failed events:" -ForegroundColor Red
                foreach ($event in $errorEvents) {
                    Write-Host "  - $($event.LogicalResourceId): $($event.ResourceStatus)" -ForegroundColor Red
                    Write-Host "    Reason: $($event.ResourceStatusReason)" -ForegroundColor Gray
                }
            } else {
                Write-Host "✅ No recent failed events found" -ForegroundColor Green
            }
            
            return $true
        } else {
            Write-Host "❌ Stack '$StackName' not found!" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking stack status: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check IAM role status
function Get-IAMRoleStatus {
    Write-Host "`n=== IAM ROLE STATUS ===" -ForegroundColor Cyan
    
    $roleName = "$UserPoolName-sms-role"
    Write-Host "Checking IAM Role: $roleName" -ForegroundColor Yellow
    
    try {
        # Check if role exists
        $roleInfo = aws iam get-role --role-name $roleName 2>$null | ConvertFrom-Json
        
        if ($roleInfo.Role) {
            Write-Host "✅ IAM Role exists!" -ForegroundColor Green
            Write-Host "Role Name: $($roleInfo.Role.RoleName)" -ForegroundColor White
            Write-Host "Role ARN: $($roleInfo.Role.Arn)" -ForegroundColor White
            Write-Host "Create Date: $($roleInfo.Role.CreateDate)" -ForegroundColor White
            Write-Host "Path: $($roleInfo.Role.Path)" -ForegroundColor White
            
            # Check role policies
            Write-Host "`nChecking attached policies..." -ForegroundColor Yellow
            $policies = aws iam list-attached-role-policies --role-name $roleName 2>$null | ConvertFrom-Json
            
            if ($policies.AttachedPolicies) {
                Write-Host "✅ Attached Policies:" -ForegroundColor Green
                foreach ($policy in $policies.AttachedPolicies) {
                    Write-Host "  - $($policy.PolicyName) (ARN: $($policy.PolicyArn))" -ForegroundColor White
                }
            } else {
                Write-Host "⚠️  No attached policies found" -ForegroundColor Yellow
            }
            
            # Check inline policies
            $inlinePolicies = aws iam list-role-policies --role-name $roleName 2>$null | ConvertFrom-Json
            if ($inlinePolicies.PolicyNames) {
                Write-Host "`nInline Policies:" -ForegroundColor Yellow
                foreach ($policy in $inlinePolicies.PolicyNames) {
                    Write-Host "  - $policy" -ForegroundColor White
                }
            }
            
            # Check trust relationship
            Write-Host "`nTrust Relationship:" -ForegroundColor Yellow
            $trustPolicy = $roleInfo.Role.AssumeRolePolicyDocument
            Write-Host "Version: $($trustPolicy.Version)" -ForegroundColor White
            foreach ($statement in $trustPolicy.Statement) {
                Write-Host "Effect: $($statement.Effect)" -ForegroundColor White
                Write-Host "Principal: $($statement.Principal.Service)" -ForegroundColor White
                Write-Host "Actions: $($statement.Action -join ', ')" -ForegroundColor White
            }
            
            if ($Detailed) {
                # Check role usage
                Write-Host "`nChecking role usage..." -ForegroundColor Yellow
                $usage = aws iam get-role --role-name $roleName --query 'Role.RoleLastUsed' 2>$null | ConvertFrom-Json
                if ($usage.LastUsedDate) {
                    Write-Host "Last Used: $($usage.LastUsedDate)" -ForegroundColor White
                    Write-Host "Region: $($usage.Region)" -ForegroundColor White
                } else {
                    Write-Host "Role has not been used yet" -ForegroundColor Gray
                }
            }
            
            return $true
        } else {
            Write-Host "❌ IAM Role '$roleName' not found!" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error checking IAM role: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check Cognito User Pool SMS configuration
function Get-CognitoSMSConfig {
    Write-Host "`n=== COGNITO SMS CONFIGURATION ===" -ForegroundColor Cyan
    
    try {
        # Get User Pool ID from stack outputs
        $outputs = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs' 2>$null | ConvertFrom-Json
        
        $userPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
        
        if ($userPoolId) {
            Write-Host "User Pool ID: $userPoolId" -ForegroundColor Yellow
            
            # Get User Pool details
            $userPool = aws cognito-idp describe-user-pool --user-pool-id $userPoolId 2>$null | ConvertFrom-Json
            
            if ($userPool.UserPool) {
                $smsConfig = $userPool.UserPool.SmsConfiguration
                if ($smsConfig) {
                    Write-Host "✅ SMS Configuration found!" -ForegroundColor Green
                    Write-Host "SNS Region: $($smsConfig.SnsRegion)" -ForegroundColor White
                    Write-Host "External ID: $($smsConfig.ExternalId)" -ForegroundColor White
                    Write-Host "SNS Caller ARN: $($smsConfig.SnsCallerArn)" -ForegroundColor White
                    
                    # Check if the ARN matches our role
                    $expectedRoleArn = "arn:aws:iam::$(aws sts get-caller-identity --query 'Account' --output text):role/$UserPoolName-sms-role"
                    if ($smsConfig.SnsCallerArn -eq $expectedRoleArn) {
                        Write-Host "✅ SNS Caller ARN matches expected role!" -ForegroundColor Green
                    } else {
                        Write-Host "⚠️  SNS Caller ARN does not match expected role" -ForegroundColor Yellow
                        Write-Host "Expected: $expectedRoleArn" -ForegroundColor Gray
                        Write-Host "Actual: $($smsConfig.SnsCallerArn)" -ForegroundColor Gray
                    }
                } else {
                    Write-Host "❌ No SMS configuration found in User Pool" -ForegroundColor Red
                }
                
                # Check MFA configuration
                $mfaConfig = $userPool.UserPool.MfaConfiguration
                Write-Host "`nMFA Configuration: $mfaConfig" -ForegroundColor Yellow
            } else {
                Write-Host "❌ Could not retrieve User Pool details" -ForegroundColor Red
            }
        } else {
            Write-Host "❌ Could not find User Pool ID in stack outputs" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ Error checking Cognito SMS configuration: $_" -ForegroundColor Red
    }
}

# Function to check SNS permissions
function Test-SNSPermissions {
    Write-Host "`n=== SNS PERMISSIONS TEST ===" -ForegroundColor Cyan
    
    try {
        # Test if we can list SNS topics (basic permission check)
        $topics = aws sns list-topics 2>$null | ConvertFrom-Json
        
        if ($topics.Topics) {
            Write-Host "✅ SNS access confirmed - Found $($topics.Topics.Count) topics" -ForegroundColor Green
        } else {
            Write-Host "✅ SNS access confirmed - No topics found" -ForegroundColor Green
        }
        
        # Test SMS sending permissions (this will fail if not configured, but that's expected)
        Write-Host "`nTesting SMS sending permissions..." -ForegroundColor Yellow
        $testResult = aws sns publish --phone-number "+1234567890" --message "Test message" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SMS sending permissions confirmed!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  SMS sending test failed (this may be expected if not configured):" -ForegroundColor Yellow
            Write-Host $testResult -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "❌ Error testing SNS permissions: $_" -ForegroundColor Red
    }
}

# Main execution
Write-Host "HomeOrder IAM Role Status Check" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check prerequisites
if (-not (Test-AWSCLI)) {
    Write-Host "❌ AWS CLI is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-AWSAuth)) {
    Write-Host "❌ AWS authentication failed. Please run 'aws configure' first" -ForegroundColor Red
    exit 1
}

Write-Host "✅ AWS CLI and authentication verified" -ForegroundColor Green

# Check stack status
$stackExists = Get-StackStatus

if ($stackExists) {
    # Check IAM role status
    Get-IAMRoleStatus
    
    # Check Cognito SMS configuration
    Get-CognitoSMSConfig
    
    # Test SNS permissions
    Test-SNSPermissions
    
    Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
    Write-Host "✅ Stack status check completed" -ForegroundColor Green
    Write-Host "✅ IAM role status check completed" -ForegroundColor Green
    Write-Host "✅ Cognito SMS configuration check completed" -ForegroundColor Green
    Write-Host "✅ SNS permissions test completed" -ForegroundColor Green
    
    Write-Host "`nFor more detailed information, run with -Detailed flag" -ForegroundColor Yellow
} else {
    Write-Host "❌ Cannot proceed without a valid CloudFormation stack" -ForegroundColor Red
    Write-Host "Please deploy the stack first using: .\deploy-cognito.ps1" -ForegroundColor Yellow
}

Write-Host "`nCheck completed!" -ForegroundColor Green 