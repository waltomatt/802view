const express = require("express"),
    db = require("db"),
    connections = require("device/connections")
    nodes = require("device/nodes")

const app = express()
const expressWs = require("express-ws")(app)

app.set("view engine", "ejs")


console.log(__dirname)
app.use("/static", express.static(__dirname + "/../wwwroot/static"))
app.use("/node", require("node/router"))
app.use("/dashboard", require("dashboard/router"))
app.use("/api", require("api/router"))

connections.init()
nodes.init()

app.listen(8082)