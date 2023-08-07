require('dotenv').config()
const path = require('path');

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors"); 

const passport = require("passport")
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bodyParser = require("body-parser");
const createError = require('http-errors');


const adminRouter = require("./routes/admin");
const apiRouter = require("./routes/api");
const userRouter = require("./routes/user");

const app = express(); 

const mongoDB = process.env.MONGODB_URI;
mongoose.connect(
  mongoDB,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(() => {
  console.log("mongoose is conncected")
}).catch((err) => console.log(err));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(
  cors({
    origin: process.env.CLIENT_HOST_ORIGIN, 
    credentials: true,
  })
);
app.use(
  session({ 
    secret: process.env.SECRET_KEY, 
    resave: true, 
    saveUninitialized: true 
  })
);
app.use(cookieParser(process.env.SECRET_KEY));
app.use(passport.initialize());
app.use(passport.session());
require("./passport-config")(passport);

app.use(express.static(path.resolve(__dirname, 'public')));

app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(res.locals.message)
  console.log(res.locals.error.status)
  console.log(res.locals.error.stack)
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
