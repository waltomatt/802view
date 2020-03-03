let Notify

$(document).ready(function() {
    Notify = new Vue({
        el: "#notify",
        data: {
            notifications: [
                {
                    img: "/static/img/icons/info.svg",
                    type: "info",
                    title: "Hi matt",
                    body: "You're cool!"
                }
            ]
        },

        methods: {
            moment: function(d) {
                return moment(d)
            }
        }
    })
})
        

/*
function CreateNotification(type, body) {
    let img = "/static/img/icons/"

    if (type ==  "info")
        img += "info.svg"
    else if (type == "error")
        img += "x.svg"
    else if (type == "alert")
        img += "bell.svg"


    
}   

*/