document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadCategories();
    loadProducts();
    loadTaxSettings();
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
    if (!tbody) return;
    
    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color: var(--text-muted);">No sales recorded yet</td></tr>';
        return;
    }
    tbody.innerHTML = sales.map(sale => `
        <tr>
            <td><span class="sku-badge">#${sale.id}</span></td>
            <td><strong>${sale.customer_name}</strong></td>
            <td class="text-right" style="font-weight: 600; font-variant-numeric: tabular-nums;">₹${sale.total_amount.toFixed(2)}</td>
            <td><span class="payment-badge">${sale.payment_method}</span></td>
            <td style="color: var(--text-secondary); font-size: 12px;">${new Date(sale.sale_date).toLocaleString('en-IN')}</td>
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
    if (!container) return;
    
    if (categories.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 20px;">No categories defined.</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <h4>${cat.name}</h4>
            <p>${cat.description || 'No description provided'}</p>
        </div>
    `).join('');
}

function updateCategorySelect(categories) {
    const select = document.getElementById('productCategory');
    if (!select) return;
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
    if (!tbody) return;
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--text-muted);">No products in catalog</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(product => {
        const category = categories.find(c => c.id === product.category_id);
        const isOutOfStock = product.stock_quantity <= 0;
        return `
            <tr>
                <td><span class="sku-badge">${product.product_code}</span></td>
                <td><strong>${product.name}</strong></td>
                <td><span class="category-tag">${category ? category.name : 'Uncategorized'}</span></td>
                <td class="text-right" style="font-weight: 600; font-variant-numeric: tabular-nums;">₹${product.price.toFixed(2)}</td>
                <td class="text-right">
                    <span class="stock-pill ${isOutOfStock ? 'stock-empty' : product.stock_quantity <= 10 ? 'stock-low' : 'stock-ok'}">
                        ${product.stock_quantity}
                    </span>
                </td>
                <td class="text-right">
                    <button onclick="deleteProduct(${product.id})" class="btn-ghost-danger">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

function showTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const targetTab = document.getElementById(tabName + 'Tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function showAddProductForm() {
    const form = document.getElementById('addProductForm');
    if (form) form.style.display = 'block';
}

function hideAddProductForm() {
    const form = document.getElementById('addProductForm');
    if (form) {
        form.style.display = 'none';
        form.querySelector('form').reset();
    }
}

function addProduct(event) {
    event.preventDefault();
    
    const products = getProducts();
    const productCode = document.getElementById('productCode').value.trim().toUpperCase();
    
    if (products.find(p => p.product_code === productCode)) {
        alert('Product SKU code already exists!');
        return;
    }
    
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        product_code: productCode,
        name: document.getElementById('productName').value.trim(),
        category_id: parseInt(document.getElementById('productCategory').value),
        price: parseFloat(document.getElementById('productPrice').value),
        stock_quantity: parseInt(document.getElementById('productStock').value),
        description: document.getElementById('productDescription').value.trim()
    };
    
    products.push(newProduct);
    localStorage.setItem('products', JSON.stringify(products));
    
    alert('Product added successfully to catalog!');
    hideAddProductForm();
    loadProducts();
    loadStats();
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product SKU?')) return;
    
    let products = getProducts();
    products = products.filter(p => p.id !== productId);
    localStorage.setItem('products', JSON.stringify(products));
    
    alert('Product deleted successfully!');
    loadProducts();
    loadStats();
}

function showAddCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (form) form.style.display = 'block';
}

function hideAddCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (form) {
        form.style.display = 'none';
        form.querySelector('form').reset();
    }
}

function addCategory(event) {
    event.preventDefault();
    
    const categories = getCategories();
    const categoryName = document.getElementById('categoryName').value.trim();
    
    if (categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase())) {
        alert('Category name already exists!');
        return;
    }
    
    const newCategory = {
        id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
        name: categoryName,
        description: document.getElementById('categoryDescription').value.trim()
    };
    
    categories.push(newCategory);
    localStorage.setItem('categories', JSON.stringify(categories));
    
    alert('Category created successfully!');
    hideAddCategoryForm();
    loadCategories();
    loadStats();
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

function getTaxSettings() {
    const defaultSettings = { cgst: 2.5, sgst: 2.5 };
    try {
        const saved = localStorage.getItem('tax_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    } catch (e) {
        return defaultSettings;
    }
}

// Tax Configuration Functions
function loadTaxSettings() {
    const settings = getTaxSettings();
    const cgstInput = document.getElementById('cgstRate');
    const sgstInput = document.getElementById('sgstRate');
    if (cgstInput && sgstInput) {
        cgstInput.value = settings.cgst;
        sgstInput.value = settings.sgst;
        calculateTotalGST();
    }
}

function calculateTotalGST() {
    const cgst = parseFloat(document.getElementById('cgstRate').value) || 0;
    const sgst = parseFloat(document.getElementById('sgstRate').value) || 0;
    const totalInput = document.getElementById('totalGSTRate');
    if (totalInput) {
        totalInput.value = `${(cgst + sgst).toFixed(2)}%`;
    }
}

function saveTaxSettings(event) {
    event.preventDefault();
    const cgst = parseFloat(document.getElementById('cgstRate').value);
    const sgst = parseFloat(document.getElementById('sgstRate').value);

    if (isNaN(cgst) || cgst < 0 || isNaN(sgst) || sgst < 0) {
        alert('Please enter valid, non-negative GST rates.');
        return;
    }

    const settings = {
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2))
    };

    localStorage.setItem('tax_settings', JSON.stringify(settings));
    alert('Tax settings saved successfully!');
    loadTaxSettings();
}
