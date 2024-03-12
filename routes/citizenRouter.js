//jshint esversion:6
const express = require('express');
const router = express.Router({
    mergeParams: true
});
const bodyParser = require('body-parser');
const citizenModel = require("../models/citizenSchema");
const userModel = require('../models/userSchema');
const flash = require('connect-flash');
const multer = require('multer');
const path = require('path');
var fs = require('fs');
const pdf = require('html-pdf');
const ejs = require('ejs');
// router.use(express.static('public'));
router.use(flash());
router.use(bodyParser.urlencoded({
    extended: true
}));

const storage = multer.diskStorage({
    destination: "public/brokenImg",
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
});

const upload = multer({
    storage: storage
}).single('brokenImg');


router.post('/citizen/:username', upload, (req, res) => {
    const username = req.params.username;
    const myarea = req.body.area;
    const mybuilding = req.body.building;
    const myroom = req.body.room;
    const mysubject = req.body.subject;
    const mycomplaint = req.body.complaint;
    const mycomplaintBy = req.body.complaintBy;
    const str1 = Date().toString().substring(8,10);
    const str2 = Date().toString().substring(4,7);
    const str3 = Date().toString().substring(11,15);
    const str4 = Date().toString().substring(16,18);
    const str5 = Date().toString().substring(19,21);
    const str6 = Date().toString().substring(22,24);
    const str = str1+str2+str3+str4+str5+str6;
    if(myroom>9499){
        req.flash('message', 'Put valid room number!');
        res.redirect('/citizen/' + username);
    }
    if (!myarea || !mybuilding || !myroom || !mysubject || !mycomplaint || !mycomplaintBy || !req.file) {
        req.flash('message', 'All Given Fields are Required!');
        res.redirect('/citizen/' + username);
    } else {

        const citizenComplaint = new citizenModel({
            area: req.body.area,
            building: req.body.building,
            room: req.body.room,
            subject: req.body.subject,
            complaint: req.body.complaint,
            complaintBy: req.body.complaintBy,
            brokenImg: req.file.filename,
            complaintId:str,
        });
        citizenComplaint.save((err, item) => {
            if (err) console.log(err);
            else {
                // res.send(item);
                req.flash('message', 'Complaint has been lodge!');
                res.redirect('/citizen/' + username);
            }
        });

    }

});

router.get('/citizen/:username', (req, res) => {
    if (req.isAuthenticated()) {
        userModel.findOne({
            username: req.params.username
        }, (error, founduser) => {
            if (error) console.log(error);
            else {
                citizenModel.find({}, (err, found) => {
                    if (err) console.log(err);
                    else {
                        userModel.findOne({
                            username: found.assignedTo
                        }, (er, assFind) => {
                            if (er) console.log(er);
                            else {
                                res.render('citi2', {
                                    user: founduser,
                                    message: req.flash('message'),
                                    complaint: found,
                                    assigned: assFind
                                });
                            }
                        });
                    }

                }).sort({
                    date: -1
                });
            }
        });

    } else {
        res.redirect('/');
    }
});
router.post('/deleteComplaint/:itemId/:username', (req, res) => {
    const id = req.params.itemId;
    const username = req.params.username;
    citizenModel.findByIdAndDelete({
        _id: id
    }, (err, found) => {
        if (err) {
            console.log(err);
        } else {
            req.flash('message', 'Complaint has been deleted!');
            res.redirect('/citizen/' + username);
        }
    });
});

router.post('/doneByCiti/:id/:doneBy', (req, res) => {
    const id = req.params.id;
    const by = req.params.doneBy;
    citizenModel.findByIdAndUpdate({
            _id: id
        }, {
            resolvedByCiti: "yes",
            progress: "Person who lodged complaint is satisfied!"
        },
        (err, found) => {
            if (err) console.log(err);
            else {
                req.flash('message', 'Complaint has been marked done!');
                res.redirect('/citizen/' + by);
            }
        });
});

const storage1 = multer.diskStorage({
    destination: "public/issue",
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload1 = multer({
    storage: storage1
}).single('issueImg');

router.post('/issueSend/:id/:doneBy', upload1, (req, res) => {
    const id = req.params.id;
    const by = req.params.doneBy;
    if (!req.file) {
        req.flash('message', 'Select the Image of Issue!');
        res.redirect('/citizen/' + by);
    }
    const issueImg = req.file.filename;
    const issue = req.body.issue;
    if (!issue) {
        req.flash('message', 'Write the details of Issue!');
        res.redirect('/citizen/' + by);
    } else {
        citizenModel.findByIdAndUpdate({
                _id: id
            }, {
                resolvedByTech: "no",
                progress: "Issue Raised by Person who lodged complaint!",
                issue: issue,
                issueImg: issueImg
            },
            (err, found) => {
                if (err) console.log(err);
                else {
                    req.flash('message', 'Issue has been raised!');
                    res.redirect('/citizen/' + by);
                }
            });
    }

});

router.post('/download/:user/:complaint', (req, res) => {
    const user = req.params.user;
    const complaint = req.params.complaint;
    citizenModel.findById(complaint, (err, found) => {

    });
});

module.exports = router;