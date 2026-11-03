import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

dotenv.config();

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME || 'autobi_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  };
}

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const cfg = getDbConfig();
    pool = mysql.createPool({
      host: cfg.host,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      port: cfg.port,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      timezone: '+00:00',
      dateStrings: true,
    });
  }
  return pool;
}

export async function testConnection(): Promise<boolean> {
  const cfg = getDbConfig();
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    console.log(`✅ MySQL connected → ${cfg.host}:${cfg.port}/${cfg.database} (user: ${cfg.user})`);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ MySQL connection failed:', message);
    return false;
  }
}

export async function query<T extends RowDataPacket[] = RowDataPacket[]>(
  sql: string,
  params: unknown[] = []
): Promise<T> {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<ResultSetHeader> {
  const [result] = await getPool().execute<ResultSetHeader>(sql, params as any);
  return result;
}

export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Ensures autobi_db + tables exist (safe for XAMPP first boot). */
export async function ensureSchema(): Promise<void> {
  const cfg = getDbConfig();
  const safeDbName = cfg.database.replace(/[^a-zA-Z0-9_]/g, '');
  const bootstrap = await mysql.createConnection({
    host: cfg.host,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
  });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${safeDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('Employee', 'Authorized', 'Manager') NOT NULL DEFAULT 'Employee',
      name_ar VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_users_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS branches (
      id VARCHAR(64) PRIMARY KEY,
      branch_name VARCHAR(255) NOT NULL,
      branch_name_ar VARCHAR(255) NOT NULL,
      location VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS vehicles (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS vehicle_costs (
      vehicle_id VARCHAR(64) PRIMARY KEY,
      purchase_price DECIMAL(14, 2) NOT NULL DEFAULT 0,
      shipping_fees DECIMAL(14, 2) NOT NULL DEFAULT 0,
      customs DECIMAL(14, 2) NOT NULL DEFAULT 0,
      reconditioning_cost DECIMAL(14, 2) NOT NULL DEFAULT 0,
      total_cost DECIMAL(14, 2) NOT NULL DEFAULT 0,
      CONSTRAINT fk_costs_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS vehicle_history (
      vehicle_id VARCHAR(64) PRIMARY KEY,
      accidents_record TEXT,
      maintenance_history JSON,
      odometer_readings JSON,
      CONSTRAINT fk_history_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(64) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      acquisition_channel VARCHAR(100) NOT NULL DEFAULT 'معارض الحبيبية / البياع'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS deals (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS invoices (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_role ENUM('Employee', 'Authorized', 'Manager') NOT NULL,
      action_type VARCHAR(100) NOT NULL,
      details TEXT,
      timestamp DATETIME NOT NULL,
      KEY idx_audit_timestamp (timestamp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of statements) {
    await execute(sql);
  }

  const [channelColumns] = await getPool().query<RowDataPacket[]>(
    `SELECT DATA_TYPE AS dataType
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'acquisition_channel'`,
    [safeDbName]
  );
  if (String(channelColumns[0]?.dataType || '').toLowerCase() === 'enum') {
    await execute(
      `ALTER TABLE customers MODIFY acquisition_channel VARCHAR(100) NOT NULL DEFAULT 'معارض الحبيبية / البياع'`
    );
  }
}

export type { PoolConnection, RowDataPacket, ResultSetHeader };
