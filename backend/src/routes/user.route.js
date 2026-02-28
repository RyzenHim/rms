const router = require("express").Router();
const { signup, login, me } = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/authenticate");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, me);

module.exports = router;
