const {Pool} = require("pg"),
    config = require("./config.json")

const pool = new Pool({
    user: config.db.user,
    host: config.db.host,
    database: config.db.database,
    port: config.db.port,
    password: process.env.DB_PASSWORD
})

pool.on("error", (e) => {
    console.log("database error: ", e)
})

module.exports = {
    query: (text, params) => pool.query(text, params)
}