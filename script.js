// Menu Data - Load from localStorage or use default
let menuItems = [];

// Cart functionality
let cart = [];
let currentCategory = 'all';

// Authentication state
let isUserAuthenticated = false;
let currentUser = null;

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const categoryTabs = document.querySelectorAll('.category-tab');
const cartSidebar = document.getElementById('cartSidebar');
const cartOverlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');
const navAuth = document.getElementById('navAuth');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadMenuItems();
    displayMenuItems();
    setupEventListeners();
});

// Check authentication status
function checkAuthentication() {
    // Check if authUtils is available (from auth-script.js)
    if (typeof window.authUtils !== 'undefined') {
        isUserAuthenticated = window.authUtils.isAuthenticated();
        currentUser = window.authUtils.getCurrentUser();
    } else {
        // Fallback to localStorage check
        const userSession = localStorage.getItem('userSession');
        const isAuth = localStorage.getItem('isAuthenticated');
        isUserAuthenticated = !!(userSession && isAuth);
        
        if (isUserAuthenticated) {
            try {
                currentUser = JSON.parse(userSession);
            } catch (error) {
                console.error('Error parsing user session:', error);
                isUserAuthenticated = false;
                currentUser = null;
            }
        }
    }
    
    updateAuthUI();
}

// Update authentication UI
function updateAuthUI() {
    if (isUserAuthenticated && currentUser) {
        // Show user profile
        const phoneNumber = currentUser.phoneNumber || 'Unknown';
        const displayPhone = formatPhoneDisplay(phoneNumber);
        const userInitial = displayPhone.charAt(0).toUpperCase();
        
        navAuth.innerHTML = `
            <div class="user-profile" onclick="showUserMenu()">
                <div class="user-avatar">${userInitial}</div>
                <div class="user-info">
                    <div class="user-name">User</div>
                    <div class="user-phone">${displayPhone}</div>
                </div>
            </div>
        `;
    } else {
        // Show login button
        navAuth.innerHTML = `
            <button class="auth-btn" onclick="goToLogin()">
                <i class="fas fa-sign-in-alt"></i>
                Login
            </button>
        `;
    }
}

