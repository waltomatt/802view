const db = require("db"),
    nodes = require("nodes")

async function getNodeList() {
    let {rows} = await db.query(`
        SELECT * FROM "nodes"
        ORDER BY "id"
    `)

    for (let i=0; i<rows.length; i++) {
        rows[i].online = (nodes.online.indexOf(rows[i].id) > -1)
    }

    return rows
}

async function editNode(id, name, secret) {
    await db.query(`
    UPDATE "nodes"
    SET "name"=$2, "secret"=$3
    WHERE "id"=$1
    `, [id, name, secret])
}

async function createNode(name, secret) {
    await db.query(`
    INSERT INTO "nodes"("name", "secret", "description")
    VALUES($1, $2, '')
    `, [name, secret])
}

async function deleteNode(id) {
    await db.query(`
    DELETE FROM "nodes"
    WHERE "id"=$1
    `, [id])
}

module.exports = {
    getNodeList: getNodeList,
    editNode: editNode,
    createNode: createNode,
    deleteNode: deleteNode
}