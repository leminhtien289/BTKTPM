const express = require("express");
const { authenticate } = require("../middlewares/authenticate");

const router = express.Router();

// GET /api/me — trả thông tin user từ JWT claims
router.get("/me", authenticate, (req, res) => {
    res.json({
        message: "Authenticated successfully",
        user: {
            userId:   req.user.userId,
            username: req.user.username,
            role:     req.user.role,
        },
        tokenIssuedAt: new Date(req.user.iat * 1000).toISOString(),
        tokenExpiresAt: new Date(req.user.exp * 1000).toISOString(),
    });
});

// GET /api/admin — chỉ role admin mới vào được
router.get("/admin", authenticate, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden: admin only" });
    }
    res.json({ message: "Welcome, admin!", user: req.user });
});

module.exports = router;
