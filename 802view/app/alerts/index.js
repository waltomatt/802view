const db = require("db"),
    search = require("search")

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

async function get() {
    let {rows} = await db.query(`
    SELECT * FROM alerts
    `)

    return rows
}

module.exports = {
    create: create,
    get: get
}