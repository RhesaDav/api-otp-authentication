const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const mailSetting = {
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
};

const transporter = nodemailer.createTransport(mailSetting);

module.exports.list = async (req, res) => {
  try {
    const user = await User.find();
    return res.json(user);
  } catch (error) {
    console.log(error);
  }
};

module.exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!name || !email || !password) {
    return res.status(400).send({
      msg: 'please fill all field'
    })
  }
    const hashedPassword = await bcrypt.hash(password, 10);
    const checkEmail = await User.findOne({ email });
    if (checkEmail) {
      return res.status(404).send({
        msg: "email already registered"
      });
    }
    const otp = Math.floor(Math.random() * 1000000);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      otp,
      isVerified: false,
      isLocked: false,
      otpExpiredAt: new Date(Date.now() + 120000)
    });
    const token = jwt.sign({ user: user.email }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });
    const sendEmail = await transporter.sendMail({
      from: mailSetting.auth.user,
      to: email,
      subject: "Registration Complete",
      html: `      <div
      class="container"
      style="max-width: 90%; margin: auto; padding-top: 20px"
    >
      <h2>Thanks to join</h2>
      <p style="margin-bottom: 30px;">Pleas enter the sign up OTP to get started</p>
      <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${otp}</h1>
 </div>`,
    });
    if (sendEmail) {
      return res.status(200).send({
        user: user,
        token: token,
      });
    } else {
      return res.status(404).send({
        msg: "register failed",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send({
        msg: "email invalid",
      });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(404).send({
        msg: "password invalid",
      });
    }

    if (checkPassword && user) {
      const token = jwt.sign({ user: user.email }, process.env.SECRET_KEY, {
        expiresIn: "24h",
      });
      await transporter
        .sendMail({
          from: mailSetting.auth.user,
          to: email,
          subject: "OTP for login",
          html: `      <div
        class="container"
        style="max-width: 90%; margin: auto; padding-top: 20px"
      >
        <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${user.otp}</h1>
   </div>`,
        })
        .then(() => {
          return res.status(200).send({
            msg: "otp sended",
          });
        })
        .catch((err) => {
          return res.status(404).send(err);
        });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.verify = async (req, res) => {
  const { email, otp } = req.body;
  if(!email || !otp) {
    return res.status(400).send({
      msg: 'please fill this field'
    })
  }
  const user = await User.findOne({ email });
  if (user) {
    if (user.isLocked === true) {
      return res.status(400).send({
        msg: 'account locked, contact admin'
      })
    }
    if (user.otpExpiredAt > new Date()) {
      if (otp == user.otp) {
        const token = jwt.sign({ user: user.email }, process.env.SECRET_KEY, {
          expiresIn: "24h",
        });
        user.isVerified = true;
        user.otpFailedLogin = 0;
        await user.save();
        return res.status(200).send({ user, token });
      } else {
        if (user.otpFailedLogin >= 3) {
          user.isLocked = true;
          await user.save();
          return res.status(400).send({
            msg: "account locked",
          });
        } else {
          user.otpFailedLogin += 1;
          await user.save();
          return res.status(400).send({
            msg: "invalid otp",
          });
        }
      }
    } else {
      res.status(400).send({
        msg: 'otp expired'
      })
    }
  } else {
    res.status(400).send({
      msg: "invalid email",
    });
  }
};

module.exports.resendOtp = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    if (user.isLocked === true) {
      return res.status(400).send({
        msg: 'account locked, contact admin'
      })
    }
    const otp = Math.floor(Math.random() * 1000000).toString();
    user.otp = otp;
    user.otpExpiredAt = new Date(Date.now() + 120000)
    user.save();
    await transporter.sendMail({
      from: mailSetting.auth.user,
      to: email,
      subject: "OTP for login",
      html: `      <div
      class="container"
      style="max-width: 90%; margin: auto; padding-top: 20px"
    >
      <h1 style="font-size: 40px; letter-spacing: 2px; text-align:center;">${otp}</h1>
 </div>`,
    });
    res.status(200).send({ user });
  } else {
    res.status(400).send({
      msg: "email not found",
    });
  }
};

module.exports.logout = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    user.isVerified = false;
    user.save();
    res.status(200).send({
      msg: "user logout",
    });
  } else {
    res.status(400).send({
      msg: "email not found",
    });
  }
};
