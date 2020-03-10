let Alerts

$(document).ready(function() {
    Alerts = new Vue({
        el: "#alerts",

        data: {
            create: {
                name: "",
                on: "session-start",
                type: "mac",
                matches: true,
                org: false,
                mac: "",
                label: ""
            },

            current: {
                name: "test",
                list: []
            },

            list: []
        },

        methods: {
            moment: function(d) {
                return moment(d)
            },

            get: function() {
                $.getJSON("/alerts/list", function(res) {
                    Alerts.list = res

                    Alerts.list.sort((a, b) => {
                        return (a.active_count > b.active_count)
                    })
                })
            },

            createAlert: function(e) {
                e.preventDefault()

                $.post("/alerts/create", Alerts.create, function(res) {
                    if (res.status == "success") {
                        $("#create").modal("hide")
                        Alerts.get()
                    }
                })
            },

            showAlerts: function(alert) {
                Alerts.current.name = alert.name
                Alerts.current.id = alert.id

                $.getJSON("/alerts/list/" + alert.id + "?clear=true", (list) => {
                    Alerts.current.list = list

                    $("#show").modal("show")
                })
            },

            showDevice: function(dev) {
                $("#show").modal("hide")
                Device.set(dev)
                Device.open()
            }
        }
    })

    Alerts.get()
    setInterval(Alerts.get, 3000)
})
