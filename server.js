const express = require("express");
const exhbars = require("express-handlebars");
const app = express();
const cookieSession = require("cookie-session");
const db = require("./db");
const { hash, compare } = require("./utils/bc.js");
const csurf = require("csurf");

// handlebars setup
app.engine("handlebars", exhbars());
app.set("view engine", "handlebars");
// handlebars setup

// middlewares
app.use(express.urlencoded({ extended: false }));

app.use(
    cookieSession({
        secret: `I love to eat.`,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

app.use(csurf());

app.use(function (req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(express.static("./public"));

// app.use((req, res, next) => {
//     if (req.session.userId) {
//         if (req.session.signatureId) {
//             if (
//                 req.url == "/petition" ||
//                 req.url == "/register" ||
//                 req.url == "/login"
//             ) {
//                 res.redirect("/thanks");
//             } else {
//                 return next();
//             }
//         } else {
//             if (req.url != "/petition" && req.url != "/profile") {
//                 res.redirect("/petition");
//             } else {
//                 return next();
//             }
//         }
//     } else {
//         if (
//             req.url == "/register" ||
//             req.url == "/login" ||
//             req.url == "/profile"
//         ) {
//             return next();
//         } else {
//             res.redirect("/register");
//         }
//     }
// });

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
                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log("Error:", err.message);
                    res.render("register", {
                        layout: "main",
                        error: true,
                        errorMsg:
                            "ERROR: We didn't get everything, please try again.",
                    });
                });
        })
        .catch((err) => {
            console.log("Error:", err.message);
        });
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
    });
});

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        url = "https://" + url;
    }
    // if (age == "") {
    //     age = null;
    // }
    const user_id = req.session.userId;
    db.addProfile(age, city, url, user_id)
        .then(() => res.redirect("/petition"))
        .catch((err) => console.log("Error:", err.message));
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
            errorMsg: "ERROR: Please provide both EMAIL and PASSWORD.",
        });
    }

    db.getUser(email)
        .then(({ rows }) => {
            // console.log(rows);
            const hashpass = rows[0].hashpass;
            const id = rows[0].id;
            compare(password, hashpass).then((match) => {
                if (match) {
                    req.session.userId = id;
                    // if signature is null for joined table -> go to petition
                    if (rows[0].signature == null) {
                        res.redirect("/petition");
                    } else {
                        // if signature is present for logged in user -> set sign cookie, redirect to /thanks
                        req.session.signatureId = rows[0].sign_id;
                        res.redirect("/thanks");
                    }
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

    const user_id = req.session.userId;
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

// delete signature
app.post("/thanks", (req, res) => {
    db.deleteSign(req.session.userId)
        .then(() => {
            req.session.signatureId = null;
            res.redirect("/petition");
        })
        .catch((err) => console.log("Error:", err.message));
});

app.get("/signers", (req, res) => {
    // get list of signers and forward to template
    db.getSigners()
        .then(({ rows }) => {
            // console.log(rows);
            res.render("signers", {
                layout: "main",
                rows,
            });
        })
        .catch((err) => console.log("Error:", err.message));
});

app.get("/signers/:city", (req, res) => {
    // console.log(req.params);
    const city = req.params.city;
    db.getSignersByCity(city)
        .then(({ rows }) => {
            res.render("signers", {
                layout: "main",
                rows,
                selectedCity: true,
                city: city,
            });
        })
        .catch((err) => console.log("Error:", err.message));
});

app.get("/edit", (req, res) => {
    db.getProfile(req.session.userId)
        .then(({ rows }) => {
            res.render("edit", {
                layout: "main",
                rows,
            });
        })
        .catch((err) => {
            console.log("Error:", err.message);
        });
});

app.post("/edit", (req, res) => {
    const { first, last, email, password, age, city, url } = req.body;

    // re-render /edit from catch when an error occurs due to empty first/last/email

    if (password) {
        hash(password)
            .then((hashedpass) => {
                db.updateUserWithPass(
                    first,
                    last,
                    email,
                    hashedpass,
                    req.session.userId
                )
                    .then(() => {
                        db.upsertProfile(
                            age,
                            city,
                            url,
                            req.session.userId
                        ).then(() => {
                            res.redirect("/petition");
                        });
                    })
                    .catch((err) => {
                        console.log("Error at with pass upsert:", err.message);
                    });
            })
            .catch((err) => {
                console.log("Error at update user:", err.message);
            });
    } else {
        db.updateUserNoPass(first, last, email, req.session.userId)
            .then(() => {
                db.upsertProfile(age, city, url, req.session.userId)
                    .then(() => {
                        res.redirect("/petition");
                    })
                    .catch((err) => {
                        console.log("Error at no pass upsert:", err.message);
                    });
            })
            .catch((err) => {
                console.log("Error at update user:", err.message);
            });
    }
});

// listen locally or in production
app.listen(process.env.PORT || 8080, () =>
    console.log("🛑 Petition server is running...")
);
