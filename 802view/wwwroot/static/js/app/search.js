let Search

$(document).ready(function() {
    Search = new Vue({
        el: "#search",

        data: {
            query: {
                type: "devices",
                search: "mac",
                search2: "mac",
                mac: "",
                mac2: "",
                org: -1,
                org2: -1,

                filter: {
                    min_date: false,
                    max_date: false,
                    ap: false,
                    node: []
                },

                sort: ""

            },

            page: 0,
            maxPage: 0,
            totalCount: 0,

            searchType: "",
            results: []
        },

        methods: {
            moment: function(d) {
                return moment(d)
            },

            search: function(e) {
                e.preventDefault()

                Search.page = 0
                Search.doSearch()
            },

            doSearch: function() {
                let data

                if (Search.query.type == "devices") 
                    data = Search.devices()
                else if (Search.query.type == "sessions")
                    data = Search.sessions()
                else if (Search.query.type == "connections")
                    data = Search.connections()

                data.page = Search.page

                $.getJSON("/search/" + Search.query.type + "?" + $.param(data), Search.onResults)
            },

            setPage(page) {
                page = Math.min(Search.maxPage, Math.max(0, page))
                this.page = page
                this.doSearch()
            },

            devices: function() {
                let query = {
                    search: Search.query.search,
                    only_ap: Search.query.filter.ap,
                    sort: Search.query.sort
                }

                if (Search.query.filter.min_date)
                    query.min_date = Search.query.filter.min_date.getTime() / 1000

                if (Search.query.filter.max_date)
                    query.max_date = Search.query.filter.max_date.getTime() / 1000


                if (Search.query.search == "mac")
                    query.mac = Search.query.mac
                else
                    query.org = Search.query.org

                return query
            },

            sessions: function() {
                let query = {
                    search: Search.query.search,
                    nodes: Search.query.filter.node.join(","),
                    sort: Search.query.sort
                }

                if (Search.query.filter.min_date)
                    query.min_date = Search.query.filter.min_date.getTime() / 1000

                if (Search.query.filter.max_date)
                    query.max_date = Search.query.filter.max_date.getTime() / 1000


                if (Search.query.search == "mac")
                    query.mac = Search.query.mac
                else
                    query.org = Search.query.org

                return query
            },

            connections: function() {
                let query = {
                    search: Search.query.search,
                    node: Search.query.filter.node,
                    sort: Search.query.sort
                }

                if (Search.query.filter.min_date)
                    query.min_date = Search.query.filter.min_date.getTime() / 1000

                if (Search.query.filter.max_date)
                    query.max_date = Search.query.filter.max_date.getTime() / 1000

                if (Search.query.search == "mac")
                    query.mac = Search.query.mac
                else
                    query.org = Search.query.org

                if (Search.query.search2 == "mac")
                    query.mac2 = Search.query.mac2
                else
                    query.org2 = Search.query.org2

                return query
            },

            onResults: function(data) {
                Search.searchType = data.type
                Search.results = data.results
                

                if (Search.results.length > 0) {
                    Search.totalCount = Search.results[0].count
                    Search.maxPage = Math.ceil(Search.results[0].count / 25)
                } else {
                    Search.totalCount = 0
                    Search.maxPage = 0
                }
            },

            openDevice: function(dev) {
                Device.set(dev)
                Device.open()
            }


        }
    })

    $(".manufacture-picker").selectpicker()
    $(".node-picker").selectpicker()
    
    setTimeout(function() {
        $(".node-picker").selectpicker("selectAll")
    }, 0)
    
    $("#filter-date").flatpickr({
        mode: "range",
        enableTime: true,
        maxDate: new Date(),
        onChange: function(date) {
            if (date.length == 1) {
                Search.query.filter.min_date = date[0]
                Search.query.filter.max_date = date[0]
            } else if (date.length == 2) {
                Search.query.filter.min_date = date[0]
                Search.query.filter.max_date = date[1]
            }
        }
    })
})
