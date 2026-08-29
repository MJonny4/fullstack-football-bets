SELECT 'CREATE DATABASE football_test'
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = 'football_test'
)\gexec
