const db = require("db"),
    util = require("device/util"),
    config = require("config"),
    alerts = require("alerts")

let active = []

async function updateActive() {
    const {rows} = await db.query("UPDATE connections SET active=false WHERE active=true AND end_time <= NOW() - INTERVAL '" + config.connectionExpireInterval + " seconds' RETURNING id")
    return rows
}

async function init() {
    // load connections that are still active
    const {rows} = await db.query("SELECT * FROM connections WHERE active=true")

    for (let i=0; i<rows.length; i++) {
        active.push({
            index: active.length,
            src: rows[i].src.toUpperCase(),
            dst: rows[i].dst.toUpperCase(),
            start_time: rows[i].start_time,
            last_update: rows[i].end_time,
            last_seen: rows[i].end_time,
            up_packets: parseInt(rows[i].up_packets),
            down_packets: parseInt(rows[i].down_packets),
            up_data: parseInt(rows[i].up_data),
            down_data: parseInt(rows[i].down_data),
            db_id: parseInt(rows[i].id)
        })
    }
}

// this function searches all our active connections and sees if we have a pair between the two
function findActive(dev1, dev2) {
    let found = false
    for (let i=0; i<active.length; i++) {
        const con = active[i]
        if ((con.src == dev1 && con.dst == dev2) || (con.src == dev2 && con.dst == dev1)) {
            active[i].index = i
            found = active[i]
            break
        }
    }

    return found
}

// find the corosponding entry in the active array for a specific database ID
function findByID(id) {
    let found = false
    for (let i=0; i<active.length; i++) {
        const con = active[i]
        if (con.db_id == id) {
            active[i].index = i
            found = active[i]
            break
        }
    }

    return found
}

async function createActive(mac, con) {
    alerts.connectionStart(mac, con)

    let connection = {
        index: active.length,
        src: mac,   // src & dest are kindof meaningless lables
        dst: con.mac,
        start_time: new Date(),
        last_update: new Date(), // we don't want to flood the DB, so updating every X secibds
        last_seen: new Date(), // when we haven't seen the device for X seconds, we say that the connection has ended
        up_packets: con.count,
        down_packets: 0,
        up_data: con.data,
        down_data: 0,
    }

    let {rows} = await db.query("INSERT INTO connections(start_time, end_time, src, dst, up_packets, up_data) VALUES(NOW(), NOW(), $1, $2, $3, $4) RETURNING id", [connection.src, connection.dst, connection.up_packets, connection.up_data])
    connection.db_id = rows[0].id
    
    active[connection.index] = connection
    return connection
}

// either update or create our active connection from the received data
async function updateConnection(dev, con) {
    // filter out broadcast & multicast addresses
    if (util.filter(dev.mac) || util.filter(con.mac)) return

    let connection = findActive(dev.mac, con.mac)
    if (connection === false) {
        console.log("updateConnection", dev.mac, con.mac, "CREATE")
        connection = await createActive(dev.mac, con)
    } else {
        console.log("updateConnection", dev.mac, con.mac, "UPDATE")
    }
    
    if (connection.src == dev.mac) {
        connection.up_packets += con.count
        connection.up_data += con.data
    } else {
        connection.down_packets += con.count
        connection.down_data += con.data
    }

    connection.last_seen = new Date()
    
    // check if the update interval has passed
    if ((new Date()).getTime() - connection.last_update.getTime() > (config.connectionUpdateInterval * 1000)) {
        connection.last_update = new Date()
        db.query(`
            UPDATE connections
            SET up_packets=$1, down_packets=$2, up_data=$3, down_data=$4, end_time=NOW(), active=true
            WHERE id=$5
        `, [connection.up_packets, connection.down_packets, connection.up_data, connection.down_data, connection.db_id])
    }
    
    active[connection.index] = connection
}

async function update(devices) {
    for (let i=0; i<devices.length; i++) {
        const dev = devices[i]

        for (let x=0; x<dev.connections.length; x++) {
            await updateConnection(dev, dev.connections[x])
        }
    }
}

// check for expired connections
async function checkExpired() {
    const {rows} = await updateActive()

    if (rows) {
        for (let i=0; i<rows.length; i++) {
            alerts.connectionEnd(rows[i].id)

            let con = findByID(rows[i].id)
            if (con) {
                active.splice(con.index, 1)
            }
        }
    }
}

setInterval(checkExpired, config.connectionCheckInterval * 1000)


async function get(device, start, end) {

    if (start) {
        let {rows} = await db.query(`
        SELECT * 
        FROM "connections"
        WHERE ("src"=$1 OR "dst"=$1) AND "end_time" > $2 AND "start_time" < $3
        `, [device, new Date(start), new Date(end)])

        return rows
    } else {
        let {rows} = await db.query(`
        SELECT * 
        FROM "connections"
        WHERE ("src"=$1 OR "dst"=$1) AND "active"=true
        `, [device])

        return rows
    }
}

module.exports = {
    update: update,
    get: get,
    init: init
}
