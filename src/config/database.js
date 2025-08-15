import { createPool } from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env files
dotenv.config({ path: path.resolve(__dirname,  '../.env') });


export const pool = createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER, // Using .env for best practice and security
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 10
}).promise();



export default pool;   