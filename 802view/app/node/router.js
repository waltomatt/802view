const express = require("express"),
    WebSocket = require("ws"),
    node = require("node"),
    config = require("config")

const router = express.Router()


router.ws("/", (ws, req) => {
    console.log("New WebSocket connection from " + req.ip)
    ws.id = false
    ws.alive = true

    ws.on("message", (msg) => {
        ws.alive = true

        try {
            msg = JSON.parse(msg)
        } catch(e) {
            console.log("Invalid JSON in websocket")
        }

        if (msg) {
            if (ws.id) {
                node.packet(ws.id, msg)
            } else if (msg.i && msg.s) {
                node.authenticate(parseInt(msg.i), msg.s, req.ip).then((id) => {
                    if (id) {
                        ws.id = id
                    }
                })
            }
        }
    })
    
    ws.on("close", () => {
        if (ws.id)
            node.disconnect(ws.id)
    })

    ws.on("pong", () => {
        ws.alive = true
    })

    ws.on("error", (e) => {
        console.log("WebSocket error", e.message)
    })

    let interval = setInterval(() => {
        // make sure the client is still alive
        if (ws.readyState === WebSocket.OPEN) {
            if (ws.alive == false) ws.terminate()
            ws.ping()
        } else {
            clearInterval(interval)
        }
    }, config.wsKeepAliveTime * 1000)

})


module.exports = router