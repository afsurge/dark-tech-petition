const spicedPg = require("spiced-pg");

// for demo "talk" to actors database from today morning
// probably want new database for petition
// createdb petition
const db = spicedPg("postgres:postgres:postgres@localhost:5432/actors");

module.exports.getAllActors = () => {
    const q = `SELECT * FROM actors`;
    return db.query(q);
};

module.exports.addActor = () => {};
