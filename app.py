from flask import Flask, render_template, request, jsonify, session
import sqlite3
from datetime import datetime
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)

def get_db_connection():
    conn = sqlite3.connect('bms_mart.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

# Get all categories
@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    categories = conn.execute('SELECT * FROM categories ORDER BY name').fetchall()
    conn.close()
    return jsonify([dict(row) for row in categories])

# Add new category
@app.route('/api/categories', methods=['POST'])
def add_category():
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            (data['name'], data.get('description', ''))
        )
        conn.commit()
        category_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'id': category_id, 'message': 'Category added successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Category already exists'}), 400

# Get all products
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('''
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name
    ''').fetchall()
    conn.close()
    return jsonify([dict(row) for row in products])

# Search products by code or name
@app.route('/api/products/search', methods=['GET'])
def search_products():
    query = request.args.get('q', '')
    conn = get_db_connection()
    products = conn.execute('''
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.product_code LIKE ? OR p.name LIKE ?
        ORDER BY p.name
    ''', (f'%{query}%', f'%{query}%')).fetchall()
    conn.close()
    return jsonify([dict(row) for row in products])

# Add new product
@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    conn = get_db_connection()
    try:
        cursor = conn.execute('''
            INSERT INTO products (product_code, name, category_id, price, stock_quantity, description) 
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data['product_code'],
            data['name'],
            data['category_id'],
            data['price'],
            data.get('stock_quantity', 0),
            data.get('description', '')
        ))
        conn.commit()
        product_id = cursor.lastrowid
        conn.close()
        return jsonify({'success': True, 'id': product_id, 'message': 'Product added successfully'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'message': 'Product code already exists'}), 400

# Update product
@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    data = request.json
    conn = get_db_connection()
    conn.execute('''
        UPDATE products 
        SET name = ?, category_id = ?, price = ?, stock_quantity = ?, description = ?
        WHERE id = ?
    ''', (
        data['name'],
        data['category_id'],
        data['price'],
        data['stock_quantity'],
        data.get('description', ''),
        product_id
    ))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Product updated successfully'})

# Delete product
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    conn = get_db_connection()
    conn.execute('DELETE FROM products WHERE id = ?', (product_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Product deleted successfully'})

# Process sale/checkout
@app.route('/api/checkout', methods=['POST'])
def checkout():
    data = request.json
    conn = get_db_connection()
    
    try:
        # Check or create customer
        customer = conn.execute(
            'SELECT id FROM customers WHERE contact_number = ?',
            (data['customer']['contact'],)
        ).fetchone()
        
        if customer:
            customer_id = customer['id']
        else:
            cursor = conn.execute(
                'INSERT INTO customers (name, contact_number, email) VALUES (?, ?, ?)',
                (data['customer']['name'], data['customer']['contact'], data['customer'].get('email', ''))
            )
            customer_id = cursor.lastrowid
        
        # Create sale
        cursor = conn.execute(
            'INSERT INTO sales (customer_id, total_amount, payment_method) VALUES (?, ?, ?)',
            (customer_id, data['total'], data.get('payment_method', 'Cash'))
        )
        sale_id = cursor.lastrowid
        
        # Add sale items and update stock
        for item in data['items']:
            conn.execute('''
                INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
                VALUES (?, ?, ?, ?, ?)
            ''', (sale_id, item['id'], item['quantity'], item['price'], item['subtotal']))
            
            # Update stock
            conn.execute(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                (item['quantity'], item['id'])
            )
        
        conn.commit()
        
        # Get sale details for bill
        sale = conn.execute('''
            SELECT s.*, c.name as customer_name, c.contact_number
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            WHERE s.id = ?
        ''', (sale_id,)).fetchone()
        
        sale_items = conn.execute('''
            SELECT si.*, p.name as product_name, p.product_code
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = ?
        ''', (sale_id,)).fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'sale_id': sale_id,
            'sale': dict(sale),
            'items': [dict(item) for item in sale_items]
        })
    
    except Exception as e:
        conn.close()
        return jsonify({'success': False, 'message': str(e)}), 400

# Get sale details for printing bill
@app.route('/api/sales/<int:sale_id>', methods=['GET'])
def get_sale(sale_id):
    conn = get_db_connection()
    
    sale = conn.execute('''
        SELECT s.*, c.name as customer_name, c.contact_number
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        WHERE s.id = ?
    ''', (sale_id,)).fetchone()
    
    if not sale:
        conn.close()
        return jsonify({'success': False, 'message': 'Sale not found'}), 404
    
    sale_items = conn.execute('''
        SELECT si.*, p.name as product_name, p.product_code
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
    ''', (sale_id,)).fetchall()
    
    conn.close()
    
    return jsonify({
        'success': True,
        'sale': dict(sale),
        'items': [dict(item) for item in sale_items]
    })

# Get sales statistics
@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    
    total_sales = conn.execute('SELECT COUNT(*) as count FROM sales').fetchone()['count']
    total_revenue = conn.execute('SELECT SUM(total_amount) as total FROM sales').fetchone()['total'] or 0
    total_products = conn.execute('SELECT COUNT(*) as count FROM products').fetchone()['count']
    total_customers = conn.execute('SELECT COUNT(*) as count FROM customers').fetchone()['count']
    
    recent_sales = conn.execute('''
        SELECT s.*, c.name as customer_name
        FROM sales s
        JOIN customers c ON s.customer_id = c.id
        ORDER BY s.sale_date DESC
        LIMIT 10
    ''').fetchall()
    
    conn.close()
    
    return jsonify({
        'total_sales': total_sales,
        'total_revenue': total_revenue,
        'total_products': total_products,
        'total_customers': total_customers,
        'recent_sales': [dict(sale) for sale in recent_sales]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
