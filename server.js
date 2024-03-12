//jshint esversion:6
require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const citizenRouter = require('./routes/citizenRouter');
const forgotPassRouter = require('./routes/forgotPassRouter');
const adminRouter = require('./routes/adminRouter');
const assignRouter = require('./routes/assignRouter');
const profileRouter = require('./routes/profileRouter');
const techRouter = require('./routes/techRouter');
const userModel = require('./models/userSchema');
const citizenModel = require('./models/citizenSchema');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const e = require('connect-flash');
const multer = require('multer');
const assert = require('assert');
const { findById } = require('./models/userSchema');
const { json } = require('body-parser');
app.use(flash());
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

 mongoose.connect(process.env.MONGODB_ON, {
     useNewUrlParser: true,  useUnifiedTopology: true
 }).then(()=>{console.log("DB connected!!")}).catch((err)=>{console.log(err)});

// mongoose connect
//mongoose.connect(process.env.MONGODB_LOCAL, {useNewUrlParser: true, useUnifiedTopology: true }).then(()=>{console.log("DB connected!!");}).catch((err)=>{console.log(err);});

passport.use(userModel.createStrategy());
passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());

const storage = multer.diskStorage({
    destination:"public/adhar",
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({
    storage:storage
}).single('adharImg');

app.post('/', upload,(req, res) => {
    const username = req.body.username;
    const age = req.body.age;
    const firstname = req.body.firstName;
    const lastname = req.body.lastName;
    const originalPass = req.body.password;
    const confirmPass = req.body.confirmPass;
    const mobile = req.body.mobile;
    const adharNo = req.body.adharNo;
    const password = req.body.password;
    var reg = /[a-zA-Z]/g;
    if(mobile.length!=10 || adharNo.length!=12 || confirmPass!=originalPass || password.length<8 ||!req.file || !reg.test(firstname) || !reg.test(lastname) || age>99){
       const vec = [];
        if(mobile.length!=10) 
        vec.push("Enter Valid mobile No ");

        if(age>99) 
        vec.push("Enter Valid age");

        if(!reg.test(firstname)) 
        vec.push("first-name should contains only letters");

        if(!reg.test(lastname)) 
        vec.push("Last-name should contains only letters");

        if(adharNo.length!=12)
        vec.push(" Enter Valid Identity No ");

        if(confirmPass!=originalPass)
        vec.push(" Password not Matched ");

        if(password.length<8)
        vec.push(" Password is weak ");

        if(!req.file)
        vec.push(" Select Identity Card ");

        req.flash('message',vec);
       res.redirect('/registration');
    }
    
    
else{
    const userno = new userModel({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        password: req.body.password,
        mobile: req.body.mobile,
        adharNo:req.body.adharNo,
        adharImg:req.file.filename,
        age:req.body.age,
        typeOfPerson: req.body.typeOfPerson
    });
    userModel.register(userno, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            const data = {};
            data.user = req.user;
            console.log(user);
            req.flash('message','this user is already present');
            res.render('registration', {
                user, message:req.flash('message')
            });
        } else {
            passport.authenticate('local')(req, res, () => {
                userModel.findOne({username:username},(err,found)=>{
                    if(err){
                        console.log("no such user!!");
                    }
                    if(found.typeOfPerson === "citizen")res.redirect('/citizen/'+ username);
                    if(found.typeOfPerson === "assigningOfficer")
                    {   if(found.verified === 'yes')  res.redirect('/assigningOfficer/' + username);
                        else{
                            req.flash('message','Verification Takes some days!');
                            res.redirect('/registration');
                        }   
                    }
                    // if(found.typeOfPerson === "admin")res.redirect('/admin');
                   else if(found.typeOfPerson === "technician")
                   {   if(found.verified === 'yes')  res.redirect('/technician/'+ username);
                   else{
                       req.flash('message','Verification Takes some days!');
                       res.redirect('/registration');
                   }   
               }
                });
                
            });
        }
    });
}   
});
app.post('/login', (req, res) => {
    const username = req.body.username;
    const userno = new userModel({
        username: req.body.username,
        password: req.body.password
    });
    req.login(userno, (err) => {
        if (err) {
            console.log(err);
        }
        // else if(!user){
        //     req.flash('message','No such user found!');
        //     res.redirect('/');
        // }
        
        else if(req.body.inputCaptcha === req.body.captcha){
            passport.authenticate('local',{failureRedirect:'/login',failureMessage: req.flash('message','Enter correct info')})(req, res, () => {
                userModel.findOne({username:username},(err,found)=>{
                    
                    if(found.typeOfPerson === "citizen")res.redirect('/citizen/' + username);
                    if(found.typeOfPerson === "assigningOfficer")
                    {   if(found.verified === 'yes')  res.redirect('/assigningOfficer/' + username);
                    else{
                        req.flash('message','Verification Takes some days!');
                        res.redirect('/');
                    }   
                }
                    // if(found.typeOfPerson === "admin")res.redirect('/admin');
                   else if(found.typeOfPerson === "technician")
                   {   if(found.verified === 'yes')  res.redirect('/technician/'+ username);
                   else{
                       req.flash('message','Verification Takes some days!');
                       res.redirect('/');
                   }   
               }
                });
               // userModel.findOne({password:password})
                
            });
        }
        else if(req.body.inputCaptcha != req.body.captch){
            req.flash('message','Invalid Captcha');
            res.redirect('/login');
        }
    });
});
// app.get('/assignOff', (req, res) => {
//     if (req.isAuthenticated()) {
//         const data ={};
//         data.user = req.user;
//         res.render('Assigning',{profile:data.user});
//     } else {
//         res.redirect('/');
//     }
// });
// app.get('/technician/:username', (req, res) => {
//     if (req.isAuthenticated()) {
//         const data ={};
//         data.user = req.user;
//         res.render('technician',{profile:data.user});
//     } else {
//         res.redirect('/');
//     }
// });

