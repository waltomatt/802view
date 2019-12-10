const events = ["reset", "update"]

let bindings = {}
let socket = false

function log(msg) {
    console.log("[server] " + msg)
}

function onSocketOpen(e) {
    log("connection opened")
}

function onSocketMessage(e) {
    let data = JSON.parse(e.data)
    //log("got message type: " + data[0])
    let event = data[0]
    if (events.indexOf(event) > -1 && bindings[event]) {
        for (let i=0; i<bindings[event].length; i++)
            bindings[event][i](data[1]) 
    }
}

exports.init = function() {
    socket = new WebSocket("ws://localhost:8081")

    socket.onopen = onSocketOpen
    socket.onmessage = onSocketMessage

    exports.socket = socket
}

exports.on = function(event, cb) {
    bindings[event] = bindings[event] || []
    bindings[event].push(cb)
}

exports.update = function(cb) {
    socket.send("update")
}