// Format phone number for display
function formatPhoneDisplay(phoneNumber) {
    // Remove country code and format
    const number = phoneNumber.replace(/^\+\d{1,3}/, '');
    
    if (number.length === 10) {
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    return number;
}

// Show user menu
function showUserMenu() {
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        padding: 1rem;
        min-width: 200px;
        z-index: 1000;
        margin-top: 0.5rem;
    `;
    
    userMenu.innerHTML = `
        <div class="user-menu-header">
            <div class="user-avatar" style="width: 40px; height: 40px; font-size: 1.2rem;">
                ${formatPhoneDisplay(currentUser.phoneNumber).charAt(0).toUpperCase()}
            </div>
            <div class="user-menu-info">
                <div class="user-name">User</div>
                <div class="user-phone">${formatPhoneDisplay(currentUser.phoneNumber)}</div>
            </div>
        </div>
        <div class="user-menu-actions">
            <button class="menu-btn" onclick="viewOrders()">
                <i class="fas fa-list"></i>
                My Orders
            </button>
            <button class="menu-btn" onclick="viewProfile()">
                <i class="fas fa-user"></i>
                Profile
            </button>
            <button class="menu-btn logout-btn" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        </div>
    `;
    
    // Add styles for menu elements
    const menuStyles = `
        .user-menu-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e9ecef;
            margin-bottom: 1rem;
        }
        
        .user-menu-info {
            flex: 1;
        }
        
        .user-menu-actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .menu-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 5px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: background 0.3s ease;
            text-align: left;
            width: 100%;
        }
        
        .menu-btn:hover {
            background: #f8f9fa;
        }
        
        .menu-btn.logout-btn {
            color: #dc3545;
        }
        
        .menu-btn.logout-btn:hover {
            background: #f8d7da;
        }
    `;
    
    // Inject styles if not already present
    if (!document.getElementById('user-menu-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'user-menu-styles';
        styleSheet.textContent = menuStyles;
        document.head.appendChild(styleSheet);
    }
    
    // Position the menu
    const userProfile = navAuth.querySelector('.user-profile');
    userProfile.style.position = 'relative';
    userProfile.appendChild(userMenu);
    
    // Close menu when clicking outside
    document.addEventListener('click', function closeMenu(e) {
        if (!userProfile.contains(e.target)) {
            userMenu.remove();
            document.removeEventListener('click', closeMenu);
        }
    });
}

// Navigation functions
function goToLogin() {
    window.location.href = 'auth.html';
}

function logout() {
    if (typeof window.authUtils !== 'undefined') {
        window.authUtils.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('userSession');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTimestamp');
        window.location.reload();
    }
}

function viewOrders() {
    // TODO: Implement order history view
    showNotification('Order history feature coming soon!', 'info');
}

function viewProfile() {
    // TODO: Implement profile view
    showNotification('Profile feature coming soon!', 'info');
}

// Load menu items from localStorage or use default
function loadMenuItems() {
    const savedMenuItems = localStorage.getItem('menuItems');
    if (savedMenuItems) {
        menuItems = JSON.parse(savedMenuItems);
    } else {
        // Default menu items if none exist
        menuItems = [
            {
                id: 1,
                name: "Margherita Pizza",
                description: "Classic tomato sauce with mozzarella cheese and fresh basil",
                price: 14.99,
                category: "pizza",
                image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 2,
                name: "Pepperoni Pizza",
                description: "Spicy pepperoni with melted cheese on crispy crust",
                price: 16.99,
                category: "pizza",
                image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 3,
                name: "Classic Burger",
                description: "Juicy beef patty with lettuce, tomato, and special sauce",
                price: 12.99,
                category: "burger",
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 4,
                name: "Cheese Burger",
                description: "Classic burger topped with melted cheddar cheese",
                price: 13.99,
                category: "burger",
                image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 5,
                name: "Spaghetti Carbonara",
                description: "Pasta with eggs, cheese, pancetta, and black pepper",
                price: 15.99,
                category: "pasta",
                image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 6,
                name: "Fettuccine Alfredo",
                description: "Creamy pasta with parmesan cheese and butter",
                price: 14.99,
                category: "pasta",
                image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 7,
                name: "Caesar Salad",
                description: "Fresh romaine lettuce with caesar dressing and croutons",
                price: 9.99,
                category: "salad",
                image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 8,
                name: "Greek Salad",
                description: "Mixed greens with feta cheese, olives, and mediterranean dressing",
                price: 10.99,
                category: "salad",
                image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 9,
                name: "Chocolate Cake",
                description: "Rich chocolate cake with chocolate ganache frosting",
                price: 7.99,
                category: "dessert",
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            },
            {
                id: 10,
                name: "Tiramisu",
                description: "Italian dessert with coffee-soaked ladyfingers and mascarpone",
                price: 8.99,
                category: "dessert",
                image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            }
        ];
        // Save default items
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category tab clicks
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const category = tab.dataset.category;
            filterMenu(category);
            
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Contact form submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }
}

// Display menu items
function displayMenuItems(items = menuItems) {
    menuGrid.innerHTML = '';
    
    // Filter out inactive items
    const activeItems = items.filter(item => !item.status || item.status === 'active');
    
    if (activeItems.length === 0) {
        menuGrid.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem; grid-column: 1 / -1;">No menu items available</p>';
        return;
    }
    
    activeItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="menu-item-image">
            <div class="menu-item-content">
                <h3 class="menu-item-title">${item.name}</h3>
                <p class="menu-item-description">${item.description}</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
        menuGrid.appendChild(menuItem);
    });
}

// Filter menu by category
function filterMenu(category) {
    currentCategory = category;
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    displayMenuItems(filteredItems);
}

// Add item to cart
function addToCart(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;

    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }
    
    updateCart();
    showNotification(`${item.name} added to cart!`);
}

// Remove item from cart
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCart();
}

// Update item quantity
function updateQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        updateCart();
    }
}

// Update cart display
function updateCart() {
    // Update cart items display
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Your cart is empty</p>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Toggle cart sidebar
function toggleCart() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('open');
    document.body.style.overflow = cartSidebar.classList.contains('open') ? 'hidden' : '';
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    // Check if user is authenticated
    if (!isUserAuthenticated) {
        showNotification('Please login to place an order', 'error');
        goToLogin();
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create order object with user information
    const order = {
        id: Date.now(),
        customer: currentUser.phoneNumber,
        customerName: 'User',
        items: cart.map(item => item.name),
        total: total,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.phoneNumber
    };
    
    // Save order to localStorage (for admin to see)
    const existingOrders = JSON.parse(localStorage.getItem('adminOrders') || '[]');
    existingOrders.push(order);
    localStorage.setItem('adminOrders', JSON.stringify(existingOrders));
    
    showNotification(`Order placed successfully! Total: $${total.toFixed(2)}`, 'success');
    
    // Clear cart
    cart = [];
    updateCart();
    toggleCart();
}

// Scroll to menu section
function scrollToMenu() {
    document.getElementById('menu').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Handle contact form submission
function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const message = e.target.querySelector('textarea').value;
    
    // Simulate form submission
    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
    e.target.reset();
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Mobile menu toggle
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.menu-item, .feature, .contact-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Add loading animation
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
});

// Initialize body opacity
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';

// Listen for storage changes to sync with admin updates
window.addEventListener('storage', function(e) {
    if (e.key === 'menuItems') {
        loadMenuItems();
        displayMenuItems();
        if (currentCategory !== 'all') {
            filterMenu(currentCategory);
        }
    }
    
    // Check authentication changes
    if (e.key === 'userSession' || e.key === 'isAuthenticated') {
        checkAuthentication();
    }
}); 