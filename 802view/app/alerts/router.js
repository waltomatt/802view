const express = require("express"),
    search = require("search"),
    alerts = require("alerts")

const router = express.Router()

router.get("/", (req, res) => {
    res.render("alerts", {
        manufacturers: search.getActiveOrgs()
    })
})

router.get("/list", (req, res) => {
    alerts.update().then((list) => {
        res.json(list)
    })
})

router.get("/list/:alert_id", (req, res) => {
    alerts.get(parseInt(req.params.alert_id), req.query.clear).then((list) => {
        res.json(list)
    })
})

router.get("/active", (req, res) => {
    alerts.getActive().then((list) => {
        res.json(list)
    })
})

router.post("/dismiss", (req, res) => {
    let id = parseInt(req.body.id)

    if (id) {
        alerts.dismiss(id).then(() => {
            res.json({
                status: "success"
            })
        })
    }
})

router.post("/remove", (req, res) => {
    let id = parseInt(req.body.id)

    if (id) {
        alerts.remove(id).then(() => {
            res.json({
                status: "success"
            })
        })
    }
})

router.post("/create", (req, res) => {
    let name = req.body.name || "",
        on = req.body.on || "",
        type = req.body.type || "",
        matches = (req.body.matches == "true"),
        ap = (req.body.ap == "true")

    let data
    if (type == "mac")
        data = req.body.mac || ""
    else if (type == "org")
        data = parseInt(req.body.org)
    else if (type == "label")
        data = req.body.label || ""

    const allowedOn = ["session-start", "session-end", "connection-start", "connection-end"]
    const allowedType = ["mac", "org", "label"]

    //if (name.length && allowedOn.indexOf(on) > -1 && allowedType.indexOf(type) > -1 && data.length) {
        alerts.create(name, on, type, matches, data, ap).then(() => {
            res.json({
                status: "success"
            })
        }).catch((e) => {
            res.json({
                status: "error",
                error: e.message
            })
        })
    /*} else {
        res.json({
            status: "error",
            error: "invalid parameters"
        })
    }
    */
})

module.exports = router