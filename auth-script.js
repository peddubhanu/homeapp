// AWS Cognito Configuration
// Replace these with your actual AWS Cognito User Pool configuration
const COGNITO_CONFIG = {
    UserPoolId: 'YOUR_USER_POOL_ID', // e.g., 'us-east-1_xxxxxxxxx'
    ClientId: 'YOUR_CLIENT_ID', // e.g., 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
    Region: 'YOUR_REGION' // e.g., 'us-east-1'
};

// Initialize AWS Cognito
let userPool;
let cognitoUser;
let sessionTimer;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const verificationForm = document.getElementById('verificationForm');
const phoneForm = document.getElementById('phoneForm');
const codeForm = document.getElementById('codeForm');
const loadingContainer = document.getElementById('loadingContainer');
const errorContainer = document.getElementById('errorContainer');
const successContainer = document.getElementById('successContainer');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const phoneDisplay = document.getElementById('phoneDisplay');
const timer = document.getElementById('timer');
const resendCodeBtn = document.getElementById('resendCodeBtn');

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    initializeCognito();
    setupEventListeners();
    checkExistingSession();
});

// Initialize AWS Cognito
function initializeCognito() {
    try {
        // Configure AWS
        AWS.config.region = COGNITO_CONFIG.Region;
        
        // Initialize Cognito User Pool
        userPool = new AmazonCognitoIdentity.CognitoUserPool({
            UserPoolId: COGNITO_CONFIG.UserPoolId,
            ClientId: COGNITO_CONFIG.ClientId
        });
        
        console.log('Cognito initialized successfully');
    } catch (error) {
        console.error('Error initializing Cognito:', error);
        showError('Failed to initialize authentication service');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Phone form submission
    phoneForm.addEventListener('submit', handlePhoneSubmit);
    
    // Code form submission
    codeForm.addEventListener('submit', handleCodeSubmit);
    
    // Phone number input formatting
    const phoneInput = document.getElementById('phoneNumber');
    phoneInput.addEventListener('input', formatPhoneNumber);
    
    // Verification code input
    const codeInput = document.getElementById('verificationCode');
    codeInput.addEventListener('input', formatVerificationCode);
    
    // Country code change
    const countryCode = document.getElementById('countryCode');
    countryCode.addEventListener('change', updatePhonePlaceholder);
}

// Check for existing session
function checkExistingSession() {
    const currentUser = userPool.getCurrentUser();
    
    if (currentUser) {
        currentUser.getSession((err, session) => {
            if (err) {
                console.log('Session error:', err);
                return;
            }
            
            if (session.isValid()) {
                // User is already authenticated
                redirectToMainApp();
            }
        });
    }
}

// Handle phone number submission
async function handlePhoneSubmit(e) {
    e.preventDefault();
    
    const countryCode = document.getElementById('countryCode').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const fullPhoneNumber = countryCode + phoneNumber;
    
    if (!validatePhoneNumber(phoneNumber)) {
        showError('Please enter a valid phone number');
        return;
    }
    
    showLoading('Sending verification code...');
    hideError();
    hideSuccess();
    
    try {
        // Create user attributes
        const attributeList = [
            new AmazonCognitoIdentity.CognitoUserAttribute({
                Name: 'phone_number',
                Value: fullPhoneNumber
            })
        ];
        
        // Sign up user with phone number
        userPool.signUp(fullPhoneNumber, 'tempPassword123!', attributeList, null, (err, result) => {
            if (err) {
                hideLoading();
                
                if (err.code === 'UsernameExistsException') {
                    // User exists, proceed to verification
                    proceedToVerification(fullPhoneNumber);
                } else {
                    showError(err.message || 'Failed to send verification code');
                }
            } else {
                hideLoading();
                showSuccess('Verification code sent successfully!');
                proceedToVerification(fullPhoneNumber);
            }
        });
        
    } catch (error) {
        hideLoading();
        showError('Failed to send verification code. Please try again.');
        console.error('Phone submission error:', error);
    }
}

// Handle verification code submission
async function handleCodeSubmit(e) {
    e.preventDefault();
    
    const verificationCode = document.getElementById('verificationCode').value;
    
    if (!validateVerificationCode(verificationCode)) {
        showError('Please enter a valid 6-digit verification code');
        return;
    }
    
    showLoading('Verifying code...');
    hideError();
    hideSuccess();
    
    try {
        // Confirm user registration
        cognitoUser.confirmRegistration(verificationCode, true, (err, result) => {
            if (err) {
                hideLoading();
                showError(err.message || 'Invalid verification code');
            } else {
                hideLoading();
                showSuccess('Phone number verified successfully!');
                
                // Sign in the user
                signInUser();
            }
        });
        
    } catch (error) {
        hideLoading();
        showError('Failed to verify code. Please try again.');
        console.error('Code verification error:', error);
    }
}

// Sign in user after verification
function signInUser() {
    const phoneNumber = cognitoUser.getUsername();
    
    // Sign in with temporary password
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
        Username: phoneNumber,
        Password: 'tempPassword123!'
    });
    
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            // Store user session
            storeUserSession(result);
            
            // Redirect to main app
            setTimeout(() => {
                redirectToMainApp();
            }, 1000);
        },
        onFailure: function(err) {
            showError('Failed to sign in. Please try again.');
            console.error('Sign in error:', err);
        }
    });
}

