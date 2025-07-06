// HomeOrder Admin Panel - DynamoDB Integration
// Uses AWS SDK default credential provider chain

// Initialize AWS SDK
let dynamodb;
let isAWSConfigured = false;

// DynamoDB Table Names
const TABLES = {
    MENU_ITEMS: 'homeorder-menu-items-dev',
    ORDERS: 'homeorder-orders-dev'
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    loadDashboard();
    loadMenuItems();
    loadOrders();
});

// Initialize AWS SDK and admin panel
function initializeAdmin() {
    try {
        // Initialize AWS SDK with default credential provider chain
        // This will automatically use AWS CLI credentials, IAM roles, or environment variables
        AWS.config.update({
            region: 'us-east-2'
        });
        
        dynamodb = new AWS.DynamoDB.DocumentClient();
        isAWSConfigured = true;
        
        console.log('AWS SDK initialized with default credentials');
        
        // Test the connection
        testDynamoDBConnection();
    } catch (error) {
        console.warn('AWS SDK initialization failed:', error);
        console.warn('Using localStorage fallback for development');
        // Fallback to localStorage for development
        loadFromLocalStorage();
    }
}

// Test DynamoDB connection
async function testDynamoDBConnection() {
    try {
        const params = {
            TableName: TABLES.MENU_ITEMS,
            Limit: 1
        };
        
        await dynamodb.scan(params).promise();
        console.log('✅ DynamoDB connection successful');
    } catch (error) {
        console.warn('DynamoDB connection failed:', error);
        console.warn('Using localStorage fallback');
        isAWSConfigured = false;
        loadFromLocalStorage();
    }
}

// Load data from localStorage (fallback)
function loadFromLocalStorage() {
    const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    
    displayMenuItems(menuItems);
    displayOrders(orders);
    updateDashboardStats(menuItems, orders);
}

// Dashboard Functions
function loadDashboard() {
    if (isAWSConfigured) {
        Promise.all([
            getAllMenuItems(),
            getAllOrders()
        ]).then(([menuItems, orders]) => {
            updateDashboardStats(menuItems, orders);
            displayRecentOrders(orders);
            displayPopularItems(menuItems);
        }).catch(error => {
            console.error('Error loading dashboard:', error);
            loadFromLocalStorage();
        });
    } else {
        loadFromLocalStorage();
    }
}

function updateDashboardStats(menuItems, orders) {
    document.getElementById('totalItems').textContent = menuItems.length;
    document.getElementById('totalOrders').textContent = orders.length;
    
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    
    const uniqueCustomers = new Set(orders.map(order => order.customerPhone)).size;
    document.getElementById('totalCustomers').textContent = uniqueCustomers;
}

function displayRecentOrders(orders) {
    const recentOrdersContainer = document.getElementById('recentOrders');
    const recentOrders = orders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = '<p class="no-data">No recent orders</p>';
        return;
    }
    
    const ordersHTML = recentOrders.map(order => `
        <div class="order-item">
            <div class="order-info">
                <strong>${order.customerName}</strong>
                <span class="order-status ${order.orderStatus}">${order.orderStatus}</span>
            </div>
            <div class="order-details">
                <span>$${order.totalAmount}</span>
                <small>${new Date(order.orderDate).toLocaleDateString()}</small>
            </div>
        </div>
    `).join('');
    
    recentOrdersContainer.innerHTML = ordersHTML;
}

function displayPopularItems(menuItems) {
    const popularItemsContainer = document.getElementById('popularItems');
    
    if (menuItems.length === 0) {
        popularItemsContainer.innerHTML = '<p class="no-data">No data available</p>';
        return;
    }
    
    const popularItems = menuItems.slice(0, 5);
    const itemsHTML = popularItems.map(item => `
        <div class="popular-item">
            <span>${item.name}</span>
            <span class="price">$${item.price}</span>
        </div>
    `).join('');
    
    popularItemsContainer.innerHTML = itemsHTML;
}

