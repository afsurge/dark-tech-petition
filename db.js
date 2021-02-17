const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.addSignature = (first, last, sign) => {
    const q = `
        INSERT INTO signatures (first, last, signature) 
        VALUES ($1, $2, $3)
        RETURNING id
    `;
    const params = [first, last, sign];
    return db.query(q, params);
};

module.exports.getNames = () => {
    const q = `SELECT first, last FROM signatures`;
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
