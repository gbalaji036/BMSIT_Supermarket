document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadCategories();
    loadProducts();
});

function loadStats() {
    const sales = getSales();
    const products = getProducts();
    const customers = getCustomers();
    
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
    
    document.getElementById('totalSales').textContent = sales.length;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById('totalProducts').textContent = products.length;
    document.getElementById('totalCustomers').textContent = customers.length;
    
    displayRecentSales(sales.slice(-10).reverse());
}

function displayRecentSales(sales) {
    const tbody = document.getElementById('salesTable');
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No sales yet</td></tr>';
        return;
    }
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td>#${sale.id}</td>
            <td>${sale.customer_name}</td>
            <td>₹${sale.total_amount.toFixed(2)}</td>
            <td>${sale.payment_method}</td>
            <td>${new Date(sale.sale_date).toLocaleString('en-IN')}</td>
        </tr>
    `).join('');
}

function loadCategories() {
    const categories = getCategories();
    displayCategories(categories);
    updateCategorySelect(categories);
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesList');
    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <div>
                <h4>${cat.name}</h4>
                <p>${cat.description || 'No description'}</p>
            </div>
        </div>
    `).join('');
}

function updateCategorySelect(categories) {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Select Category</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function loadProducts() {
    const products = getProducts();
    const categories = getCategories();
    displayProducts(products, categories);
}

function displayProducts(products, categories) {
    const tbody = document.getElementById('productsTable');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products available</td></tr>';
        return;
    }
    tbody.innerHTML = products.map(product => {
        const category = categories.find(c => c.id === product.category_id);
        return `
            <tr>
                <td>${product.product_code}</td>
                <td>${product.name}</td>
                <td>${category ? category.name : 'N/A'}</td>
                <td>₹${product.price.toFixed(2)}</td>
                <td>${product.stock_quantity}</td>
                <td>
                    <button onclick="deleteProduct(${product.id})" class="btn btn-sm btn-danger">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function showAddProductForm() {
    document.getElementById('addProductForm').style.display = 'block';
}

function hideAddProductForm() {
    document.getElementById('addProductForm').style.display = 'none';
    document.querySelector('#addProductForm form').reset();
}

function addProduct(event) {
    event.preventDefault();
    
    const products = getProducts();
    const productCode = document.getElementById('productCode').value;
    
    if (products.find(p => p.product_code === productCode)) {
        alert('Product code already exists!');
        return;
    }
    
    const newProduct = {
        id: products.length + 1,
        product_code: productCode,
        name: document.getElementById('productName').value,
        category_id: parseInt(document.getElementById('productCategory').value),
        price: parseFloat(document.getElementById('productPrice').value),
        stock_quantity: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value
    };
    
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    
    alert('Product added successfully!');
    hideAddProductForm();
    loadProducts();
    loadStats();
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    let products = getProducts();
    products = products.filter(p => p.id !== productId);
    localStorage.setItem('products', JSON.stringify(products));
    
    alert('Product deleted successfully!');
    loadProducts();
    loadStats();
}

function showAddCategoryForm() {
    document.getElementById('addCategoryForm').style.display = 'block';
}

function hideAddCategoryForm() {
    document.getElementById('addCategoryForm').style.display = 'none';
    document.querySelector('#addCategoryForm form').reset();
}

function addCategory(event) {
    event.preventDefault();
    
    const categories = getCategories();
    const categoryName = document.getElementById('categoryName').value;
    
    if (categories.find(c => c.name === categoryName)) {
        alert('Category already exists!');
        return;
    }
    
    const newCategory = {
        id: categories.length + 1,
        name: categoryName,
        description: document.getElementById('categoryDescription').value
    };
    
    categories.push(newCategory);
    localStorage.setItem('categories', JSON.stringify(categories));
    
    alert('Category added successfully!');
    hideAddCategoryForm();
    loadCategories();
    loadStats();
}

// Helper functions
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
