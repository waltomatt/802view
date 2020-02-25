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
                node: []
            },

            nodes: [],

            history: [],

            editLabel: false
        },

        methods: {
            moment: function(date) {
                return moment(date)
            },

            set: function(deviceID, history) {
                if (history)
                    Device.history.push(Device.device.mac)

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
                        if (!Device.editLabel) {
                            Device.device = data
                        }
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
            }
        }
    })

    setInterval(Device.update, 1000)
    Device.updateNodes()
})