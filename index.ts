
import express from 'express';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import { API } from './util';

dotenv.config();
const EXPRESS_PORT = 3344;

const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json());

const api = new API();

app.get("/test", async (req, res) => {
    console.log("GET /test");
    res.send("hello!");
});

app.get('/', async (req, res) => {
    console.log("GET /");
    res.render('home', {
        campus: await api.getCampuses(),
        semester: ["Fall", "Spring"]
    });
});

app.post("/api/badge", (req, res) => {
    const { campus, startDate } = req.body;
    const date = new Date(startDate);
    // HARDCODED
    const semester = "Spring";
    api.getHours(campus, semester).then(async hours => {
        res.send(await api.getCoursesFromHour(campus, hours[0]));
    });
});

app.listen(EXPRESS_PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${EXPRESS_PORT}`);
});
