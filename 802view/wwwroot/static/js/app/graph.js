let Graph

$(document).ready(function() {
    
    Graph = new Vue({
        el: ".graph",
        
        data: {
            view: "network",
            date: false,
            live: true,
            graphEndpoint: "nodes",
            selectedNode: {},
            selectedDevice: {
                first_seen: new Date(),
                last_seen: new Date(),
                connections: []
            },
            lastUpdate: new Date(),

            nodes: [],
            edges: []
        },

        methods: {
            moment: function(date) {
                return moment(date)
            },

            updateConnections: function() {
                let dev = Graph.selectedDevice.id
                let connections = []
                let edges = Graph.network.getConnectedEdges(dev)

                for (let i=0; i<edges.length; i++) {
                    let edge = Graph.edgeDataSet.get(edges[i])
                    let connection = {}

                    if (edge.from == dev) {
                        connection.device = Graph.nodeDataSet.get(edge.to)
                        connection.packets_tx = edge.up_packets
                        connection.packets_rx = edge.down_packets
                        connection.bytes_tx = edge.up_data
                        connection.bytes_rx = edge.down_data
                    } else {
                        connection.device = Graph.nodeDataSet.get(edge.from)
                        connection.packets_tx = edge.down_packets
                        connection.packets_rx = edge.up_packets
                        connection.bytes_tx = edge.down_data
                        connection.bytes_rx = edge.up_data
                    }

                    connections.push(connection)
                }

                Graph.selectedDevice.connections = Object.assign([], [], connections)
            },

            openDevice: function(dev) {
                Device.set(dev)
                Device.open()
            },

            initNodeGraph: function() {
                Graph.nodeGraphDataSet = new vis.DataSet([])
                let groups = new vis.DataSet()
                groups.add({
                    id: 1,
                    content: "Devices"
                })


                Graph.nodeGraph = new vis.Graph2d($("#node-graph")[0], Graph.nodeGraphDataSet, groups,{
                    start: moment().subtract(1, "days")._d,
                    end: new Date(),
                    drawPoints: false,
                    graphHeight: 200,
                    max: new Date(),
                    dataAxis: {
                        left: {
                            title: {
                                text: "Devices"
                            }
                        }
                    }
                })
            },

            updateNodeGraph: function() {
                Graph.nodeGraphDataSet.clear()
                $.getJSON("/api/graph/node/" + Graph.selectedNode.id, (data) => {
                    for (let i=0; i<data.length; i++) {
                        Graph.nodeGraphDataSet.add({
                            x: new Date(data[i].date),
                            y: data[i].value,
                            group: 1
                        })
                    }
                })
            }
        }
    })

    initGraph()
    initNetworkView()
    Graph.initNodeGraph()

    setInterval(getNodeDetails, 1000)
    setInterval(getDeviceDetails, 1000)
    setInterval(updateGraph, 1000)

    $("#graph-control-back").click((e) => {
        e.preventDefault()

        if (Graph.view == "node") {
            Graph.selectedDevice = {}
            initNetworkView()
        }
    })

    $("#live-toggle").click(function (e) {
        if (Graph.live) {
            Graph.live = false

            $("#graph-control-date")[0]._flatpickr.setDate(new Date(), true)
            
            $(this).removeClass("btn-success")
            $(this).addClass("btn-secondary")
            
        } else {
            Graph.live = true
            Graph.date = false

            Graph.nodeDataSet.clear()
            Graph.edgeDataSet.clear()

            initNodeView()

            $(this).addClass("btn-success")
            $(this).removeClass("btn-secondary")
            
        }
    })

    $("#device-label").keydown((e) => {
        console.log(e.keyCode)
    })

    $("#graph-control-date").flatpickr({
        enableTime: true,
        maxDate: new Date(),
        onChange: function(date) {
            Graph.date = date[0]
            initNodeView()
        }
    })

    $("[data-tooltip='tooltip']").tooltip()
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
            Graph.updateNodeGraph()
            getNodeDetails()
        }

        if (Graph.view == "node") {
            Graph.selectedDevice.id = nodeID
            getDeviceDetails()
        }
    })

    Graph.network.on("doubleClick", (obj) => {
        if (obj.nodes.length) {
            let nodeID = obj.nodes[0]

            if (Graph.view == "network") {
                Graph.selectedNode.id = nodeID
                initNodeView()
            } else if (Graph.view == "node") {
                Device.set(nodeID)
                Device.open()
            }
        }
    })
}

function initNetworkView() {
    Graph.view = "network"
    Graph.graphEndpoint = "nodes"
    Graph.selectedDevice = {
        first_seen: new Date(),
        last_seen: new Date(),
        connections: []
    }

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

function initNodeView() {
    let path = "/api/graph/devices/" + Graph.selectedNode.id
    if (Graph.date) {
        path += ("?date=" + parseInt(Graph.date.getTime() / 1000))
    }

    $.getJSON(path, (json) => {
        Graph.lastUpdate = new Date()
        Graph.view = "node"
        Graph.graphEndpoint = "devices/" + Graph.selectedNode.id

        Graph.nodeDataSet.clear()

        Graph.nodes = []
        Graph.edges = []

        for (let i=0; i<json.nodes.length; i++) {
            let node = json.nodes[i]
            Graph.nodes.push(node.id)

            // set vis.js specific properties here
            if (node.is_ap)
                node.shape = "circle"
            else
                node.shape = "box"

            Graph.nodeDataSet.add(node)
        }

        Graph.edgeDataSet.clear()

        for (let i=0; i<json.edges.length; i++) {
            Graph.edges.push(json.edges[i].id)
            Graph.edgeDataSet.add(json.edges[i])
        }

    })
}

function updateGraph() {
    // we don't need to update when viewing historical
    if (!Graph.live) return

    let path = "/api/graph/ " + Graph.graphEndpoint
    if (Graph.date) {
        path += ("?date=" + Graph.date)
    }

    $.getJSON("/api/graph/" + Graph.graphEndpoint, (json) => {
        Graph.lastUpdate = new Date()
        
        let newNodes = []
        let newEdges = []

        for (let i=0; i<json.nodes.length; i++) {
            Graph.nodes.splice(Graph.nodes.indexOf(json.nodes[i].id), 1)
            newNodes.push(json.nodes[i].id)
            Graph.nodeDataSet.update(json.nodes[i])
        }

        // clear old nodes
        for (let i=0; i<Graph.nodes.length; i++) {
            Graph.nodeDataSet.remove(Graph.nodes[i])
        }

        Graph.nodes = newNodes

        if (json.edges) {
            for (let i=0; i<json.edges.length; i++) {
                Graph.edges.splice(Graph.edges.indexOf(json.edges[i].id), 1)
                newEdges.push(json.edges[i].id)
                Graph.edgeDataSet.update(json.edges[i])
            }

            // Clear edges that we don't see anymore
            for (let i=0; i<Graph.edges.length; i++) {
                Graph.edgeDataSet.remove(Graph.edges[i])
            }

            Graph.edges = newEdges
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
        let path = "/api/device/" + Graph.selectedDevice.id + "?node=" + Graph.selectedNode.id
        if (Graph.date) 
            path += "&date=" + (Graph.date.getTime()/1000)

        $.getJSON(path, (json) => {
            Graph.selectedDevice = Object.assign({}, Graph.selectedDevice, json)
            Graph.updateConnections(Graph.selectedDevice.id)
        })
    }
}