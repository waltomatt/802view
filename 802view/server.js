const express = require("express"),
    db = require("db"),
    node = require("node")

const app = express()
const expressWs = require("express-ws")(app)

app.use("/node", require("node/router"))


app.listen(8082)