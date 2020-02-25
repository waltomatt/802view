const express = require("express"),
    db = require("db"),
    node = require("node"),
    nodes = require("device/nodes")
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
        let date = false
        if (req.query.date) {
            date = new Date(parseInt(req.query.date) * 1000)
        }

        device.getInfo(mac, req.query.node, date).then((data) => {
            if (data) {
                res.json(data)
            } else {
                res.sendStatus(404)
            }
        })
    }
})

router.get("/device/:mac/sessions", (req, res, next) => {
    const mac = req.params.mac

    if (mac) {
        nodes.getAllSessions(mac).then((sessions) => {
            let minDate = new Date()
            let maxDate = new Date(0, 0, 0)

            for (let i=0; i<sessions.length; i++) {
                if (sessions[i].start < minDate)
                    minDate = sessions[i].start
                
                if (sessions[i].end > maxDate)
                    maxDate = sessions[i].end
            }

            res.json({
                start: minDate,
                end: maxDate,
                sessions: sessions
            })
        }).catch((e) => {
            next(e)
        })
    }
})

router.post("/device/label", (req, res, next) => {
    let dev = req.body.device,
        label = req.body.label

    if (dev && label) {
        device.setLabel(dev, label).then(() => {
            res.json({
                status: "success"
            })
        }).catch((e) => {
            next(e)
        })
    }
})


module.exports = router