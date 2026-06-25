import * as dotenv from 'dotenv';
dotenv.config();
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

async function main() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);
  const [rows] = await connection.execute('SELECT id, name, email, role FROM users');
  console.log('Users in DB:', rows);
  await connection.end();
}

main().catch(console.error);
