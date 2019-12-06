const SerialPort = require("serialport"),
    SerialParser = require("@serialport/parser-delimiter")

const data = require("./data.js"),
    config = require("./../config.json")


exports.listen = function() {
    const port = new SerialPort(config.port, {
        baudRate: config.baudRate
    })

    const parser = port.pipe(new SerialParser({delimiter: data.header}))

    parser.on("data", (packet) => {
        data.handlePacket(packet)
    })
}