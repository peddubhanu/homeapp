// Admin Dashboard JavaScript

// Global variables
let menuItems = [];
let orders = [];
let categories = [
    { name: 'Pizza', icon: 'fas fa-pizza-slice', count: 0 },
    { name: 'Burgers', icon: 'fas fa-hamburger', count: 0 },
    { name: 'Pasta', icon: 'fas fa-utensils', count: 0 },
    { name: 'Salads', icon: 'fas fa-leaf', count: 0 },
    { name: 'Desserts', icon: 'fas fa-ice-cream', count: 0 }
];

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupEventListeners();
    updateDashboard();
    displayMenuItems();
    displayCategories();
    displayOrders();
});

// Setup event listeners
function setupEventListeners() {
    // Add item form
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItem);
    }

    // Edit item form
    const editItemForm = document.getElementById('editItemForm');
    if (editItemForm) {
        editItemForm.addEventListener('submit', handleEditItem);
    }

    // Add category form
    const addCategoryForm = document.getElementById('addCategoryForm');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', handleAddCategory);
    }
}

// Load data from localStorage
function loadData() {
    // Load menu items
    const savedMenuItems = localStorage.getItem('adminMenuItems');
    if (savedMenuItems) {
        menuItems = JSON.parse(savedMenuItems);
    } else {
        // Initialize with default items if no data exists
        menuItems = [
            {
                id: 1,
                name: "Margherita Pizza",
                description: "Classic tomato sauce with mozzarella cheese and fresh basil",
                price: 14.99,
                category: "pizza",
                image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
                status: "active"
            },
            {
                id: 2,
                name: "Pepperoni Pizza",
                description: "Spicy pepperoni with melted cheese on crispy crust",
                price: 16.99,
                category: "pizza",
                image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
                status: "active"
            },
            {
                id: 3,
                name: "Classic Burger",
                description: "Juicy beef patty with lettuce, tomato, and special sauce",
                price: 12.99,
                category: "burger",
                image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
                status: "active"
            }
        ];
        saveMenuItems();
    }

    // Load orders
    const savedOrders = localStorage.getItem('adminOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    } else {
        // Initialize with sample orders
        orders = [
            {
                id: 1,
                customer: "John Doe",
                items: ["Margherita Pizza", "Classic Burger"],
                total: 27.98,
                status: "completed",
                date: "2024-01-15"
            },
            {
                id: 2,
                customer: "Jane Smith",
                items: ["Pepperoni Pizza"],
                total: 16.99,
                status: "pending",
                date: "2024-01-16"
            }
        ];
        saveOrders();
    }
}

// Save data to localStorage
function saveMenuItems() {
    localStorage.setItem('adminMenuItems', JSON.stringify(menuItems));
    // Also update the main site's menu items
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
}

function saveOrders() {
    localStorage.setItem('adminOrders', JSON.stringify(orders));
}

// Navigation functions
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
}

// Dashboard functions
function updateDashboard() {
    // Update stats
    document.getElementById('totalItems').textContent = menuItems.length;
    document.getElementById('totalOrders').textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    
    document.getElementById('totalCustomers').textContent = new Set(orders.map(order => order.customer)).size;

    // Update category counts
    categories.forEach(category => {
        category.count = menuItems.filter(item => item.category === category.name.toLowerCase()).length;
    });

    // Display recent orders
    displayRecentOrders();
    
    // Display popular items
    displayPopularItems();
}

function displayRecentOrders() {
    const recentOrdersContainer = document.getElementById('recentOrders');
    const recentOrders = orders.slice(-5).reverse();

    if (recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = '<p class="no-data">No recent orders</p>';
        return;
    }

    recentOrdersContainer.innerHTML = recentOrders.map(order => `
        <div class="recent-order-item">
            <div class="order-info">
                <h4>Order #${order.id}</h4>
                <p>${order.customer} - $${order.total.toFixed(2)}</p>
                <small>${order.date}</small>
            </div>
            <span class="status-badge status-${order.status}">${order.status}</span>
        </div>
    `).join('');
}

function displayPopularItems() {
    const popularItemsContainer = document.getElementById('popularItems');
    
    // For demo purposes, show items with highest prices
    const popularItems = menuItems
        .sort((a, b) => b.price - a.price)
        .slice(0, 3);

    if (popularItems.length === 0) {
        popularItemsContainer.innerHTML = '<p class="no-data">No items available</p>';
        return;
    }

    popularItemsContainer.innerHTML = popularItems.map(item => `
        <div class="popular-item">
            <img src="${item.image}" alt="${item.name}" class="popular-item-image">
            <div class="popular-item-info">
                <h4>${item.name}</h4>
                <p>$${item.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

// Menu management functions
function displayMenuItems() {
    const tableBody = document.getElementById('menuTableBody');
    
    if (menuItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No menu items found</td></tr>';
        return;
    }

    tableBody.innerHTML = menuItems.map(item => `
        <tr>
            <td><img src="${item.image}" alt="${item.name}" class="menu-item-image"></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function searchMenuItems() {
    const searchTerm = document.getElementById('menuSearch').value.toLowerCase();
    const filteredItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );
    displayFilteredMenuItems(filteredItems);
}

function filterMenuItems() {
    const category = document.getElementById('categoryFilter').value;
    const filteredItems = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);
    displayFilteredMenuItems(filteredItems);
}

