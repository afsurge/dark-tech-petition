const express = require("express");
const exhbars = require("express-handlebars");
const app = express();
const cookieParser = require("cookie-parser");
const db = require("./db");

app.engine("handlebars", exhbars());
app.set("view engine", "handlebars");

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((req, res, next) => {
    if (req.cookies.signed == "true") {
        if (req.url == "/petition") {
            res.redirect("/thanks");
        } else {
            return next();
        }
    } else if (req.cookies.signed != "true") {
        if (req.url == "/thanks" || req.url == "/signers") {
            res.redirect("/petition");
        } else {
            return next();
        }
    }
});
app.use(express.static("./public"));

app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});

app.get("/thanks", (req, res) => {
    res.render("thanks", {
        layout: "main",
    });
});

app.get("/signers", (req, res) => {
    res.render("signers", {
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    const { first, last, sign } = req.body;
    // console.log(req.body);
    db.addSignature(first, last, sign)
        .then(() => {
            console.log(db);
            res.cookie("signed", "true");
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("Error:", err.message);
            res.render("petition", {
                layout: "main",
                errorMsg: "Something went wrong, please try again.",
            });
        });
});

app.listen(8080, () => console.log("🛑 Petition server is running..."));
