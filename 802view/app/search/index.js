const oui = require("oui"),
    db = require("db")

let activeOrgs = []

async function updateOrgs() {
    const all = oui.search("*")
    let organizations = {}

    for (let i=0; i<all.length; i++) {
        let org = all[i].organization
        if (org) {
            org = org.split("\n")[0]

            if (!organizations[org])
                organizations[org] = []

            organizations[org].push(all[i].oui)
        }
    }
    
    let {rows} = await db.query(`
        SELECT mac
        FROM "devices"
    `)

    let done = []

    activeOrgs = []

    for (let i=0; i<rows.length; i++) {
        let org = oui(rows[i].mac)
        if (org)
            org = org.split("\n")[0]

        if (done.indexOf(org) == -1 && org) {
            activeOrgs.push({
                org: org,
                ouis: organizations[org]
            })
            done.push(org)
        }
    }

}

function getActiveOrgs() {
    return activeOrgs
}

async function getNodeList() {
    let {rows} = await db.query(`
    SELECT "id", "name"
    FROM "nodes"
    ORDER BY "id" ASC`)

    return rows
}

async function device(searchType, mac, org, only_ap, sort, page) {
    
    let query = `
        SELECT COUNT(*) OVER (), *,
            (SELECT "ssid" FROM "device_ssids" ds WHERE ds."device"=d."mac") AS ssid,
            (SELECT COUNT(*) OVER () FROM "node_devices" nd WHERE nd."device"=d."mac" AND "active"=true GROUP BY nd."device") AS online
        FROM devices d `

    let queryParams = []

    if (searchType == "org") {
        if (activeOrgs[org]) {
            query += `WHERE trunc("mac") IN (`

            let macs = []
            for (let i=0; i<activeOrgs[org].ouis.length; i++) {
                let oui = activeOrgs[org].ouis[i]
                oui = "macaddr '" + oui + "000000'"
                macs.push(oui)
            }

            query += macs.join(",")
            query += ")"

        } else {
            return []
        }
    } else {
        if (mac) {
            mac = mac.replace(new RegExp(":", "g"), "")
            query += `WHERE REPLACE(CAST("mac" as varchar), ':', '') LIKE $1`
            queryParams.push("%"+mac+"%")
        } else {
            if (only_ap) {
                query += "WHERE 1=1"
            }
        }
    }

    if (only_ap) {
        query += " AND is_ap=true"
    }

    query += " GROUP BY mac "
    
    if (sort == "last_seen")
        query += ` ORDER BY "last_seen" DESC`

    if (sort == "first_seen")
        query += ` ORDER BY "first_seen" DESC`

    query += " LIMIT 25 OFFSET $" + (queryParams.length+1)
    queryParams.push(page * 25)

    let {rows} = await db.query(query, queryParams)
    return rows
}

async function sessions(searchType, mac, org, min_date, max_date, nodes, sort, page) {
    let query = `
        SELECT COUNT(*) OVER (), *, 
            (SELECT "label" FROM "devices" WHERE devices."mac" = nd."device"),
            (SELECT "ssid" FROM "device_ssids" ds WHERE ds."device"=nd."device") AS ssid,
            (SELECT "name" FROM "nodes" n WHERE n."id"=nd."node") AS node_name
        FROM "node_devices" nd `

    let queryParams = []

    if (searchType == "org") {
        if (activeOrgs[org]) {
            query += `WHERE trunc("device") IN (`

            let macs = []
            for (let i=0; i<activeOrgs[org].ouis.length; i++) {
                let oui = activeOrgs[org].ouis[i]
                oui = "macaddr '" + oui + "000000'"
                macs.push(oui)
            }

            query += macs.join(",")
            query += ")"

        } else {
            return []
        }
    } else {
        if (mac) {
            mac = mac.replace(new RegExp(":", "g"), "")
            query += `WHERE REPLACE(CAST("device" as varchar), ':', '') LIKE $1`
            queryParams.push("%"+mac+"%")
        } else {
            query += "WHERE 1=1"
        }
    }

    if (min_date && max_date) {
        query +=  ` AND ("start_time" < $${queryParams.length+1} AND "end_time" > $${queryParams.length+2})`
        queryParams.push(max_date)
        queryParams.push(min_date) 
    }

    if (nodes) {
        query += ` AND "node" IN (`

        let nodeNums = []
        for (let i=0; i<nodes.length; i++) {
            let node = parseInt(nodes[i])
            if (node)
                nodeNums.push(node)
        }

        query += nodeNums.join(",")
        query += ")"
    }

    query += " GROUP BY id"


    if (sort == "session_start")
        query += ` ORDER BY "start" DESC `

    if (sort == "session_end")
        query += ` ORDER BY "end" DESC `

    if (sort == "session_length")
        query += ` ORDER BY ("end" - "start") DESC`

    query += " LIMIT 25 OFFSET $" + (queryParams.length+1)
    queryParams.push(page * 25)

    let {rows} = await db.query(query, queryParams)
    return rows
}

