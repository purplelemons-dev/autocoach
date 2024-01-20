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
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = void 0;
const jsdom_1 = require("jsdom");
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
            return yield fetch(`http://py:8080`)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                const text = yield res.text();
                console.log(res.status);
                let creds = {};
                const json = JSON.parse(text);
                console.log(JSON.stringify(json, null, 2));
                json.cookies.forEach(cookie => {
                    creds[cookie.name] = cookie.value;
                });
                return creds;
            }));
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
                    console.log(`Filtering ${campusElement}`);
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
        setTimeout(() => {
            try {
                this.login().then(cred => {
                    this.creds = cred;
                }).then(() => {
                    console.log(`Logged in, ${JSON.stringify(this.creds, null, 2)}`);
                });
            }
            catch (e) {
                console.log("Error logging in");
                console.log(e);
            }
        }, 5000);
        setInterval(() => {
            try {
                this.login().then(cred => {
                    this.creds = cred;
                }).then(() => {
                    console.log("Logged in");
                });
            }
            catch (e) {
                console.log("Error logging in");
                console.log(e);
            }
        }, 1000 * 60 * 60 * 24);
    }
}
exports.API = API;
