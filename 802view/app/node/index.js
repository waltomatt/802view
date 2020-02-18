const crypto = require("crypto"),
    config = require("config"),
    util = require("device/util"),
    device = require("device"),
    db = require("db")

let online = []
let nodeInfo = []

function processPacket(id, msg, ws) {
    let localDevices = []

    for (let i=0; i<msg.length; i++) {
        let dev = msg[i]
        localDevices[dev.i] = {
            mac: dev.m,
            rssi: -dev.r,
            is_ap: dev.a,
            connections: []
        }

        if (dev.s) {
            localDevices[dev.i].ssid = dev.s
        }

        if (typeof(dev.co) == "object" && dev.co.length) {
            for (let x=0; x<dev.co.length; x++) {
                const con = dev.co[x]
                localDevices[dev.i].connections.push({
                    id: con.i,
                    count: con.c,
                    data: con.d
                })
            }
        }
    }

    nodeInfo[id].last_seen = new Date()

    globalize(id, localDevices)
}

// In this function, we convert all of the 'local' snapshot IDs into 'global' MAC addresses
function globalize(id, localDevs) {
    let globalized = []

    for (let i=0; i<localDevs.length; i++) {
        let dev = localDevs[i]
        
        // convert each connection from id to mac
        for (let x=0; x<dev.connections.length; x++) {
            const con = dev.connections[x]

            let obj = {
                mac: localDevs[con.id].mac,
                count: con.count, 
                data: con.data
            }

            dev.connections[x] = obj
        }

        globalized.push(dev)
    }


    // send to get processed
    device.update(id, globalized)
}

async function create() {
    // generate a secure, random buffer to use for our secret key
    let buffer = crypto.randomBytes(32)
    let secret = buffer.toString("hex")

    const {rows} = await db.query("INSERT INTO nodes(name, secret) VALUES('New node', $1) RETURNING *", [secret])
}

async function authenticateNode(id, secret, ip) {
    const {rows} = await db.query("SELECT * FROM nodes WHERE id=$1 AND secret=$2", [id, secret])
    if (rows && rows.length) {
        // node exists & secret is correct, authenticate
        console.log("Successfully authenticated node ", id)
        online.push(rows[0].id)
        nodeInfo[rows[0].id] = {
            ip: ip,
            last_seen: new Date()
        }

        return rows[0].id
    } else {
        // not correct
        console.log("Authentication failed for node ", id)
        return false
    }
}

function disconnectNode(id) {
    // remove from our online list
    online.splice(online.indexOf(id), 1)
}


async function getInfo(id) {
    let {rows} = await db.query(`
    SELECT n.id, n.name, n.description,
    (SELECT COUNT(*) FROM node_devices WHERE node=$1 AND active=true) AS devices
    FROM 
        "nodes" n
    WHERE
        n.id=$1
    `, [id])

    if (rows.length == 0) {
        return false
    }

    const row = rows[0]

    let obj = {
        id: row.id,
        name: row.name,
        description: row.description,
        devices: row.devices
    } 

    obj.online = false

    if (online.indexOf(row.id) > -1) {
        // device is online, populate with some more upto date information
        obj.online = true
        obj.ip = nodeInfo[id].ip
        obj.last_seen = nodeInfo[id].last_seen
    }
    

    let {rowCount} = await db.query(`
    SELECT mac 
    FROM 
        devices d 
    INNER JOIN 
        node_devices nd ON nd.device = d.mac
    WHERE 
        d.is_ap=true AND nd.active=true AND nd.node=$1
    GROUP BY d.mac
    `, [row.id])

    obj.ap_count = rowCount
    
    return obj
}

exports.create = create
exports.packet = processPacket
exports.authenticate = authenticateNode
exports.online = online
exports.disconnect = disconnectNode
exports.getInfo = getInfo