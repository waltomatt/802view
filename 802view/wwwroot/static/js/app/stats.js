let Stats

$(document).ready(function() {
    Stats = new Vue({
        el: "#stats",

        data: {
            stats: {
                devices: 0,
                aps: 0,
                sessions: 0,
                connections: 0,
                nodes: 0
            },

            selectedNode: "all",
            nodes: [],
            nodeGraphData: []
        },

        methods: {
            moment: function(d) {
                return moment(d)
            },

            updateStats: function() {
                $.getJSON("/stats/data?node=" + Stats.selectedNode, function(data) {
                    Stats.stats.devices = parseInt(data.devices)
                    Stats.stats.aps = data.aps
                    Stats.stats.sessions = data.sessions
                    Stats.stats.connections = data.connections
                    Stats.stats.nodes = data.nodes
                    Stats.stats.active_devices = data.active_devices
                    Stats.stats.active_aps = data.active_aps
                    Stats.stats.active_connections = data.active_connections
                })
                
                $.getJSON("/stats/graph?node=" + Stats.selectedNode, (data) => {
               
                    let graphData = []
                    for (let i=0; i<data.length; i++) {
                        graphData.push({
                            x: new Date(data[i].x), 
                            y: parseInt(data[i].y)
                        })
                    }

                    let options = {
                        series: [{
                            name: 'Devices',
                            data: graphData
                        }],

                        chart: {
                            type: 'area',
                            stacked: false,
                            height: 350,
                            zoom: {
                                type: 'x',
                                enabled: true,
                                autoScaleYaxis: true
                            },
                            toolbar: {
                                autoSelected: 'zoom'
                            }
                        },

                        stroke: {
                            width: 1
                        },

                        dataLabels: {
                            enabled: false
                        },
                        markers: {
                            size: 0,
                        },
                    
                
                        xaxis: {
                            type: 'datetime',
                        },
                        tooltip: {
                            shared: false,
                            x: {
                                show: true,
                                format: "dd/MM/yyyy HH:MM"
                            }
                        }
                    }

                    if (Stats.deviceGraph) {
                        Stats.deviceGraph.destroy()
                    }
                      
                    Stats.deviceGraph = new ApexCharts($("#device-time-graph")[0], options)
                    Stats.deviceGraph.render()
                })

                $.getJSON("/stats/heatmap?node=" + Stats.selectedNode, drawHeatmap)
            },


            update: function() {
                $.getJSON("/api/graph/nodes", function(data) {
                    const nodes = data.nodes
                    for (let i=0; i<nodes.length; i++)
                        Stats.nodes.push(nodes[i])
                })

                Stats.updateStats()
            }
        }
    })


    Stats.update()

})

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function drawHeatmap(data) {
    let array = data.array
    array = array.map(function(row, index) {
        return {
            name: ("0" + index).substr(-2) + ":00",
            data: row.map(function(d, dindex) {
                return {
                    x: days[dindex],
                    y: d
                }
            })
        }
    })
    array = array.reverse()

    if (Stats.busyMap)
        Stats.busyMap.destroy()

    let options = {
        series: array,
        chart: {
            type: "heatmap",
            height:350
        },
        dataLabels: {
            enabled: false
        },
        tooltip: {
            enabled: false
        },
        plotOptions: {
            heatmap: {
                colorScale: {
                    ranges: [
                        {
                            from: -999,
                            to: 0.75,
                            color: "#28a745",
                            name: "quiet"
                        },
                        {
                            from: 0.75,
                            to: 1.25,
                            color: "#007bff",
                            name: "normal"
                        },
                        {
                            from: 1.25,
                            to: 2.5,
                            color: "#ffc107",
                            name: "busy"
                        },
                        {
                            from: 2.5,
                            to: 100,
                            color: "#dc3545",
                            name: "very busy"
                        }
                    ]
                }
            }
        }
    }

    Stats.busyMap = new ApexCharts($("#busy-map-graph")[0], options)
    Stats.busyMap.render()
}
