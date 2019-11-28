const stream = require("stream")

class PacketDecoder extends stream.Transform {
    constructor(options = {}) {
        super(options);

        this.splitter = new Buffer([0xFF, 0x69, 0xFF]);
        this.buffer = Buffer.alloc(0);
        this.inPacket = false;
        this.remPcktLength = -1;
    }

    _transform(chunk, encoding, cb) {
        while (chunk.length > 0) {
            if (this.inPacket) {
                if (this.remPcktLength < 0) {
                    this.remPcktLength = chunk[0] - 1; // get the size
                    chunk = chunk.slice(1, chunk.length);
                } else {
                    let bytes = Math.min(this.remPcktLength, chunk.length)
                    this.buffer = Buffer.concat([this.buffer, chunk.slice(0, bytes)])
                    chunk = chunk.slice(bytes, chunk.length);

                    this.remPcktLength = this.remPcktLength - bytes;

                    if (this.remPcktLength == 0) {
                        this.push(this.buffer);
                        this.buffer = chunk;

                        this.inPacket = false;

                    }
                }
            
            } else {
                let data = this.buffer + chunk;
                let pos = data.indexOf(this.splitter);

                if (pos != -1) {
                    this.inPacket = true;
                    this.buffer = Buffer.alloc(0)
                    this.remPcktLength = -1;

                    chunk = chunk.slice(pos + 3, chunk.length);

                } else {
                    this.buffer = data;
                    chunk = Buffer.alloc(0)
                }
            }
        }

        cb();
    }

    _flush(cb) {
        cb();
    }
}

module.exports = PacketDecoder;