const spicedPg = require("spiced-pg");

// connect database locally or in production
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);

// have to include user_id from cookie
module.exports.addSignature = (user_id, sign) => {
    const q = `
        INSERT INTO signatures (user_id, signature) 
        VALUES ($1, $2)
        RETURNING id
    `;
    const params = [user_id, sign];
    return db.query(q, params);
};

module.exports.addUser = (first, last, email, hashpass) => {
    const q = `
        INSERT INTO users (first, last, email, hashpass) 
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `;
    const params = [first, last, email, hashpass];
    return db.query(q, params);
};

// have to cross-check with signatures table (JOIN)
// only names of users who gave signatures
module.exports.getSigners = () => {
    const q = `
    SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url 
    FROM users
    JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    `;
    return db.query(q);
};

module.exports.getSignersByCity = (city) => {
    const q = `
    SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url 
    FROM users
    JOIN signatures
    ON users.id = signatures.user_id
    LEFT JOIN user_profiles
    ON users.id = user_profiles.user_id
    WHERE LOWER(user_profiles.city) = LOWER($1)
    `;
    const params = [city];
    return db.query(q, params);
};

module.exports.getTotalSigners = () => {
    const q = `SELECT COUNT(*) FROM signatures`;
    return db.query(q);
};

module.exports.getSignature = (id) => {
    const q = `SELECT signature FROM signatures WHERE id = $1`;
    const params = [id];
    return db.query(q, params);
};

// check if user logging in already signed (JOIN)
// then go to /thanks directly
// Joined table with id from both users, signatures
// users.id for req.session.userId
// signatures.id for req.session.signatureId
module.exports.getUser = (email) => {
    const q = `
    SELECT users.id, users.hashpass, signatures.id AS sign_id, signatures.signature 
    FROM users
    LEFT JOIN signatures
    ON users.id = signatures.user_id 
    WHERE email = $1
    `;
    const params = [email];
    return db.query(q, params);
};

module.exports.addProfile = (age, city, url, user_id) => {
    const q = `
        INSERT INTO user_profiles (age, city, url, user_id) 
        VALUES ($1, $2, $3, $4)
    `;
    const params = [age, city, url, user_id];
    return db.query(q, params);
};

module.exports.editProfile = (id) => {
    const q = `
    SELECT users.id, users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
    FROM users
    LEFT JOIN user_profiles
    On users.id = user_profiles.user_id
    WHERE users.id = $1
    `;
    const params = [id];
    return db.query(q, params);
};
