import express from 'express';
import { connectToDatabase } from './db.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// DB connection health-check endpoint
app.get('/health', async (req, res) => {
  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    res.json({ status: 'UP', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'DOWN', error: error.message });
  }
});

// GET all products
app.get('/products', async (req, res) => {
  try {
    const db = await connectToDatabase();
    const products = await db.collection('products').find({}).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new product
app.post('/products', async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const db = await connectToDatabase();
    const product = { name, price, createdAt: new Date() };
    const result = await db.collection('products').insertOne(product);
    res.status(201).json({ _id: result.insertedId, name, price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

// Connect to database and start server (only if not running in test environment)
if (process.env.NODE_ENV !== 'test') {
  connectToDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server due to database connection error:', err);
      process.exit(1);
    });
}

export default app;
