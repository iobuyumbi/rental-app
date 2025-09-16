import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection, Model, connect } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { Product, ProductDocument } from '../src/modules/inventory/schemas/product.schema';
import { ProductCategory, ProductCategoryDocument } from '../src/modules/inventory/schemas/product-category.schema';
import { User, UserDocument, UserRole } from '../src/modules/users/schemas/user.schema';

describe('Inventory Management (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let productModel: Model<ProductDocument>;
  let categoryModel: Model<ProductCategoryDocument>;
  let userModel: Model<UserDocument>;
  let jwtService: JwtService;
  let configService: ConfigService;
  let adminToken: string;
  let staffToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    connection = moduleFixture.get<Connection>('DatabaseConnection');
    productModel = moduleFixture.get<Model<ProductDocument>>(getModelToken(Product.name));
    categoryModel = moduleFixture.get<Model<ProductCategoryDocument>>(getModelToken(ProductCategory.name));
    userModel = moduleFixture.get<Model<UserDocument>>(getModelToken(User.name));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    // Create test data
    await seedDatabase();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await connection.db.dropDatabase();
    // Re-seed the database
    await seedDatabase();
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  // Helper function to seed the test database
  const seedDatabase = async () => {
    // Create test categories
    const categories = await categoryModel.insertMany([
      {
        name: 'Tents',
        type: 'TENT',
        description: 'Camping tents for outdoor adventures',
        isActive: true,
        rentalPriceMultiplier: 1.0,
        requiresMaintenance: true,
        maintenanceIntervalDays: 30,
      },
      {
        name: 'Chairs',
        type: 'CHAIR',
        description: 'Folding chairs for events',
        isActive: true,
        rentalPriceMultiplier: 1.0,
      },
    ]);

    // Create test products
    await productModel.insertMany([
      {
        name: '4-Person Camping Tent',
        category: categories[0]._id,
        rentalPrice: 29.99,
        purchasePrice: 199.99,
        quantityInStock: 10,
        quantityRented: 2,
        condition: 'Good',
        description: 'A high-quality 4-person camping tent with rainfly',
      },
      {
        name: '6-Person Family Tent',
        category: categories[0]._id,
        rentalPrice: 39.99,
        purchasePrice: 299.99,
        quantityInStock: 5,
        quantityRented: 1,
        condition: 'Good',
        description: 'Spacious family tent with room divider',
      },
      {
        name: 'Folding Chair',
        category: categories[1]._id,
        rentalPrice: 4.99,
        purchasePrice: 24.99,
        quantityInStock: 50,
        quantityRented: 10,
        condition: 'Fair',
        description: 'Standard folding chair for events',
      },
    ]);

    // Create test users
    const adminUser = await userModel.create({
      email: 'admin@example.com',
      password: 'hashed_password', // In a real test, this should be hashed
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    const staffUser = await userModel.create({
      email: 'staff@example.com',
      password: 'hashed_password', // In a real test, this should be hashed
      name: 'Staff User',
      role: UserRole.STAFF,
      isActive: true,
    });

    // Generate JWT tokens
    adminToken = jwtService.sign(
      { userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      { secret: configService.get<string>('jwt.secret') }
    );

    staffToken = jwtService.sign(
      { userId: staffUser._id, email: staffUser.email, role: staffUser.role },
      { secret: configService.get<string>('jwt.secret') }
    );
  };

  describe('Product Management', () => {
    it('should create a new product (Admin)', async () => {
      const newProduct = {
        name: 'New Test Tent',
        category: (await categoryModel.findOne({ type: 'TENT' }))._id,
        rentalPrice: 34.99,
        purchasePrice: 249.99,
        quantityInStock: 8,
        condition: 'Good',
        description: 'A brand new test tent',
      };

      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(newProduct.name);
      expect(response.body.quantityInStock).toBe(newProduct.quantityInStock);
      expect(response.body.quantityRented).toBe(0); // Should default to 0
    });

    it('should update a product (Staff)', async () => {
      const product = await productModel.findOne({ name: '4-Person Camping Tent' });
      const updatedData = {
        rentalPrice: 34.99,
        quantityInStock: 12,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.rentalPrice).toBe(updatedData.rentalPrice);
      expect(response.body.quantityInStock).toBe(updatedData.quantityInStock);
    });

    it('should not allow updating product with invalid data', async () => {
      const product = await productModel.findOne({ name: '4-Person Camping Tent' });
      
      const response = await request(app.getHttpServer())
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rentalPrice: -10, // Invalid price
          quantityInStock: -5, // Invalid quantity
        })
        .expect(400);

      expect(response.body.message).toContain('rentalPrice must not be less than 0');
      expect(response.body.message).toContain('quantityInStock must not be less than 0');
    });

    it('should delete a product (Admin only)', async () => {
      const product = await productModel.findOne({ name: 'Folding Chair' });
      
      // Staff should not be able to delete
      await request(app.getHttpServer())
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(403);
      
      // Admin should be able to delete
      await request(app.getHttpServer())
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      // Verify deletion
      const deletedProduct = await productModel.findById(product._id);
      expect(deletedProduct).toBeNull();
    });
  });

  describe('Inventory Management', () => {
    it('should update stock levels correctly', async () => {
      const product = await productModel.findOne({ name: '4-Person Camping Tent' });
      const initialStock = product.quantityInStock;
      
      // Add to stock
      await request(app.getHttpServer())
        .patch(`/api/inventory/${product._id}/stock`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ quantity: 5, operation: 'add' })
        .expect(200);
      
      let updatedProduct = await productModel.findById(product._id);
      expect(updatedProduct.quantityInStock).toBe(initialStock + 5);
      
      // Remove from stock
      await request(app.getHttpServer())
        .patch(`/api/inventory/${product._id}/stock`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ quantity: 3, operation: 'remove' })
        .expect(200);
      
      updatedProduct = await productModel.findById(product._id);
      expect(updatedProduct.quantityInStock).toBe(initialStock + 2); // 5 added, 3 removed
    });

    it('should prevent stock from going negative', async () => {
      const product = await productModel.findOne({ name: 'Folding Chair' });
      
      // Try to remove more than available
      await request(app.getHttpServer())
        .patch(`/api/inventory/${product._id}/stock`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ 
          quantity: product.quantityInStock + 10, // More than available
          operation: 'remove' 
        })
        .expect(400);
      
      // Stock should remain unchanged
      const updatedProduct = await productModel.findById(product._id);
      expect(updatedProduct.quantityInStock).toBe(product.quantityInStock);
    });

    it('should track rented items correctly', async () => {
      const product = await productModel.findOne({ name: '6-Person Family Tent' });
      const initialRented = product.quantityRented;
      
      // Rent out an item
      await request(app.getHttpServer())
        .patch(`/api/inventory/${product._id}/rented`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ quantity: 1, operation: 'add' })
        .expect(200);
      
      let updatedProduct = await productModel.findById(product._id);
      expect(updatedProduct.quantityRented).toBe(initialRented + 1);
      
      // Return an item
      await request(app.getHttpServer())
        .patch(`/api/inventory/${product._id}/rented`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ quantity: 1, operation: 'remove' })
        .expect(200);
      
      updatedProduct = await productModel.findById(product._id);
      expect(updatedProduct.quantityRented).toBe(initialRented); // Back to original
    });
  });

  describe('Category Management', () => {
    it('should create a new category (Admin)', async () => {
      const newCategory = {
        name: 'Tables',
        type: 'TABLE',
        description: 'Folding tables for events',
        isActive: true,
        rentalPriceMultiplier: 1.0,
      };

      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(newCategory.name);
      expect(response.body.type).toBe(newCategory.type);
      expect(response.body.isActive).toBe(true);
    });

    it('should update a category (Staff)', async () => {
      const category = await categoryModel.findOne({ type: 'CHAIR' });
      const updatedData = {
        rentalPriceMultiplier: 1.1,
        requiresMaintenance: true,
        maintenanceIntervalDays: 60,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.rentalPriceMultiplier).toBe(updatedData.rentalPriceMultiplier);
      expect(response.body.requiresMaintenance).toBe(updatedData.requiresMaintenance);
      expect(response.body.maintenanceIntervalDays).toBe(updatedData.maintenanceIntervalDays);
    });

    it('should not allow deactivating a category with active products', async () => {
      const category = await categoryModel.findOne({ type: 'TENT' });
      
      await request(app.getHttpServer())
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(400);
      
      // Verify category is still active
      const updatedCategory = await categoryModel.findById(category._id);
      expect(updatedCategory.isActive).toBe(true);
    });
  });
});
