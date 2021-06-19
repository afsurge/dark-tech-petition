const express = require("express");
const exhbars = require("express-handlebars");
const app = express();
const cookieSession = require("cookie-session");
const db = require("./db");
const { hash, compare } = require("./utils/bc.js");
const csurf = require("csurf");

// redis
const redis = require("./redis");
// redis

// export for supertest
module.exports.app = app;
// export for supertest

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

app.use((req, res, next) => {
    if (req.session.userId) {
        if (req.session.signatureId) {
            if (
                req.url == "/petition" ||
                req.url == "/register" ||
                req.url == "/login"
            ) {
                res.redirect("/thanks");
            } else {
                return next();
            }
        } else {
            if (
                req.url != "/petition" &&
                req.url != "/profile" &&
                req.url != "/logout"
            ) {
                res.redirect("/petition");
            } else {
                return next();
            }
        }
    } else {
        if (
            req.url == "/register" ||
            req.url == "/login" ||
            req.url == "/profile"
        ) {
            return next();
        } else {
            res.redirect("/register");
        }
    }
});

// redis routes
app.get("/fun-with-redis", (req, res) => {
    redis
        .setex(
            "dog",
            10,
            JSON.stringify({
                name: "shadow",
                breed: "husky",
            })
        )
        .then(() => res.redirect("/get-from-redis"))
        .catch((err) => console.log("err in setex:", err));
});

app.get("/get-from-redis", (req, res) => {
    redis.get("dog").then((data) => {
        console.log("preparsed data:", data);
        console.log("data from redis:", JSON.parse(data));
        res.sendStatus(200);
    });
});
// redis routes

//// re-usable functions
// db.getProfile
function getProfileFunc(id, res, errorMsg) {
    db.getProfile(id)
        .then(({ rows }) => {
            if (errorMsg == "ERROR: Invalid age (18 and above).") {
                res.render("edit", {
                    layout: "main",
                    rows,
                    loggedin: true,
                    errorAge: true,
                    errorAgeMsg: errorMsg,
                });
            } else if (errorMsg) {
                res.render("edit", {
                    layout: "main",
                    rows,
                    loggedin: true,
                    error: true,
                    errorMsg: errorMsg,
                });
            } else {
                res.render("edit", {
                    layout: "main",
                    rows,
                    loggedin: true,
                });
            }
        })
        .catch((err) => {
            console.log("Error:", err.message);
        });
}

// handle catch in /edit post
function handleCatchesInEditPost(err) {
    console.log("Error at update user:", err.message);
    var errorMsgInFunc;

    if (err.message.includes("violates check constraint")) {
        errorMsgInFunc =
            "ERROR: Names and email cannot be empty! Please try again.";
    } else if (err.message.includes("duplicate key")) {
        errorMsgInFunc =
            "ERROR: Sorry that email is already registered. Please try again.";
    }

    return errorMsgInFunc;
}

// re-render in /login post
function renderForErrors(res, msg) {
    return res.render("login", {
        layout: "main",
        error: true,
        errorMsg: msg,
    });
}
//// re-usable functions

// routes
app.get("/", (req, res) => {
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    res.render("register", {
        layout: "main",
        loggedin: false,
    });
});

