const router = require('express').Router()
const { signup } = require('../controllers/user.controller')
router.post('/signup', signup)


module.exports = router