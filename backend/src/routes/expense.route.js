const express = require("express");
const expenseController = require("../controllers/expense.controller");
const { authenticate } = require("../middlewares/authenticate");
const { authorizeRoles } = require("../middlewares/authorize");

const router = express.Router();

router.get("/", authenticate, authorizeRoles("admin", "manager", "cashier"), expenseController.getExpenses);
router.post("/", authenticate, authorizeRoles("admin", "manager", "cashier"), expenseController.createExpense);
router.put("/:id", authenticate, authorizeRoles("admin", "manager", "cashier"), expenseController.updateExpense);
router.delete("/:id", authenticate, authorizeRoles("admin", "manager"), expenseController.deleteExpense);

module.exports = router;
