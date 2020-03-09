const db = require("db"),
    util = require("device/util"),
    config = require("config"),
    alerts = require("alerts")

let active = []

async function updateActive() {
    const {rows} = await db.query(`UPDATE node_devices SET active=false WHERE active=true AND "end" <= NOW() - INTERVAL ' `+ config.nodeExpireInterval + ` seconds' RETURNING id`)
    return rows
}

async function processRows(rows) {
    for (let i=0; i<rows.length; i++) {
        const row = rows[i]
        const node = parseInt(row.node)

        if (!active[node])
            active[node] = {}

        active[node][row.device.toUpperCase()] = {
            start: row.start,
            end: row.end,
            last_update: row.end,
            node: node,
            rssi: parseInt(row.rssi),
            device: row.device,
            active: row.active,
            db_id: parseInt(row.id)
        }
    }
}

async function init() {
    // load still active node_devices

    let {rows} = await db.query(`
    SELECT * FROM node_devices
    WHERE active=true
    `)

    if (rows) {
        await processRows(rows)
    }
}

async function initDevice(id) {
    active[id] = {}

    let {rows} = await db.query(`
    SELECT * FROM node_devices
    WHERE active=true AND node=$1`, [id])

    if (rows && rows.length) {
        processRows(rows)
    }
}

async function checkNode(id) {
    let rows = await updateActive();
    if (rows) {
        // remove from our active array
        for (let i=0; i<rows.length; i++) {
            alerts.sessionEnd(rows[i].id, id)
            
            for (const device in active[id]) {
                if (active[id][device].db_id == rows[i].id) {
                    delete active[id][device]
                }
            }
        }
    }
}

async function check() {
    let {rows} = await db.query("SELECT id FROM nodes");

    if (rows) {
        for (let i=0; i<rows.length; i++) {
            const id = rows[i].id
            checkNode(id)
        }
    }
}

async function update(id, devices) {
    // if we don't already have a record of this node, create an empty object
    if (!active[id])
        active[id] = {}
    
    for (let i=0; i<devices.length; i++) {
        const dev = devices[i]

        // check in range
        if (dev.rssi) {
            if (!active[id][dev.mac]) {
                newDevice(id, dev)
            } else {
                updateDevice(id, dev)
            }
        }
    }
    
}

async function newDevice(id, dev) {
    if (util.filter(dev.mac)) return

    console.log("new node device ", id, dev.mac)
    alerts.sessionStart(dev.mac, id)

    active[id][dev.mac] = {
        start: new Date(),
        end: new Date(),
        last_update: new Date(),
        node: id,
        rssi: dev.rssi,
        device: dev.mac
    }

    let {rows} = await db.query(`
    INSERT INTO node_devices(
        "start", "end", "node", "rssi", "device"
    ) VALUES(
        NOW(), NOW(), $1, $2, $3
    ) RETURNING id`, [id, dev.rssi, dev.mac])

    active[id][dev.mac].db_id = rows[0].id
}

function updateDevice(id, dev) {
    let storedDev = active[id][dev.mac]
    if (dev.rssi)
        storedDev.rssi = dev.rssi

    storedDev.end = new Date()

    if ((new Date()).getTime() - storedDev.last_update.getTime() > (config.nodeUpdateInterval * 1000)) {
        // database update
        db.query(`
            UPDATE node_devices
            SET "end"=NOW(), rssi=$1
            WHERE id=$2
        `, [dev.rssi, storedDev.db_id])

        storedDev.last_update = new Date()
    }
}

function getActive(dev, node) {
    // all of the MACs on the server get stored in upper case
    dev = dev.toUpperCase()
    if (node) {
        return active[node][dev]
    } else {
        let actives = []

        for (let i=0; i<active.length; i++) {
            if (active[i] && active[i][dev])
                actives.push(active[i][dev])
        }

        return actives
    }
}

async function getSessionOnDate(node, dev, date) {
    let {rows} = await db.query(`
    SELECT "start", "end"
    FROM "node_devices"
    WHERE "node"=$1 AND "device"=$2 AND "start" < $3 AND "end" > $3
    `, [node, dev, date])

    if (rows.length) {
        return {
            start: rows[0].start,
            end: rows[0].end
        }
    } else {
        return false
    }
}

async function getSession(sessionID) {
    let {rows} = await db.query(`
    SELECT "start", "end", "node", "active", "device"
    FROM "node_devices"
    WHERE "id"=$1
    `, [sessionID])

    if (rows.length) {
        return {
            id: sessionID,
            device: rows[0].device,
            start: rows[0].start,
            end: rows[0].end,
            node: rows[0].node,
            active: rows[0].active
        }
    } else {
        return false
    }
}

async function getAllSessions(dev) {
    let {rows} = await db.query(`
    SELECT nd."id", nd."node", nd."start", nd."end", nd."active", n."name" AS "node_name"
    FROM "node_devices" nd
    INNER JOIN "nodes" n ON n."id" = nd."node"
    WHERE "device"=$1
    ORDER BY "start" ASC
    `, [dev])

    let sessions = []

    for (let i=0; i<rows.length; i++) {
        const row = rows[i]
        sessions.push({
            id: rows[i].id,
            node: rows[i].node,
            node_name: rows[i].node_name,
            start: new Date(rows[i].start),
            end: new Date(rows[i].end),
            active: rows[i].active
        })
    }

    return sessions
}

setInterval(() => {
    check()
}, config.nodeCheckInterval * 1000)

module.exports = {
    init: init,
    update: update,
    getActive: getActive,
    getSessionOnDate: getSessionOnDate,
    getSession: getSession,
    getAllSessions: getAllSessions,
    initDevice: initDevice
}