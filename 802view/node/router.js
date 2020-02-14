const express = require("express"),
    node = require("node")
const router = express.Router()


router.ws("/", (ws, req) => {
    console.log("New WebSocket connection from " + req.ip)
    ws.id = false

    ws.on("message", (msg) => {
        try {
            msg = JSON.parse(msg)
        } catch(e) {
            console.log("Invalid JSON in websocket")
        }

        if (msg) {
            if (ws.id) {
                node.packet(ws.id, msg)
            } else if (msg.i && msg.s) {
                node.authenticate(parseInt(msg.i), msg.s).then((id) => {
                    if (id)
                        ws.id = id
                })
            }
        }
    })

})

module.exports = router