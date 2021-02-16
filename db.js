const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/petition");

module.exports.addSignature = (first, last, sign) => {
    const q = `
        INSERT INTO signatures (first, last, signature) 
        VALUES ($1, $2, $3)
    `;
    const params = [first, last, sign];
    return db.query(q, params);
};

module.exports.getName = () => {
    const q = `SELECT first, last FROM signatures`;
    return db.query(q);
};

module.exports.getAllNames = () => {};