// Store user session
function storeUserSession(session) {
    const userData = {
        phoneNumber: cognitoUser.getUsername(),
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
        expiresAt: session.getAccessToken().getExpiration() * 1000
    };
    
    localStorage.setItem('userSession', JSON.stringify(userData));
    localStorage.setItem('isAuthenticated', 'true');
}

// Proceed to verification step
function proceedToVerification(phoneNumber) {
    // Create Cognito user object
    cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: phoneNumber,
        Pool: userPool
    });
    
    // Update phone display
    phoneDisplay.textContent = formatPhoneDisplay(phoneNumber);
    
    // Show verification form
    loginForm.classList.add('hidden');
    verificationForm.classList.remove('hidden');
    
    // Start timer
    startVerificationTimer();
}

// Start verification timer
function startVerificationTimer() {
    let timeLeft = 120; // 2 minutes
    
    const updateTimer = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            resendCodeBtn.disabled = false;
            timer.textContent = '00:00';
            return;
        }
        
        timeLeft--;
        sessionTimer = setTimeout(updateTimer, 1000);
    };
    
    resendCodeBtn.disabled = true;
    updateTimer();
}

// Resend verification code
function resendCode() {
    if (!cognitoUser) {
        showError('Please enter your phone number first');
        return;
    }
    
    showLoading('Resending verification code...');
    hideError();
    hideSuccess();
    
    cognitoUser.resendConfirmationCode((err, result) => {
        hideLoading();
        
        if (err) {
            showError(err.message || 'Failed to resend code');
        } else {
            showSuccess('Verification code resent successfully!');
            startVerificationTimer();
        }
    });
}

// Validate phone number
function validatePhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Basic validation - at least 10 digits
    return cleanNumber.length >= 10;
}

// Validate verification code
function validateVerificationCode(code) {
    return /^\d{6}$/.test(code);
}

// Format phone number input
function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (value.length >= 6) {
        value = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    } else if (value.length >= 3) {
        value = value.replace(/(\d{3})(\d{0,3})/, '$1-$2');
    }
    
    e.target.value = value;
}

// Format verification code input
function formatVerificationCode(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 6 digits
    value = value.substring(0, 6);
    
    e.target.value = value;
}

// Update phone placeholder based on country code
function updatePhonePlaceholder() {
    const countryCode = document.getElementById('countryCode').value;
    const phoneInput = document.getElementById('phoneNumber');
    
    const placeholders = {
        '+1': '555-123-4567',
        '+44': '20 7946 0958',
        '+91': '98765 43210',
        '+61': '412 345 678',
        '+86': '138 0013 8000',
        '+81': '90-1234-5678',
        '+49': '30 12345678',
        '+33': '1 23 45 67 89',
        '+39': '312 345 6789',
        '+34': '612 345 678'
    };
    
    phoneInput.placeholder = placeholders[countryCode] || 'Enter your phone number';
}

// Format phone number for display
function formatPhoneDisplay(phoneNumber) {
    // Remove country code for display
    const number = phoneNumber.replace(/^\+\d{1,3}/, '');
    
    // Format as XXX-XXX-XXXX
    if (number.length === 10) {
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    return number;
}

// Show loading state
function showLoading(message = 'Processing...') {
    loadingContainer.querySelector('p').textContent = message;
    loadingContainer.classList.remove('hidden');
}

// Hide loading state
function hideLoading() {
    loadingContainer.classList.add('hidden');
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorContainer.classList.remove('hidden');
}

// Hide error message
function hideError() {
    errorContainer.classList.add('hidden');
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successContainer.classList.remove('hidden');
}

// Hide success message
function hideSuccess() {
    successContainer.classList.add('hidden');
}

// Redirect to main application
function redirectToMainApp() {
    // Store authentication state
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('authTimestamp', Date.now().toString());
    
    // Redirect to main app
    window.location.href = 'index.html';
}

// Logout function
function logout() {
    const currentUser = userPool.getCurrentUser();
    
    if (currentUser) {
        currentUser.signOut();
    }
    
    // Clear local storage
    localStorage.removeItem('userSession');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authTimestamp');
    
    // Redirect to auth page
    window.location.href = 'auth.html';
}

// Check if user is authenticated
function isAuthenticated() {
    const userSession = localStorage.getItem('userSession');
    const isAuth = localStorage.getItem('isAuthenticated');
    
    if (!userSession || !isAuth) {
        return false;
    }
    
    try {
        const session = JSON.parse(userSession);
        const now = Date.now();
        
        // Check if session is expired
        if (session.expiresAt && now > session.expiresAt) {
            logout();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error parsing user session:', error);
        return false;
    }
}

// Get current user data
function getCurrentUser() {
    const userSession = localStorage.getItem('userSession');
    
    if (userSession) {
        try {
            return JSON.parse(userSession);
        } catch (error) {
            console.error('Error parsing user session:', error);
            return null;
        }
    }
    
    return null;
}

// Refresh user session
function refreshSession() {
    const currentUser = userPool.getCurrentUser();
    
    if (currentUser) {
        currentUser.getSession((err, session) => {
            if (err) {
                console.log('Session refresh error:', err);
                logout();
                return;
            }
            
            if (session.isValid()) {
                storeUserSession(session);
            } else {
                logout();
            }
        });
    }
}

// Auto-refresh session every 30 minutes
setInterval(refreshSession, 30 * 60 * 1000);

// Export functions for use in other scripts
window.authUtils = {
    isAuthenticated,
    getCurrentUser,
    logout,
    refreshSession
}; 