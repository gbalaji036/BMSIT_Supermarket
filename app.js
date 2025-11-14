// Initialize data in localStorage
function initializeData() {
    if (!localStorage.getItem('categories')) {
        const categories = [
            { id: 1, name: 'Groceries', description: 'Daily grocery items' },
            { id: 2, name: 'Beverages', description: 'Drinks and beverages' },
            { id: 3, name: 'Snacks', description: 'Snacks and chips' },
            { id: 4, name: 'Dairy Products', description: 'Milk, cheese, yogurt' },
            { id: 5, name: 'Personal Care', description: 'Toiletries' }
        ];
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    if (!localStorage.getItem('products')) {
        const products = [
            { id: 1, product_code: 'BMS001', name: 'Rice 1kg', category_id: 1, price: 60.00, stock_quantity: 100 },
            { id: 2, product_code: 'BMS002', name: 'Wheat Flour 1kg', category_id: 1, price: 45.00, stock_quantity: 80 },
            { id: 3, product_code: 'BMS003', name: 'Coca Cola 500ml', category_id: 2, price: 40.00, stock_quantity: 150 },
            { id: 4, product_code: 'BMS004', name: 'Pepsi 500ml', category_id: 2, price: 40.00, stock_quantity: 150 },
            { id: 5, product_code: 'BMS005', name: 'Lays Chips', category_id: 3, price: 20.00, stock_quantity: 200 },
            { id: 6, product_code: 'BMS006', name: 'Milk 1L', category_id: 4, price: 60.00, stock_quantity: 50 },
            { id: 7, product_code: 'BMS007', name: 'Bread', category_id: 1, price: 35.00, stock_quantity: 60 },
            { id: 8, product_code: 'BMS008', name: 'Toothpaste', category_id: 5, price: 85.00, stock_quantity: 75 }
        ];
        localStorage.setItem('products', JSON.stringify(products));
    }

    if (!localStorage.getItem('customers')) {
        localStorage.setItem('customers', JSON.stringify([]));
    }

    if (!localStorage.getItem('sales')) {
        localStorage.setItem('sales', JSON.stringify([]));
    }
}

// Storage helpers
function getCategories() {
    return JSON.parse(localStorage.getItem('categories')) || [];
}

function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function getCustomers() {
    return JSON.parse(localStorage.getItem('customers')) || [];
}

function getSales() {
    return JSON.parse(localStorage.getItem('sales')) || [];
}

// Global variables
let cart = [];
let products = [];
let categories = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    loadCategories();
    loadProducts();
    updateTime();
    setInterval(updateTime, 1000);
    
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchProducts();
    });
});

function updateTime() {
    document.getElementById('currentTime').textContent = new Date().toLocaleString('en-IN');
}

function loadCategories() {
    categories = getCategories();
    displayCategories();
}

function displayCategories() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = categories.map(cat => 
        `<button class="category-btn" onclick="filterByCategory(${cat.id})">${cat.name}</button>`
    ).join('');
}

function loadProducts() {
    products = getProducts();
    displayProducts(products);
}

function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (productsToShow.length === 0) {
        grid.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }
    
    grid.innerHTML = productsToShow.map(product => {
        const category = categories.find(c => c.id === product.category_id);
        return `
            <div class="product-card" onclick="addToCart(${product.id})">
                <div class="product-code">${product.product_code}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-category">${category ? category.name : 'Uncategorized'}</div>
                <div class="product-price">₹${product.price.toFixed(2)}</div>
                <div class="product-stock">Stock: ${product.stock_quantity}</div>
                <button class="btn btn-sm btn-primary">Add to Cart</button>
            </div>
        `;
    }).join('');
}

function filterByCategory(categoryId) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (categoryId === 'all') {
        displayProducts(products);
    } else {
        displayProducts(products.filter(p => p.category_id === categoryId));
    }
}

function searchProducts() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    if (!query) {
        displayProducts(products);
        return;
    }
    
    const results = products.filter(p => 
        p.product_code.toLowerCase().includes(query) || 
        p.name.toLowerCase().includes(query)
    );
    displayProducts(results);
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

function checkout() {
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
    
    // Save customer
    let customers = getCustomers();
    let customer = customers.find(c => c.contact === customerContact);
    if (!customer) {
        customer = {
            id: customers.length + 1,
            name: customerName,
            contact: customerContact,
            email: customerEmail
        };
        customers.push(customer);
        localStorage.setItem('customers', JSON.stringify(customers));
    }
    
    // Create sale
    const sales = getSales();
    const saleId = sales.length + 1;
    const sale = {
        id: saleId,
        customer_id: customer.id,
        customer_name: customerName,
        contact_number: customerContact,
        total_amount: total,
        payment_method: paymentMethod,
        sale_date: new Date().toISOString(),
        items: cart.map(item => ({
            product_id: item.id,
            product_code: item.product_code,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            subtotal: item.price * item.quantity
        }))
    };
    
    sales.push(sale);
    localStorage.setItem('sales', JSON.stringify(sales));
    
    // Update stock
    products = getProducts();
    cart.forEach(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (product) {
            product.stock_quantity -= cartItem.quantity;
        }
    });
    localStorage.setItem('products', JSON.stringify(products));
    
    // Show bill
    generateBill(sale);
    
    // Clear
    clearCart();
    document.getElementById('customerName').value = '';
    document.getElementById('customerContact').value = '';
    document.getElementById('customerEmail').value = '';
    
    // Reload products
    loadProducts();
}

function generateBill(sale) {
    const billHTML = `
        <div class="bill">
            <div class="bill-header">
                <h1>BMS MART</h1>
                <p>Supermarket & General Store</p>
                <p>Contact: +91-XXXXXXXXXX</p>
                <hr>
            </div>
            
            <div class="bill-info">
                <p><strong>Bill No:</strong> ${sale.id}</p>
                <p><strong>Date:</strong> ${new Date(sale.sale_date).toLocaleString('en-IN')}</p>
                <p><strong>Customer:</strong> ${sale.customer_name}</p>
                <p><strong>Contact:</strong> ${sale.contact_number}</p>
                <p><strong>Payment:</strong> ${sale.payment_method}</p>
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
                    ${sale.items.map(item => `
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
                <p><strong>Subtotal:</strong> ₹${(sale.total_amount / 1.05).toFixed(2)}</p>
                <p><strong>Tax (5%):</strong> ₹${(sale.total_amount * 0.05 / 1.05).toFixed(2)}</p>
                <h3><strong>Total Amount:</strong> ₹${sale.total_amount.toFixed(2)}</h3>
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
            <title>Print Bill - BMS Mart</title>
            <style>
                body { font-family: 'Courier New', monospace; padding: 20px; }
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
