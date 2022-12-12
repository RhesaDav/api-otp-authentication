const express = require("express");
const {
  list,
  register,
  login,
  verify,
  resendOtp,
  logout,
} = require("../controllers/user.controller");
const userRouter = express.Router();

userRouter.get("/", list);
userRouter.post("/", register);
userRouter.post("/login", login);
userRouter.post("/verify", verify);
userRouter.post("/resend-otp", resendOtp);
userRouter.post('/logout', logout)

module.exports = userRouter;
