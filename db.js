const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/actors");

// module.exports.getAllActors = () => {
//     const q = `SELECT * FROM actors`;
//     return db.query(q);
// };

// module.exports.addActor = () => {};
