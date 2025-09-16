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
import { RentalAgreement, RentalStatus } from '../src/modules/rentals/schemas/rental-agreement.schema';

describe('Rental Management (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let productModel: Model<ProductDocument>;
  let categoryModel: Model<ProductCategoryDocument>;
  let userModel: Model<UserDocument>;
  let rentalAgreementModel: Model<any>; // Using any to avoid type issues with the schema
  let jwtService: JwtService;
  let configService: ConfigService;
  let adminToken: string;
  let staffToken: string;
  let customerToken: string;
  let customerId: string;
  let product1: any;
  let product2: any;
  let category: any;

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
    rentalAgreementModel = moduleFixture.get<Model<any>>(getModelToken(RentalAgreement.name));
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
    // Create test category
    category = await categoryModel.create({
      name: 'Tents',
      type: 'TENT',
      description: 'Camping tents for outdoor adventures',
      isActive: true,
      rentalPriceMultiplier: 1.0,
    });

    // Create test products
    product1 = await productModel.create({
      name: '4-Person Camping Tent',
      category: category._id,
      rentalPrice: 29.99,
      purchasePrice: 199.99,
      quantityInStock: 10,
      quantityRented: 0,
      condition: 'Good',
      description: 'A high-quality 4-person camping tent with rainfly',
    });

    product2 = await productModel.create({
      name: '6-Person Family Tent',
      category: category._id,
      rentalPrice: 39.99,
      purchasePrice: 299.99,
      quantityInStock: 5,
      quantityRented: 0,
      condition: 'Good',
      description: 'Spacious family tent with room divider',
    });

    // Create test users
    const adminUser = await userModel.create({
      email: 'admin@example.com',
      password: 'hashed_password',
      name: 'Admin User',
      role: UserRole.ADMIN,
      isActive: true,
    });

    const staffUser = await userModel.create({
      email: 'staff@example.com',
      password: 'hashed_password',
      name: 'Staff User',
      role: UserRole.STAFF,
      isActive: true,
    });

    const customerUser = await userModel.create({
      email: 'customer@example.com',
      password: 'hashed_password',
      name: 'Customer User',
      role: UserRole.CUSTOMER,
      isActive: true,
      phone: '123-456-7890',
      address: '123 Main St, Anytown, USA',
    });

    customerId = customerUser._id;

    // Generate JWT tokens
    adminToken = jwtService.sign(
      { userId: adminUser._id, email: adminUser.email, role: adminUser.role },
      { secret: configService.get<string>('jwt.secret') }
    );

    staffToken = jwtService.sign(
      { userId: staffUser._id, email: staffUser.email, role: staffUser.role },
      { secret: configService.get<string>('jwt.secret') }
    );

    customerToken = jwtService.sign(
      { userId: customerUser._id, email: customerUser.email, role: customerUser.role },
      { secret: configService.get<string>('jwt.secret') }
    );
  };

  describe('Rental Agreement Management', () => {
    it('should create a new rental agreement (Staff/Admin)', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7); // 7 days later

      const newRental = {
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 2,
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentMethod: 'Credit Card',
        paymentReference: 'PAY-123456',
        pickupLocation: 'Main Office',
        dropoffLocation: 'Main Office',
      };

      const response = await request(app.getHttpServer())
        .post('/api/rentals')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(newRental)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.status).toBe(RentalStatus.PENDING);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].product).toBe(product1._id.toString());
      expect(response.body.totalAmount).toBeGreaterThan(0);
      expect(response.body.totalDeposit).toBe(100); // 2 items * $50 deposit each

      // Verify product stock was updated
      const updatedProduct = await productModel.findById(product1._id);
      expect(updatedProduct.quantityRented).toBe(2);
    });

    it('should not create a rental with insufficient stock', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 7);

      const newRental = {
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 15, // More than available in stock
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/rentals')
        .set('Authorization', `Bearer ${staffToken}`)
        .send(newRental)
        .expect(400);

      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should process a payment and update rental status', async () => {
      // First create a rental
      const rental = await rentalAgreementModel.create({
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 1,
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        status: RentalStatus.PENDING,
        totalAmount: 209.93, // 7 days * $29.99
        totalDeposit: 50,
        amountPaid: 0,
      });

      // Process a deposit payment
      await request(app.getHttpServer())
        .post(`/api/rentals/${rental._id}/payments`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          amount: 100,
          method: 'Credit Card',
          reference: 'PAY-789012',
        })
        .expect(200);

      // Verify rental status and payment
      const updatedRental = await rentalAgreementModel.findById(rental._id);
      expect(updatedRental.amountPaid).toBe(100);
      expect(updatedRental.status).toBe(RentalStatus.ACTIVE);

      // Verify product stock was updated
      const updatedProduct = await productModel.findById(product1._id);
      expect(updatedProduct.quantityRented).toBe(1);
      expect(updatedProduct.quantityInStock).toBe(9); // 10 - 1
    });

    it('should process a rental return', async () => {
      // First create an active rental
      const rental = await rentalAgreementModel.create({
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 2,
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        status: RentalStatus.ACTIVE,
        totalAmount: 419.86, // 7 days * $29.99 * 2 items
        totalDeposit: 100, // $50 * 2 items
        amountPaid: 519.86, // Full payment including deposit
        paymentMethod: 'Credit Card',
        paymentReference: 'PAY-123456',
      });

      // Update product stock to reflect rented items
      await productModel.findByIdAndUpdate(product1._id, {
        $inc: { quantityInStock: -2, quantityRented: 2 },
      });

      // Process return
      await request(app.getHttpServer())
        .post(`/api/rentals/${rental._id}/return`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      // Verify rental status
      const updatedRental = await rentalAgreementModel.findById(rental._id);
      expect(updatedRental.status).toBe(RentalStatus.COMPLETED);
      expect(updatedRental.returnedAt).toBeDefined();

      // Verify product stock was updated
      const updatedProduct = await productModel.findById(product1._id);
      expect(updatedProduct.quantityRented).toBe(0);
      expect(updatedProduct.quantityInStock).toBe(10); // Back to original
    });

    it('should cancel a pending rental', async () => {
      // First create a pending rental
      const rental = await rentalAgreementModel.create({
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 1,
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
        status: RentalStatus.PENDING,
        totalAmount: 209.93, // 7 days * $29.99
        totalDeposit: 50,
        amountPaid: 0,
      });

      // Cancel the rental
      await request(app.getHttpServer())
        .post(`/api/rentals/${rental._id}/cancel`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          reason: 'Customer request',
          notes: 'Customer found a better deal elsewhere',
        })
        .expect(200);

      // Verify rental status
      const updatedRental = await rentalAgreementModel.findById(rental._id);
      expect(updatedRental.status).toBe(RentalStatus.CANCELLED);
      expect(updatedRental.cancellationReason).toBe('Customer request');
    });
  });

  describe('Rental Queries', () => {
    beforeEach(async () => {
      // Create test rentals
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      // Active rental (starts today, ends next week)
      await rentalAgreementModel.create({
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 1,
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: now,
        endDate: nextWeek,
        status: RentalStatus.ACTIVE,
        totalAmount: 209.93, // 7 days * $29.99
        totalDeposit: 50,
        amountPaid: 259.93, // Full payment including deposit
        paymentMethod: 'Credit Card',
        paymentReference: 'PAY-111111',
      });

      // Upcoming rental (starts tomorrow)
      await rentalAgreementModel.create({
        customer: customerId,
        items: [
          {
            product: product2._id,
            quantity: 1,
            dailyRate: product2.rentalPrice,
            deposit: 75,
          },
        ],
        startDate: tomorrow,
        endDate: nextWeek,
        status: RentalStatus.PENDING,
        totalAmount: 239.93, // 6 days * $39.99 (rounded)
        totalDeposit: 75,
        amountPaid: 0,
      });

      // Completed rental (ended yesterday)
      await rentalAgreementModel.create({
        customer: customerId,
        items: [
          {
            product: product1._id,
            quantity: 2,
            dailyRate: product1.rentalPrice,
            deposit: 50,
          },
        ],
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        endDate: yesterday,
        status: RentalStatus.COMPLETED,
        totalAmount: 419.86, // 7 days * $29.99 * 2 items
        totalDeposit: 100, // $50 * 2 items
        amountPaid: 519.86, // Full payment including deposit
        paymentMethod: 'Credit Card',
        paymentReference: 'PAY-222222',
        returnedAt: yesterday,
      });
    });

    it('should get rentals by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/rentals')
        .query({ status: RentalStatus.ACTIVE })
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].status).toBe(RentalStatus.ACTIVE);
    });

    it('should get rentals by customer', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/rentals/customer/${customerId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
    });

    it('should get upcoming and overdue rentals', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/rentals/upcoming/overdue')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200);

      expect(response.body.upcoming).toHaveLength(1);
      expect(response.body.upcoming[0].status).toBe(RentalStatus.PENDING);
      
      // No overdue rentals in our test data
      expect(response.body.overdue).toHaveLength(0);
    });
  });
});
