const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { userModel } = require("../models/user/userModel");

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({usernameField:'email'}, (email, password, done) => {
            userModel.findOne('', email, function(err, users) {
                if(err) {
                    console.log("error");
                    throw err;
                }

                // console.log(users);
                if(!users[0]) {
                    return done(null, false, {message : 'Wrong username/password'});
                } 

                let user = users[0];

                if(user.is_locked) {
                    return done(null, false, {message : 'This account has been locked'});
                }

                // match password
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err) throw err;

                    if(isMatch) {
                        return done(null, user)
                    } else {
                        console.log("Incorrect Password");
                        return done(null, false, {message: 'Wrong username/password',errors : ['Incorrect Password']});
                    }

                })
            })

        })
    )

    passport.serializeUser(function(user, done) {
        return done(null, user.user_id);
    });

    passport.deserializeUser(function(user_id, done) {
        userModel.findById(user_id, function(err, user) {
            return done(err, user);
        });
    });
}