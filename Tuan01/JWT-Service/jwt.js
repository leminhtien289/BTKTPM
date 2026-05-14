const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(path.join(__dirname, "../keys/private.pem"));
const publicKey  = fs.readFileSync(path.join(__dirname, "../keys/public.pem"));

const ACCESS_TOKEN_EXPIRES  = "15m";
const REFRESH_TOKEN_EXPIRES = "7d";

// Tạo access token — chứa thông tin user, expire ngắn
const signAccessToken = (payload) => {
    return jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: ACCESS_TOKEN_EXPIRES,
    });
};

// Tạo refresh token — chỉ chứa userId, expire dài
const signRefreshToken = (userId) => {
    return jwt.sign({ userId }, privateKey, {
        algorithm: "RS256",
        expiresIn: REFRESH_TOKEN_EXPIRES,
    });
};

// Verify token bằng public key
const verifyToken = (token) => {
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
};

module.exports = { signAccessToken, signRefreshToken, verifyToken };
