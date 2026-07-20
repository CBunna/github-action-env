import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from './server.js';
import { connectToDatabase, closeDatabase } from './db.js';

describe('Products API Integration Tests', () => {
  let db;

  beforeAll(async () => {
    // Ensure database connection is initialized
    db = await connectToDatabase();
  });

  afterAll(async () => {
    // Close connection to prevent vitest from hanging
    await closeDatabase();
  });

  beforeEach(async () => {
    // Clean up products collection for a fresh test state
    await db.collection('products').deleteMany({});
  });

  it('should return UP on GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.database).toBe('connected');
  });

  it('should create and retrieve products successfully', async () => {
    // Create new product
    const createRes = await request(app)
      .post('/products')
      .send({ name: 'Practice Monitor', price: 299.99 });
    
    expect(createRes.status).toBe(201);
    expect(createRes.body.name).toBe('Practice Monitor');
    expect(createRes.body.price).toBe(299.99);
    expect(createRes.body._id).toBeDefined();

    // Get all products and verify
    const getRes = await request(app).get('/products');
    expect(getRes.status).toBe(200);
    expect(getRes.body.length).toBe(1);
    expect(getRes.body[0].name).toBe('Practice Monitor');
    expect(getRes.body[0].price).toBe(299.99);
  });

  it('should return 400 when missing name or price in POST /products', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'Broken Product' }); // missing price
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });
});
