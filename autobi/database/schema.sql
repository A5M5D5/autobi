-- AutoBI MySQL Schema for XAMPP
-- Import via phpMyAdmin or: mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS autobi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE autobi_db;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS vehicle_history;
DROP TABLE IF EXISTS vehicle_costs;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS branches;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Employee', 'Authorized', 'Manager') NOT NULL DEFAULT 'Employee',
  name_ar VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE branches (
  id VARCHAR(64) PRIMARY KEY,
  branch_name VARCHAR(255) NOT NULL,
  branch_name_ar VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicles (
  id VARCHAR(64) PRIMARY KEY,
  vin VARCHAR(32) NOT NULL,
  branch_id VARCHAR(64) NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(150) NOT NULL,
  trim VARCHAR(150) NOT NULL DEFAULT 'Standard',
  year INT NOT NULL,
  mileage INT NOT NULL DEFAULT 0,
  transmission ENUM('Automatic', 'Manual') NOT NULL DEFAULT 'Automatic',
  fuel_type ENUM('Gasoline', 'Hybrid', 'Electric', 'Diesel') NOT NULL DEFAULT 'Gasoline',
  color VARCHAR(100) NOT NULL DEFAULT 'White',
  status ENUM('Available', 'Sold', 'Reserved', 'In-Transit') NOT NULL DEFAULT 'Available',
  days_on_lot INT NOT NULL DEFAULT 0,
  selling_price DECIMAL(14, 2) NOT NULL DEFAULT 0,
  target_discount DECIMAL(14, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uq_vehicles_vin (vin),
  KEY idx_vehicles_status (status),
  KEY idx_vehicles_branch (branch_id),
  CONSTRAINT fk_vehicles_branch FOREIGN KEY (branch_id) REFERENCES branches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicle_costs (
  vehicle_id VARCHAR(64) PRIMARY KEY,
  purchase_price DECIMAL(14, 2) NOT NULL DEFAULT 0,
  shipping_fees DECIMAL(14, 2) NOT NULL DEFAULT 0,
  customs DECIMAL(14, 2) NOT NULL DEFAULT 0,
  reconditioning_cost DECIMAL(14, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(14, 2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_costs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vehicle_history (
  vehicle_id VARCHAR(64) PRIMARY KEY,
  accidents_record TEXT,
  maintenance_history JSON,
  odometer_readings JSON,
  CONSTRAINT fk_history_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customers (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  acquisition_channel VARCHAR(100) NOT NULL DEFAULT 'معارض الحبيبية / البياع'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE deals (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  vehicle_id VARCHAR(64) NOT NULL,
  employee_id VARCHAR(64) NOT NULL,
  pipeline_stage ENUM('Lead', 'Test Drive', 'Negotiation', 'Closed') NOT NULL DEFAULT 'Lead',
  deal_value DECIMAL(14, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATE NOT NULL,
  updated_at DATE NOT NULL,
  KEY idx_deals_stage (pipeline_stage),
  CONSTRAINT fk_deals_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_deals_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE invoices (
  id VARCHAR(64) PRIMARY KEY,
  vehicle_id VARCHAR(64) NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  final_sale_price DECIMAL(14, 2) NOT NULL,
  currency ENUM('USD', 'SAR', 'AED', 'IQD') NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(14, 4) NOT NULL DEFAULT 1,
  front_end_profit DECIMAL(14, 2) NOT NULL DEFAULT 0,
  back_end_profit DECIMAL(14, 2) NOT NULL DEFAULT 0,
  fni_notes TEXT,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uq_invoices_vehicle (vehicle_id),
  CONSTRAINT fk_invoices_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT fk_invoices_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role ENUM('Employee', 'Authorized', 'Manager') NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp DATETIME NOT NULL,
  KEY idx_audit_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
