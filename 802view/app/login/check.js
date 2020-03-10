function check(req, res, next) {
    if (req.session.authed)
        next()
    else
        res.redirect("/login")
}

module.exports = check