const router = require("express").Router();
const {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
} = require("../controllers/employee.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

router.get("/", authenticate, authorizeRoles("admin"), getEmployees);
router.post("/", authenticate, authorizeRoles("admin"), createEmployee);
router.put("/:id", authenticate, authorizeRoles("admin"), updateEmployee);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteEmployee);

module.exports = router;
