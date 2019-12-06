/*
    802map
    Third year Computer Science Project by Matt Walton
    @ The University of Manchester
*/


const express = require("express")

const routes = require("./routes.js"),
    data = require("./lib/data.js"),
    serial = require("./lib/serial.js")

const app = express()

app.get("/", routes.map)
app.get("/data", routes.data)


serial.listen()
app.listen(8080)