const request = require('supertest');
const app = require('../server');

describe('Order Controller', () => {
  it('should create a new order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ client: 'Client1', rentalStartDate: '2025-10-15', rentalEndDate: '2025-10-20', items: [] });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
