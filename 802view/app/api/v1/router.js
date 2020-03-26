const express = require("express"),
    db = require("db"),
    nodes = require("device/nodes")

const router = express.Router()

router.get("/devices", (req, res) => {
    let mac = req.query.mac,
        label = req.query.label,
        ap = (req.query.ap == "true"),
        online = (req.query.online == "true")
    
    let query = `SELECT * FROM "devices" WHERE 1=1 `
    let queryParams = []

    if (mac) {
        mac = "%" + mac.toLowerCase() + "%"
        queryParams.push(mac)
        query += `AND (REPLACE(CAST("mac" as varchar), ':', '') LIKE $${queryParams.length}) `
    }

    if (label) {
        label = "%" + label.toLowerCase() + "%"
        queryParams.push(label)
        query += `AND (LOWER("label") LIKE $${queryParams.length}) `
    }

    if (ap) {
        query += `AND "is_ap"=true `
    }

    db.query(query, queryParams).then((dres) => {
        let rows = dres.rows

        let results = []

        for (let i=0; i<rows.length; i++) {
            if (!online || nodes.getActive(rows[i].mac))
                results.push(rows[i])
        }

        res.json(results)
    })
})

router.get("/sessions", (req, res) => {
    let from = req.query.from,
        to = req.query.to,
        node = parseInt(req.query.node),
        label = req.query.label,
        mac = req.query.mac,
        ap = (req.query.ap == "true"),
        active = (req.query.active == "true")

    let query = `SELECT nd.*, d.label AS "label", d."is_ap" AS "is_ap" FROM "node_devices" nd INNER JOIN "devices" d ON d."mac"=nd."device" WHERE 1=1 `
    let queryParams = []

    if (mac) {
        mac = "%" + mac.toLowerCase() + "%"
        queryParams.push(mac)
        query += `AND (REPLACE(CAST("device" as varchar), ':', '') LIKE $${queryParams.length}) `
    }

    if (label) {
        label = "%" + label.toLowerCase() + "%"
        queryParams.push(label)
        query += `AND (LOWER("label") LIKE $${queryParams.length}) `
    }

    if (ap) {
        query += `AND "is_ap"=true `
    }

    if (from) {
        from = new Date(from)
        queryParams.push(from)
        query += ` AND "end" > $${queryParams.length} `
    }

    if (to) {
        to = new Date(to)
        queryParams.push(to)
        query += ` AND "start" < $${queryParams.length} `
    }

    if (active) {
        query += ` AND "active"=true `
    }

    db.query(query, queryParams).then((dres) => {
        let rows = dres.rows

        res.json(rows)
    })
})

router.get("/connections", (req, res) => {
    let from = req.query.from,
        to = req.query.to,
        mac_1 = req.query.mac_1,
        mac_2 = req.query.mac_2,
        active = (req.query.active == "true")

    let query = `SELECT * FROM "connections" WHERE 1=1 `
    let queryParams = []

    if (from) {
        from = new Date(from)
        queryParams.push(from)
        query += ` AND "end_date" > $${queryParams.length} `
    }

    if (to) {
        to = new Date(to)
        queryParams.push(to)
        query += ` AND "start_date" < $${queryParams.length} `
    }

    if (mac_1 || mac_2) {
        if (mac_1 && mac_2) {
            queryParams.push(mac_1)
            queryParams.push(mac_2)

            query += ` AND ((REPLACE(CAST("src" as varchar), ':', '') LIKE $${queryParams.length-1} AND REPLACE(CAST("dst" as varchar), ':', '') LIKE $${queryParams.length}) `
            query += ` OR (REPLACE(CAST("src" as varchar), ':', '') LIKE $${queryParams.length} AND REPLACE(CAST("dst" as varchar), ':', '') LIKE $${queryParams.length-1})) `
        }

        let mac = mac_1 || mac_2

        queryParams.push(mac)
        query += ` AND (REPLACE(CAST("src" as varchar), ':', '') LIKE $${queryParams.length} OR REPLACE(CAST("dst" as varchar), ':', '') LIKE $${queryParams.length}) `
    }

    if (active) {
        query += ` AND "active"=true ` 
    }

    db.query(query, queryParams).then((dres) => {
        let rows = dres.rows
        res.json(rows)
    })
})

module.exports = router