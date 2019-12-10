const WebSocket = require("ws")

const data = require("./data.js")

exports.wss = null;



function onConnection(ws) {
    // upon first connection, send 
    ws.send(JSON.stringify([
        "reset",
        data.devices
    ]))

    ws.on("message", (msg) => {
        onMessage(ws, msg)
    })

    ws.updated = []
}

function onMessage(ws, msg) {
    if (msg == "update") {
        sendUpdate(ws)
    }
}

function onDataUpdated(updated) {
    // update each clients updated list

    exports.wss.clients.forEach((ws) => {
        for (let i=0; i<updated.length; i++)
            if (ws.updated.indexOf(updated[i]) == -1)
                ws.updated.push(updated[i])
    })
}

function sendUpdate(ws) {
    let devs = {}

    for (let i=0; i<ws.updated.length; i++) {
        devs[ws.updated[i]] = data.devices[ws.updated[i]]
    }

    ws.send(JSON.stringify([
        "update",
        devs
    ]))

    ws.updated = []
}

exports.init = function() {
    exports.wss = new WebSocket.Server({port: 8081})
    exports.wss.on("connection", onConnection)
    exports.wss.on("message", onMessage)

    data.onUpdated(onDataUpdated)
}