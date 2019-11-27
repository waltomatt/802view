const SerialPort = require("serialport")

const port = new SerialPort("/dev/ttyUSB0", {
    baudRate: 9600
});

port.on("data", function(data) {
    console.log(data.length, data.toString("hex"));
});