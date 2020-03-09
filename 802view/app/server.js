const express = require("express"),
    db = require("db"),
    bodyParser = require("body-parser")
    connections = require("device/connections")
    nodes = require("device/nodes")

const app = express()
const expressWs = require("express-ws")(app)

app.set("view engine", "ejs")
app.set("views", __dirname + "/views")

app.use(bodyParser.urlencoded({
    extended: false
}))

app.use("/static", express.static(__dirname + "/../wwwroot/static"))
app.use("/node", require("node/router"))
app.use("/graph", require("graph/router"))
app.use("/api", require("api/router"))
app.use("/search", require("search/router"))
app.use("/alerts", require("alerts/router"))

connections.init()
nodes.init()

app.listen(8082)