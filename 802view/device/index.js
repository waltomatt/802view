const db = require("db"),
    connections = require("device/connections"),
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
    await db.query(`
    INSERT INTO devices(
        mac, last_seen, is_ap
    ) VALUES (
        $1, NOW(), $2
    ) ON CONFLICT(mac)
    DO
        UPDATE 
        SET last_seen=NOW(), is_ap=$2
    `, [device.mac, device.is_ap])
    
    
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

exports.update = updateDevices