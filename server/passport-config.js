const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const asyncHandler = require("express-async-handler");
const User = require("./models/User")

passport.use(
    new LocalStrategy(asyncHandler(async (username, password, done) => {
        const user = await User.findOne({ username: username });
        if (!user) {
            return done(null, false, { message: "Incorrect username" });
        };
        if (user.password !== password) {
            return done(null, false, { message: "Incorrect password" });
        };
        return done(null, user);
    }))
);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch(err) {
        done(err);
    };
});

module.exports = passport;