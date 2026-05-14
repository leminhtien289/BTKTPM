const express = require("express");
const bcrypt = require("bcryptjs");
const { signAccessToken, signRefreshToken, verifyToken } = require("../utils/jwt");

const router = express.Router();

// ─── In-memory store ────────────────────────────────────────────────────────
// Thực tế dùng DB (Redis cho refresh token, SQL/NoSQL cho users)
const users = [
    {
        id: 1,
        username: "tien",
        // bcrypt hash của "12345678"
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        role: "admin",
    },
    {
        id: 2,
        username: "user",
        password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
        role: "user",
    },
];

// Lưu refresh token hợp lệ (key: token, value: userId)
const refreshTokenStore = new Map();

// ─── POST /auth/login ────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
    }

    const user = users.find((u) => u.username === username);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    // Tạo cặp token
    const accessToken  = signAccessToken({ userId: user.id, username: user.username, role: user.role });
    const refreshToken = signRefreshToken(user.id);

    // Lưu refresh token
    refreshTokenStore.set(refreshToken, user.id);

    res.json({
        accessToken,
        refreshToken,
        expiresIn: "15m",
    });
});

// ─── POST /auth/refresh ──────────────────────────────────────────────────────
router.post("/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken is required" });
    }

    // Kiểm tra refresh token có trong store không
    if (!refreshTokenStore.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid or revoked refresh token" });
    }

    try {
        const decoded = verifyToken(refreshToken);

        const user = users.find((u) => u.id === decoded.userId);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Cấp access token mới
        const newAccessToken = signAccessToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        res.json({ accessToken: newAccessToken, expiresIn: "15m" });

    } catch (err) {
        // Refresh token hết hạn → xóa khỏi store, buộc login lại
        refreshTokenStore.delete(refreshToken);
        return res.status(401).json({ error: "Refresh token expired, please login again" });
    }
});

// ─── POST /auth/logout ───────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        refreshTokenStore.delete(refreshToken); // Thu hồi refresh token
    }

    res.json({ message: "Logged out successfully" });
});

module.exports = router;
