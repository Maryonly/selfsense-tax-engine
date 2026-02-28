const betterSqlite3 = require('better-sqlite3');
const path = require('path');
// Це створить файл database.db, якщо його ще немає
const db = betterSqlite3(path.join(__dirname, '../data/database.db'));

// 1. СПОЧАТКУ СТВОРЮЄМО ТАБЛИЦІ
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT, latitude REAL, longitude REAL, subtotal REAL,
    identified_region TEXT, status TEXT, state_rate REAL, county_rate REAL,
    city_rate REAL, special_rates REAL, composite_tax_rate REAL,
    tax_amount REAL, total_amount REAL
  );
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, total_orders INTEGER, total_spent REAL, status TEXT
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, timestamp TEXT
  );
`);

// 2. ПОТІМ ЗАПОВНЮЄМО ЇХ ДАНИМИ
db.exec(`
  INSERT INTO customers (name, total_orders, total_spent, status) VALUES 
  ('Acme Corp', 45, 12450.50, 'Active'), 
  ('TechStart Inc', 32, 8920.25, 'Active'), 
  ('Metro Logistics', 19, 5234.75, 'Inactive');

  INSERT INTO notifications (message, timestamp) VALUES 
  ('System initialized successfully', '${new Date().toISOString()}'), 
  ('Tax rate database refreshed', '${new Date().toISOString()}');
`);

console.log("Seed data applied successfully!");