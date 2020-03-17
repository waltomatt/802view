const express = require("express"),
    db = require("db"),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    connections = require("device/connections")
    nodes = require("device/nodes")

const app = express()
const expressWs = require("express-ws")(app)

app.set("view engine", "ejs")
app.set("views", __dirname + "/views")

app.use(bodyParser.urlencoded({
    extended: false
}))

app.use(session({
    secret: "bZQpvzwtRkqqQTHHk9GX5uuy",
    resave: false,
    saveUninitialized: false
}))

app.use("/static", express.static(__dirname + "/../wwwroot/static"))
app.use("/node", require("node/router"))
app.use("/graph", require("login/check"), require("graph/router"))
app.use("/api", require("login/check"), require("api/router"))
app.use("/search", require("login/check"), require("search/router"))
app.use("/alerts", require("login/check"), require("alerts/router"))
app.use("/stats", require("login/check"), require("stats/router"))
app.use("/login", require("login/router"))

app.get("/", (req, res) => {
    res.redirect("/stats")
})


connections.init()
nodes.init()

app.listen(8082)