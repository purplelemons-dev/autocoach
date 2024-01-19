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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_handlebars_1 = require("express-handlebars");
const util_1 = require("./util");
dotenv_1.default.config();
const { EXPRESS_PORT } = process.env;
const app = (0, express_1.default)();
app.engine('handlebars', (0, express_handlebars_1.engine)());
app.set('view engine', 'handlebars');
app.set('views', './views');
app.use(express_1.default.static('public'));
app.use(express_1.default.json());
const api = new util_1.API();
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.render('home', {
        campus: yield api.getCampuses(),
        semester: ["Fall", "Spring"]
    });
}));
app.post("/api/badge", (req, res) => {
    console.log(JSON.stringify(req.body));
    res.send("OK");
});
app.listen(EXPRESS_PORT, () => {
    console.log(`Server is running on http://localhost:${EXPRESS_PORT}`);
});
