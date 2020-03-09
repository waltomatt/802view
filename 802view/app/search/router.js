const express = require("express"),
    oui = require("oui"),
    db = require("db"),
    search = require("search")

const router = express.Router()

router.get("/", (req, res) => {
    search.getNodeList().then((nodes) => {
        res.render("search", {manufacturers: search.getActiveOrgs(), nodes: nodes})
    })
})

router.get("/devices", (req, res) => {
    let searchType = req.query.search,
        mac = (req.query.mac || "").toLowerCase(),
        org = parseInt(req.query.org),
        only_ap = (req.query.only_ap == "true"),
        active = (req.query.active == "true"),
        sort = req.query.sort,
        page = parseInt(req.query.page) || 0


    search.device(searchType, mac, org, only_ap, active, sort, page).then((results) => {
        res.json({
            type: "devices", 
            results: results
        })
    })
})

router.get("/sessions", (req, res) => {
    let searchType = req.query.search,
        mac = (req.query.mac || "").toLowerCase(),
        org = parseInt(req.query.org),
        min_date = parseInt(req.query.min_date),
        max_date = parseInt(req.query.max_date),
        nodes = req.query.nodes.split(","),
        sort = req.query.sort,
        active = (req.query.active == "true"),
        page = parseInt(req.query.page) || 0

    if (min_date)
        min_date = new Date(min_date * 1000)
    
    if (max_date)
        max_date = new Date(max_date * 1000)

    search.sessions(searchType, mac, org, min_date, max_date, nodes, active, sort, page).then((results) => {
        res.json({
            type: "sessions",
            results: results
        })
    })
})

router.get("/connections", (req, res) => {
    let searchType = req.query.search,
        mac = (req.query.mac || "").toLowerCase(),
        org = parseInt(req.query.org),
        searchType2 = req.query.search2,
        mac2 = (req.query.mac2 || "").toLowerCase(),
        org2 = parseInt(req.query.org2),
        min_date = parseInt(req.query.min_date),
        max_date = parseInt(req.query.max_date),
        sort = req.query.sort,
        page = parseInt(req.query.page) || 0,
        active = (req.query.active == "true")

    if (min_date)
        min_date = new Date(min_date * 1000)
    
    if (max_date)
        max_date = new Date(max_date * 1000)

    search.connections(searchType, mac, org, searchType2, mac2, org2, min_date, max_date, active, sort, page).then((results) => {
        res.json({
            type: "connections",
            results: results
        })
    })
})

search.updateOrgs()

module.exports = router