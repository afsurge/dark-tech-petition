const express = require("express");
const app = express();
const db = require("./db");

console.log("db: ", db);

db.getAllActors()
    .then(({ rows }) => {
        console.log("rows: ", rows);
    })
    .catch((err) => console.log(err));

app.listen(8080, () => console.log("Listening..."));
