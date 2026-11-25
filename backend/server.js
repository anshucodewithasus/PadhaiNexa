
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
require("dotenv").config();

const app = express();
const routes = require("./routes");
console.log("Loaded API routes:");
console.log(
    routes.stack
        .filter(item => item.route)
        .map(item => item.route.path)
);

const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
    origin: "http://127.0.0.1:5500",
    credentials: true
}));

app.use(express.json());

// Session configuration
app.use(session({
    store: new SQLiteStore({
        db: "sessions.sqlite",
        dir: __dirname
    }),
    secret: process.env.SESSION_SECRET || "padhainexa-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
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

// API routes
app.get("/api/check", (req, res) => {
    res.json({
        success: true,
        message: "API routing is working!"
    });
});
app.use("/api", (req, res, next) => {
    console.log("API REQUEST RECEIVED:", req.method, req.originalUrl);
    next();
});
app.use("/api", routes);

// Start server
app.listen(PORT, () => {
    console.log(`PadhaiNexa Server running at http://localhost:${PORT}`);
});
