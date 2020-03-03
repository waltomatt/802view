const db = require("db"),
    oui = require("oui"),
    connections = require("device/connections"),
    util = require("device/util"),
    nodes = require("device/nodes")

let newDevices = []

function updateSSID(device) {
    db.query(`
    INSERT INTO device_ssids(
        device, ssid, first_seen, last_seen
    ) VALUES (
        $1, $2, NOW(), NOW()
    ) ON CONFLICT ON CONSTRAINT ssid_pk
    DO
        UPDATE
        SET last_seen=NOW()
    `, [device.mac, device.ssid])
}

async function updateDevice(id, device) {
    // we don't want multicast or broadcast addresses
    if (util.filter(device.mac)) return

    await db.query(`
    INSERT INTO devices(
        mac, first_seen, last_seen, is_ap
    ) VALUES (
        $1, NOW(), NOW(), $2
    ) ON CONFLICT(mac)
    DO
        UPDATE 
        SET last_seen=NOW()
    `, [device.mac, device.is_ap])

    if (device.is_ap)
        await db.query(`
            UPDATE devices SET is_ap=true WHERE mac=$1
        `, [device.mac])
    
    
    if (device.is_ap && device.ssid && device.ssid.length) {
        updateSSID(device)
    }

}

async function updateDevices(id, devices) {
    // we now have a globalized array of devices
    for (let i=0; i<devices.length; i++) {
        await updateDevice(id, devices[i])
    }

    connections.update(devices)
    nodes.update(id, devices)
}

async function getInfo(mac, node, date) {
    let {rows} = await db.query(`
    SELECT d.label, d.last_seen, d.is_ap, d.mac, d.first_seen,
        (SELECT ssid FROM device_ssids s WHERE s.device=$1)
    FROM devices d
    WHERE d.mac=$1
    `, [mac])

    let obj = {}

    if (rows && rows.length) {
        obj = {
            label: rows[0].label || rows[0].mac,
            mac: rows[0].mac,
            first_seen: rows[0].first_seen,
            last_seen: rows[0].last_seen,
            is_ap: rows[0].is_ap,
            ssid: false,
            node: false,
            session: false,
            org: false
        }

        if (rows[0].ssid)
            obj.ssid = rows[0].ssid

        obj.org = oui(obj.mac)
        if (obj.org)
            obj.org = obj.org.split("\n")[0]

        if (node) {
            obj.node = nodes.getActive(mac, parseInt(node))
        } else {
            obj.node = nodes.getActive(mac)
        }

        if (date) {
            obj.session = await nodes.getSessionOnDate(parseInt(node), mac, date)
        }

        obj.connections = await connections.get(mac)

        return obj
    } else {
        return false
    }
}

async function setLabel(dev, label) {
    await db.query(`
    UPDATE "devices" 
    SET "label"=$1
    WHERE "mac"=$2
    `, [label, dev])
}

async function getSession(sessionID) {

}

module.exports = {
    update: updateDevices,
    getInfo: getInfo,
    setLabel: setLabel
}
