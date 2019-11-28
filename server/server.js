const SerialPort = require("serialport"),
    PacketDecoder = require("@serialport/parser-delimiter"),
    stream = require("stream")


const port = new SerialPort("COM7", {
    baudRate: 115200
})


const parser = port.pipe(new PacketDecoder({delimiter: new Buffer([0xFF, 0x60, 0x55])}))

parser.on("data", (data) => {

    let offset = 0;

    let obj = {}

    obj.size = data.readUInt8(offset++)

    obj.sniffer_id = data.readUInt8(offset++)
    obj.device_id = data.readUInt16BE(offset+= 2)

    obj.mac = data.toString("hex", offset, offset + 6)
    offset += 6

    obj.rssi_total = data.readUInt16BE(offset += 2)
    obj.rssi_count = data.readUInt8(offset++)

    obj.is_ap = (data.readUInt8(offset++) == 1)
    obj.device_count = (data.readUInt8(offset++))

    if (obj.is_ap) {
        obj.ssid = data.toString("ascii", offset, offset + 32)
        offset += 32
    }

    console.log(obj)
})
