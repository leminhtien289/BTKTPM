const { verifyToken } = require("../utils/jwt");

const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // Gắn thông tin user vào request
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Access token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = { authenticate };
