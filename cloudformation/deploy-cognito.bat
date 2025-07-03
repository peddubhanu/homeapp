@echo off
REM HomeOrder Cognito User Pool Deployment Script (Batch Version)
REM This script deploys the Cognito User Pool using CloudFormation

setlocal enabledelayedexpansion

REM Default parameters
set "STACK_NAME=homeorder-cognito-stack"
set "REGION=us-east-1"
set "USER_POOL_NAME=homeorder-user-pool"
set "APP_CLIENT_NAME=homeorder-client"
set "DOMAIN_NAME=homeorder-auth"
set "CALLBACK_URLS=https://localhost:3000/auth.html,http://localhost:3000/auth.html"
set "LOGOUT_URLS=https://localhost:3000/,http://localhost:3000/"
set "MFA_CONFIG=ON"
set "DRY_RUN=false"
set "DELETE_STACK=false"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :main
if /i "%~1"=="-StackName" (
    set "STACK_NAME=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-Region" (
    set "REGION=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-UserPoolName" (
    set "USER_POOL_NAME=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-AppClientName" (
    set "APP_CLIENT_NAME=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-DomainName" (
    set "DOMAIN_NAME=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-CallbackURLs" (
    set "CALLBACK_URLS=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-LogoutURLs" (
    set "LOGOUT_URLS=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-MFAConfiguration" (
    set "MFA_CONFIG=%~2"
    shift
    shift
    goto :parse_args
)
if /i "%~1"=="-DryRun" (
    set "DRY_RUN=true"
    shift
    goto :parse_args
)
if /i "%~1"=="-DeleteStack" (
    set "DELETE_STACK=true"
    shift
    goto :parse_args
)
if /i "%~1"=="-Help" (
    goto :show_help
)
if /i "%~1"=="-h" (
    goto :show_help
)
shift
goto :parse_args

:main
echo ========================================
echo HomeOrder Cognito User Pool Deployment
echo ========================================
echo.

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: AWS CLI is not installed.
    echo Please install AWS CLI from https://aws.amazon.com/cli/
    pause
    exit /b 1
)

REM Check if user is authenticated
aws sts get-caller-identity >nul 2>&1
if errorlevel 1 (
    echo ERROR: You are not authenticated with AWS.
    echo Please run 'aws configure' first.
    pause
    exit /b 1
)

REM Set AWS region
echo Setting AWS region to: %REGION%
aws configure set region %REGION%

REM Show current settings
echo.
echo Deployment Settings:
echo   Stack Name: %STACK_NAME%
echo   Region: %REGION%
echo   User Pool Name: %USER_POOL_NAME%
echo   App Client Name: %APP_CLIENT_NAME%
echo   Domain Name: %DOMAIN_NAME%
echo   MFA Configuration: %MFA_CONFIG%
echo   Callback URLs: %CALLBACK_URLS%
echo   Logout URLs: %LOGOUT_URLS%
echo.

REM Create parameters file
echo Creating parameters.json file...
(
echo {
echo   "UserPoolName": "%USER_POOL_NAME%",
echo   "AppClientName": "%APP_CLIENT_NAME%",
echo   "DomainName": "%DOMAIN_NAME%",
echo   "AllowedOAuthFlows": ["code"],
echo   "AllowedOAuthScopes": ["phone", "email", "openid", "profile"],
echo   "CallbackURLs": ["%CALLBACK_URLS%"],
echo   "LogoutURLs": ["%LOGOUT_URLS%"],
echo   "SMSRoleArn": "",
echo   "MFAConfiguration": "%MFA_CONFIG%"
echo }
) > parameters.json

if "%DRY_RUN%"=="true" (
    echo DRY RUN - Validating template...
    aws cloudformation validate-template --template-body file://cognito-user-pool.yaml
    if errorlevel 1 (
        echo Template validation failed.
        pause
        exit /b 1
    )
    echo Template validation completed successfully.
    goto :end
)

if "%DELETE_STACK%"=="true" (
    echo Deleting CloudFormation stack: %STACK_NAME%
    aws cloudformation delete-stack --stack-name %STACK_NAME%
    if errorlevel 1 (
        echo Failed to delete stack.
        pause
        exit /b 1
    )
    echo Stack deletion initiated. Waiting for completion...
    aws cloudformation wait stack-delete-complete --stack-name %STACK_NAME%
    if errorlevel 1 (
        echo Stack deletion failed. Check CloudFormation console for details.
        pause
        exit /b 1
    )
    echo Stack deleted successfully!
    goto :end
)

REM Check if stack already exists
aws cloudformation describe-stacks --stack-name %STACK_NAME% >nul 2>&1
if errorlevel 1 (
    echo Creating new stack: %STACK_NAME%
    aws cloudformation create-stack --stack-name %STACK_NAME% --template-body file://cognito-user-pool.yaml --parameters file://parameters.json --capabilities CAPABILITY_NAMED_IAM
) else (
    echo Stack %STACK_NAME% already exists. Updating...
    aws cloudformation update-stack --stack-name %STACK_NAME% --template-body file://cognito-user-pool.yaml --parameters file://parameters.json --capabilities CAPABILITY_NAMED_IAM
)

if errorlevel 1 (
    echo Failed to deploy stack. Check the error message above.
    pause
    exit /b 1
)

echo Stack deployment initiated successfully!
echo Waiting for stack to complete...

REM Wait for stack to complete
aws cloudformation wait stack-create-complete --stack-name %STACK_NAME% >nul 2>&1
if errorlevel 1 (
    aws cloudformation wait stack-update-complete --stack-name %STACK_NAME% >nul 2>&1
)

if errorlevel 1 (
    echo Stack deployment failed. Check CloudFormation console for details.
    pause
    exit /b 1
)

echo Stack deployment completed successfully!
echo.

REM Show stack outputs
echo === STACK OUTPUTS ===
aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs" --output table

REM Create configuration files
echo.
echo Creating configuration files...

REM Get outputs as JSON
for /f "tokens=*" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --query "Stacks[0].Outputs" --output json') do set "OUTPUTS=%%i"

REM Create cognito-config.json
echo Creating cognito-config.json...
(
echo {
echo   "UserPoolId": "REPLACE_WITH_ACTUAL_ID",
echo   "ClientId": "REPLACE_WITH_ACTUAL_ID", 
echo   "Region": "%REGION%",
echo   "Domain": "%DOMAIN_NAME%",
echo   "DomainUrl": "https://%DOMAIN_NAME%.auth.%REGION%.amazoncognito.com"
echo }
) > cognito-config.json

REM Create cognito-config.js
echo Creating cognito-config.js...
(
echo // HomeOrder Cognito Configuration
echo // Generated on: %date% %time%
echo.
echo const COGNITO_CONFIG = {
echo     UserPoolId: 'REPLACE_WITH_ACTUAL_ID',
echo     ClientId: 'REPLACE_WITH_ACTUAL_ID',
echo     Region: '%REGION%',
echo     Domain: '%DOMAIN_NAME%',
echo     DomainUrl: 'https://%DOMAIN_NAME%.auth.%REGION%.amazoncognito.com'
echo };
echo.
echo // Export for use in your application
echo if ^(typeof module !== 'undefined' ^&^& module.exports^) {
echo     module.exports = COGNITO_CONFIG;
echo }
) > cognito-config.js

echo.
echo Configuration files created:
echo   - cognito-config.json
echo   - cognito-config.js
echo.
echo NOTE: Please manually update the UserPoolId and ClientId values in the config files
echo with the actual values from the stack outputs above.
echo.

:end
echo ========================================
echo Deployment Script Completed
echo ========================================
pause

:show_help
echo HomeOrder Cognito User Pool Deployment Script ^(Batch Version^)
echo.
echo Usage:
echo   deploy-cognito.bat [parameters]
echo.
echo Parameters:
echo   -StackName          CloudFormation stack name ^(default: homeorder-cognito-stack^)
echo   -Region             AWS region ^(default: us-east-1^)
echo   -UserPoolName       Cognito User Pool name ^(default: homeorder-user-pool^)
echo   -AppClientName      Cognito App Client name ^(default: homeorder-client^)
echo   -DomainName         Cognito domain name ^(default: homeorder-auth^)
echo   -CallbackURLs       OAuth callback URLs ^(comma-separated^)
echo   -LogoutURLs         OAuth logout URLs ^(comma-separated^)
echo   -MFAConfiguration   MFA setting: OFF, ON, OPTIONAL ^(default: ON^)
echo   -DryRun             Validate template without deploying
echo   -DeleteStack        Delete the CloudFormation stack
echo   -Help               Show this help message
echo.
echo Examples:
echo   # Deploy with default settings
echo   deploy-cognito.bat
echo.
echo   # Deploy with custom settings
echo   deploy-cognito.bat -StackName "my-homeorder-cognito" -Region "us-west-2"
echo.
echo   # Dry run to validate template
echo   deploy-cognito.bat -DryRun
echo.
echo   # Delete stack
echo   deploy-cognito.bat -DeleteStack
echo.
pause
exit /b 0 