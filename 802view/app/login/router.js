const express = require("express"),
    bcrypt = require("bcrypt")

const router = express.Router()

router.get("/", (req, res) => {
    res.render("login")
})

router.post("/", (req, res) => {
    let password = (req.body.password || "").toString()

    // yes, hardcoded password - I wouldn't do this in production but I want to put it on a live server and don't want everyone seeing my internal network
    if (bcrypt.compareSync(password, "$2b$10$zlruX4y72eDu82H/Hv2Qw.k/YsnB3QjSor4MO7gzgq2oA2EkaUkIO")) {
        req.session.authed = true
        res.redirect("/")
    } else {
        res.redirect("/login")
    }
})

module.exports = router