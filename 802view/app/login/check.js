const api_key = require("config.json").api_key 

function check(req, res, next) {
    if (req.session.authed)
        next()
    else {
        if (req.query.key && req.query.key == api_key) {
            next()
        } else {
            res.redirect("/login?r=" + req.originalUrl)
        }
    }
}

module.exports = check