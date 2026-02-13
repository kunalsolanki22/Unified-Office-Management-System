-- Run this script in pgAdmin Query Tool while connected as 'postgres' user
-- 1. Create the user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'office_admin') THEN
      CREATE ROLE office_admin WITH LOGIN PASSWORD 'office_password';
   ELSE
      ALTER ROLE office_admin WITH PASSWORD 'office_password';
   END IF;
END
$do$;

-- 2. Grant privileges
ALTER ROLE office_admin CREATEDB;

-- 3. Create the database (Run this separately if the block above fails in transaction)
-- Note: In pgAdmin, you might need to run the CREATE DATABASE command in a separate query window 
-- if it complains about running inside a transaction block.
-- CREATE DATABASE office_management OWNER office_admin;
