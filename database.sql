-- Create Database
CREATE DATABASE IF NOT EXISTS bmsit_supermarket;
USE bmsit_supermarket;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_product_code (product_code),
    INDEX idx_category (category_id)
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_contact (contact_number)
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(200) NOT NULL,
    contact_number VARCHAR(20),
    payment_method ENUM('Cash', 'Card', 'UPI') NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sale_date (sale_date)
);

-- Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_sale (sale_id)
);

-- Insert Initial Categories
INSERT INTO categories (name, description) VALUES
('Groceries', 'Daily grocery items'),
('Beverages', 'Drinks and beverages'),
('Snacks', 'Snacks and chips'),
('Dairy Products', 'Milk, cheese, yogurt'),
('Personal Care', 'Toiletries');

-- Insert Initial Products
INSERT INTO products (product_code, name, category_id, price, stock_quantity) VALUES
('BMS001', 'Rice 1kg', 1, 60.00, 100),
('BMS002', 'Wheat Flour 1kg', 1, 45.00, 80),
('BMS003', 'Coca Cola 500ml', 2, 40.00, 150),
('BMS004', 'Pepsi 500ml', 2, 40.00, 150),
('BMS005', 'Lays Chips', 3, 20.00, 200),
('BMS006', 'Milk 1L', 4, 60.00, 50),
('BMS007', 'Bread', 1, 35.00, 60),
('BMS008', 'Toothpaste', 5, 85.00, 75);