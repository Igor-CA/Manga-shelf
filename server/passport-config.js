const User = require("./models/User")
const bcrypt = require("bcrypt")
const localStrategy = require("passport-local").Strategy
const asyncHandler = require("express-async-handler")

module.exports = function(passport){
  passport.use(
    new localStrategy(asyncHandler(async (username, password, done) => {
      const user = await User.findOne({username:username})
      if(!user)return done(null, false)
            
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          return done(null, user)
        } else {
          return done(null, false, { message: "Incorrect password" })
        }
      })
    }))
  )

  passport.serializeUser(function(user, done) {
    console.log("Serialize")
    done(null, user.id);
  });
    
  passport.deserializeUser(asyncHandler(async(id, done) =>{
    console.log("Deserialize")
    const user = await User.findById(id);
    const userInfo = {
      _id: user._id,
      username: user.username
    }
    done(null, userInfo);
  }));
  
}

