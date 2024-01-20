
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
    console.log(JSON.stringify(api.fetchOptions, null, 2))
    res.render('home', {
        campus: await api.getCampuses(),
        semester: ["Fall", "Spring"],
    });
});

app.post("/api/badge", (req, res) => {
    const { campus, startDate } = req.body;
    // HARDCODED
    const semester = "Spring";
    api.getHours(campus, semester).then(async hours => {
        const { id, hour } = hours[0];
        const badge = await (await api.getCoursesFromHour(campus, id));
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(await badge, null, 2));
    });
});

app.post("/api/hours", (req, res) => {
    const { campus, semester } = req.body;
    api.getHours(campus, semester).then(hours => {
        res.send(JSON.stringify(hours, null, 2));
    });
});

app.listen(EXPRESS_PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${EXPRESS_PORT}`);
});
