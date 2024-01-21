
export class Course {
    courseid: string = "";
    roomnum: string = "GONE";
    coursename: string = "Gone - Not on Campus";
    hourname: string = "";

    constructor(courseid: string, roomnum: string, coursename: string, hourname: string) {
        this.courseid = courseid;
        this.roomnum = roomnum;
        this.coursename = coursename;
        this.hourname = hourname;
    }

    toString() {
        return `${this.coursename} (${this.roomnum})`;
    }
}

export class User {
    id: string = "";
    firstname: string = "";
    lastname: string = "";
    courses: Course[];

    constructor(id: string, firstname: string, lastname: string) {
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.courses = [];
    }

    addCourse(course: Course) {
        this.courses.push(course);
    }

    toString() {
        return `${this.firstname} ${this.lastname} (${this.id}) ${JSON.stringify(this.courses)}`;
    }
}

export class Database {
    users: User[];

    constructor() {
        this.users = [];
    }

    addUser(user: User) {
        this.users.push(user);
    }

    getUser(id: string) {
        return this.users.find(user => user.id === id);
    }

    getUsers() {
        return this.users;
    }

    getCourse(id: string) {
        return this.users.find(user => user.id === id);
    }

    getCourses() {
        return this.users;
    }
}
