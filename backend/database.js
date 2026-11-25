
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "padhainexa.db");

const db = new sqlite3.Database(dbPath, (error) => {
    if (error) {
        console.error("Database connection failed:", error.message);
    } else {
        console.log("PadhaiNexa Database connected successfully!");
    }
});

db.serialize(() => {

    // Students Table
    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            mobile TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Courses Table
    db.run(`
        CREATE TABLE IF NOT EXISTS courses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Student Course Enrollments Table
    db.run(`
        CREATE TABLE IF NOT EXISTS enrollments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            course_id INTEGER NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'pending',
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, course_id),
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        )
    `);

    // Sample Courses
    const courses = [
        [
            "HTML & CSS Complete Course",
            "Learn website development from basic to advanced.",
            499
        ],
        [
            "C Programming Complete Course",
            "Learn C programming with practical examples.",
            399
        ],
        [
            "English Speaking Course",
            "Improve English grammar and speaking skills.",
            299
        ]
    ];

    const insertCourse = db.prepare(`
        INSERT INTO courses (title, description, price)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM courses WHERE title = ?
        )
    `);

    courses.forEach((course) => {
        insertCourse.run(
            course[0],
            course[1],
            course[2],
            course[0]
        );
    });

    insertCourse.finalize();

    console.log("Students, Courses and Enrollments tables are ready!");
});

module.exports = db;
