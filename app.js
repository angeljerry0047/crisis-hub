const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fileUpload = require('express-fileupload');
const passport  = require('passport');

const flash = require('connect-flash');
var MySQLStore = require('express-mysql-session')(session);

require("./config/passport")(passport);

// middleware
const { notifications } = require("./config/globalMiddleware");

// connection pool
const connection = require("./db");

// router
const userRouter = require("./routes/user/userRoute");
const router = require("./routes/events/eventsRoute");

// config dotenv module
require('dotenv').config();

// express app instance
const app = express();

// add file upload middleware
app.use(fileUpload());

// templating engine
app.set('view engine', 'ejs');

// static files 
app.use("/static/", express.static(path.join(__dirname, '/views')));
app.use("/uploads/", express.static(path.join(__dirname, '/uploads')));

// http request body parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// configure session
var options = {
    host:process.env.HOST,
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    database:process.env.DB_NAME
};

var sessionStore = new MySQLStore(options, connection);

app.use(session({
    secret:'azsADD1hdjdunGLhdjd',
    resave:true,
    saveUninitialized:false,
    store:sessionStore,
    cookie:{ path: '/', httpOnly: true, secure: false, maxAge: null },
}));

// configure passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error  = req.flash('error');

    next();
});

// configure the routes
app.use(notifications);
app.use('', userRouter);
app.use('', router);

app.get('*', function(req, res){
    res.render('pages/404', {
        notifications:[],
        user:req.user || {},
        section:'404'
    });

    // res.status(404).send('what???');
});

// listen on a given port
app.listen(process.env.PORT, function() {
    console.log("Application listening at port " + process.env.PORT);
});
