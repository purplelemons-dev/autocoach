"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_handlebars_1 = require("express-handlebars");
const util_1 = require("./util");
const database_1 = require("./database");
const googleapis_1 = require("googleapis");
dotenv_1.default.config();
const PORT = 3344;
let api;
let db;
const mckinneySheetID = process.env.MCKINNEY;
const rockwallSheetID = process.env.ROCKWALL;
const sheets = new googleapis_1.sheets_v4.Sheets({
    auth: new googleapis_1.google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        keyFile: "google_creds.json",
    }),
});
const hourTranslate = (hourname) => {
    const number = parseInt(hourname.split(" ")[1].replace(":", ""));
    return number * 2;
};
const app = (0, express_1.default)();
app.engine('handlebars', (0, express_handlebars_1.engine)());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
app.get("/test", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /test");
    res.send("hello!");
}));
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /");
    console.log(JSON.stringify(api.fetchOptions(), null, 2));
    res.render('home', {
        campus: yield api.getCampuses(),
        semester: ["Fall", "Spring"],
    });
}));
app.post("/api/badge", (req, res) => {
    const { campus, semester } = req.body;
    res.setHeader("Content-Type", "event-stream");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders();
    api.getHours(campus, semester).then((hours) => __awaiter(void 0, void 0, void 0, function* () {
        for (const { hourid, hourname } of hours) {
            const courses = yield api.getCoursesFromHour(campus, hourid);
            for (const course of courses) {
                if (!course)
                    continue;
                const courseid = course.courseid;
                const courseObj = new database_1.Course(courseid, course.roomnum, course.coursename, hourname);
                const users = yield api.usersInCourse(courseid);
                for (const user of users) {
                    let userObj = db.getUser(user.id);
                    if (!userObj) {
                        userObj = new database_1.User(user.id, user.firstname, user.lastname);
                        db.addUser(userObj);
                    }
                    userObj.addCourse(courseObj);
                }
            }
        }
        const rows = [];
        for (const user of db.getUsers().sort((a, b) => a.lastname.localeCompare(b.lastname))) {
            let temp = [];
            temp.push(user.firstname);
            temp.push(user.lastname);
            for (const course of user.courses) {
                const index = hourTranslate(course.hourname);
                temp[index] = course.coursename;
                temp[index + 1] = course.roomnum;
            }
            rows.push(temp);
        }
        sheets.spreadsheets.values.update({
            spreadsheetId: mckinneySheetID,
            range: "Sheet1!A2",
            valueInputOption: "RAW",
            requestBody: {
                values: rows
            }
        }).then(res => {
            console.log("Sheets Done!");
            console.log(res);
        }).catch(err => {
            console.log("Sheets Error!");
            console.log(err);
        });
        res.write(JSON.stringify(rows, null, 2));
        res.end();
    }));
});
app.post("/api/hours", (req, res) => {
    const { campus, semester } = req.body;
    api.getHours(campus, semester).then(hours => {
        res.json(hours);
    });
});
app.post("/api/userscourse", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { course } = req.body;
    const users = yield api.usersInCourse(course);
    res.json(users);
}));
app.listen(PORT, "0.0.0.0", () => {
    api = new util_1.API();
    db = new database_1.Database();
    console.log(`Server is running on http://localhost:${PORT}`);
});
