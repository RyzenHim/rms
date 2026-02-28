const router = require("express").Router();
const { getPublicMenu, createCategory, createMenuItem } = require("../controllers/menu.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.get("/public", getPublicMenu);
router.post("/categories", authenticate, authorizeRoles("admin", "manager"), createCategory);
router.post("/items", authenticate, authorizeRoles("admin", "manager"), createMenuItem);

module.exports = router;
