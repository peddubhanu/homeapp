# HomeOrder Cognito User Pool Deployment Script
# This script deploys the Cognito User Pool using CloudFormation

param(
    [string]$StackName = "homeorder-cognito-stack",
    [string]$Region = "us-east-1",
    [string]$UserPoolName = "homeorder-user-pool",
    [string]$AppClientName = "homeorder-client",
    [string]$DomainName = "homeorder-auth",
    [string]$CallbackURLs = "https://howto-aws.com/auth.html,http://howto-aws.com/auth.html",
    [string]$LogoutURLs = "https://howto-aws.com/,http://howto-aws.com/",
    [string]$MFAConfiguration = "ON",
    [switch]$DryRun,
    [switch]$DeleteStack
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

# Function to validate parameters
function Test-Parameters {
    if ($DomainName.Length -lt 3) {
        Write-Error "Domain name must be at least 3 characters long"
        exit 1
    }
    
    if ($DomainName.Length -gt 63) {
        Write-Error "Domain name must be less than 63 characters"
        exit 1
    }
    
    # Check if domain name contains only valid characters
    if ($DomainName -notmatch '^[a-z0-9-]+$') {
        Write-Error "Domain name can only contain lowercase letters, numbers, and hyphens"
        exit 1
    }
}

# Function to create parameters file
function New-ParametersFile {
    $parameters = @(
        @{ ParameterKey = "UserPoolName"; ParameterValue = $UserPoolName },
        @{ ParameterKey = "AppClientName"; ParameterValue = $AppClientName },
        @{ ParameterKey = "DomainName"; ParameterValue = $DomainName },
        @{ ParameterKey = "AllowedOAuthFlows"; ParameterValue = "code" },
        @{ ParameterKey = "AllowedOAuthScopes"; ParameterValue = "phone,email,openid,profile" },
        @{ ParameterKey = "CallbackURLs"; ParameterValue = $CallbackURLs },
        @{ ParameterKey = "LogoutURLs"; ParameterValue = $LogoutURLs },
        @{ ParameterKey = "SMSRoleArn"; ParameterValue = "" },
        @{ ParameterKey = "MFAConfiguration"; ParameterValue = $MFAConfiguration }
    )
    $json = $parameters | ConvertTo-Json -Depth 10
    [System.IO.File]::WriteAllText("parameters.json", $json, [System.Text.Encoding]::UTF8)
    Write-Host "Created parameters.json file (CloudFormation format, UTF-8 without BOM)" -ForegroundColor Green
}

# Function to deploy stack
function Deploy-Stack {
    Write-Host "Deploying CloudFormation stack: $StackName" -ForegroundColor Green
    
    $templateFile = "cognito-user-pool.yaml"
    $parametersFile = "parameters.json"
    
    if ($DryRun) {
        Write-Host "DRY RUN - Validating template..." -ForegroundColor Yellow
        aws cloudformation validate-template --template-body file://$templateFile
        Write-Host "Template validation completed" -ForegroundColor Green
        return
    }
    
    # Check if stack already exists
    $stackExists = aws cloudformation describe-stacks --stack-name $StackName 2>$null
    if ($stackExists) {
        Write-Host "Stack $StackName already exists. Updating..." -ForegroundColor Yellow
        $command = "aws cloudformation update-stack --stack-name $StackName --template-body file://$templateFile --parameters file://$parametersFile --capabilities CAPABILITY_NAMED_IAM"
    } else {
        Write-Host "Creating new stack: $StackName" -ForegroundColor Green
        $command = "aws cloudformation create-stack --stack-name $StackName --template-body file://$templateFile --parameters file://$parametersFile --capabilities CAPABILITY_NAMED_IAM"
    }
    
    Write-Host "Executing: $command" -ForegroundColor Cyan
    Invoke-Expression $command
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Stack deployment initiated successfully!" -ForegroundColor Green
        Write-Host "Waiting for stack to complete..." -ForegroundColor Yellow
        
        # Wait for stack to complete
        aws cloudformation wait stack-create-complete --stack-name $StackName 2>$null
        if ($LASTEXITCODE -ne 0) {
            aws cloudformation wait stack-update-complete --stack-name $StackName 2>$null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Stack deployment completed successfully!" -ForegroundColor Green
            Show-StackOutputs
        } else {
            Write-Host "Stack deployment failed. Check CloudFormation console for details." -ForegroundColor Red
        }
    } else {
        Write-Host "Failed to deploy stack. Check the error message above." -ForegroundColor Red
    }
}

# Function to delete stack
function Remove-Stack {
    Write-Host "Deleting CloudFormation stack: $StackName" -ForegroundColor Yellow
    aws cloudformation delete-stack --stack-name $StackName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Stack deletion initiated. Waiting for completion..." -ForegroundColor Yellow
        aws cloudformation wait stack-delete-complete --stack-name $StackName
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Stack deleted successfully!" -ForegroundColor Green
        } else {
            Write-Host "Stack deletion failed. Check CloudFormation console for details." -ForegroundColor Red
        }
    } else {
        Write-Host "Failed to delete stack. Check the error message above." -ForegroundColor Red
    }
}

