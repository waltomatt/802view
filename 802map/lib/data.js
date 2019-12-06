const header = Buffer.from([0xFF, 0x60, 0x55])

exports.devices = {}
exports.current = []
exports.updated = []

console.log(header.length)

exports.handlePacket = function(data) {
    let offset = 0
    let obj = {}

    let size = data.readUInt8(offset++);

    if (size == 0) {
        // marks the start of a new set of packets
        let sniffer_id = data.readUInt8(offset)
        exports.processCurrent(sniffer_id)

    } else if (size - header.length == data.length) { // basic size check for packet validation
        // might add a checksum at the end
        obj.size = size
        obj.sniffer_id = data.readUInt8(offset++)

        obj.device_id = data.readUInt16BE(offset)
        offset += 2

        obj.mac = data.slice(offset, offset + 6).toString("hex")
        offset += 6

        obj.rssi_total = data.readUInt16BE(offset)
        offset += 2

        obj.rssi_count = data.readUInt8(offset++)

        obj.is_ap = (data.readUInt8(offset++) == 1)

        if (obj.is_ap) {
            let ssid = data.slice(offset, offset + 32)
            let pos = ssid.indexOf(0x0)

            if (pos > -1)
                ssid = ssid.slice(0, pos)

            obj.ssid = ssid.toString("ascii")
            offset += 32
        }

        obj.device_count = (data.readUInt8(offset++))
        obj.destinations = {}

        for (let i=0; i<obj.device_count; i++) {
            let dst = data.readUInt16BE(offset)
            offset += 2;

            let count = data.readUInt8(offset++)

            let bytes = data.readUInt16BE(offset)
            offset +=2;

            obj.destinations[dst] = {count: count, data: bytes}
        }

        if (!exports.current[obj.sniffer_id])
            exports.current[obj.sniffer_id] = []

        console.log(exports.current)

        exports.current[obj.sniffer_id][obj.device_id] = obj;
    }
}

exports.getMac = function(sniffer_id, id) {
    let current = exports.current[sniffer_id]

    if (current[id])
        return current[id].mac
    else
        return false
}

/*
    mac ->  {
                total_packets,
                total_bytes,

                last_5 : [
                    {
                        time,
                        packets,
                        data
                    }
                ]
            }

*/


exports.processCurrent = function(id) {

    if (exports.current[id]) {
        let processed = 0;

        exports.current[id].forEach(obj => {
            processed++

            let device = {}

            if (exports.devices[obj.mac]) {
                // we have already seen this mac
                device = exports.devices[obj.mac]
            } else {
                device = {
                    mac: obj.mac,
                    rssi: [],
                    isAp: false,
                    lastSeen: Date.now(),
                    devices: {}
                }
            }

            // average RSSI over the session
            if (obj.rssi_count)
                device.rssi[obj.sniffer_id] = - (obj.rssi_total / obj.rssi_count)

            if (obj.is_ap)
                device.isAp = true

            if (obj.ssid)
                device.ssid = obj.ssid

            

            let keys = Object.keys(obj.destinations)
            for (let i=0; i<keys.length; i++) {
                let mac = exports.getMac(id, keys[i])
                let dest = obj.destinations[keys[i]]
                
                if (mac) {
                    let dev_mac = device.devices[mac]
                    if (!dev_mac) {
                        dev_mac = {
                            total_packets: 0,
                            total_bytes: 0,

                            recent: []
                        }
                    }

                    dev_mac.total_packets += dest.count
                    dev_mac.total_bytes += dest.data

                    if (dev_mac.recent.length == 10)
                        dev_mac.recent.shift()
            
                    dev_mac.recent.push({
                        time: Date.now(),
                        count: dest.count,
                        data: dest.data
                    })

                    device.devices[mac] = dev_mac
                    if (exports.updated.indexOf(mac) == -1)
                        exports.updated.push(mac)
                }
            }

            device.lastSeen = Date.now()

            exports.devices[obj.mac] = device
            
            if (processed == exports.current[id].length) {
                exports.current[id] = []
            }
        })
    }
}

exports.getUpdated = function() {
    const updated = exports.updated.slice(0)
    exports.updated = []

    return updated
}

exports.header = header