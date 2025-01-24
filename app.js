var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');
var hbs = require('express-handlebars')
var fileUpload = require('express-fileupload')

var session=require('express-session')
const nocache=require('nocache')
//var db=require('./config/connection');
const { connectDB } = require('./config/connection'); // MongoDB connection function
const bodyParser = require('body-parser');


const { log } = require('console');


var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.engine('hbs', hbs.engine({ extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layout/', partialsDir: __dirname + '/views/partials/' }))






app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(express.static('public'));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//app.use(express.static('public', { maxAge: 0 }));

app.use(express.urlencoded({ extended : false}));
app.use(express.json()); 

app.use(session({secret:"key",cookie:{maxAge:6000000}}))
app.use(nocache());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//db.connect((err)=>{
 //if(err) console.log('connection error'+err)
 // else console.log("database connected")
//})
connectDB().then(() => {
  console.log('MongoDB Connected1');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1); // Stop the server if the DB connection fails
});

async function startApp() {
  await connectDB();
  await initializeAdminCollection('admin@example.com', 'securepassword123'); // Set email and password
}


app.use('/', userRouter);
app.use('/admin', adminRouter);
app.use('/product-images', express.static('public/product-images'));


//app.use((req, res, next) => {
 // res.set('Cache-Control', 'no-store');
 // next();
//});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
