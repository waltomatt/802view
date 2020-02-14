const express = require("express"),
    db = require("db"),
    connections = require("device/connections")
    nodes = require("device/nodes")

const app = express()
const expressWs = require("express-ws")(app)

app.use("/node", require("node/router"))
connections.init()
nodes.init()

app.listen(8082)