
import { JSDOM } from "jsdom";
import cookie from "cookie";
import { writeFileSync } from "fs";

const baseURL = "https://coachhomeschool.org/blackboard";
const hourByCampus = {
    McKinney: [1, 2, 3, 4, 5, 6],
    Rockwall: [0, 1, 2, 3, 4, 5, 6, 7]
}

export class API {
    creds: Record<string, string> = {};

    fetchOptions = {
        headers: {
            "Cookie": Object.entries(this.creds).map(([key, value]) => `${key}=${value}`).join("; "),
        }
    }

    constructor() {
        setTimeout(() => {
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
        }, 5000);
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
        return await fetch(`http://py:8080`)
            .then(async res => {
                const text = await res.text();

                console.log(res.status);

                let creds: Record<string, string> = {};
                const json = JSON.parse(text);
                console.log(JSON.stringify(json, null, 2));

                (json.cookies as Record<string, string>[]).forEach(cookie => {
                    creds[cookie.name] = cookie.value;
                });
                return creds;
            })
    }

    getCampuses = async () => {
        return await fetch(`https://coachhomeschool.org/`, this.fetchOptions)
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
        return await fetch(`${baseURL}/course/management.php`, this.fetchOptions)
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                console.log(document.title);
                const queryText = `li.listitem-category`;
                const campusSelector = Array.from(
                    document.querySelectorAll(queryText)
                ).filter(campusElement => {
                    console.log(campusElement.textContent);
                    return campusElement.textContent?.startsWith(`COACH ${campus}`)
                })[0];
                const hourList = Array.from(
                    campusSelector.querySelectorAll(queryText)
                ).filter(semesterElement => semesterElement.textContent?.startsWith(semester))[0];
                const hours = Array.from(hourList.querySelector("ul")?.querySelectorAll(queryText) as NodeListOf<HTMLLIElement>);
                return hours.map(liElement => liElement.querySelector("a")) as unknown as HTMLHyperlinkElementUtils[];
            });
    }

    getCoursesFromHour = async (campus: string, hour: HTMLHyperlinkElementUtils) => {
        const courseElements = await fetch(hour.href, this.fetchOptions)
            .then(res => res.text())
            .then(html => {
                const dom = new JSDOM(html);
                const document = dom.window.document;
                const courseElements = Array.from(
                    document.querySelector(`ul.course-list`)?.querySelectorAll("li[data-visible='1']") as NodeListOf<HTMLLIElement>
                );
                return courseElements.map(courseElement => courseElement.querySelector("a.coursename") as unknown as HTMLHyperlinkElementUtils);
            });
        let courseAndRoom: Record<string, string>[] = [];
        courseElements.forEach(async courseElement => {
            if (!courseElement) throw new Error("Course element is null");
            const link = new URL(courseElement.href);
            const courseid = link.searchParams.get("courseid");
            if (!courseid) throw new Error("Course ID is null");
            return await fetch(`${baseURL}/course/edit.php?id=${courseid}`, this.fetchOptions)
                .then(res => res.text())
                .then(html => {
                    const dom = new JSDOM(html);
                    const document = dom.window.document;
                    const roomnum = (
                        document.querySelector("#id_tagshdrcontainer")?.querySelector("option[selected]") as HTMLOptionElement
                    ).innerText.split(`${campus} `)[1];
                    courseAndRoom.push({ courseid, roomnum });
                });
        });
        return courseAndRoom;
    }

    viewAllUserCourses = async (id: string) => {
        return await fetch(`${baseURL}/user/profile.php?id=${id}&showallcourses=1`);
    }
}
