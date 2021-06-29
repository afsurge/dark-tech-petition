var redis = require("redis");
const { promisify } = require("util");

var client = redis.createClient({
    host: "localhost",
    port: 6379,
});

client.on("error", function (err) {
    console.log(err);
});

module.exports.set = promisify(client.set).bind(client);
module.exports.get = promisify(client.get).bind(client);
module.exports.setex = promisify(client.setex).bind(client);
module.exports.del = promisify(client.del).bind(client);

// client.set("name", "anika", (err, data) => {
//     console.log("set 'name' from redis:", data);
// });

// client.get("name", (err, data) => {
//     console.log("get 'name' from redis:", data);
// });

// client.del("name", (err, data) => {
//     console.log("delete 'name':", data);
// });

// client.get("name", (err, data) => {
//     console.log("get 'name' after deleting it:", data);
// });
