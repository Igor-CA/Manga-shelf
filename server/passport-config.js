const User = require("./models/User")
const bcrypt = require("bcrypt")
const localStrategy = require("passport-local").Strategy
const asyncHandler = require("express-async-handler")

module.exports = function(passport){
  passport.use(
    new localStrategy(async (username, password, done) => {
        try{
            const user = await User.findOne({username:username})
            if(!user)return done(null, false)
            
            bcrypt.compare(password, user.password, (err, res) => {
                if (res) {
                  return done(null, user)
                } else {
                  return done(null, false, { message: "Incorrect password" })
                }
            })
            
        }catch(err){
            console.log(err)
        }
      })
  )

  passport.serializeUser(function(user, done) {
    console.log("Serialize")
    done(null, user.id);
  });
    
  passport.deserializeUser(async function(id, done) {
    console.log("Deserialize")
      try {
        const user = await User.findById(id);
        const userInfo = {
          username: user.username
        }
        done(null, userInfo);
      } catch(err) {
        done(err);
      };
  });
  /*
    passport.use(
        new localStrategy(async (username, password, done) => {
            try{
                const user = await User.findOne({username:username})
                if (!user) {
                    return done(null, false, { message: "Incorrect username" });
                };
                
                bcrypt.compare(password, user.password, (err, res) => {
                    if (res) {
                      return done(null, user)
                    } else {
                        return done(null, false, { message: "Incorrect password" });
                    }
                })
                
            }catch(err){
                console.log(err)
            }
        })
    )

    passport.serializeUser(function(user, done) {
      console.log("Serialize")
      done(null, user.id);
    });
      
    passport.deserializeUser(async function(id, done) {
      console.log("Deserialize")
        try {
          const user = await User.findById(id);
          const userInfo = {
            username: user.username
          }
          done(null, userInfo);
        } catch(err) {
          done(err);
        };
    });
    */
}

