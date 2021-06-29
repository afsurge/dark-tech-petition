const supertest = require("supertest");
const { app } = require("./server");
const cookieSession = require("cookie-session");

test("Redirect to /register when attempt to /petition as logged out", () => {
    cookieSession.mockSessionOnce({
        userId: false,
    });

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/register");
        });
});

test("Redirect to /petition when attempt to /register or /login  as logged in", () => {
    cookieSession.mockSessionOnce({
        userId: true,
    });

    return supertest(app)
        .get("/register" || "/login")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});

test("Redirect to /thanks when attempt to /petition as logged in and already signed", () => {
    cookieSession.mockSessionOnce({
        userId: true,
        signatureId: true,
    });

    return supertest(app)
        .get("/petition")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/thanks");
        });
});

test("Redirect to /petition when attempt to /thanks or /signers  as logged in but not signed", () => {
    cookieSession.mockSessionOnce({
        userId: true,
        signatureId: false,
    });

    return supertest(app)
        .get("/thanks" || "/signers")
        .then((res) => {
            expect(res.statusCode).toBe(302);
            expect(res.headers.location).toBe("/petition");
        });
});
