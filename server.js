const express = require("express");
const exhbars = require("express-handlebars");
const app = express();
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const db = require("./db");

// handlebars setup
app.engine("handlebars", exhbars());
app.set("view engine", "handlebars");
//

// middlewares
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(
    cookieSession({
        secret: `I love to eat.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);
app.use((req, res, next) => {
    if (req.session.signatureId) {
        if (req.url == "/petition") {
            res.redirect("/thanks");
        } else {
            return next();
        }
    } else {
        if (req.url == "/thanks" || req.url == "/signers") {
            res.redirect("/petition");
        } else {
            return next();
        }
    }
});
app.use(express.static("./public"));

// routes
app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    const { first, last, sign } = req.body;
    // console.log(req.body);
    // need to have data from canvas sign and call func below
    if (first == "" || last == "") {
        res.redirect("/petition");
    } else {
        db.addSignature(first, last, sign)
            .then(({ rows }) => {
                // console.log(rows);
                // res.cookie("signed", "true");
                req.session.signatureId = rows[0].id;
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("Error:", err.message);
                res.render("petition", {
                    layout: "main",
                    errorMsg: "Something went wrong, please try again.",
                });
            });
    }
});

app.get("/thanks", (req, res) => {
    // get total number of signers and forward to template
    // get signature value using id in cookie to render in image
    db.getTotalSigners()
        .then(({ rows }) => {
            let totalRows = rows;

            db.getSignature(req.session.signatureId)
                .then(({ rows }) => {
                    let signRows = rows;
                    res.render("thanks", {
                        layout: "main",
                        signRows,
                        totalRows,
                    });
                })
                .catch((err) => console.log("Error:", err.message));
        })
        .catch((err) => console.log("Error:", err.message));
});

app.get("/signers", (req, res) => {
    // get list of signers and forward to template
    db.getNames()
        .then(({ rows }) => {
            // console.log(rows);
            res.render("signers", {
                layout: "main",
                rows,
            });
        })
        .catch((err) => console.log("Error:", err.message));
});

// listen
app.listen(8080, () => console.log("🛑 Petition server is running..."));
