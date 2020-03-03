let Device

$(document).ready(function() {
    Device = new Vue({
        el: "#device-modal",

        data: {
            device: {
                mac: "",
                label: "A device",
                is_ap: true,
                organisation: "Huahauawuei Cn",
                first_seen: new Date(),
                last_seen: new Date(),
                node: [],
                connections: []
            },

            selectedSession: {
                id: null,
                node: null,
                start: null,
                end: null,
                connections: []
            },

            nodes: [],

            history: [],
            sessionHistory: [],

            editLabel: false
        },

        methods: {
            moment: function(date) {
                return moment(date)
            },

            momentutc: function(d) {
                return moment.utc(d)
            },

            set: function(deviceID, history) {
                if (history) {
                    Device.history.push(Device.device.mac)
                    Device.sessionHistory.push(Device.selectedSession.id)
                }


                Device.selectedSession = {}

                $.getJSON("/api/device/" + deviceID, (data) => {
                    Device.device = data
                    Device.initTimeline()
                })

                Device.updateNodes()
            },

            back: function() {
                let mac = Device.history.pop()
                if (mac) {
                    Device.set(mac)
                }

                let session = Device.sessionHistory.pop()
                if (session) {
                    Device.selectedSession.id = session
                    Device.updateSession()
                }
            },

            open: function() {
                $("#device-modal").modal("show")
                Device.history = []
            },

            saveLabel: function() {
                let label = $("#label-input").val()

                $.post("/api/device/label", {
                    device: Device.device.mac,
                    label: label
                }, (res) => {
                    Device.editLabel = false
                })
            },

            update: function() {
                if (Device.device.mac && $("#device-modal").is(":visible")) {
                    $.getJSON("/api/device/" + Device.device.mac, (data) => {
                        let connections = []
                        for (let i=0; i<data.connections.length; i++) {
                            const con = data.connections[i]
                            let connection = {}

                            if (con.src == data.mac) {
                                connection.device = con.dst
                                connection.tx_packets = con.up_packets
                                connection.tx_bytes = con.up_data
                                connection.rx_packets = con.down_packets
                                connection.rx_bytes = con.down_data
                            } else {
                                connection.device = con.src
                                connection.tx_packets = con.down_packets
                                connection.tx_bytes = con.down_data
                                connection.rx_packets = con.up_packets
                                connection.rx_bytes = con.up_data
                            }

                            console.log(connection)
                            connections.push(connection)
                        }

                        if (!Device.editLabel) {
                            Device.device = data
                            
                        }

                        Device.device.connections = connections
                    })
                }
            },

            initTimeline: function() {
                if (Device.timeline)
                    Device.timeline.destroy()

                $.getJSON("/api/device/" + Device.device.mac + "/sessions", (data) => {
                    let sessions = []
                    for (let i=0; i<data.sessions.length; i++) {
                        let session = {
                            content: data.sessions[i].node_name,
                            id: data.sessions[i].id,
                            start: new Date(data.sessions[i].start),
                            group: data.sessions[i].node
                        }

                        if (!data.sessions[i].active)
                            session.end = new Date(data.sessions[i].end)

                        sessions.push(session)
                    }

                    Device.timelineDataSet = new vis.DataSet(sessions)
                    Device.timeline = new vis.Timeline($(".device-timeline")[0], Device.timelineDataSet, {
                        start: new Date(data.start),
                        end: new Date(data.end),
                        margin: {
                            axis: 20,
                            item: {
                                horizontal:0,
                                vertical:10
                            }
                        },
                        align: "left"
                    })

                    Device.timeline.on("select", (prop) => {
                        if (prop.items && prop.items[0]) {
                            Device.selectedSession.id = prop.items[0]
                            Device.updateSession()
                        }
                    })
                })
            },

            updateNodes: function() {
                $.getJSON("/api/graph/nodes", (data) => {
                    const nodes = data.nodes
                    for (let i=0; i<nodes.length; i++) {
                        Device.nodes[nodes[i].id] = nodes[i].label
                    }
                })
            },

            updateSession: function() {
                $.getJSON("/api/session/" + Device.selectedSession.id, (data) => {
                    Device.selectedSession = {
                        id: data.id,
                        node: data.node,
                        start: data.start,
                        end: data.end,
                        active: data.active
                    }

                    let devices = []
                    for (let i=0; i<data.connections.length; i++) {
                        if (devices.indexOf(data.connections[i].src) == -1 && data.connections[i].src != data.device)
                            devices.push(data.connections[i].src)
                        
                        if (devices.indexOf(data.connections[i].dst) == -1 && data.connections[i].dst != data.device)
                            devices.push(data.connections[i].dst)
                    }

                    Device.selectedSession.connections = devices

                })
            }
        }
    })

    setInterval(Device.update, 1000)
    Device.updateNodes()
})