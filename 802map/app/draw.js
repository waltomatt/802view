const fabric = require("fabric").fabric

exports.canvas = null

exports.init = function(sel) {
    let canvas = new fabric.Canvas(sel)
    
    canvas.setWidth(window.innerWidth)
    canvas.setHeight(window.innerHeight)

    canvas.on("mouse:over", function(e) {
        if (e.target)
            e.target.setHovered(true)
    })

    canvas.on("mouse:out", function(e) {
        if (e.target)
            e.target.setHovered(false)
    })

    exports.canvas = canvas
}