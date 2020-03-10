$(document).ready(function() {

    setInterval(() => {
        $.getJSON("/alerts/list", (list) => {
            let activeCount = 0

            for (let i=0; i<list.length; i++) {
                activeCount += parseInt(list[i].active_count)
            }

            $("#active-alerts-count").text("(" + activeCount + ")")
        })
    }, 3000)


})