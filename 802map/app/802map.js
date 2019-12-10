const server = require("./server.js"),
    Device = require("./device.js"),
    draw = require("./draw.js")

const $ = require("jquery"),
    fabric = require("fabric").fabric

server.init()

function processDevices(devs) {
    for (mac in devs) {
        let dev = Device.find(mac)
        if (dev)
            dev.update(devs[mac])
        else
            dev = new Device(devs[mac])
    }
}

server.on("reset", processDevices)
server.on("update", processDevices)

$(document).ready(function() {
    draw.init("canvas")
})

setInterval(function() {
    server.update()
}, 1000)