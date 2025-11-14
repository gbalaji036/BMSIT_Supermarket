let cart = [];
let products = [];
let categories = [];

// Load initial data
document.addEventListener('DOMContentLoaded', function() {
    loadCategories();
    loadProducts();
    updateTime();
    setInterval(updateTime, 1000);
});

function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleString();
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        categories = await response.json();
        displayCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function displayCategories() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = categories.map(cat => 
        `<button class="category-btn" onclick="filterByCategory(${cat.id})">${cat.name}</button>`
    ).join('');
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Error loading products');
    }
}

function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (productsToShow.length === 0) {
        grid.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => `
        <div class="product-card" onclick="addToCart(${product.id})">
            <div class="product-code">${product.product_code}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-category">${product.category_name || 'Uncategorized'}</div>
            <div class="product-price">₹${product.price.toFixed(2)}</div>
            <div class="product-stock">Stock: ${product.stock_quantity}</div>
            <button class="btn btn-sm btn-primary">Add to Cart</button>
        </div>
    `).join('');
}

function filterByCategory(categoryId) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (categoryId === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category_id === categoryId);
        displayProducts(filtered);
    }
}

async function searchProducts() {
    const query = document.getElementById('searchInput').value;
    if (!query) {
        displayProducts(products);
        return;
    }
    
    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        displayProducts(results);
    } catch (error) {
        console.error('Error searching products:', error);
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock_quantity <= 0) {
        alert('Product out of stock!');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
            alert('Cannot add more than available stock!');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            product_code: product.product_code,
            name: product.name,
            price: product.price,
            quantity: 1,
            max_stock: product.stock_quantity
        });
    }
    
    updateCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else if (item.quantity > item.max_stock) {
        alert('Cannot exceed available stock!');
        item.quantity = item.max_stock;
    }
    
    updateCart();
}

function updateCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Cart is empty</p>';
        document.getElementById('subtotal').textContent = '₹0.00';
        document.getElementById('tax').textContent = '₹0.00';
        document.getElementById('total').textContent = '₹0.00';
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-code">${item.product_code}</div>
                <div class="item-price">₹${item.price.toFixed(2)} × ${item.quantity}</div>
            </div>
            <div class="item-actions">
                <button onclick="updateQuantity(${item.id}, -1)" class="btn-icon">−</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" class="btn-icon">+</button>
                <button onclick="removeFromCart(${item.id})" class="btn-icon btn-remove">×</button>
            </div>
            <div class="item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `₹${total.toFixed(2)}`;
}

async function checkout() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    const customerName = document.getElementById('customerName').value.trim();
    const customerContact = document.getElementById('customerContact').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    if (!customerName || !customerContact) {
        alert('Please enter customer name and contact number!');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    
    const saleData = {
        customer: {
            name: customerName,
            contact: customerContact,
            email: customerEmail
        },
        items: cart.map(item => ({
            id: item.id,
            product_code: item.product_code,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        })),
        subtotal: subtotal,
        tax: tax,
        total: total,
        payment_method: paymentMethod
    };
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            generateBill(result);
            clearCart();
            document.getElementById('customerName').value = '';
            document.getElementById('customerContact').value = '';
            document.getElementById('customerEmail').value = '';
        } else {
            alert('Error processing sale: ' + result.message);
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Error processing sale');
    }
}

function generateBill(saleData) {
    const billHTML = `
        <div class="bill">
            <div class="bill-header">
                <h1>BMS MART</h1>
                <p>Supermarket & General Store</p>
                <p>Contact: +91-XXXXXXXXXX</p>
                <hr>
            </div>
            
            <div class="bill-info">
                <p><strong>Bill No:</strong> ${saleData.sale_id}</p>
                <p><strong>Date:</strong> ${new Date(saleData.sale.sale_date).toLocaleString()}</p>
                <p><strong>Customer:</strong> ${saleData.sale.customer_name}</p>
                <p><strong>Contact:</strong> ${saleData.sale.contact_number}</p>
                <p><strong>Payment:</strong> ${saleData.sale.payment_method}</p>
                <hr>
            </div>
            
            <table class="bill-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${saleData.items.map(item => `
                        <tr>
                            <td>${item.product_code}</td>
                            <td>${item.product_name}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.unit_price.toFixed(2)}</td>
                            <td>₹${item.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="bill-summary">
                <hr>
                <p><strong>Subtotal:</strong> ₹${(saleData.sale.total_amount / 1.05).toFixed(2)}</p>
                <p><strong>Tax (5%):</strong> ₹${(saleData.sale.total_amount * 0.05 / 1.05).toFixed(2)}</p>
                <h3><strong>Total Amount:</strong> ₹${saleData.sale.total_amount.toFixed(2)}</h3>
                <hr>
            </div>
            
            <div class="bill-footer">
                <p>Thank you for shopping with us!</p>
                <p>Visit again!</p>
            </div>
        </div>
    `;
    
    document.getElementById('billContainer').innerHTML = billHTML;
    document.getElementById('billModal').style.display = 'block';
}

function printBill() {
    const billContent = document.getElementById('billContainer').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`
        <html>
        <head>
            <title>Print Bill</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .bill { max-width: 400px; margin: 0 auto; }
                .bill-header { text-align: center; margin-bottom: 20px; }
                .bill-header h1 { margin: 0; font-size: 24px; }
                .bill-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                .bill-table th, .bill-table td { padding: 5px; text-align: left; border-bottom: 1px solid #ddd; }
                .bill-table th { background: #f8f9fa; font-weight: 700; }
                .bill-summary { margin-top: 10px; }
                .bill-footer { text-align: center; margin-top: 20px; }
                hr { border: none; border-top: 2px dashed #000; margin: 10px 0; }
            </style>
        </head>
        <body>${billContent}</body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function closeBill() {
    document.getElementById('billModal').style.display = 'none';
}

function clearCart() {
    cart = [];
    updateCart();
}

// Allow Enter key for search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchProducts();
        });
    }
});
