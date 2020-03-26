let Manage

$(document).ready(function() {
    Manage = new Vue({
        el: "#manage",

        data: {
            showApiKey: false,
           nodes: [],
           edit: {
               new: true,
               node: {
                   id: false,
                   name: "",
                   secret: ""
               }
           }
        },

        methods: {
            getNodes: function() {
                $.getJSON("/manage/nodes/list", function(data) {
                    for (let i=0; i<data.length; i++) {
                        data[i].showKey = false
                    }

                    Manage.nodes = data
                })
            },

            revealKey: function(node) {
                node.showKey = true
            },

            editNode: function(node) {
                Manage.edit.new = false

                Manage.edit.node.id = node.id
                Manage.edit.node.name = node.name
                Manage.edit.node.secret = node.secret

                $("#node-edit").modal("show")
            },

            createNode: function() {
                Manage.edit.node.id = false
                Manage.edit.node.name = ""
                Manage.edit.node.secret = ""

                Manage.edit.new = true

                $("#node-edit").modal("show")
            },

            saveNode: function() {
                let endpoint = "/manage/nodes/new"
                if (!Manage.edit.new)
                    endpoint = "/manage/nodes/edit"

                $.post(endpoint, {
                    id: Manage.edit.node.id,
                    name: Manage.edit.node.name,
                    secret: Manage.edit.node.secret

                }, function() {
                    Manage.getNodes()
                    $("#node-edit").modal("hide")
                })
            },

            removeNode: function(id) {
                $.post("/manage/nodes/delete", {
                    id: id
                }, function() {
                    Manage.getNodes()
                })
            }
        }
    })

    Manage.getNodes()
})
