const router = require("express").Router();
const {
  signup,
  login,
  me,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  forgotPassword,
  resetPassword,
} = require("../controllers/user.controller");
const { authenticate } = require("../middlewares/authenticate");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authenticate, me);
router.patch("/profile", authenticate, updateProfile);
router.get("/profile/addresses", authenticate, getAddresses);
router.post("/profile/addresses", authenticate, addAddress);
router.patch("/profile/addresses/:id", authenticate, updateAddress);
router.delete("/profile/addresses/:id", authenticate, deleteAddress);
router.patch("/profile/addresses/:id/default", authenticate, setDefaultAddress);

module.exports = router;