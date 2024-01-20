"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = exports.User = exports.Course = void 0;
class Course {
    constructor(courseid, roomnum, coursename, hourname) {
        this.courseid = "";
        this.roomnum = "";
        this.coursename = "";
        this.hourname = "";
        this.courseid = courseid;
        this.roomnum = roomnum;
        this.coursename = coursename;
        this.hourname = hourname;
    }
}
exports.Course = Course;
class User {
    constructor(id, firstname, lastname) {
        this.id = "";
        this.firstname = "";
        this.lastname = "";
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
        this.courses = [];
    }
    addCourse(course) {
        this.courses.push(course);
    }
}
exports.User = User;
class Database {
    constructor() {
        this.users = [];
    }
    addUser(user) {
        this.users.push(user);
    }
    getUser(id) {
        return this.users.find(user => user.id === id);
    }
    getUsers() {
        return this.users;
    }
    getCourse(id) {
        return this.users.find(user => user.id === id);
    }
    getCourses() {
        return this.users;
    }
}
exports.Database = Database;
