require('dotenv').config()
const path = require('path');

const express = require('express');
const mongoose = require("mongoose");
const cors = require('cors'); 

const logger = require('morgan');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const passport = require('./passport-config');

const adminRouter = require('./routes/admin');
const apiRouter = require('./routes/api');
const userRouter = require('./routes/user');

const app = express(); 
const mongoDB = process.env.MONGODB_URI;
mongoose.set("strictQuery", false);

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
}

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'public')));

app.use(session({ secret: process.env.SECRET_KEY, resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

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