app.post("/register", (req, res) => {
    const { first, last, email, password } = req.body;
    // console.log(req.body);
    // console.log(password);
    if (password == "") {
        let errNoPass =
            "ERROR: You did not provide a password, please try again.";
        return res.render("register", {
            layout: "main",
            error: true,
            loggedin: false,
            errorMsg: errNoPass,
        });
    }
    hash(password)
        .then((hashedpass) => {
            // console.log(hashedpass);
            db.addUser(first, last, email, hashedpass)
                .then(({ rows }) => {
                    req.session.userId = rows[0].id;
                    res.redirect("/profile");
                })
                .catch((err) => {
                    console.log("Error:", err.message);
                    if (err.message.includes("violates check constraint")) {
                        var errorMsg =
                            "ERROR: We did not get everything. Please try again.";
                    } else if (err.message.includes("duplicate key")) {
                        errorMsg =
                            "ERROR: Sorry that email is already registered. Please try again.";
                    }
                    res.render("register", {
                        layout: "main",
                        error: true,
                        errorMsg: errorMsg,
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
        loggedin: true,
    });
});

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;
    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        url = "https://" + url;
    }
    if (age < 18 || age > 100) {
        let errAge = "ERROR: Invalid age (18 and above).";
        return res.render("profile", {
            layout: "main",
            error: true,
            errorMsg: errAge,
        });
    }
    const user_id = req.session.userId;
    db.addProfile(age, city, url, user_id)
        .then(() => res.redirect("/petition"))
        .catch((err) => console.log("Error:", err.message));
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main",
        loggedin: false,
    });
});

// could use func for re-render 3x below -> DONE
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (email == "" || password == "") {
        return renderForErrors(
            res,
            "ERROR: Please provide both EMAIL and PASSWORD."
        );
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
                    renderForErrors(res, "Wrong PASSWORD! Please try again.");
                }
            });
        })
        .catch((err) => {
            console.log("Error:", err.message);
            renderForErrors(res, "Invalid EMAIL. Please try again.");
        });
});

app.get("/petition", (req, res) => {
    res.render("petition", {
        layout: "main",
        loggedin: true,
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
                        loggedin: true,
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
                loggedin: true,
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
                loggedin: true,
            });
        })
        .catch((err) => console.log("Error:", err.message));
});

app.get("/edit", (req, res) => {
    // re-usable func call
    getProfileFunc(req.session.userId, res);
});

// could use func for re-render 2x below (catch) -> DONE
app.post("/edit", (req, res) => {
    let { first, last, email, password, age, city, url } = req.body;

    // re-render /edit from catch when an error occurs due to empty first/last/email

    if (!url.startsWith("https://") && !url.startsWith("http://")) {
        url = "https://" + url;
    }

    if (age < 18 || age > 100) {
        let errorAgeMsg = "ERROR: Invalid age (18 and above).";
        // re-usable func call
        getProfileFunc(req.session.userId, res, errorAgeMsg);
    } else {
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
                            console.log(
                                "Error at with pass upsert:",
                                err.message
                            );
                        });
                })
                .catch((err) => {
                    var errorMsg = handleCatchesInEditPost(err);

                    // re-usable func call
                    getProfileFunc(req.session.userId, res, errorMsg);
                });
        } else {
            db.updateUserNoPass(first, last, email, req.session.userId)
                .then(() => {
                    db.upsertProfile(age, city, url, req.session.userId)
                        .then(() => {
                            res.redirect("/petition");
                        })
                        .catch((err) => {
                            console.log(
                                "Error at no pass upsert:",
                                err.message
                            );
                        });
                })
                .catch((err) => {
                    var errorMsg = handleCatchesInEditPost(err);

                    // re-usable func call
                    getProfileFunc(req.session.userId, res, errorMsg);
                });
        }
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

// delete profile and sign
// could use Promises.all below for deleting sign, profile, user
app.get("/delete", (req, res) => {
    db.deleteSign(req.session.userId)
        .then(() => {
            db.deleteProfile(req.session.userId)
                .then(() => {
                    db.deleteUser(req.session.userId)
                        .then(() => {
                            res.redirect("/logout");
                        })
                        .catch((err) => {
                            console.log("Error with user delete:", err.message);
                        });
                })
                .catch((err) =>
                    console.log("Error with profile delete:", err.message)
                );
        })
        .catch((err) => console.log("Error with sign delete:", err.message));
});

// listen locally or in production
// if-block: server does not fully run when running tests (supertest)
if (require.main == module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("🛑 Petition server is running...")
    );
}
