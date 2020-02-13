const crypto = require("crypto"),
    config = require("config"),
    device = require("device")
    db = require("db")

let online = []

function processPacket(id, msg) {
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

        for (let x=0; x<dev.co.length; x++) {
            const con = dev.co[x]
            localDevices[dev.i].connections.push({
                id: con.i,
                count: con.c,
                data: con.d
            })
        }
    }

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
                device: localDevs[con.id].mac,
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

async function authenticateNode(id, secret) {
    const {rows} = await db.query("SELECT * FROM nodes WHERE id=$1 AND secret=$2", [id, secret])
    if (rows && rows.length) {
        // node exists & secret is correct, authenticate
        console.log("Successfully authenticated node ", id)
        online.push(rows[0].id)
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

exports.create = create
exports.packet = processPacket
exports.authenticate = authenticateNode
exports.online = online