// Menu Items Functions
async function loadMenuItems() {
    if (isAWSConfigured) {
        try {
            const menuItems = await getAllMenuItems();
            displayMenuItems(menuItems);
        } catch (error) {
            console.error('Error loading menu items:', error);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
}

async function getAllMenuItems() {
    if (!isAWSConfigured) {
        return JSON.parse(localStorage.getItem('menuItems') || '[]');
    }
    
    const params = {
        TableName: TABLES.MENU_ITEMS
    };
    
    try {
        const result = await dynamodb.scan(params).promise();
        return result.Items || [];
    } catch (error) {
        console.error('Error getting menu items:', error);
        throw error;
    }
}

function displayMenuItems(menuItems) {
    const tableBody = document.getElementById('menuTableBody');
    
    if (menuItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No menu items found</td></tr>';
        return;
    }
    
    const rowsHTML = menuItems.map(item => `
        <tr>
            <td>
                <img src="${item.image || 'https://via.placeholder.com/50x50'}" alt="${item.name}" class="item-image">
            </td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>$${item.price}</td>
            <td>
                <span class="status-badge ${item.isAvailable === 'true' ? 'available' : 'unavailable'}">
                    ${item.isAvailable === 'true' ? 'Available' : 'Unavailable'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editMenuItem('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteMenuItem('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    tableBody.innerHTML = rowsHTML;
}

async function addMenuItem(itemData) {
    const item = {
        id: generateId(),
        name: itemData.name,
        description: itemData.description,
        price: parseFloat(itemData.price),
        category: itemData.category,
        image: itemData.image || 'https://via.placeholder.com/300x200',
        isAvailable: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (isAWSConfigured) {
        try {
            const params = {
                TableName: TABLES.MENU_ITEMS,
                Item: item
            };
            
            await dynamodb.put(params).promise();
            console.log('Menu item added to DynamoDB');
        } catch (error) {
            console.error('Error adding menu item:', error);
            throw error;
        }
    } else {
        // Fallback to localStorage
        const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
        menuItems.push(item);
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
    }
    
    loadMenuItems();
    loadDashboard();
    showNotification('Menu item added successfully!', 'success');
}

async function updateMenuItem(itemId, itemData) {
    const updateData = {
        name: itemData.name,
        description: itemData.description,
        price: parseFloat(itemData.price),
        category: itemData.category,
        image: itemData.image,
        updatedAt: new Date().toISOString()
    };
    
    if (isAWSConfigured) {
        try {
            const params = {
                TableName: TABLES.MENU_ITEMS,
                Key: { id: itemId },
                UpdateExpression: 'SET #name = :name, #description = :description, #price = :price, #category = :category, #image = :image, #updatedAt = :updatedAt',
                ExpressionAttributeNames: {
                    '#name': 'name',
                    '#description': 'description',
                    '#price': 'price',
                    '#category': 'category',
                    '#image': 'image',
                    '#updatedAt': 'updatedAt'
                },
                ExpressionAttributeValues: {
                    ':name': updateData.name,
                    ':description': updateData.description,
                    ':price': updateData.price,
                    ':category': updateData.category,
                    ':image': updateData.image,
                    ':updatedAt': updateData.updatedAt
                }
            };
            
            await dynamodb.update(params).promise();
            console.log('Menu item updated in DynamoDB');
        } catch (error) {
            console.error('Error updating menu item:', error);
            throw error;
        }
    } else {
        // Fallback to localStorage
        const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
        const index = menuItems.findIndex(item => item.id === itemId);
        if (index !== -1) {
            menuItems[index] = { ...menuItems[index], ...updateData };
            localStorage.setItem('menuItems', JSON.stringify(menuItems));
        }
    }
    
    loadMenuItems();
    showNotification('Menu item updated successfully!', 'success');
}

async function deleteMenuItem(itemId) {
    if (!confirm('Are you sure you want to delete this menu item?')) {
        return;
    }
    
    if (isAWSConfigured) {
        try {
            const params = {
                TableName: TABLES.MENU_ITEMS,
                Key: { id: itemId }
            };
            
            await dynamodb.delete(params).promise();
            console.log('Menu item deleted from DynamoDB');
        } catch (error) {
            console.error('Error deleting menu item:', error);
            throw error;
        }
    } else {
        // Fallback to localStorage
        const menuItems = JSON.parse(localStorage.getItem('menuItems') || '[]');
        const filteredItems = menuItems.filter(item => item.id !== itemId);
        localStorage.setItem('menuItems', JSON.stringify(filteredItems));
    }
    
    loadMenuItems();
    loadDashboard();
    showNotification('Menu item deleted successfully!', 'success');
}

// Orders Functions
async function loadOrders() {
    if (isAWSConfigured) {
        try {
            const orders = await getAllOrders();
            displayOrders(orders);
        } catch (error) {
            console.error('Error loading orders:', error);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
}

async function getAllOrders() {
    if (!isAWSConfigured) {
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }
    
    const params = {
        TableName: TABLES.ORDERS
    };
    
    try {
        const result = await dynamodb.scan(params).promise();
        return result.Items || [];
    } catch (error) {
        console.error('Error getting orders:', error);
        throw error;
    }
}

function displayOrders(orders) {
    const ordersContainer = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<tr><td colspan="7" class="no-data">No orders found</td></tr>';
        return;
    }
    
    const rowsHTML = orders.map(order => `
        <tr>
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.customerPhone}</td>
            <td>$${order.totalAmount}</td>
            <td>
                <span class="status-badge ${order.orderStatus}">${order.orderStatus}</span>
            </td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-view" onclick="viewOrder('${order.orderId}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-edit" onclick="updateOrderStatus('${order.orderId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    ordersContainer.innerHTML = rowsHTML;
}

async function updateOrderStatus(orderId, newStatus) {
    if (isAWSConfigured) {
        try {
            const params = {
                TableName: TABLES.ORDERS,
                Key: { orderId: orderId },
                UpdateExpression: 'SET orderStatus = :status, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':status': newStatus,
                    ':updatedAt': new Date().toISOString()
                }
            };
            
            await dynamodb.update(params).promise();
            console.log('Order status updated in DynamoDB');
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    } else {
        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const index = orders.findIndex(order => order.orderId === orderId);
        if (index !== -1) {
            orders[index].orderStatus = newStatus;
            orders[index].updatedAt = new Date().toISOString();
            localStorage.setItem('orders', JSON.stringify(orders));
        }
    }
    
    loadOrders();
    loadDashboard();
    showNotification('Order status updated successfully!', 'success');
}

// Utility Functions
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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
    
    // Find and activate the corresponding nav item
    const navItem = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function goToMainSite() {
    window.open('index.html', '_blank');
}

function logout() {
    window.location.href = 'index.html';
}

// Form handling
document.addEventListener('DOMContentLoaded', function() {
    const addItemForm = document.getElementById('addItemForm');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(addItemForm);
            const itemData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: formData.get('price'),
                category: formData.get('category'),
                image: formData.get('image')
            };
            
            addMenuItem(itemData);
            addItemForm.reset();
            showSection('menu');
        });
    }
});

// Search and filter functions
function searchMenuItems() {
    const searchTerm = document.getElementById('menuSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#menuTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const category = row.cells[2].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || category.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function filterMenuItems() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const rows = document.querySelectorAll('#menuTableBody tr');
    
    rows.forEach(row => {
        const category = row.cells[2].textContent.toLowerCase();
        
        if (selectedCategory === 'all' || category === selectedCategory) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
} 