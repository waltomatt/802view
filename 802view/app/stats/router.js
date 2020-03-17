const express = require("express"),
    db = require("db")

const router = express.Router()

router.get("/", (req, res) => {
    res.render("stats")
})

async function getStatData() {
    let {rows} = await db.query(`
    SELECT
        (SELECT COUNT(*) FROM "devices") AS devices,
        (SELECT COUNT(*) FROM "devices" WHERE "is_ap"=true) AS aps,
        (SELECT COUNT(*) FROM "node_devices") AS sessions,
        (SELECT COUNT(*) FROM "connections") AS connections,
        (SELECT COUNT(*) FROM "nodes") AS nodes
    `)

    return rows[0]
}

router.get("/data", (req, res) => {
    getStatData().then((data) => {
        res.json(data)
    })
})

module.exports = router