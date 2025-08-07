require('dotenv').config();

export const testUsers = {
  validUser: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    location: 'Test City'
  },
  invalidUser: {
    email: 'invalid@email',
    password: '123',
    firstName: '',
    lastName: '',
    phone: 'invalid',
    location: ''
  }
};

export const testBerths = {
  validBerth: {
    name: 'Test Marina Berth',
    location: 'Test Harbor',
    price: '100',
    description: 'A beautiful test berth for testing purposes',
    length: '30',
    width: '12',
    depth: '8'
  },
  searchFilters: {
    location: 'Test Harbor',
    dateFrom: '2024-12-01',
    dateTo: '2024-12-07',
    minPrice: '50',
    maxPrice: '200'
  }
};

export const contactForm = {
  name: 'Test User',
  email: 'test@example.com',
  subject: 'Test Subject',
  message: 'This is a test message for the contact form.'
};

export const blogData = {
  title: 'Test Blog Post',
  content: 'This is test blog content for testing purposes.',
  author: 'Test Author',
  tags: ['test', 'blog', 'docking']
};