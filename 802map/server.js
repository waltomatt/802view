/*
    802map
    Third year Computer Science Project by Matt Walton
    @ The University of Manchester
*/


const express = require("express")

const routes = require("./routes.js"),
    data = require("./lib/data.js"),
    serial = require("./lib/serial.js"),
    websocket = require("./lib/websocket.js")

const app = express()

app.use("/static", express.static(__dirname + "/static"))

app.get("/", routes.map)
app.get("/data", routes.data)


websocket.init()
serial.listen()
app.listen(8080)