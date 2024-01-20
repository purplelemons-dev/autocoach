
import { JSDOM } from "jsdom";
import { writeFileSync, existsSync, readFileSync } from "fs";

const DEBUG = false;
const baseURL = "https://coachhomeschool.org/blackboard";
const hourByCampus = {
    McKinney: [1, 2, 3, 4, 5, 6],
    Rockwall: [0, 1, 2, 3, 4, 5, 6, 7]
}

export class API {
    creds: Record<string, string> = {};

    fetchOptions = () => {
        return {
            headers: {
                "Cookie": Object.entries(this.creds).map(([key, value]) => `${key}=${value}`).join("; "),
            }
        }
    }

    constructor() {
        setTimeout(() => {
            try {
                this.login().then(cred => {
                    this.creds = cred;
                }).then(() => {
                    console.log(`Logged in, ${JSON.stringify(this.creds, null, 2)}`)
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
                    console.log("Logged in")
                });
            }
            catch (e) {
                console.log("Error logging in");
                console.log(e);
            }
        }, 1000 * 60 * 60 * 24);

    }

    login = async () => {
        if (existsSync("data/creds.json") && !DEBUG) {
            const creds = JSON.parse(readFileSync("data/creds.json").toString());
            return creds;
        }
        return await fetch(`http://py:8080`)
            .then(async res => {
                const text = await res.text();

                let creds: Record<string, string> = {};
                const json = JSON.parse(text);
                for (const cookie of json["cookies"]) {
                    creds[cookie.name] = cookie.value;
                }
                writeFileSync("data/creds.json", JSON.stringify(creds, null, 2));
                return creds;
            });
    }

    getCampuses = async () => {
        return await fetch(`https://coachhomeschool.org/`, this.fetchOptions())
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const campusList = document.querySelector(`ul.sub-menu`);
                const campuses = campusList?.querySelectorAll(`li`);
                const campusNames: string[] = [];
                for (const campus of campuses as NodeListOf<HTMLLIElement>) {
                    campusNames.push((campus.textContent as string).slice(6));
                }
                return campusNames;
            });
    };

    getHours = async (campus: string, semester: string) => {
        return await fetch(`${baseURL}/course/management.php`, this.fetchOptions())
            .then(res => res.text())
            .then(async html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const queryText = `li.listitem-category`;
                const campusSelector = Array.from(
                    document.querySelectorAll(queryText)
                ).filter(campusElement => {
                    return campusElement.textContent?.startsWith(`COACH ${campus}`)
                })[0];
                const hourList = Array.from(
                    campusSelector.querySelectorAll(queryText)
                ).filter(semesterElement => semesterElement.textContent?.startsWith(semester))[0];
                const semesterID = hourList.getAttribute("data-id");
                return await fetch(`${baseURL}/course/management.php?categoryid=${semesterID}`, this.fetchOptions())
                    .then(res => res.text())
                    .then(html => {
                        const dom = new JSDOM(html);
                        const document = dom.window.document;
                        // Shortcut bc we already did the work
                        const hourList = Array.from(document.querySelector(`[data-id='${semesterID}']`)?.querySelectorAll(`li`) as NodeListOf<HTMLLIElement>);
                        const aElements = hourList.map(hourElement => hourElement.querySelector("a") as Element);
                        let out: {
                            hourid: string,
                            hourname: string,
                        }[] = [];
                        for (const aElement of aElements) {
                            out.push({
                                hourid: aElement.getAttribute("href")?.split("categoryid=")[1] as string,
                                hourname: aElement.textContent as string,
                            });
                        };
                        return out;
                    });
            });
    }

    getCoursesFromHour = async (campus: string, hourID: string) => {
        const courseElements = await fetch(`${baseURL}/course/management.php?categoryid=${hourID}`, this.fetchOptions())
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const courseElements = Array.from(
                    document.querySelector(`ul.course-list`)?.querySelectorAll("li[data-visible='1']") as NodeListOf<HTMLLIElement>
                );
                return courseElements.map(courseElement => courseElement.querySelector("a.coursename") as unknown as HTMLHyperlinkElementUtils);
            });
        const out = courseElements.map(async courseElement => {
            if (!courseElement) throw new Error("Course element is null");
            const link = new URL(courseElement.href);
            const courseid = link.searchParams.get("courseid");
            if (!courseid) throw new Error("Course ID is null");
            const out = await fetch(`${baseURL}/course/edit.php?id=${courseid}`, this.fetchOptions())
                .then(res => res.text())
                .then(html => {
                    const dom = new JSDOM(html);
                    const document = dom.window.document;
                    const tagcontainer = document.querySelector("#id_tags");
                    try {
                        const roomnum = (
                            tagcontainer?.querySelector("option[selected]") as HTMLOptionElement
                        ).textContent?.split(`${campus} `)[1] as string;
                        const coursename = document.querySelector("h1.h2")?.textContent?.slice(0, 31) as string;
                        const out = { courseid, roomnum, coursename };
                        return out;
                    }
                    catch (e) {
                        console.log("Error getting room number");
                        console.log(e);
                    }
                });
            return out;
        });
        return await Promise.all(out);
    }

    usersInCourse = async (courseid: string) => {
        return await fetch(`${baseURL}/user/index.php?id=${courseid}&perpage=1024`, this.fetchOptions())
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const tbody = document.querySelector("tbody");
                if (!tbody) return [];
                const nonEmpty = tbody.querySelectorAll("tr:not(.emptyrow)");
                if (!nonEmpty) return [];
                const userElements = Array.from(nonEmpty);
                const out: {
                    firstname: string,
                    lastname: string,
                    id: string,
                }[] = [];
                for (const tr of userElements) {
                    const link = tr.querySelector("a") as Element;
                    link.querySelector("span")?.remove();
                    const userlink = link.getAttribute("href");
                    const name = link.textContent?.split(" ");
                    if (!name || !userlink) continue;
                    const firstname = name[0];
                    let lastname = "";
                    let i = 1;
                    while (!lastname.includes(")") && i < name.length) {
                        lastname = name[i];
                        i++;
                    }
                    const id = new URL(userlink).searchParams.get("id") as string;
                    out.push({ firstname, lastname, id });
                }
                return out;
            });
    }
}
