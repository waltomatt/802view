const data = require("./lib/data.js")

exports.map = function(req, res) {
    res.sendFile(__dirname + "/static/map.html")
}

exports.data = function(req, res) {
    res.json(data.devices)
}