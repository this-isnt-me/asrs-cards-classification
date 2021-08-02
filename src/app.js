require('dotenv').config();
//NPM Packages
const express				= require('express');
const request 				= require('request');
const path 					= require('path');
const mongoose  			= require('mongoose');
const bodyParser 			= require("body-parser");
const passport				= require("passport");
const cookieParser 			= require("cookie-parser");
const LocalStrategy 		= require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const methodOverride 		= require("method-override");
const flash 				= require("connect-flash");
const helmet 				= require('helmet');

//My Packages
const alphaFunc 			= require('../public/functions/functions.js');
const indexRoutes			= require('../routes/index.js');
const uploadRoutes			= require('../routes/upload.js');
const classRoutes			= require('../routes/classifier.js');

//const address				= process.argv[2];
const publicDir 			= path.join(__dirname,'../public');
const viewsPath 			= path.join(__dirname,'../templates/views');
const partialsPath 			= path.join(__dirname,'../templates/partials');

const app	= express();
const port 	= process.env.PORT || 3000;


// assign mongoose promise library and connect to database
mongoose.Promise = global.Promise;
const databaseUri = process.env.MONGO_DATABASE_CONNECT;
mongoose.connect(databaseUri, {
	useNewUrlParser: true,
	useUnifiedTopology: true
	})
    .then(() => console.log(`Database connected`))
    .catch(err => console.log(`Database connection error: ${err.message}`
));


//define paths to templates and using Handlebars
app.set("view engine", "ejs");
app.use(express.static(publicDir));
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(cookieParser('secret'));
//require moment
//app.locals.moment = require('moment');

// PASSPORT CONFIGURATION
// app.use(require("express-session")({
//     secret: process.env.PASSPORT_CONFIG,
//     resave: false,
//     saveUninitialized: false
// }));

// app.use(flash());
// app.use(passport.initialize());
// app.use(passport.session());
// passport.use(new LocalStrategy(User.authenticate()));
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// app.use(function(req, res, next) {
//     res.locals.currentUser = req.user;
//     res.locals.success = req.flash('success');
//     res.locals.error = req.flash('error');
//     next();
// });uploadRoutes

app.use("/", indexRoutes);
app.use("/class", classRoutes);
app.use("/upload", uploadRoutes);

app.listen(port, function() {	
    console.log("The Server Has Started on Port "  + port);
});

// app.listen(process.env.PORT, process.env.IP, function() {
//     console.log("The Server Has Started!");
// });