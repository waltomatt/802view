const fabric = require("fabric").fabric,
    oui = require("oui")

const draw = require("./draw.js"),
    Device = require("./device.js")

let DeviceInfo = fabric.util.createClass(fabric.Rect,{
    type: "DeviceInfo",
    device: null,
    lines: {},

    initialize: function(dev) {
        this.fill = "#1f1f1f"

        this.left = Math.random() * window.innerWidth
        this.top = Math.random() * window.innerHeight

        this.lockScalingX = true
        this.lockScalingY = true
        this.lockRotation = true

        this.updateDevice(dev)
    },

    updateDevice: function(dev) {
        this.device = dev
        this.oui = oui(this.device.mac)

        this.swidth = 15 + (5 * Object.keys(dev.connected).length)
        this.sheight = 15 + (5 * Object.keys(dev.connected).length)


        this.updateSize()
    },

    updateSize: function() {
        if (this.hovered) {
            this.set("width", 200)
            this.set("height", 175)
        } else {
            this.set("width", this.swidth)
            this.set("height", this.sheight)
        }

        draw.canvas.renderAll()
    },

    makeLine: function(dev2) {
        let line = new fabric.Line([
            this.left + this.swidth/2, 
            this.top + this.sheight/2, 
            dev2.left + dev2.swidth/2,
            dev2.top + dev2.sheight/2, 
        ], {
            fill: 'grey',
            stroke: 'grey',
            strokeWidth: 1,
            selectable: false,
            evented: false
        });

        let dev1 = this

        function doLineUpdate(e) {
            if (e.target == dev1) {
                line.set({
                    "x1": e.target.left + e.target.swidth/2,
                    "y1": e.target.top + e.target.sheight/2
                })
            } else if (e.target == dev2) {
                line.set({
                    "x2": e.target.left + e.target.swidth/2,
                    "y2": e.target.top + e.target.sheight/2
                })
            }
        }

        this.on("moving", doLineUpdate)
        dev2.on("moving", doLineUpdate)

        return line
    },  

    setHovered: function(hovered) {
        this.hovered = hovered
        this.updateSize()
    },

    _mousedown: function(e) {
        console.log("TEST!!!")
    },

    _render: function(ctx) {
        ctx.fillStyle = "#1f1f1f"
        
        if (this.hovered) {
            this.callSuper("_render", ctx)

            if (this.device) {

                ctx.font = "16px sans-serif"
                ctx.fillStyle = "#FFF"
            
                if (this.device.ap) {
                    ctx.fillText(this.device.ssid, - this.width/2 +10, -this.height/2 + 20)
                }

                ctx.fillText(this.device.mac, -this.width/2 + 10,  -this.height/2 + 40)

                if (this.oui) {
                    ctx.fillText(this.oui, -this.width/2 + 10, -this.height/2 + 60)
                }

                ctx.fillText((this.device.getRSSI(0) || "").toString() + "db", -this.width/2 + 10, -this.height/2 + 80)
            }
        } else {
            if (this.device.ap) {
                ctx.beginPath()
                ctx.arc(0, 0, this.width/2, 0, Math.PI * 2, true)
                ctx.closePath()
                ctx.fill()
            } else {
                ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height)
            }
        }
    }
})

module.exports = DeviceInfo