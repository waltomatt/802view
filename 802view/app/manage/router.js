const express = require("express"),
    manage = require("manage"),
    nodes = require("node")

const router = express.Router()

router.get("/", (req, res) => {
    res.render("manage")
})

router.get("/nodes/list", (req, res) => {
    console.log(nodes.online)
    manage.getNodeList().then((data) => {
        res.json(data)
    })
})

router.post("/nodes/edit", (req, res) => {
    manage.editNode(parseInt(req.body.id), req.body.name, req.body.secret).then(() => {
        res.json({
            status: "success"
        })
    })
})

router.post("/nodes/new", (req, res) => {
    manage.createNode(req.body.name, req.body.secret).then(() => {
        res.json({
            status: "success"
        })
    })
})

router.post("/nodes/delete", (req, res) => {
    manage.deleteNode(parseInt(req.body.id)).then(() => {
        res.json({
            status: "success"
        })
    })
})

module.exports = router