let Graph

$(document).ready(function() {
    
    Graph = new Vue({
        el: ".graph",
        
        data: {
            view: "network",
            graphEndpoint: "nodes",
            selectedNode: {},
            selectedDevice: {}
        },

        methods: {
            moment: function(date) {
                return moment(date)
            }
        }
    })

    initGraph()
    initNetworkView()

    setInterval(getNodeDetails, 1000)
    setInterval(updateGraph, 1000)

    $("#graph-control-back").click((e) => {
        e.preventDefault()

        if (Graph.view == "node") {
            Graph.selectedDevice = {}
            initNetworkView()
        }
    })
})

function initGraph() {
    Graph.nodeDataSet = new vis.DataSet([])
    Graph.edgeDataSet = new vis.DataSet([])

    Graph.network = new vis.Network($(".graph-container")[0], {
        nodes: Graph.nodeDataSet,
        edges: Graph.edgeDataSet
    }, {})

    Graph.network.on("selectNode", (obj) => {
        let nodeID = obj.nodes[0]

        if (Graph.view == "network") {
            Graph.selectedNode.id = nodeID
            getNodeDetails()
        }

        if (Graph.view == "node") {
            Graph.selectedDevice.id = nodeID
            getDeviceDetails()
        }
    })

    Graph.network.on("doubleClick", (obj) => {
        console.log("DOUBLE CLICK")
        if (obj.nodes.length) {
            let nodeID = obj.nodes[0]

            if (Graph.view == "network") {
                Graph.selectedNode.id = nodeID
                initNodeView(nodeID)
            }
        }
    })
}

function initNetworkView() {
    Graph.view = "network"
    Graph.graphEndpoint = "nodes"
    $.getJSON("/api/graph/nodes", (json) => {
    
        let nodes = []

        Graph.nodeDataSet.clear()

        for (let i=0; i<json.nodes.length; i++) {
            let node = json.nodes[i]

            // set vis.js specific properties here
            node.shape = "circle"

            Graph.nodeDataSet.add(node)
        }
    })
}

function initNodeView(nodeID) {
    $.getJSON("/api/graph/devices/" + nodeID, (json) => {
        Graph.view = "node"
        Graph.graphEndpoint = "devices/" + nodeID

        Graph.nodeDataSet.clear()

        for (let i=0; i<json.nodes.length; i++) {
            let node = json.nodes[i]

            // set vis.js specific properties here
            if (node.is_ap)
                node.shape = "box"
            else
                node.shape = "circle"

            Graph.nodeDataSet.add(node)
        }

        Graph.edgeDataSet.clear()

        for (let i=0; i<json.edges.length; i++) {
            Graph.edgeDataSet.add(json.edges[i])
        }

    })
}

function updateGraph() {
    $.getJSON("/api/graph/" + Graph.graphEndpoint, (json) => {
        console.log(json)

        for (let i=0; i<json.nodes.length; i++) {
            Graph.nodeDataSet.update(json.nodes[i])
        }

        if (json.edges) {
            for (let i=0; i<json.edges.length; i++) {
                Graph.edgeDataSet.update(json.edges[i])
            }
        }
    })
}

function getNodeDetails() {
    if (Graph.selectedNode && Graph.selectedNode.id) {
        $.getJSON("/api/node/" + Graph.selectedNode.id, (json) => {
            Graph.selectedNode = json
        })
    }
}

function getDeviceDetails() {
    if (Graph.selectedDevice && Graph.selectedDevice.id) {
        $.getJSON("/api/device/" + Graph.selectedDevice.id, (json) => {
            Graph.selectedDevice = json
        })
    }
}