async function connections(searchType, mac, org, searchType2, mac2, org2, min_date, max_date, sort, page) {
    let query = `
        SELECT COUNT(*) OVER (), *, 
            (SELECT "label" FROM "devices" WHERE devices."mac" = c."src") AS src_label, 
            (SELECT "ssid" FROM "device_ssids" ds WHERE ds."device"=c."src") AS src_ssid,
            (SELECT "label" FROM "devices" WHERE devices."mac" = c."dst") AS dst_label,
            (SELECT "ssid" FROM "device_ssids" ds WHERE ds."device"=c."dst") AS dst_ssid
        FROM "connections" c `

    let queryParams = []


    if (searchType == "org") {
        if (activeOrgs[org]) {
            query += `WHERE (trunc("src") IN (`

            let macs = []
            for (let i=0; i<activeOrgs[org].ouis.length; i++) {
                let oui = activeOrgs[org].ouis[i]
                oui = "macaddr '" + oui + "000000'"
                macs.push(oui)
            }

            query += macs.join(",")
            query += ")"

            query += ` OR trunc("dst") IN (`
            query += macs.join(",")
            query += "))"
        } else {
            return []
        }
    } else {
        if (mac) {
            mac = mac.replace(new RegExp(":", "g"), "")
            query += `WHERE (REPLACE(CAST("src" as varchar), ':', '') LIKE $1 OR REPLACE(CAST("dst" as varchar), ':', '') LIKE $1)`
            queryParams.push("%"+mac+"%")
        } else {
            query += "WHERE 1=1"
        }
    }

    if (searchType2 == "org") {
        if (activeOrgs[org2]) {
            query += `AND ((trunc("src") IN (`

            let macs = []
            for (let i=0; i<activeOrgs[org2].ouis.length; i++) {
                let oui = activeOrgs[org2].ouis[i]
                oui = "macaddr '" + oui + "000000'"
                macs.push(oui)
            }

            query += macs.join(",")
            query += ")"

            query += ` OR trunc("dst") IN (`
            query += macs.join(",")
            query += "))"
        } else {
            return []
        }
    } else {
        if (mac2) {
            mac2 = mac.replace(new RegExp(":", "g"), "")
            query += `AND (REPLACE(CAST("src" as varchar), ':', '') LIKE $1 OR REPLACE(CAST("dst" as varchar), ':', '') LIKE $1)`
            queryParams.push("%"+mac+"%")
        }
    }

    if (min_date && max_date) {
        query +=  ` AND ("start_time" < $${queryParams.length+1} AND "end_time" > $${queryParams.length+2})`
        queryParams.push(max_date)
        queryParams.push(min_date) 
    }


    query += ` GROUP BY c."id"`

    if (sort == "connection_start")
        query += ` ORDER BY "start_time" DESC `

    if (sort == "connection_end")
        query += ` ORDER BY "end_time" DESC `

    if (sort == "connection_length")
        query += ` ORDER BY ("connection_end" - "connection_start") DESC`

    if (sort == "connection_bytes")
        query += ` ORDER BY ("up_data" + "down_data") DESC`
    
    if (sort == "connection_packets")
        query += ` ORDER BY ("up_packets" + "down_packets") DESC`
        
    query += " LIMIT 25 OFFSET $" + (queryParams.length+1)
    queryParams.push(page * 25)

    let {rows} = await db.query(query, queryParams)
    return rows
}

module.exports = {
    device: device,
    sessions: sessions,
    connections: connections,

    getActiveOrgs: getActiveOrgs,
    updateOrgs: updateOrgs,
    getNodeList: getNodeList
}