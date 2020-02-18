const express = require("express"),
    db = require("db"),
    node = require("node"),
    device = require("device")

const router = express.Router()

router.use("/graph", require("api/graph/router"))

router.get("/node/:id", (req, res) => {
    node.getInfo(req.params.id).then((data) => {
        if (data) {
            res.json(data)
        } else {
            res.sendStatus(404)
        }
    })
})

router.get("/device/:mac", (req, res) => {
    const mac = req.params.mac

    if (mac) {
        device.getInfo(mac).then((data) => {
            if (data) {
                res.json(data)
            } else {
                res.sendStatus(404)
            }
        })
    }
})


module.exports = router