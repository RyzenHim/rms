const router = require("express").Router();
const { getActiveTheme, upsertTheme } = require("../controllers/theme.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.get("/active", getActiveTheme);
router.put("/active", authenticate, authorizeRoles("admin"), upsertTheme);

module.exports = router;
