const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const { check, validationResult } = require("express-validator");

// @route   POST api/users/register
// @desc    Register user
// @access  Public
router.post(
  "/register",
  [
    check("name", "Please enter your name")
      .not()
      .isEmpty(),
    check("email", "Please enter a valid email address").isEmail(),
    check("password", "Password must be more than 5 characters").isLength({
      min: 5
    })
  ],
  async (req, res) => {
    const errros = validationResult(req);
    if (!errros.isEmpty()) {
      return res.status(400).json({ errros: errros.array() });
    }

    const { name, email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "Email already exists" });
      }
      user = new User({
        name,
        email,
        password
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

// @route   POST api/users/login
// @desc    Login user
// @access  Public

module.exports = router;
