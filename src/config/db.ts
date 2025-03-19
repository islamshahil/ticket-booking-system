import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("✅ A new connection has been established to the PostgreSQL Database");
});

pool.connect()
    .then(() => console.log('✅ Connected to PostgreSQL Database'))
    .catch((err) => console.error('❌ PostgreSQL connection error:', err));

export default pool;


