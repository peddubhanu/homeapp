# HomeOrder - Food Delivery Website

A modern, responsive food ordering website built with HTML, CSS, and JavaScript. This website provides a complete food delivery experience with a beautiful UI and interactive features.

## 🍕 Features

### Core Functionality
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Interactive Menu**: Browse food items by categories (Pizza, Burgers, Pasta, Salads, Desserts)
- **Shopping Cart**: Add items, adjust quantities, and checkout
- **Smooth Animations**: Beautiful transitions and hover effects
- **Contact Form**: Get in touch with the restaurant

### User Experience
- **Modern UI**: Clean, professional design with gradient backgrounds
- **Category Filtering**: Filter menu items by food category
- **Real-time Cart Updates**: See cart total and item count in real-time
- **Smooth Scrolling**: Navigate between sections seamlessly
- **Mobile-Friendly**: Optimized for mobile devices with hamburger menu

### Technical Features
- **Vanilla JavaScript**: No frameworks required
- **CSS Grid & Flexbox**: Modern layout techniques
- **Font Awesome Icons**: Beautiful iconography
- **Google Fonts**: Professional typography
- **Intersection Observer**: Scroll-based animations

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software required

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Start exploring the website!

### File Structure
```
homeapp/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality
├── README.md           # This file
└── test.html           # Original test file
```

## 🎨 Customization

### Adding New Menu Items
To add new food items, edit the `menuItems` array in `script.js`:

```javascript
{
    id: 11, // Unique ID
    name: "Your Food Name",
    description: "Description of the food item",
    price: 12.99,
    category: "pizza", // Category: pizza, burger, pasta, salad, dessert
    image: "https://your-image-url.com/image.jpg"
}
```

### Changing Colors
The main color scheme uses `#ff6b6b` (coral red). To change colors, update these CSS variables in `styles.css`:

```css
/* Primary color */
--primary-color: #ff6b6b;
--primary-hover: #ff5252;

/* Background colors */
--hero-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adding New Categories
1. Add the category button in `index.html`:
```html
<button class="category-tab" data-category="newcategory">New Category</button>
```

2. Add menu items with the new category in `script.js`

### Modifying Contact Information
Update the contact details in `index.html`:
```html
<div class="contact-item">
    <i class="fas fa-phone"></i>
    <div>
        <h3>Phone</h3>
        <p>Your Phone Number</p>
    </div>
</div>
```

## 📱 Responsive Design

The website is fully responsive and includes:
- **Desktop**: Full layout with sidebar cart
- **Tablet**: Adjusted grid layouts and spacing
- **Mobile**: Single column layout, full-width cart, hamburger menu

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🛒 Shopping Cart Features

### Cart Functionality
- Add items to cart
- Adjust quantities (+/- buttons)
- Remove items automatically when quantity reaches 0
- Real-time total calculation
- Cart count badge in navigation
- Sidebar cart with overlay

### Cart Storage
Currently, the cart is stored in memory (resets on page refresh). To add persistent storage, you can integrate localStorage:

```javascript
// Save cart to localStorage
localStorage.setItem('cart', JSON.stringify(cart));

// Load cart from localStorage
const savedCart = localStorage.getItem('cart');
if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCart();
}
```

## 🎯 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Known Issues

- Cart resets on page refresh (can be fixed with localStorage)
- Contact form is simulated (needs backend integration)
- Images are from Unsplash (replace with your own)

## 🔧 Future Enhancements

- [ ] Backend integration for real orders
- [ ] User authentication
- [ ] Payment processing
- [ ] Order tracking
- [ ] Restaurant reviews
- [ ] Delivery time estimation
- [ ] Multiple restaurant support
- [ ] Admin panel for menu management

## 📞 Support

If you have any questions or need help customizing the website, feel free to:
- Open an issue on GitHub
- Contact through the website's contact form
- Email: support@homeorder.com

---

**Enjoy your food ordering experience! 🍕🍔🍝** 