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
const fs_1 = require("fs");
const DEBUG = false;
const baseURL = "https://coachhomeschool.org/blackboard";
const hourByCampus = {
    McKinney: [1, 2, 3, 4, 5, 6],
    Rockwall: [0, 1, 2, 3, 4, 5, 6, 7]
};
class API {
    constructor() {
        this.creds = {};
        this.fetchOptions = () => {
            return {
                headers: {
                    "Cookie": Object.entries(this.creds).map(([key, value]) => `${key}=${value}`).join("; "),
                }
            };
        };
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            if ((0, fs_1.existsSync)("data/creds.json") && !DEBUG) {
                const creds = JSON.parse((0, fs_1.readFileSync)("data/creds.json").toString());
                return creds;
            }
            return yield fetch(`http://py:8080`)
                .then((res) => __awaiter(this, void 0, void 0, function* () {
                const text = yield res.text();
                let creds = {};
                const json = JSON.parse(text);
                for (const cookie of json["cookies"]) {
                    creds[cookie.name] = cookie.value;
                }
                (0, fs_1.writeFileSync)("data/creds.json", JSON.stringify(creds, null, 2));
                return creds;
            }));
        });
        this.getCampuses = () => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`https://coachhomeschool.org/`, this.fetchOptions())
                .then(res => res.text())
                .then(html => {
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const campusList = document.querySelector(`ul.sub-menu`);
                const campuses = campusList === null || campusList === void 0 ? void 0 : campusList.querySelectorAll(`li`);
                const campusNames = [];
                for (const campus of campuses) {
                    campusNames.push(campus.textContent.slice(6));
                }
                return campusNames;
            });
        });
        this.getHours = (campus, semester) => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`${baseURL}/course/management.php`, this.fetchOptions())
                .then(res => res.text())
                .then((html) => __awaiter(this, void 0, void 0, function* () {
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const queryText = `li.listitem-category`;
                const campusSelector = Array.from(document.querySelectorAll(queryText)).filter(campusElement => {
                    var _a;
                    return (_a = campusElement.textContent) === null || _a === void 0 ? void 0 : _a.startsWith(`COACH ${campus}`);
                })[0];
                const hourList = Array.from(campusSelector.querySelectorAll(queryText)).filter(semesterElement => { var _a; return (_a = semesterElement.textContent) === null || _a === void 0 ? void 0 : _a.startsWith(semester); })[0];
                const semesterID = hourList.getAttribute("data-id");
                return yield fetch(`${baseURL}/course/management.php?categoryid=${semesterID}`, this.fetchOptions())
                    .then(res => res.text())
                    .then(html => {
                    var _a, _b;
                    const dom = new jsdom_1.JSDOM(html);
                    const document = dom.window.document;
                    const hourList = Array.from((_a = document.querySelector(`[data-id='${semesterID}']`)) === null || _a === void 0 ? void 0 : _a.querySelectorAll(`li`));
                    const aElements = hourList.map(hourElement => hourElement.querySelector("a"));
                    let out = [];
                    for (const aElement of aElements) {
                        out.push({
                            hourid: (_b = aElement.getAttribute("href")) === null || _b === void 0 ? void 0 : _b.split("categoryid=")[1],
                            hourname: aElement.textContent,
                        });
                    }
                    ;
                    return out;
                });
            }));
        });
        this.getCoursesFromHour = (campus, hourID) => __awaiter(this, void 0, void 0, function* () {
            const courseElements = yield fetch(`${baseURL}/course/management.php?categoryid=${hourID}`, this.fetchOptions())
                .then(res => res.text())
                .then(html => {
                var _a;
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const courseElements = Array.from((_a = document.querySelector(`ul.course-list`)) === null || _a === void 0 ? void 0 : _a.querySelectorAll("li[data-visible='1']"));
                return courseElements.map(courseElement => courseElement.querySelector("a.coursename"));
            });
            const out = courseElements.map((courseElement) => __awaiter(this, void 0, void 0, function* () {
                if (!courseElement)
                    throw new Error("Course element is null");
                const link = new URL(courseElement.href);
                const courseid = link.searchParams.get("courseid");
                if (!courseid)
                    throw new Error("Course ID is null");
                const out = yield fetch(`${baseURL}/course/edit.php?id=${courseid}`, this.fetchOptions())
                    .then(res => res.text())
                    .then(html => {
                    var _a, _b, _c;
                    const dom = new jsdom_1.JSDOM(html);
                    const document = dom.window.document;
                    const tagcontainer = document.querySelector("#id_tags");
                    try {
                        const roomnum = (_a = (tagcontainer === null || tagcontainer === void 0 ? void 0 : tagcontainer.querySelector("option[selected]")).textContent) === null || _a === void 0 ? void 0 : _a.split(`${campus} `)[1];
                        const coursename = (_c = (_b = document.querySelector("h1.h2")) === null || _b === void 0 ? void 0 : _b.textContent) === null || _c === void 0 ? void 0 : _c.slice(0, 31);
                        const out = { courseid, roomnum, coursename };
                        return out;
                    }
                    catch (e) {
                        console.log("Error getting room number");
                        console.log(e);
                    }
                });
                return out;
            }));
            return yield Promise.all(out);
        });
        this.usersInCourse = (courseid) => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`${baseURL}/user/index.php?id=${courseid}&perpage=1024`, this.fetchOptions())
                .then(res => res.text())
                .then(html => {
                var _a, _b;
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const tbody = document.querySelector("tbody");
                if (!tbody)
                    return [];
                const nonEmpty = tbody.querySelectorAll("tr:not(.emptyrow)");
                if (!nonEmpty)
                    return [];
                const userElements = Array.from(nonEmpty);
                const out = [];
                for (const tr of userElements) {
                    const link = tr.querySelector("a");
                    (_a = link.querySelector("span")) === null || _a === void 0 ? void 0 : _a.remove();
                    const userlink = link.getAttribute("href");
                    const name = (_b = link.textContent) === null || _b === void 0 ? void 0 : _b.split(" ");
                    if (!name || !userlink)
                        continue;
                    const firstname = name[0];
                    let lastname = "";
                    let i = 1;
                    while (!lastname.includes(")")) {
                        lastname += name[i];
                        i++;
                    }
                    const id = new URL(userlink).searchParams.get("id");
                    out.push({ firstname, lastname, id });
                }
                return out;
            });
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
        }, 3000);
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
