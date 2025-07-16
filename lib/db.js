// lib/db.js

import mysql from 'mysql2/promise';

// Create the pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lhdp_fcmm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Optional: Centralized query handler
export async function query(sql, params = []) {
  const [results] = await pool.query(sql, params);
  return results;
}

// Optional: Centralized execute handler
export async function execute(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Optional: Begin Transaction
export async function withTransaction(callback) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// Optional: Table constants
export const TABLES = {
  USERS: 'users',
  COMPLAINTS: 'complaints',
  ATTACHMENTS: 'complaint_attachments',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
};

export default pool;
