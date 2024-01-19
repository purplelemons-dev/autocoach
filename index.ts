
import express from 'express';
import dotenv from 'dotenv';
import { engine } from 'express-handlebars';
import { API } from './util';

dotenv.config();
const { EXPRESS_PORT } = process.env;

const app = express();
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.json());

const api = new API();

app.get('/', async (req, res) => {
    res.render('home', {
        campus: await api.getCampuses(),
        semester: ["Fall", "Spring"]
    });
});

app.post("/api/badge", (req, res) => {
    console.log(JSON.stringify(req.body));
    res.send("OK");
});

app.listen(EXPRESS_PORT, () => {
    console.log(`Server is running on http://localhost:${EXPRESS_PORT}`);
});
