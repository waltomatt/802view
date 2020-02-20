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
                last_seen: new Date()
            },

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
                })
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
                Device.editLabel = false
            },

            update: function() {
                if (Device.device.mac) {
                    $.getJSON("/api/device/" + Device.device.mac, (data) => {
                        Device.device = data
                    })
                }
            }
        }
    })

    
})