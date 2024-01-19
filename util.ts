
import { JSDOM } from "jsdom";
import cookie from "cookie";
import dotenv from "dotenv";

dotenv.config();

const baseURL = "https://coachhomeschool.org/blackboard";

class API {
    moodleSess = "";

    constructor() {
        this.login().then(sess => {
            this.moodleSess = sess;
        });
        setInterval(() => {
            this.login().then(sess => {
                this.moodleSess = sess;
            });
        }, 1000 * 60 * 60 * 24);
    }

    login = async () => {
        return await fetch(`${baseURL}/login/index.php`, {
            method: "POST",
            headers: {
                "Content-Type": "application/form-data",
            },
            body: new URLSearchParams({
                username: process.env.BB_USERNAME as string,
                password: process.env.BB_PASSWORD as string,
            }),
        }).then(res => {
            return cookie.parse(
                res.headers.get("Set-Cookie") as string
            ).MoodleSession;
        });
    }

    getCampuses = async () => {
        return await fetch(`https://coachhomeschool.org/`, {
            headers: {
                Cookie: `MoodleSession=${this.moodleSess}`,
            }
        })
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const campusList = document.querySelector(`ul.sub-menu`);
                const campuses = campusList?.querySelectorAll(`li`);
                const campusNames: string[] = [];
                campuses?.forEach(campus => {
                    campusNames.push((campus.textContent as string).slice(6));
                });
                return campusNames;
            });
    };

    getHours = async (campus: string, semester: string) => {
        return await fetch(`${baseURL}/course/management.php`, {
            "headers": {
                "Cookie": `MoodleSession=${this.moodleSess}`,
            },
        })
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const queryText = `a.float-left.categoryname.aalink`;
                const campusSelector = Array.from(
                    document.querySelectorAll(queryText)
                ).filter(campusElement => campusElement.textContent === `COACH ${campus}`)[0];
                const hourList = Array.from(
                    campusSelector.querySelectorAll(queryText)
                ).filter(semesterElement => semesterElement.textContent?.slice(0, -5) === semester)[0];
                const hours = Array.from(hourList.querySelectorAll(queryText));
                return hours;
            });
    }
}

export { API };
