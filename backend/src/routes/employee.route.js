const router = require("express").Router();
const {
    getEmployees,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
    restoreEmployee,
    deleteEmployee,
} = require("../controllers/employee.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.get("/", authenticate, authorizeRoles("admin", "manager"), getEmployees);
router.post("/", authenticate, authorizeRoles("admin", "manager"), createEmployee);
router.put("/:id", authenticate, authorizeRoles("admin", "manager"), updateEmployee);
router.patch("/:id/status", authenticate, authorizeRoles("admin", "manager"), updateEmployeeStatus);
router.patch("/:id/restore", authenticate, authorizeRoles("admin", "manager"), restoreEmployee);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), deleteEmployee);

module.exports = router;
