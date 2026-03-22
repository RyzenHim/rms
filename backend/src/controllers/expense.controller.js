const Expense = require("../models/expense.model");

exports.getExpenses = async (req, res) => {
  try {
    const { startDate = "", endDate = "", category = "" } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    const expenses = await Expense.find(query)
      .populate("createdBy", "name roles")
      .sort({ expenseDate: -1, createdAt: -1 });

    const summary = expenses.reduce(
      (acc, expense) => {
        acc.total += Number(expense.amount || 0);
        acc.count += 1;
        acc.categories[expense.category] = (acc.categories[expense.category] || 0) + Number(expense.amount || 0);
        return acc;
      },
      { total: 0, count: 0, categories: {} }
    );

    return res.status(200).json({ expenses, summary });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const category = String(req.body.category || "").trim();
    const amount = Number(req.body.amount);

    if (!title || !category || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Title, category, and a valid amount are required" });
    }

    const expense = await Expense.create({
      title,
      category,
      amount,
      expenseDate: req.body.expenseDate || new Date(),
      notes: String(req.body.notes || "").trim(),
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({ message: "Expense created", expense });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const title = String(req.body.title || "").trim();
    const category = String(req.body.category || "").trim();
    const amount = Number(req.body.amount);

    if (!title || !category || !Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: "Title, category, and a valid amount are required" });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title,
        category,
        amount,
        expenseDate: req.body.expenseDate || new Date(),
        notes: String(req.body.notes || "").trim(),
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.status(200).json({ message: "Expense updated", expense });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    return res.status(200).json({ message: "Expense deleted" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
