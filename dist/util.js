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
exports.API = void 0;
const jsdom_1 = require("jsdom");
const dotenv_1 = __importDefault(require("dotenv"));
const follow_redirects_1 = require("follow-redirects");
dotenv_1.default.config();
const { BB_USERNAME, BB_PASSWORD } = process.env;
const baseURL = "https://coachhomeschool.org/blackboard";
const hourByCampus = {
    McKinney: [1, 2, 3, 4, 5, 6],
    Rockwall: [0, 1, 2, 3, 4, 5, 6, 7]
};
class API {
    constructor() {
        this.creds = {};
        this.fetchOptions = {
            headers: {
                "Cookie": Object.entries(this.creds).map(([key, value]) => `${key}=${value}`).join("; "),
            }
        };
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            const res = follow_redirects_1.https.request("https://coachhomeschool.org/blackboard/login/index.php", res => {
                console.log(res.responseUrl);
            });
            return { a: "b" };
            const logintoken = yield fetch(`${baseURL}/login/index.php`, {
                redirect: "follow",
                method: "GET",
                headers: {
                    "Cookie": "MoodleSession=deleted; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/blackboard/;",
                    "User-Agent": "PostmanRuntime/7.36.1"
                },
            })
                .then(res => {
                console.log(res.headers);
                return res.text();
            })
                .then((html) => {
                var _a;
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const cookie = document.cookie;
                const token = (_a = document.querySelector(`input[name=logintoken]`)) === null || _a === void 0 ? void 0 : _a.getAttribute("value");
                if (!token)
                    throw new Error("Couldn't find token");
                console.log(token);
                return { token, cookie };
            });
            const form = `username=joshsmith&password=Support%231&logintoken=${logintoken.token}`;
            console.log(form);
            const second = yield fetch(`${baseURL}/login/index.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Cookie": logintoken.cookie,
                    "User-Agent": "PostmanRuntime/7.36.1"
                },
                body: form,
            }).then((res) => __awaiter(this, void 0, void 0, function* () {
                const dom = yield jsdom_1.JSDOM.fromURL(res.url);
                const document = dom.window.document;
                const cookie = document.cookie;
                console.log(cookie);
            }));
            return yield fetch(`${baseURL}/login/index.php?testsession=`, {})
                .then(res => res.text())
                .then(html => {
                return { a: "b" };
            });
        });
        this.getCampuses = () => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`https://coachhomeschool.org/`, this.fetchOptions)
                .then(res => res.text())
                .then(html => {
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const campusList = document.querySelector(`ul.sub-menu`);
                const campuses = campusList === null || campusList === void 0 ? void 0 : campusList.querySelectorAll(`li`);
                const campusNames = [];
                campuses === null || campuses === void 0 ? void 0 : campuses.forEach(campus => {
                    campusNames.push(campus.textContent.slice(6));
                });
                return campusNames;
            });
        });
        this.getHours = (campus, semester) => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`${baseURL}/course/management.php`, this.fetchOptions)
                .then(res => res.text())
                .then(html => {
                var _a;
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                console.log(document.title);
                const queryText = `li.listitem-category`;
                const campusSelector = Array.from(document.querySelectorAll(queryText)).filter(campusElement => {
                    var _a;
                    console.log(campusElement.textContent);
                    return (_a = campusElement.textContent) === null || _a === void 0 ? void 0 : _a.startsWith(`COACH ${campus}`);
                })[0];
                const hourList = Array.from(campusSelector.querySelectorAll(queryText)).filter(semesterElement => { var _a; return (_a = semesterElement.textContent) === null || _a === void 0 ? void 0 : _a.startsWith(semester); })[0];
                const hours = Array.from((_a = hourList.querySelector("ul")) === null || _a === void 0 ? void 0 : _a.querySelectorAll(queryText));
                return hours.map(liElement => liElement.querySelector("a"));
            });
        });
        this.getCoursesFromHour = (campus, hour) => __awaiter(this, void 0, void 0, function* () {
            const courseElements = yield fetch(hour.href, this.fetchOptions)
                .then(res => res.text())
                .then(html => {
                var _a;
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const courseElements = Array.from((_a = document.querySelector(`ul.course-list`)) === null || _a === void 0 ? void 0 : _a.querySelectorAll("li[data-visible='1']"));
                return courseElements.map(courseElement => courseElement.querySelector("a.coursename"));
            });
            let courseAndRoom = [];
            courseElements.forEach((courseElement) => __awaiter(this, void 0, void 0, function* () {
                if (!courseElement)
                    throw new Error("Course element is null");
                const link = new URL(courseElement.href);
                const courseid = link.searchParams.get("courseid");
                if (!courseid)
                    throw new Error("Course ID is null");
                return yield fetch(`${baseURL}/course/edit.php?id=${courseid}`, this.fetchOptions)
                    .then(res => res.text())
                    .then(html => {
                    var _a;
                    const dom = new jsdom_1.JSDOM(html);
                    const document = dom.window.document;
                    const roomnum = ((_a = document.querySelector("#id_tagshdrcontainer")) === null || _a === void 0 ? void 0 : _a.querySelector("option[selected]")).innerText.split(`${campus} `)[1];
                    courseAndRoom.push({ courseid, roomnum });
                });
            }));
            return courseAndRoom;
        });
        this.viewAllUserCourses = (id) => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`${baseURL}/user/profile.php?id=${id}&showallcourses=1`);
        });
        this.login().then(cred => {
            this.creds = cred;
        });
        setInterval(() => {
            this.login().then(cred => {
                this.creds = cred;
            });
        }, 1000 * 60 * 60 * 24);
    }
}
exports.API = API;
