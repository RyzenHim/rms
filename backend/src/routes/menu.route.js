const router = require("express").Router();
const {
    getPublicMenu,
    getAdminMenuData,
    updateMenuPdf,
    createCategory,
    updateCategory,
    deleteCategory,
    createSubCategory,
    updateSubCategory,
    deleteSubCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
} = require("../controllers/menu.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.get("/public", getPublicMenu);
router.get("/admin-data", authenticate, authorizeRoles("admin", "manager"), getAdminMenuData);
router.put("/pdf", authenticate, authorizeRoles("admin"), updateMenuPdf);

router.post("/categories", authenticate, authorizeRoles("admin", "manager"), createCategory);
router.put("/categories/:id", authenticate, authorizeRoles("admin", "manager"), updateCategory);
router.delete("/categories/:id", authenticate, authorizeRoles("admin", "manager"), deleteCategory);

router.post("/sub-categories", authenticate, authorizeRoles("admin", "manager"), createSubCategory);
router.put("/sub-categories/:id", authenticate, authorizeRoles("admin", "manager"), updateSubCategory);
router.delete("/sub-categories/:id", authenticate, authorizeRoles("admin", "manager"), deleteSubCategory);

router.post("/items", authenticate, authorizeRoles("admin", "manager"), createMenuItem);
router.put("/items/:id", authenticate, authorizeRoles("admin", "manager"), updateMenuItem);
router.delete("/items/:id", authenticate, authorizeRoles("admin", "manager"), deleteMenuItem);

module.exports = router;
