
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
require("dotenv").config();

const app = express();
const routes = require("./routes");

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// Render HTTPS proxy
if (isProduction) {
    app.set("trust proxy", 1);
}

// Allowed frontend origins
const allowedOrigins = [
    "https://sprightly-stardust-f4232f.netlify.app",
    "http://127.0.0.1:5500",
    "http://localhost:5500"
];

// CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
    store: new SQLiteStore({
        db: "sessions.sqlite",
        dir: __dirname
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to PadhaiNexa Backend!");
});

// Test API
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "PadhaiNexa Backend is working!"
    });
});

// API check
app.get("/api/check", (req, res) => {
    res.json({
        success: true,
        message: "API routing is working!"
    });
});

// API request logging
app.use("/api", (req, res, next) => {
    console.log("API REQUEST RECEIVED:", req.method, req.originalUrl);
    next();
});

// Load API routes
app.use("/api", routes);

// Start server
app.listen(PORT, () => {
    console.log(`PadhaiNexa Server running on port ${PORT}`);
});
