const express = require("express");
const exhbars = require("express-handlebars");
const app = express();
// const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const db = require("./db");
const { hash, compare } = require("./utils/bc.js");

// handlebars setup
app.engine("handlebars", exhbars());
app.set("view engine", "handlebars");
// handlebars setup

// middlewares
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(
    cookieSession({
        secret: `I love to eat.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(express.static("./public"));

app.use((req, res, next) => {
    if (req.session.userId) {
        if (req.session.signatureId) {
            if (req.url == "/petition") {
                res.redirect("/thanks");
            } else {
                return next();
            }
        } else {
            if (req.url != "/petition") {
                res.redirect("/petition");
            } else {
                return next();
            }
        }
    } else {
        if (req.url == "/register" || req.url == "/login") {
            return next();
        } else {
            res.redirect("/register");
        }
    }
});

// routes
app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
    });
});

app.post("/register", (req, res) => {
    const { first, last, email, password } = req.body;
    hash(password)
        .then((hashedpass) => {
            db.addUser(first, last, email, hashedpass)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;
                    res.redirect("/petition");
                })
                .catch((err) => {
                    console.log("Error:", err.message);
                    res.render("register", {
                        layout: "main",
                        error: true,
                        errorMsg: "We didn't get everything, please try again.",
                    });
                });
        })
        .catch((err) => {
            console.log("Error:", err.message);
        });
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
    });
});

// can use func for re-render 3x below
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email == "" || password == "") {
        return res.render("login", {
            layout: "main",
            error: true,
            errorMsg: "Please provide both EMAIL and PASSWORD.",
        });
    }

    db.getUser(email)
        .then(({ rows }) => {
            const hashpass = rows[0].hashpass;
            const id = rows[0].id;
            compare(password, hashpass).then((match) => {
                if (match) {
                    req.session.userId = id;
                    res.redirect("/petition");
                } else {
                    return res.render("login", {
                        layout: "main",
                        error: true,
                        errorMsg: "Wrong PASSWORD! Please try again.",
                    });
                }
            });
        })
        .catch((err) => {
            console.log("Error:", err.message);
            return res.render("login", {
                layout: "main",
                error: true,
                errorMsg: "Invalid EMAIL. Please try again.",
            });
        });
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
    });
});

app.post("/petition", (req, res) => {
    // const { first, last, sign } = req.body;
    const { sign } = req.body;
    // console.log(req.body);

    // below method of passing user_id value to addSignature from req.session.userId
    // ERROR: insert or update on table "signatures" violates foreign key constraint "signatures_user_id_fkey"
    // const user_id = req.session.userId;
    // console.log(user_id);
    db.addSignature(user_id, sign)
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
                error: true,
                errorMsg: "Something went wrong, please try again.",
            });
        });
    // }
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
