-- first delete old table (if exists)
DROP TABLE IF EXISTS signatures;

-- create new table
CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    first VARCHAR(255) NOT NULL,
    last VARCHAR(255) NOT NULL,
    signature TEXT NOT NULL 
    -- CHECK (signature != '')
);