# Function to show stack outputs
function Show-StackOutputs {
    Write-Host "`n=== STACK OUTPUTS ===" -ForegroundColor Cyan
    
    $outputs = aws cloudformation describe-stacks --stack-name $StackName --query 'Stacks[0].Outputs' | ConvertFrom-Json
    
    foreach ($output in $outputs) {
        Write-Host "`n$($output.OutputKey):" -ForegroundColor Yellow
        Write-Host "$($output.OutputValue)" -ForegroundColor White
        if ($output.Description) {
            Write-Host "Description: $($output.Description)" -ForegroundColor Gray
        }
    }
    
    # Create configuration file
    $config = @{
        UserPoolId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolId" }).OutputValue
        ClientId = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolClientId" }).OutputValue
        Region = $Region
        Domain = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolDomain" }).OutputValue
        DomainUrl = ($outputs | Where-Object { $_.OutputKey -eq "UserPoolDomainUrl" }).OutputValue
    }
    
    $config | ConvertTo-Json -Depth 10 | Out-File -FilePath "cognito-config.json" -Encoding UTF8
    Write-Host "`nConfiguration saved to: cognito-config.json" -ForegroundColor Green
    
    # Create JavaScript configuration
    $jsConfig = @"
// HomeOrder Cognito Configuration
// Generated on: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

const COGNITO_CONFIG = {
    UserPoolId: '$($config.UserPoolId)',
    ClientId: '$($config.ClientId)',
    Region: '$($config.Region)',
    Domain: '$($config.Domain)',
    DomainUrl: '$($config.DomainUrl)'
};

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = COGNITO_CONFIG;
}
"@
    
    $jsConfig | Out-File -FilePath "cognito-config.js" -Encoding UTF8
    Write-Host "JavaScript configuration saved to: cognito-config.js" -ForegroundColor Green
}

# Function to show usage
function Show-Usage {
    Write-Host @"
HomeOrder Cognito User Pool Deployment Script

Usage:
    .\deploy-cognito.ps1 [parameters]

Parameters:
    -StackName          CloudFormation stack name (default: homeorder-cognito-stack)
    -Region             AWS region (default: us-east-1)
    -UserPoolName       Cognito User Pool name (default: homeorder-user-pool)
    -AppClientName      Cognito App Client name (default: homeorder-client)
    -DomainName         Cognito domain name (default: homeorder-auth)
    -CallbackURLs       OAuth callback URLs (comma-separated)
    -LogoutURLs         OAuth logout URLs (comma-separated)
    -MFAConfiguration   MFA setting: OFF, ON, OPTIONAL (default: ON)
    -DryRun             Validate template without deploying
    -DeleteStack        Delete the CloudFormation stack
    -Help               Show this help message

Examples:
    # Deploy with default settings
    .\deploy-cognito.ps1

    # Deploy with custom settings
    .\deploy-cognito.ps1 -StackName "my-homeorder-cognito" -Region "us-west-2" -DomainName "my-homeorder-auth"

    # Dry run to validate template
    .\deploy-cognito.ps1 -DryRun

    # Delete stack
    .\deploy-cognito.ps1 -DeleteStack

"@ -ForegroundColor Cyan
}

# Main execution
Write-Host "=== HomeOrder Cognito User Pool Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check for help parameter
if ($args -contains "-Help" -or $args -contains "-h") {
    Show-Usage
    exit 0
}

# Check if AWS CLI is installed
if (-not (Test-AWSCLI)) {
    Write-Error "AWS CLI is not installed. Please install it first: https://aws.amazon.com/cli/"
    exit 1
}

# Check if user is authenticated
if (-not (Test-AWSAuth)) {
    Write-Error "You are not authenticated with AWS. Please run 'aws configure' first."
    exit 1
}

# Validate parameters
Test-Parameters

# Show current settings
Write-Host "Deployment Settings:" -ForegroundColor Green
Write-Host "  Stack Name: $StackName"
Write-Host "  Region: $Region"
Write-Host "  User Pool Name: $UserPoolName"
Write-Host "  App Client Name: $AppClientName"
Write-Host "  Domain Name: $DomainName"
Write-Host "  MFA Configuration: $MFAConfiguration"
Write-Host "  Callback URLs: $CallbackURLs"
Write-Host "  Logout URLs: $LogoutURLs"
Write-Host ""

# Confirm deployment
if (-not $DeleteStack -and -not $DryRun) {
    $confirm = Read-Host "Do you want to proceed with the deployment? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Execute based on parameters
if ($DeleteStack) {
    Remove-Stack
} else {
    New-ParametersFile
    Deploy-Stack
}

Write-Host "`n=== Deployment Script Completed ===" -ForegroundColor Cyan 