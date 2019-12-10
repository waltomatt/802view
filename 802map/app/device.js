const fabric = require("fabric").fabric

const draw = require("./draw.js"),
    DeviceInfo = require("./DeviceInfo.js")

let devices = {}

function connectLine(mac1, mac2) {
    if (mac1 == mac2) return

    if (devices[mac1] && devices[mac2] && devices[mac1].draw != null && devices[mac2].draw != null) {
        if (devices[mac1].lines[mac2]) {
            draw.canvas.remove(devices[mac1].lines[mac2])
        }

        let draw1 = devices[mac1].draw,
            draw2 = devices[mac2].draw


        let line = draw1.makeLine(draw2)

        devices[mac1].lines[mac2] = line

        draw.canvas.add(line)
        draw.canvas.sendToBack(line)
       
    }
}

class Device {
    mac = false
    ap = false
    connected = {}
    connectedCount = 0
    lastSeen = false
    rssi = []
    ssid = "<NO SSID>"
    draw = null
    lines = {}

    constructor(dev) {
        this.mac = dev.mac
        devices[this.mac] = this

        this.update(dev)

        // create drawable object
        this.draw = new DeviceInfo(this)

        draw.canvas.add(this.draw)
    }

    update(dev) {
        this.ap = dev.isAp
        this.lastSeen = new Date(dev.lastSeen)
        this.connected = dev.devices
        this.rssi = dev.rssi
    
        if (dev.ssid)
            this.ssid = dev.ssid

        if (this.draw)
            this.draw.updateDevice(this)

        Device.drawConnections()
    }

    updateLinePos() {
        
    }

    getRSSI(sniffer_id) {
        return this.rssi[sniffer_id]
    }

    static find(mac) {
        if (devices[mac])
            return devices[mac]
        else
            return false
    }

    static drawConnections() {
        for (let mac1 in devices) {
            for (let mac2 in devices[mac1].connected)
                connectLine(mac1, mac2)
        }
    }

    static getDevices() {
        return devices
    }
}

module.exports = Device
window.devices = devices