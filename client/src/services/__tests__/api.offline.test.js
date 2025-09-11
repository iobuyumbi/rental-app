import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { authAPI, inventoryAPI, ordersAPI } from '../api';
import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Setup mock server
const server = setupServer(
  rest.post('http://localhost:5000/api/users/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ token: 'test-token', user: { id: 1, email: 'test@example.com' } })
    );
  }),
  
  rest.get('http://localhost:5000/api/inventory/products', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: [{ id: 1, name: 'Test Product', price: 100, stock: 10 }] })
    );
  }),
  
  rest.post('http://localhost:5000/api/orders', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: 'server-123', ...req.body, status: 'pending' })
    );
  })
);

// Mock the online/offline status
const originalNavigator = { ...navigator };
const originalWindow = { ...window };

beforeAll(() => {
  // Start the mock server
  server.listen();
  
  // Mock the online/offline status
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true,
    configurable: true
  });
  
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {};
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  })();
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });
});

afterAll(() => {
  // Restore original implementations
  Object.defineProperty(navigator, 'onLine', {
    value: originalNavigator.onLine,
    writable: true
  });
  
  // Clean up mock server
  server.close();
});

describe('API Service - Offline Support', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    localStorage.clear();
    
    // Reset fetch mock
    global.fetch = vi.fn((...args) => {
      // Forward to MSW
      return window.fetch(...args);
    });
    
    // Set initial online state
    navigator.onLine = true;
    
    // Reset server handlers
    server.resetHandlers();
  });

  describe('Authentication', () => {
    it('should queue login request when offline', async () => {
      // Simulate offline
      navigator.onLine = false;
      
      const credentials = { email: 'test@example.com', password: 'password' };
      
      try {
        // Try to login while offline
        const response = await authAPI.login(credentials);
        
        // Should return a response with offline flag
        expect(response).toHaveProperty('_offline', true);
        
        // Should save to offline queue
        const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
        expect(queue.length).toBe(1);
        expect(queue[0]).toMatchObject({
          method: 'POST',
          url: '/api/users/login',
          data: credentials
        });
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    });

    it('should sync queued requests when coming back online', async () => {
      // First, go offline and queue a request
      navigator.onLine = false;
      await authAPI.login({ email: 'test@example.com', password: 'password' });
      
      // Mock successful response for when we come back online
      const mockResponse = { token: 'test-token', user: { id: 1, email: 'test@example.com' } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Go back online
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
      
      // Wait for the sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have tried to process the queued request
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Queue should be empty after successful sync
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      expect(queue.length).toBe(0);
    });
  });

  describe('Inventory', () => {
    it('should return cached products when offline', async () => {
      // First, get products while online to populate cache
      const mockProducts = [
        { id: 1, name: 'Test Product', price: 100, stock: 10 }
      ];
      
      // Mock the initial online request
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockProducts }),
        headers: { get: () => 'application/json' }
      });
      
      // Make initial request to populate cache
      await inventoryAPI.products.get();
      
      // Go offline
      navigator.onLine = false;
      
      // This should now come from cache
      const response = await inventoryAPI.products.get();
      
      expect(response).toEqual({ data: mockProducts });
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only the initial request
    });
    
    it('should queue product updates when offline', async () => {
      // Go offline
      navigator.onLine = false;
      
      const updatedProduct = { id: 1, name: 'Updated Product', price: 150, stock: 5 };
      
      // Try to update a product while offline
      const response = await inventoryAPI.products.update(1, updatedProduct);
      
      // Should return the updated product with offline flag
      expect(response).toMatchObject({
        ...updatedProduct,
        _offline: true
      });
      
      // Should be in the offline queue
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      expect(queue.length).toBe(1);
      expect(queue[0]).toMatchObject({
        method: 'PUT',
        url: '/inventory/products/1',
        data: updatedProduct
      });
    });
  });

  describe('Orders', () => {
    it('should handle order creation while offline', async () => {
      // Go offline
      navigator.onLine = false;
      
      const newOrder = {
        customerId: 1,
        items: [{ productId: 1, quantity: 2 }],
        total: 200
      };
      
      // Try to create an order while offline
      const response = await ordersAPI.orders.create(newOrder);
      
      // Should return the order with offline flag
      expect(response).toMatchObject({
        ...newOrder,
        _offline: true,
        _id: expect.any(String) // Should have a temporary ID
      });
      
      // Should be in the offline queue
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      expect(queue.length).toBe(1);
    });
    
    it('should sync orders when coming back online', async () => {
      // First, go offline and queue an order
      navigator.onLine = false;
      
      const newOrder = {
        customerId: 1,
        items: [{ productId: 1, quantity: 2 }],
        total: 200
      };
      
      await ordersAPI.orders.create(newOrder);
      
      // Mock successful response for when we come back online
      const serverOrder = { id: 'server-123', ...newOrder, status: 'pending' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serverOrder,
      });
      
      // Go back online
      navigator.onLine = true;
      window.dispatchEvent(new Event('online'));
      
      // Wait for the sync to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have tried to process the queued request
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Queue should be empty after successful sync
      const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
      expect(queue.length).toBe(0);
    });
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
    localStorage.clear();
  });
});
