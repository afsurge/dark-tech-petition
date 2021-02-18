const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

// have to include user_id from users table (?)
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

// have to cross-check with signatures table
// if signature present for registered user
module.exports.getNames = () => {
    const q = `SELECT first, last FROM users`;
    return db.query(q);
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

module.exports.getUser = (email) => {
    const q = `SELECT * FROM users WHERE email = $1`;
    const params = [email];
    return db.query(q, params);
};