app.get('/:type/:username/about',(req,res)=>{
    const type=req.body.type;
    const username=req.body.username;
    if(req.isAuthenticated()){
        const data ={};
        data.user = req.user;
        res.render('about us',{user:req.user,type:type,username:username});
    }
});
app.get('/:type/:username/contact',(req,res)=>{
    if(req.isAuthenticated()){

    }
});

app.get('/logout', (req, res, next)=>{
    req.logout((err)=> {
      if (err) { return next(err); }
      else{
          req.flash('message','You have been log Out!!');
           res.redirect('/login');
      }
     
    });
  });
app.get('/login', (req, res) => {
    res.render('login vth password',{message:req.flash('message')});
});

app.get('/forgotUsername', (req, res) => {
    res.render('forgot username');
});
app.get('/forgotUsername', (req, res) => {
    res.render('forgot username');
});

app.get('/registration', (req, res) => {
    res.render('registration',{message:req.flash('message')});
});
app.get('/about', (req, res) => {
    res.render('about us');
});
app.get('/contact', (req, res) => {
    res.render('contact');
});
app.get('/', (req, res) => {
    res.render('home');
});
app.get('/status', (req, res) => {
    res.render('status',{complaint:"",assignedTo:"",message:req.flash('message')});
});
app.post('/status', (req, res) => {
    const id = req.body.statusId;
    citizenModel.findOne({complaintId:id},(err,found)=>{
        if(err)console.log(err);
       else if(!found){
            req.flash('message','Invalid Complaint Id!!');
            res.redirect('/status');
        }else{
        userModel.findOne({username:found.assignedTo},(err,foundUser)=>{
            
            if(err) console.log(err);
            else{
                res.render('status',{complaint:found,assignedTo:foundUser,message:req.flash('message')});
            }
        });
    }
    });
});
app.get('/techHome', (req, res) => {
    userModel.find({typeOfPerson:"technician"},(err,found)=>{
        if(err) console.log(err);
        else{
            res.render('techHome',{user:found});
        }
    });
    
});
app.get('/offHome', (req, res) => {
    userModel.find({typeOfPerson:"assigningOfficer"},(err,found)=>{
        if(err) console.log(err);
        else{
            res.render('offHome',{user:found}); 
        }
    });
});

app.use(citizenRouter);
app.use(forgotPassRouter);
app.use(adminRouter);
app.use(assignRouter);
app.use(techRouter);
app.use(profileRouter);

const port = process.env.PORT||3000;
app.listen(port, () => {
    console.log('Server running at port 3000');
});