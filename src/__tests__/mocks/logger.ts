// Mock logger for tests
export const logger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  debug: jest.fn(),
  level: 'error',
};

export const stream = {
  write: jest.fn(),
};