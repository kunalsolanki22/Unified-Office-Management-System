-- Script to populate the phone column in the users table with 10-digit numbers starting with 9
UPDATE users
SET phone = '9' || lpad(floor(random() * 1000000000)::text, 9, '0')
WHERE phone IS NULL OR phone = '';
