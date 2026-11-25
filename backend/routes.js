
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("./database");

const router = express.Router();

// ===============================
// 1. STUDENT REGISTRATION
// ===============================
router.post("/register", async (req, res) => {
    const { name, email, mobile, password } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof mobile !== "string" ||
        typeof password !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !mobile.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required!"
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email!"
        });
    }

    if (!/^[0-9]{10}$/.test(cleanMobile)) {
        return res.status(400).json({
            success: false,
            message: "Mobile number must be 10 digits!"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters!"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        db.run(
            `INSERT INTO students (name, email, mobile, password)
             VALUES (?, ?, ?, ?)`,
            [cleanName, cleanEmail, cleanMobile, hashedPassword],
            function (error) {
                if (error) {
                    if (error.message.includes("UNIQUE")) {
                        return res.status(409).json({
                            success: false,
                            message: "Email already registered!"
                        });
                    }

                    console.error("Registration Error:", error);

                    return res.status(500).json({
                        success: false,
                        message: "Registration failed!"
                    });
                }

                res.status(201).json({
                    success: true,
                    message: "Student registered successfully!",
                    student: {
                        id: this.lastID,
                        name: cleanName,
                        email: cleanEmail,
                        mobile: cleanMobile
                    }
                });
            }
        );

    } catch (error) {
        console.error("Password Hash Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error during registration!"
        });
    }
});


// ===============================
// 2. STUDENT LOGIN
// ===============================
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (
        typeof email !== "string" ||
        typeof password !== "string" ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required!"
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    db.get(
        "SELECT * FROM students WHERE email = ?",
        [cleanEmail],
        async (error, student) => {
            if (error) {
                console.error("Database Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Database error!"
                });
            }

            if (!student) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password!"
                });
            }

            try {
                const passwordMatch = await bcrypt.compare(
                    password,
                    student.password
                );

                if (!passwordMatch) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid email or password!"
                    });
                }

                req.session.student = {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    mobile: student.mobile
                };

                req.session.save((sessionError) => {
                    if (sessionError) {
                        console.error("Session Error:", sessionError);

                        return res.status(500).json({
                            success: false,
                            message: "Could not create login session."
                        });
                    }

                    res.json({
                        success: true,
                        message: "Login successful!",
                        student: req.session.student
                    });
                });

            } catch (err) {
                console.error("Login Error:", err);

                res.status(500).json({
                    success: false,
                    message: "Login failed due to server error."
                });
            }
        }
    );
});


// ===============================
// 3. CHECK STUDENT SESSION
// ===============================
router.get("/me", (req, res) => {
    if (!req.session.student) {
        return res.status(401).json({
            success: false,
            message: "Please login first!"
        });
    }

    res.json({
        success: true,
        student: req.session.student
    });
});


// ===============================
// 4. STUDENT LOGOUT
// ===============================
router.post("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Logout Error:", error);

            return res.status(500).json({
                success: false,
                message: "Logout failed!"
            });
        }

        res.clearCookie("connect.sid");

        res.json({
            success: true,
            message: "Logout successful!"
        });
    });
});


// ===============================
// 5. GET ALL COURSES
// ===============================
router.get("/courses", (req, res) => {
    db.all(
        `SELECT id, title, description, price
         FROM courses
         ORDER BY id DESC`,
        [],
        (error, courses) => {
            if (error) {
                console.error("Courses Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to fetch courses."
                });
            }

            res.json({
                success: true,
                courses: courses
            });
        }
    );
});


// ===============================
// 6. GET STUDENT PURCHASED COURSES
// ===============================
router.get("/my-courses", (req, res) => {
    if (!req.session.student) {
        return res.status(401).json({
            success: false,
            message: "Please login first."
        });
    }

    const studentId = req.session.student.id;

    db.all(
        `SELECT
            courses.id,
            courses.title,
            courses.description,
            courses.price,
            enrollments.enrolled_at
         FROM enrollments
         JOIN courses ON courses.id = enrollments.course_id
         WHERE enrollments.student_id = ?
         AND enrollments.payment_status = 'paid'`,
        [studentId],
        (error, courses) => {
            if (error) {
                console.error("My Courses Error:", error);

                return res.status(500).json({
                    success: false,
                    message: "Unable to fetch your courses."
                });
            }

            res.json({
                success: true,
                courses: courses
            });
        }
    );
});


// ===============================
// EXPORT ROUTER
// ===============================
module.exports = router;
