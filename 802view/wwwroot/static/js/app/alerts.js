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
            }
        }
    })

    Alerts.get()
    setInterval(Alerts.get, 3000)
})
