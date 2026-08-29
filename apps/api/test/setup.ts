process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://football:football@127.0.0.1:5432/football_test?schema=public";
process.env.JWT_SECRET = "integration-test-secret-with-at-least-32-characters";
process.env.NODE_ENV = "test";
process.env.DEV_TOOLS = "true";
delete process.env.REDIS_URL;
