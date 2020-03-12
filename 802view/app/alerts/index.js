const db = require("db"),
    search = require("search")

let list = []

async function create(name, on, type, matches, data) {
    if (type == "org") {
        const orgs = search.getActiveOrgs()

        if (orgs[data]) {
            data = orgs[data].ouis.join(",")
        } else {
            throw new Error("Invalid orginization specified")
        }
    }

    await db.query(`
    INSERT INTO "alerts" ("name", "on", "type", "data", "matches")
    VALUES ($1, $2, $3, $4, $5)
    `, [name, on, type, data, matches])
}


async function update() {
    let {rows} = await db.query(`
    SELECT *, 
    (SELECT COUNT(*) FROM "triggered_alerts" ta WHERE ta."alert" = a."id") AS count,
    (SELECT COUNT(*) FROM "triggered_alerts" ta WHERE ta."alert" = a."id" AND ta."active"=true) AS active_count,
    (SELECT "date" FROM "triggered_alerts" ta WHERE ta."alert" = a."id" ORDER BY "date" DESC LIMIT 1) AS last_triggered
    FROM alerts a
    `)

    let newList = []

    for (let i=0; i<rows.length; i++) {
        newList.push({
            id: rows[i].id,
            name: rows[i].name,
            on: rows[i].on,
            type: rows[i].type,
            matches: rows[i].matches,
            data: rows[i].data.split(","),
            count: rows[i].count,
            active_count: rows[i].active_count,
            last_triggered: rows[i].last_triggered
        })
    }

    list = newList

    return newList
}

function deviceMatches(type, data, mac) {
    mac = mac.toLowerCase().replace(new RegExp(":", "g"), "")

    let match = false
    if (type == "mac") {        
        for (let i=0; i<data.length; i++) {
            if (mac.indexOf(data.toLowerCase().replace(new RegExp(":", "g"), "")) > -1) {
                match = true
                break
            }
        }
    
    } else if (type == "org") {
        for (let i=0; i<data.length; i++) {
            if (mac.substr(0, 6) == data[i].toLowerCase()) {
                match = true
                break
            }
        }
    }

    return match
}

function check(on, mac) {
    let triggered = false

    for (let i=0; i<list.length; i++) {
        const alert = list[i]

        if (alert.on == on) {
            if (deviceMatches(alert.type, alert.data, mac) == alert.matches)
                triggered = alert
        }

        if (triggered != false)
            break
    }

    return triggered
}

async function getAlerts(alert_id, clear) {
    let {rows} = await db.query(`
        SELECT *,
            (SELECT "name" FROM "nodes" n WHERE n."id"=ta."node") AS node_name,
            (SELECT "label" FROM "devices" d WHERE d."mac"=ta."device") AS device_label
        FROM "triggered_alerts" ta
        WHERE "alert"=$1
        ORDER BY "active" DESC
    `, [alert_id])

    if (clear) {
        await db.query(`
        UPDATE "triggered_alerts"
        SET "active"=false
        WHERE "alert"=$1
        `, [alert_id])
    }

    return rows
}

async function getActive() {
    let {rows} = await db.query(`
    SELECT *,
        (SELECT "name" FROM "alerts" a WHERE a."id"=ta."alert") AS alert_name,
        (SELECT "name" FROM "nodes" n WHERE n."id"=ta."node") AS node_name,
        (SELECT "label" FROM "devices" d WHERE d."mac"=ta."device") AS device_label
    FROM "triggered_alerts" ta
    WHERE "active"=true
    ORDER BY "active" DESC
    `) 

    return rows
}

async function dismiss(id) {
    await db.query(`
        UPDATE "triggered_alerts"
        SET "active"=false
        WHERE "id"=$1
    `, [id])
}

async function remove(id) {
    await db.query(`
    DELETE FROM "alerts"
    WHERE "id"=$1
    `, [id])
}

// Triggering functions

function triggerAlert(alert_id, device, node, comment) {
    db.query(`
    INSERT INTO "triggered_alerts" ("alert", "device", "node", "comment", "date")
    VALUES ($1, $2, $3, $4, NOW())
    `, [alert_id, device, node, comment])
}

function sessionStart(mac, node) {
    let alert = check("session_start", mac)

    if (alert) {
        triggerAlert(alert.id, mac, node, "")
    }
}

async function sessionEnd(db_id, node) {
    let {rows} = await db.query(`
    SELECT * FROM "node_devices"
    WHERE "id"=$1`, [db_id])

    if (rows.length) {
        let alert = check("session_end", rows[0].device)
        if (alert) {
            triggerAlert(alert.id, rows[0].device, rows[0].node, "SessionID:" + rows[0].id)
        }
    }
} 

function connectionStart(mac, con) {
    let alert = check("connection_start", mac)
    if (alert) {
        triggerAlert(alert.id, mac, null, "connecting to: " + con.mac)
    }

    let alert2 = check("connection_start", con.mac)
    if (alert) {
        triggerAlert(alert.id, con.mac, null, "connecting to: " + mac)
    }
}

async function connectionEnd(db_id) {
    let {rows} = await db.query(`
    SELECT * FROM "connections"
    WHERE "id"=$1`, [db_id])

    if (rows.length) {
        let alert = check("connection_end", rows[0].src)
        let alert2 = check("connection_end", rows[0].dst)
        
        if (alert) {
            triggerAlert(alert.id, rows[0].src, null, "connected to: " + rows[0].dst)
        }

        if (alert2) {
            triggerAlert(alert.id, rows[0].dst, null, "connecting to: " + rows[0].src)
        }
    }
}

update()

module.exports = {
    list: list,
    get: getAlerts,
    getActive: getActive,
    dismiss: dismiss,
    create: create,
    remove: remove,
    update: update,
    sessionStart: sessionStart,
    sessionEnd: sessionEnd,
    connectionStart: connectionStart,
    connectionEnd: connectionEnd
}