const express = require("express"),
    db = require("db"),
    math = require("mathjs")

const router = express.Router()

router.get("/", (req, res) => {
    res.render("stats")
})

async function getStatData(node) {
    let data = {}
    
    if (node) {
        let {rows} = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM (SELECT DISTINCT "device" FROM "node_devices" WHERE "node"=$1) AS q) AS devices,
            (SELECT COUNT(*) FROM (SELECT DISTINCT "device" FROM "node_devices" INNER JOIN "devices" ON "devices"."mac"="node_devices"."device" WHERE "node"=$1 AND "is_ap"=true) AS q) AS aps,
            (SELECT COUNT(*) FROM "node_devices" WHERE "node"=$1) AS sessions,
            (SELECT COUNT(*) FROM (SELECT DISTINCT(c.id) FROM connections c INNER JOIN node_devices nd ON ("src"="device" OR "dst"="device") WHERE nd."start"<=c."end_time" AND nd."end" >= c."start_time" AND nd."node"=$1) q) AS connections,
        
            (SELECT COUNT(*) FROM "node_devices" WHERE "node"=$1 AND "active"=true) AS active_devices,
            (SELECT COUNT(*) FROM (SELECT DISTINCT "device" FROM "node_devices" INNER JOIN "devices" ON "devices"."mac"="node_devices"."device" WHERE "active"=true AND "node"=$1 AND "is_ap"=true) AS q) AS active_aps,
            (SELECT COUNT(*) FROM (SELECT DISTINCT(c.id) FROM connections c INNER JOIN node_devices nd ON ("src"="device" OR "dst"="device") WHERE nd."active"=true AND nd."start"<=c."end_time" AND nd."end" >= c."start_time" AND nd."node"=$1) q) AS active_connections
        `, [node])

        return rows[0]
    } else {
        let {rows} = await db.query(`
        SELECT
            (SELECT COUNT(*) FROM "devices") AS devices,
            (SELECT COUNT(*) FROM "devices" WHERE "is_ap"=true) AS aps,
            (SELECT COUNT(*) FROM "node_devices") AS sessions,
            (SELECT COUNT(*) FROM "connections") AS connections,

            (SELECT COUNT(*) FROM "node_devices" WHERE "active"=true) AS active_devices,
            (SELECT COUNT(*) FROM (SELECT DISTINCT "device" FROM "node_devices" INNER JOIN "devices" ON "devices"."mac"="node_devices"."device" WHERE "active"=true AND "is_ap"=true) AS q) AS active_aps,
            (SELECT COUNT(*) FROM "connections" WHERE "active"=true) AS active_connections

        `)

        return rows[0]
    }
}

async function getGraphData(node) {
    if (node) {
        let dateQuery = await db.query(`
            SELECT "start" FROM "node_devices"
            WHERE "node"=$1
            ORDER BY "start" ASC
            LIMIT 1
        `, [node])

        // TODO: merge this functionality with the other graph stuff


        if (dateQuery.rows.length) {
            let minDate = dateQuery.rows[0].start

            let {rows} = await db.query(`
            SELECT x.*, COUNT(nd.*) AS y 
            FROM generate_series($2, now(), interval '60 minute') x
            LEFT OUTER JOIN "node_devices" nd ON x >= nd."start" AND x <= nd."end" AND nd."node"=$1
            GROUP BY x
            ORDER BY x
            `, [node, minDate])

            console.log(rows)
            
            return rows
        } else {
            return []
        }
     
    } else {
        let dateQuery = await db.query(`
            SELECT "start" FROM "node_devices"
            ORDER BY "start" ASC
            LIMIT 1
        `)

        if (dateQuery.rows.length) {
            let minDate = dateQuery.rows[0].start

            let {rows} = await db.query(`
            SELECT x.*, COUNT(nd.*) AS y 
            FROM generate_series($1, now(), interval '60 minute') x
            LEFT OUTER JOIN "node_devices" nd ON x >= nd."start" AND x <= nd."end"
            GROUP BY x
            ORDER BY x
            `, [minDate])
            
            return rows
        } else {
            return []
        }
    }
}

let hmCache = {}

async function getHeatmapData(node) {

    let results = []

    for (let i=0; i<=23; i++) {
        if (node) {
            let {rows} = await db.query(`
            WITH hs AS (
                SELECT start, device FROM "node_devices" nd WHERE extract(hour FROM nd."start") <= $1 AND extract(hour FROM nd."end") >= $1 AND nd."node"=$2
            )
            SELECT 
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 0) AS q) AS sun,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 1) AS q) AS mon,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 2) AS q) AS tue,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 3) AS q) AS wed,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 4) AS q) AS thu,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 5) AS q) AS fri,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 6) AS q) AS sat
            `, [i, node])

            results.push([rows[0].sun, rows[0].mon, rows[0].tue, rows[0].wed, rows[0].thu, rows[0].fri, rows[0].sat])
        } else {
            let {rows} = await db.query(`
            WITH hs AS (
                SELECT start, device FROM "node_devices" nd WHERE extract(hour FROM nd."start") <= $1 AND extract(hour FROM nd."end") >= $1
            )
            SELECT 
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 0) AS q) AS sun,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 1) AS q) AS mon,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 2) AS q) AS tue,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 3) AS q) AS wed,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 4) AS q) AS thu,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 5) AS q) AS fri,
                (SELECT COUNT(*) FROM (SELECT DISTINCT(device) FROM hs WHERE extract(dow FROM hs."start") = 6) AS q) AS sat
            `, [i])

            results.push([rows[0].sun, rows[0].mon, rows[0].tue, rows[0].wed, rows[0].thu, rows[0].fri, rows[0].sat])
        }
    }

    let mean = math.mean(results)
    let sd = math.std(results)

    results = results.map((row) => {
        return row.map((val) => {
            return (val - mean) / sd
        })
    })
    
    return {
        mean: mean,
        sd: sd,
        array: results
    }

}


// TODO: cache this, is expensive AF
router.get("/heatmap", (req, res) => {
    let node = false
    if (req.query.node)
        node = parseInt(req.query.node)

    const cache = hmCache[node]
    if (cache && cache.expires > new Date().getTime())
        return res.json(cache)

        getHeatmapData(node).then((data) => {
        data.expires = (new Date().getTime() + (60 * 60 * 1000)) // cached for 1 hour
        hmCache[node] = data

        res.json(data)
    })
})


router.get("/data", (req, res) => {
    let node = false
    if (req.query.node)
        node = parseInt(req.query.node)

    getStatData(node).then((data) => {
        res.json(data)
    })
})

router.get("/graph", (req, res) => {
    let node = false
    if (req.query.node)
        node = parseInt(req.query.node)

    getGraphData(node).then((data) => {
        res.json(data)
    })
})
module.exports = router