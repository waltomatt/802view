const db = require("db"),
    util = require("device/util"),
    config = require("config")

let active = []

async function updateActive() {
    const {rows} = await db.query(`UPDATE node_devices SET active=false WHERE active=true AND "end" <= NOW() - INTERVAL ' `+ config.nodeExpireInterval + ` seconds' RETURNING id`)
    return rows
}

async function init() {
    // load still active node_devices

    let {rows} = await db.query(`
    SELECT * FROM node_devices
    WHERE active=true
    `)

    if (rows) {
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
}

async function checkNode(id) {
    let {rows} = await updateActive();

    if (rows) {
        // remove from our active array
        for (let i=0; i<rows.length; i++) {
            for (const device in active[id]) {
                if (active[id][device].db_id == rows[i].id) {
                    console.log("removing ", id, device)
                    delete active[id][device]
                    console.log(active[id][device])
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

        if (!active[id][dev.mac]) {
            newDevice(id, dev)
        } else {
            updateDevice(id, dev)
        }
    }
    
}

async function newDevice(id, dev) {
    if (util.filter(dev.mac)) return

    console.log("new node device ", id, dev.mac)
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

setInterval(check, config.nodeCheckInterval * 1000)

module.exports = {
    init: init,
    update: update
}