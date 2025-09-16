import { execSync } from 'child_process';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      __APP__: INestApplication;
    }
  }
}

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URI = 'mongodb://localhost:27017/rental-app-test';
  
  // Drop the test database
  try {
    execSync('mongosh rental-app-test --eval "db.dropDatabase()"');
  } catch (error) {
    console.warn('Could not drop test database. It might not exist yet.');
  }

  // Create a test module and app
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  
  // Store the app instance in the global scope for use in tests
  global.__APP__ = app;

  // Get the configuration service
  const configService = app.get(ConfigService);
  
  // Return a teardown function
  return async () => {
    await app.close();
  };
};
