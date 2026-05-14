const express = require("express");
const authRoutes = require("./routes/auth");
const apiRoutes  = require("./routes/api");

const app = express();
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
app.use("/api",  apiRoutes);

// Health check
app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`JWT Service running on port ${PORT}`);
    console.log("");
    console.log("Endpoints:");
    console.log("  POST /auth/login    — đăng nhập, nhận accessToken + refreshToken");
    console.log("  POST /auth/refresh  — đổi refreshToken → accessToken mới");
    console.log("  POST /auth/logout   — thu hồi refreshToken");
    console.log("  GET  /api/me        — [protected] thông tin user từ JWT");
    console.log("  GET  /api/admin     — [protected, admin only]");
});
