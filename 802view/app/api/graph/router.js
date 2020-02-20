const express = require("express"),
    db = require("db")
const router = express.Router()

// TODO: move logic into seperate functions

async function getActiveNodes() {
    let {rows} = await db.query(`
    SELECT n.id, n.name, n.description,
    (SELECT COUNT(*) FROM node_devices WHERE node=n.id AND active=true) AS devices
    FROM 
        "nodes" n
    `)

    let nodes = []
    for (let i=0; i<rows.length; i++) {
        let node = {}
        node.id = rows[i].id
        node.label = rows[i].name
        node.value = parseInt(rows[i].devices)
        nodes.push(node)
    }
    return nodes
}


router.get("/nodes", (req, res) => {
    getActiveNodes().then((nodes) => {
        res.json({
            nodes: nodes
        })

    }).catch((e) => {
        console.log(e)
        // something went wrong
        res.sendStatus(500)
    })
})

async function getActiveDevices(nodeID) {
    let {rows} = await db.query(`
    SELECT d.mac, d.label, d.is_ap, 
        (SELECT ds.ssid FROM device_ssids ds WHERE ds.device=d.mac ORDER BY last_seen DESC LIMIT 1) AS ssid
    FROM devices d
    INNER JOIN node_devices nd ON nd.device=d.mac
    WHERE nd.node=$1 AND nd.active=true
    `, [nodeID])


    return rows
}

async function getDevicesDate(nodeID, date) {
    let {rows} = await db.query(`
    SELECT d.mac, d.label, d.is_ap, 
        (SELECT ds.ssid FROM device_ssids ds WHERE ds.device=d.mac ORDER BY last_seen DESC LIMIT 1) AS ssid
    FROM devices d
    INNER JOIN node_devices nd ON nd.device=d.mac
    WHERE nd.node=$1 AND (nd.start < $2 AND nd.end > $2)
    `, [nodeID, date])

    return rows
}

async function getDevices(nodeID, date) {
    let rows
    if (date)
        rows = await getDevicesDate(nodeID, date)
    else
        rows = await getActiveDevices(nodeID)

    let devices = []

    for (let i=0; i<rows.length; i++) {
        let device = {}
        device.id = rows[i].mac
        device.label = rows[i].label || rows[i].mac
        device.is_ap = rows[i].is_ap   

        if (device.is_ap) {
            if (rows[i].ssid && !rows[i].label) {
                device.label = rows[i].ssid
            }

            device.shape = "circle"
        } else {
            device.shape = "box"
        }
        
        
        devices.push(device)
    }

    return devices
}

async function getActiveConnections(nodeID) {
    let {rows} = await db.query(`
    SELECT id, src, dst, up_data, down_data, up_packets, down_packets FROM connections 
    WHERE active=true AND
        (src IN (SELECT device FROM node_devices WHERE node=$1) OR
         dst IN (SELECT device FROM node_devices WHERE node=$1))
    `, [nodeID])

    return rows
}

async function getConnectionsDate(nodeID, date) {
    let {rows} = await db.query(`
    SELECT id, src, dst, up_data, down_data, up_packets, down_packets FROM connections 
    WHERE start_time < $1 AND end_time > $1 AND
        (src IN (SELECT device FROM node_devices WHERE node=$2) OR
         dst IN (SELECT device FROM node_devices WHERE node=$2))
    `, [date, nodeID])

    return rows
}

async function getConnections(nodeID, date) {
    
    let rows;

    if (date) {
        rows = await getConnectionsDate(nodeID, date)
    } else {
        rows = await getActiveConnections(nodeID)
    }   

    let edges = []

    for (let i=0; i<rows.length; i++) {
        edges.push({
            id: rows[i].id,
            from: rows[i].src,
            to: rows[i].dst,
            value: (rows[i].up_data + rows[i].down_data),
            up_data: rows[i].up_data,
            down_data: rows[i].down_data,
            up_packets: rows[i].up_packets,
            down_packets: rows[i].down_packets
        })
    }

    return edges
}

router.get("/devices/:nodeID", (req, res) => {
    const nodeID = req.params.nodeID

    let date = false

    if (req.query.date) {
        date = new Date(parseInt(req.query.date) * 1000)
    }

    if (nodeID) {
        getDevices(nodeID, date).then((nodes) => {
            getConnections(nodeID, date).then((edges) => {
                res.json({
                    nodes: nodes,
                    edges: edges
                })
            })
            
        }).catch((e) => {
            console.log(e)
            res.sendStatus(500)
        })
    } else {
        res.sendStatus(404)
    }
})



module.exports = router