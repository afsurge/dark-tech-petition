-- first delete old table (if exists)
DROP TABLE IF EXISTS signatures;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first <> ''),
    last VARCHAR NOT NULL CHECK (last <> ''),
    email VARCHAR NOT NULL UNIQUE CHECK (email <> ''),
    hashpass VARCHAR NOT NULL CHECK (hashpass <> '')
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    -- first VARCHAR(255) NOT NULL,
    -- last VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    signature TEXT NOT NULL CHECK (signature <> '')
    -- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);