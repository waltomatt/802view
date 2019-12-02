const SerialPort = require("serialport"),
    PacketDecoder = require("@serialport/parser-delimiter"),
    stream = require("stream")


const header = new Buffer([0xFF, 0x60, 0x55])

const port = new SerialPort("/dev/ttyUSB0", {
    baudRate: 115200
})



const parser = port.pipe(new PacketDecoder({delimiter: header}))

parser.on("data", (data) => {

    let offset = 0;
    let obj = {}

    let size = data.readUInt8(offset++);

    if (size - header.length == data.length) { // basic size check for packet validation
        // might add a checksum at the end
        obj.size = size
        obj.sniffer_id = data.readUInt8(offset++)

        obj.device_id = data.readUInt16BE(offset)
        offset += 2

        obj.mac = data.toString("hex", offset, offset + 6)
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
        console.log(obj)
    }

})
