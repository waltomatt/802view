let Notify

$(document).ready(function() {
    Notify = new Vue({
        el: "#notify",
        data: {
            alerts: [
    
            ]
        },

        methods: {
            moment: function(d) {
                return moment(d)
            },

            update: function() {
                $.getJSON("/alerts/active", (data) => {
                    Notify.alerts = data
                    $(".toast").toast({autohide: false}).toast("show")
                })
            },
            
            dismissAlert: function(id) {
                $.post("/alerts/dismiss", {id: id}, () => {
                    for (let i=0; i<Notify.alerts.length; i++) {
                        if (Notify.alerts[i].id == id)
                            Notify.alerts.splice(i, 1)
                    }
                })
            },

            openDevice: function(dev) {
                Device.set(dev)
                Device.open()
            }
        }
    })

    setInterval(Notify.update, 2000)
    Notify.update()
})
        

