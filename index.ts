
import express from 'express';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import { API } from './util';
import { Database, User, Course } from './database';
import googleapis from 'googleapis';

dotenv.config();
const PORT = 3344;
let api: API;
let db: Database;

const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json());

app.get("/test", async (req, res) => {
    console.log("GET /test");
    res.send("hello!");
});

app.get('/', async (req, res) => {
    console.log("GET /");
    console.log(JSON.stringify(api.fetchOptions(), null, 2))
    res.render('home', {
        campus: await api.getCampuses(),
        semester: ["Fall", "Spring"],
    });
});

app.post("/api/badge", (req, res) => {
    const { campus, semester } = req.body;
    // HARDCODED
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders();

    api.getHours(campus, semester).then(async hours => {
        for (const { hourid, hourname } of hours) {
            res.write(`${hourname}\n`);
            const courses = await api.getCoursesFromHour(campus, hourid);
            for (const course of courses) {
                if (!course) continue;
                const courseid = course.courseid;
                const courseObj = new Course(courseid, course.roomnum, course.coursename, hourname);
                const users = await api.usersInCourse(courseid);
                for (const user of users) {
                    let userObj = db.getUser(user.id);
                    if (!userObj) {
                        userObj = new User(user.id, user.firstname, user.lastname);
                        db.addUser(userObj);
                    }
                    userObj.addCourse(courseObj);
                }
            }
        }
        res.write("Working on users...\n");
        const out = [];
        for (const user of db.getUsers()) {
            const courses = user.courses;
            const userObj = {
                name: `${user.firstname} ${user.lastname}`,
                id: user.id,
                courses: courses.map(course => {
                    return {
                        name: course.coursename,
                        room: course.roomnum,
                        id: course.courseid,
                        hour: course.hourname,
                    };
                }),
            };
            out.push(userObj);
        }
        res.end();
    });

});

app.post("/api/hours", (req, res) => {
    const { campus, semester } = req.body;
    api.getHours(campus, semester).then(hours => {
        res.json(hours);
    });
});

app.post("/api/userscourse", async (req, res) => {
    const { course } = req.body;
    const users = await api.usersInCourse(course);
    res.json(users);
});

app.listen(PORT, "0.0.0.0", () => {
    api = new API();
    db = new Database();
    console.log(`Server is running on http://localhost:${PORT}`);
});
