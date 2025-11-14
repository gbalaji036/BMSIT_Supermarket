import sqlite3
from datetime import datetime

def init_db():
    conn = sqlite3.connect('bms_mart.db')
    cursor = conn.cursor()
    
    # Categories Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Products Table with Unique Code
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            category_id INTEGER,
            price REAL NOT NULL,
            stock_quantity INTEGER DEFAULT 0,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    ''')
    
    # Customers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            contact_number TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Sales Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            total_amount REAL NOT NULL,
            payment_method TEXT,
            sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id)
        )
    ''')
    
    # Sale Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER,
            product_id INTEGER,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ''')
    
    # Insert sample categories
    sample_categories = [
        ('Groceries', 'Daily grocery items'),
        ('Beverages', 'Drinks and beverages'),
        ('Snacks', 'Snacks and chips'),
        ('Dairy Products', 'Milk, cheese, yogurt'),
        ('Personal Care', 'Toiletries and personal care items')
    ]
    
    for category in sample_categories:
        try:
            cursor.execute('INSERT INTO categories (name, description) VALUES (?, ?)', category)
        except sqlite3.IntegrityError:
            pass
    
    # Insert sample products
    sample_products = [
        ('BMS001', 'Rice 1kg', 1, 60.00, 100),
        ('BMS002', 'Wheat Flour 1kg', 1, 45.00, 80),
        ('BMS003', 'Coca Cola 500ml', 2, 40.00, 150),
        ('BMS004', 'Pepsi 500ml', 2, 40.00, 150),
        ('BMS005', 'Lays Chips', 3, 20.00, 200),
        ('BMS006', 'Milk 1L', 4, 60.00, 50),
        ('BMS007', 'Bread', 1, 35.00, 60),
        ('BMS008', 'Toothpaste', 5, 85.00, 75)
    ]
    
    for product in sample_products:
        try:
            cursor.execute('''
                INSERT INTO products (product_code, name, category_id, price, stock_quantity) 
                VALUES (?, ?, ?, ?, ?)
            ''', product)
        except sqlite3.IntegrityError:
            pass
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
