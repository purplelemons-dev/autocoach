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
const cookie_1 = __importDefault(require("cookie"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const baseURL = "https://coachhomeschool.org/blackboard";
console.log(process.env.BB_USERNAME, process.env.BB_PASSWORD);
class API {
    constructor() {
        this.moodleSess = "";
        this.login = () => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`${baseURL}/login/index.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/form-data",
                },
                body: new URLSearchParams({
                    username: process.env.BB_USERNAME,
                    password: process.env.BB_PASSWORD,
                }),
            }).then(res => {
                return cookie_1.default.parse(res.headers.get("Set-Cookie")).MoodleSession;
            });
        });
        this.getCampuses = () => __awaiter(this, void 0, void 0, function* () {
            return yield fetch(`https://coachhomeschool.org/`, {
                headers: {
                    Cookie: `MoodleSession=${this.moodleSess}`,
                }
            })
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
            return yield fetch(`${baseURL}/course/management.php`, {
                "headers": {
                    "Cookie": `MoodleSession=${this.moodleSess}`,
                },
            })
                .then(res => res.text())
                .then(html => {
                const dom = new jsdom_1.JSDOM(html);
                const document = dom.window.document;
                const queryText = `a.float-left.categoryname.aalink`;
                const campusSelector = Array.from(document.querySelectorAll(queryText)).filter(campusElement => campusElement.textContent === `COACH ${campus}`)[0];
                const hourList = Array.from(campusSelector.querySelectorAll(queryText)).filter(semesterElement => { var _a; return ((_a = semesterElement.textContent) === null || _a === void 0 ? void 0 : _a.slice(0, -5)) === semester; })[0];
                const hours = Array.from(hourList.querySelectorAll(queryText));
                return hours;
            });
        });
        this.login().then(sess => {
            this.moodleSess = sess;
        });
        setInterval(() => {
            this.login().then(sess => {
                this.moodleSess = sess;
            });
        }, 1000 * 60 * 60 * 24);
    }
}
exports.API = API;
