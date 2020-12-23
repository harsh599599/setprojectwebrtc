const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    console.log("gsdgsdg");
    res.render("login");
});

router.post('/', (req, res) => {
    username = req.body.username
    res.render('video', { username: username })
})

module.exports = router;