//jshint esversion:6
const express = require('express');
const router = express.Router({
    mergeParams: true
});
const bodyParser = require('body-parser');
const userModel = require('../models/userSchema');
const complaintModel = require('../models/citizenSchema');
const flash = require('connect-flash');
const e = require('connect-flash');

router.use(flash());
router.use(bodyParser.urlencoded({
    extended: true
}));
router.post('/verifyByAdmin/:id',(req,res)=>{
    const id = req.params.id;
    userModel.findByIdAndUpdate(id,{verified:'yes'},(err,found)=>{
        if(err) console.log(err);
        else{
            console.log('user Updated!!');
            req.flash('message','User Verified!');
            res.redirect('/admin');
        }
    });
});

router.post('/rejectByAdmin/:id',(req,res)=>{
    const id = req.params.id;
    userModel.findByIdAndDelete({_id:id},(err,found)=>{
        if(err)
        {
            console.log(err);
        }
        else{
            req.flash('message','User Rejected!!');
            res.redirect('/admin');
        }
    });
});
router.post('/deleteByAdmin/:id',(req,res)=>{
    const id = req.params.id;
    userModel.findByIdAndDelete({_id:id},(err,found)=>{
        if(err){
            console.log(err);
        }
        else{
            req.flash('message','User deleted!!');
            res.redirect('/verifiedUsers');
        }
    });
});
router.get('/admin', (req, res) => {
    if(req.isAuthenticated()){
        const data ={};
        data.user = req.user;
         userModel.find({},(err,found)=>{
        if(err) console.log(err);
        else{
            res.render('admin',{user:found,message:req.flash('message'),assign:data.user});
        }
        });
    }
   
});
router.get('/verifiedUsers', (req, res) => {
    if(req.isAuthenticated()){
        const data ={};
        data.user = req.user;
    userModel.find({},(err,found)=>{
        if(err) console.log(err);
        else{
            res.render('adminVerified',{user:found,message:req.flash('message'),assign:data.user});
        }
        });
    }
});

router.get('/assigningOfficer/:username', (req, res) => {
    const usernameAssign = req.params.username;
    if (req.isAuthenticated()) {
        const data ={};
        data.user = req.user;
        userModel.find ({},(err,foundusers)=>{
            if(err) console.log(err);
            complaintModel.find({},(error,foundcomplaints)=>{
                if(err) console.log(error);
                res.render('ass',{profile:data.user,users:foundusers,complaints:foundcomplaints,message:req.flash('message'),assignedBy:usernameAssign});
            });
        }).sort({ date: -1 });
       
    } else {
        res.redirect('/');
    }
});


module.exports = router;