function displayFilteredMenuItems(items) {
    const tableBody = document.getElementById('menuTableBody');
    
    if (items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No items found</td></tr>';
        return;
    }

    tableBody.innerHTML = items.map(item => `
        <tr>
            <td><img src="${item.image}" alt="${item.name}" class="menu-item-image"></td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            <td class="action-buttons">
                <button class="btn-secondary" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteItem(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Add new item
function handleAddItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newItem = {
        id: Date.now(), // Simple ID generation
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        image: formData.get('image'),
        description: formData.get('description'),
        status: formData.get('status')
    };

    menuItems.push(newItem);
    saveMenuItems();
    
    // Reset form and show success message
    e.target.reset();
    showNotification('Item added successfully!', 'success');
    
    // Update displays
    updateDashboard();
    displayMenuItems();
    displayCategories();
    
    // Go back to menu section
    showSection('menu');
}

// Edit item
function editItem(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;

    // Populate edit form
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemCategory').value = item.category;
    document.getElementById('editItemPrice').value = item.price;
    document.getElementById('editItemImage').value = item.image;
    document.getElementById('editItemDescription').value = item.description;
    document.getElementById('editItemStatus').value = item.status;

    // Show modal
    showModal('editModal');
}

function handleEditItem(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const itemId = parseInt(document.getElementById('editItemId').value);
    
    const updatedItem = {
        id: itemId,
        name: formData.get('name'),
        category: formData.get('category'),
        price: parseFloat(formData.get('price')),
        image: formData.get('image'),
        description: formData.get('description'),
        status: formData.get('status')
    };

    // Update item in array
    const index = menuItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
        menuItems[index] = updatedItem;
        saveMenuItems();
        
        closeModal();
        showNotification('Item updated successfully!', 'success');
        
        // Update displays
        updateDashboard();
        displayMenuItems();
        displayCategories();
    }
}

// Delete item
function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        menuItems = menuItems.filter(item => item.id !== itemId);
        saveMenuItems();
        
        showNotification('Item deleted successfully!', 'success');
        
        // Update displays
        updateDashboard();
        displayMenuItems();
        displayCategories();
    }
}

// Categories management
function displayCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card">
            <div class="category-icon">
                <i class="${category.icon}"></i>
            </div>
            <div class="category-info">
                <h3>${category.name}</h3>
                <p>${category.count} items</p>
            </div>
        </div>
    `).join('');
}

function showAddCategoryModal() {
    showModal('addCategoryModal');
}

function closeAddCategoryModal() {
    closeModal('addCategoryModal');
}

function handleAddCategory(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const newCategory = {
        name: formData.get('name'),
        icon: formData.get('icon'),
        count: 0
    };

    categories.push(newCategory);
    
    // Save categories to localStorage
    localStorage.setItem('adminCategories', JSON.stringify(categories));
    
    // Reset form and show success message
    e.target.reset();
    showNotification('Category added successfully!', 'success');
    
    // Update displays
    displayCategories();
    closeAddCategoryModal();
}

// Orders management
function displayOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No orders found</td></tr>';
        return;
    }

    tableBody.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.items.join(', ')}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-${order.status}">${order.status}</span></td>
            <td>${order.date}</td>
            <td class="action-buttons">
                <button class="btn-success" onclick="updateOrderStatus(${order.id}, 'completed')">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-secondary" onclick="updateOrderStatus(${order.id}, 'pending')">
                    <i class="fas fa-clock"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(orderId, status) {
    const order = orders.find(order => order.id === orderId);
    if (order) {
        order.status = status;
        saveOrders();
        displayOrders();
        updateDashboard();
        showNotification(`Order #${orderId} status updated to ${status}`, 'success');
    }
}

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
    document.getElementById('modalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId = null) {
    if (modalId) {
        document.getElementById(modalId).classList.remove('active');
    } else {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    document.getElementById('modalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    closeModal();
}

// Utility functions
function resetForm() {
    document.getElementById('addItemForm').reset();
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
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

// Navigation functions
function goToMainSite() {
    window.open('index.html', '_blank');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // In a real application, you would clear session/tokens here
        window.location.href = 'index.html';
    }
}

// Add some CSS for the new elements
const additionalStyles = `
    .recent-order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .recent-order-item:last-child {
        border-bottom: none;
    }
    
    .order-info h4 {
        margin: 0 0 0.25rem 0;
        color: #333;
    }
    
    .order-info p {
        margin: 0 0 0.25rem 0;
        color: #666;
    }
    
    .order-info small {
        color: #999;
    }
    
    .popular-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .popular-item:last-child {
        border-bottom: none;
    }
    
    .popular-item-image {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 8px;
    }
    
    .popular-item-info h4 {
        margin: 0 0 0.25rem 0;
        color: #333;
    }
    
    .popular-item-info p {
        margin: 0;
        color: #ff6b6b;
        font-weight: 600;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet); 