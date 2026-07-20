import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load local environment variables from .env file if it exists
dotenv.config();

let client;
let db;

export async function connectToDatabase() {
  if (db) return db;

  let uri = process.env.MONGODB_URI;

  if (!uri) {
    const user = process.env.MONGODB_USERNAME;
    const password = process.env.MONGODB_PASSWORD;
    const address = process.env.MONGODB_CLUSTER_ADDRESS;
    const dbName = process.env.MONGODB_DB_NAME;

    if (user && password && address) {
      uri = `mongodb+srv://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${address}/${dbName || 'practice-db'}?retryWrites=true&w=majority`;
    } else {
      // Local development fallback
      uri = 'mongodb://127.0.0.1:27017/practice-db';
    }
  }

  console.log('Attempting to connect to database...');
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    // Extract dbName or default to practice-db
    const parsedDbName = process.env.MONGODB_DB_NAME || 'practice-db';
    db = client.db(parsedDbName);
    
    // Ping to verify
    await db.command({ ping: 1 });
    console.log('Connected successfully to MongoDB!');
    return db;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    if (client) {
      await client.close();
    }
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('Database connection closed.');
  }
}
