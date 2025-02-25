const express = require("express");
const passport = require("passport");

const router = express.Router();

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:3000/login"
  }),
  (req, res) => {
    res.redirect(
      `http://localhost:3000?user=${encodeURIComponent(
        JSON.stringify(req.user)
      )}`
    );
  }
);

router.get("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).send("Error logging out");
    res.redirect("http://localhost:3000");
  });
});

module.exports = router;
