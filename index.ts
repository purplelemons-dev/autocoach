
import express from 'express';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import { API } from './util';
import { Database, User, Course } from './database';
import { google, sheets_v4 } from 'googleapis';

dotenv.config();
const PORT = 3344;
let api: API;
let db: Database;

const mckinneySheetID = process.env.MCKINNEY;
const rockwallSheetID = process.env.ROCKWALL;
const hourByCampus = {
    McKinney: [1, 2, 3, 4, 5, 6],
    Rockwall: [1, 2, 3, 4, 5, 6, 7, 8]
}

const sheets = new sheets_v4.Sheets({
    auth: new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        keyFile: "google_creds.json",
    }),
});

const hourTranslate = (hourname: string, campus: string) => {
    let number = parseInt(hourname.split(" ")[1].replace(":", ""));
    if (campus === "Rockwall") {
        number += 1;
    }
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
    console.log(`POST /api/badge ${campus} ${semester}`);
    // HARDCODED
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Timeout", "3600");
    res.flushHeaders();

    api.getHours(campus, semester).then(async hours => {
        if (!hours) return;
        let newHours: {
            hourid: string;
            hourname: string;
        }[] = [];
        if (campus === "McKinney") {
            newHours = [
                { hourid: "47", hourname: "Hour 1: McKinney" },
                { hourid: "49", hourname: "Hour 2: McKinney" },
                { hourid: "50", hourname: "Hour 3: McKinney" },
                { hourid: "51", hourname: "Hour 4: McKinney" },
                { hourid: "52", hourname: "Hour 5: McKinney" },
                { hourid: "53", hourname: "Hour 6: McKinney" },
            ]
        }
        else if (campus === "Rockwall") {
            newHours = [
                { hourid: "57", hourname: "Hour 0: Rockwall" },
                { hourid: "59", hourname: "Hour 1: Rockwall" },
                { hourid: "60", hourname: "Hour 2: Rockwall" },
                { hourid: "61", hourname: "Hour 3: Rockwall" },
                { hourid: "62", hourname: "Hour 4: Rockwall" },
                { hourid: "63", hourname: "Hour 5: Rockwall" },
                { hourid: "64", hourname: "Hour 6: Rockwall" },
                { hourid: "65", hourname: "Hour 7: Rockwall" },
            ]
        }
        for (const { hourid, hourname } of newHours) {
            console.log(`Working on ${hourname}...`)
            const courses = await api.getCoursesFromHour(campus, hourid);
            for (const course of courses) {
                if (!course) continue;
                const courseid = course.courseid;
                const courseObj = new Course(courseid, course.roomnum, course.coursename, hourname);
                const users = await api.usersInCourse(courseid);
                console.log(`Length of users: ${users.length}`);
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
        const rows: any[][] = [];
        console.log("Working on users...");
        for (const user of db.getUsers().sort((a, b) => a.lastname.localeCompare(b.lastname))) {
            let temp: string[] = [];
            temp = temp.fill("", 0, campus === "McKinney" ? 14 : 16);
            temp.push(user.firstname);
            temp.push(user.lastname);
            for (const course of user.courses) {
                const index = hourTranslate(course.hourname, campus);
                temp[index] = course.coursename;
                temp[index + 1] = course.roomnum;
            }
            rows.push(temp);
        }
        db = new Database();
        const range = "Sheet1!A2:Z800";
        console.log(`campus: ${campus}`);
        if (campus !== "McKinney" && campus !== "Rockwall") {
            console.log("Invalid campus!");
            return;
        }
        const campusSheetID = {
            "McKinney": mckinneySheetID as string,
            "Rockwall": rockwallSheetID as string,
        }[campus as "McKinney" | "Rockwall"];
        await sheets.spreadsheets.values.clear({
            spreadsheetId: campusSheetID,
            range: range,
        })
            .then(async () => {
                await sheets.spreadsheets.values.update({
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
