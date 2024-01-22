
import express from 'express';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import { API } from './util';
import { Database, User, Course } from './database';
import { GoogleApis, google, sheets_v4 } from 'googleapis';

dotenv.config();
const PORT = 3344;
let api: API;
let db: Database;

const mckinneySheetID = process.env.MCKINNEY;
const rockwallSheetID = process.env.ROCKWALL;

const sheets = new sheets_v4.Sheets({
    auth: new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        keyFile: "google_creds.json",
    }),
});

const hourTranslate = (hourname: string) => {
    const number = parseInt(hourname.split(" ")[1].replace(":", ""));
    return number * 2;
};

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
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Timeout", "3600");
    res.flushHeaders();

    api.getHours(campus, semester).then(async hours => {
        for (const { hourid, hourname } of hours) {
            console.log(`Working on ${hourname}...`)
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
        //res.write("Working on users...\n");
        const rows = [];
        console.log("Working on users...");
        for (const user of db.getUsers().sort((a, b) => a.lastname.localeCompare(b.lastname))) {
            let temp: string[] = [];
            temp = temp.fill("", 0, campus === "McKinney" ? 14 : 16);
            temp.push(user.firstname);
            temp.push(user.lastname);
            for (const course of user.courses) {
                const index = hourTranslate(course.hourname);
                temp[index] = course.coursename;
                temp[index + 1] = course.roomnum;
            }
            rows.push(temp);
        }
        const range = "Sheet1!A2:Z800";
        const campusSheetID = {
            "McKinney": mckinneySheetID as string,
            "Rockwall": rockwallSheetID as string,
        }[campus as "McKinney" | "Rockwall"];
        await sheets.spreadsheets.values.clear({
            spreadsheetId: campusSheetID,
            range: range,
        });
        sheets.spreadsheets.values.update({
            spreadsheetId: campusSheetID,
            range: range,
            valueInputOption: "RAW",
            requestBody: {
                values: rows
            }
        }).then(() => {
            console.log("Sheets Done!");
            //console.log(res);
        }).catch(err => {
            console.log("Sheets Error!");
            console.log(err);
        });
        res.write(JSON.stringify(rows, null, 2));
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
