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
            }
        },

        methods: {
            moment: function(d) {
                return moment(d)
            },

            update: function() {
                $.getJSON("/stats/data", function(data) {
                    Stats.stats.devices = parseInt(data.devices)
                    Stats.stats.aps = data.aps
                    Stats.stats.sessions = data.sessions
                    Stats.stats.connections = data.connections
                    Stats.stats.nodes = data.nodes
                })
            }
        }
    })


    Stats.update()

})
