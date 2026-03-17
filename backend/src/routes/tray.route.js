const router = require("express").Router();
const trayController = require("../controllers/tray.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.use(authenticate, authorizeRoles("customer"));

router.get("/", trayController.getTray);
router.put("/", trayController.replaceTray);
router.delete("/", trayController.clearTray);
router.delete("/items/:menuItemId", trayController.removeTrayItem);

module.exports = router;
