const { userModel, referralModel, tokenModel, followerModel, notificationModel} = require("../../models/user/userModel");
const { eventLocationModel, eventDescriptionModel, eventMedia} = require("../../models/events/eventsModel");

const { toDatetime } = require("../../services/timeFormat");
const bcrypt = require('bcrypt');
const passport  = require('passport');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require("nodemailer");
const { response } = require("express");

const transporter = require('../../services/emailService');
// config dotenv module
require('dotenv').config();

// nodemailer transport layer
// let transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASSWORD
//     },
//     tls: {rejectUnauthorized: false}
// });

exports.login = function(req, res) {
    console.log(req.flash('message'));

    res.render("pages/login", {
        notifications:[],
        user:{},
        section:'login'
    });
}

exports.register = function(req, res){
    console.log(req.session.referral_uuid);
    res.render("pages/register", {
        username:'',
        email:'',
        email2:'',
        country:'',
        password:'',
        password2:'',
        notifications:[],
        user:{},
        section:'register'
    });
}

// post request
exports.post_register = function(req, res, next) {
    const { username, email, email2, country, password, password2 } = req.body;
    let errors = [];

    // Validate the input fields
    if(!username || !email || !country || !password || !password2) {
        errors.push({msg : "Please fill in all fields"})
    }

    if(email != email2) {
        errors.push({msg:'Emails do not match'});
    }

    if(password != password2) {
        errors.push({msg:'Passwords do not match'});
    }

    // check password length
    if(password.length < 8) {
        errors.push({msg:'Password should have 8 character or more'});
    }

    // check if we have a user the given username
    if(errors.length > 0) {
        res.render('pages/register', {
            errors:errors,
            username:username,
            email:email,
            email2:email2,
            country:country,
            password:password,
            password2:password2,
            notifications:[]
        });
    } else {
        // check id user with the submited name or email exists in the database
        userModel.findOne(username, email, function(err, response) {
            if(err) throw err;

            if(response[0]) {
                let users = [...response];
                users.forEach(user => {
                    if(user.username == username) {
                        errors.push({msg: 'username already registered'});
                    } 

                    if(user.email == email) {
                        errors.push({msg: 'email already registered'});   
                    }
                });        
                
                res.render('pages/register', {
                    errors:errors,
                    username:username,
                    email:email,
                    email2:email2,
                    country:country,
                    password:password,
                    password2:password2,
                    notifications:[]
                });
            } else {
                // user instance
                let user = new userModel({
                    username:username,
                    email:email,
                    country:country,
                    password:password,
                });

                // token instance
                let currentDate = new Date();
                currentDate.setHours(currentDate.getHours() + 24)

                // create the token
                let token = new tokenModel({
                    token:uuidv4(),
                    email:user.email,
                    expiration:toDatetime(currentDate),
                    is_expired:false
                });


                // encrypt password
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(user.password, salt, function(err, encrypted_password) {
                        if(err) throw err;

                        // update with the encrypted data
                        user.password = encrypted_password;

                        // add the data to the database
                        userModel.createUser(user, function(err, response) {
                            if(err) throw err;
                            
                            // get the 
                            if(req.session.referral_uuid) {
                                let { referral_uuid } = req.session;

                                // get the referral link by id
                                referralModel.checkReferalId(referral_uuid, function(err, response) {
                                    if(err) throw err;

                                    // get the user id
                                    let { userId } = response[0];

                                    // add 10 points to the user
                                    userModel.updatePoints(userId, 10, function(err, results) {
                                        if(err) res.send(err);

                                        delete req.session.referral_uuid;

                                        // inactivate the referral link
                                        referralModel.inActivateCode(referral_uuid, function(err, results) {
                                            if(err) res.send(err);

                                            // flash message
                                            req.flash('success_msg','You have now registered!')

                                            // redirect the user to login page
                                            // res.redirect("/login");

                                            res.status(200).send("Check your email for an activation link");


                                            tokenModel.createToken(token, function(err, result) {
                                                if(err) throw err;

                                                // send a verification mail
                                                sendVerificationMail(res, user.email, token.token);
                                            });

                                            
                                        });

                                       
                                    })
                                });
                            } else {
                                // flash message
                                req.flash('success_msg','You have now registered!')

                                tokenModel.createToken(token, function(err, result) {
                                    if(err) throw err;

                                    // send a verification mail
                                    sendVerificationMail(res, user.email, token.token);

                                    res.status(200).send("Check your email for an activation link");
                                });
                                
                            }                           

                            
                        })

                    })
                });
            }

            
        });
    }
    
}


function sendVerificationMail(res, email, token) {
    console.log("" + process.env.DOMAIN+ ":"+ process.env.PORT +"/verify/" + token);
    
    const markUp = "<p>You have successfully registered with us</p>" +
    "<p>Click the link  below to activate your account</p>" +
    "<div><a href='" + process.env.DOMAIN+ ":"+ process.env.PORT +"/verify/" + token + "' style='text-decoration:none; background-color:#477CD8; color:white; padding:0.5em 0.75em'>Verify Account</a></div>";

    // mailing options
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Account Verification',
        html: markUp
    }

    transporter.sendMail(mailOptions, function(err, info) {
        console.log("Response");
        if(err) {
            console.log("Response: "+ err);
            res.status(500).send({
                error:err
            });

            return;
        }

        // add the entry to the database
        console.log("response: " + info.response);
        res.status(200).send({
            message:'An email has been sent with a link to verify your account !'
        });

    });
}

exports.verifyAccount = function(req, res) {
    // get the token
    let { token } = req.params;

    console.log(token);
    
    // validate the token
    tokenModel.isActiveToken(token, function(err, token) {
        if(err) throw err;

        if(token[0]) {
            console.log("Activation link");
            console.log(token);
             // expire the token
            tokenModel.updateToken(token, function(err, result) {
                if(err) throw err;

                let { email } = token[0];

                // update account active status
                userModel.updateIsActive(email, function(err, response) {
                    if(err) throw err;

                    userModel.findOne('', email, function(err, userResponse) {
                        if(err) throw err;
                        
                        let user = userResponse[0] ? userResponse[0] : {};

                        // create a notification 
                        let notification = new notificationModel({
                            text:`<a href="/user_profile/${user.username}/">Congratulations! Your account has been activated</a>`,
                            user_id:user.user_id,
                            is_read:0
                        });
    
                        notificationModel.addNotification(notification, function(err, result) {
                            if(err) throw err;
    
                            // redirect to login
                            res.redirect("/login")
                        });
                    });

                    
                });

            })
        } else {
            // invalid link response
            return res.send("<h1>Invalid link!<h1>");
        }
    });

   
    
}

// authenticate user using passport local strategy
exports.post_login = function(req, res, next) {
    console.log("Loggging In");

    res.redirect('/map');
    
    // passport.authenticate('local',{
    //     successRedirect : '/map',
    //     failureRedirect : '/login',
    //     failureFlash : true,
    // });
}

exports.getAllUsers = function(req, res) {
    // create the event location
    userModel.getAllUsers(function(err, response) {
        if(err) {
            res.send(err);
        }

        console.log("Notifications");
        console.log(req.notifications);
        res.render('pages/accounts', {
            users:response,
            user:req.user,
            section:'Accounts',
            notifications:req.notifications
        });
    });
}
    
exports.userEvents = function(req, res) {
    let username = req.params.username;

    console.log("Notifications");
    console.log(req.notifications);

    if(req.user.is_admin) {
        eventLocationModel.getEventByUser(username, function(err, events) {
            if(err) {
                return res.redirect('404'); 
                // res.send(err);
            }

            // if(!events[0]) {
            //     return res.redirect('404');   
            // }

            userModel.findUserByUsername(username, function(err, users) {
                if(err) throw err;

                if(!users[0].username) return res.redirect('/404');
                addMediaFiles(events);
            });
           
        });   
    } else {
        eventLocationModel.getEventByUser(username, function(err, events) {
            if(err) {
                res.send(err);
                // return res.redirect('404'); 
            }

            userModel.findUserByUsername(username, function(err, users) {
                if(err) throw err;

                if(!users[0].username) return res.redirect('/404'); 
                addMediaFiles(events);
            });

            
        });    
    }
    
    function addMediaFiles(events) {

        // user events
        let results = events;
        // console.log(results.map(ev => ev.added_by));

        // user events and contributed events
        // following and followers
        eventMedia.getAllMedia(function(err, descriptionMedia) {
            if(err) {
                res.send(err);
            }

            // merge media to respective description id
            results.forEach(event => {
                let media = descriptionMedia.filter(media => media.description_id == event.description_id);
                
                event.media = media ? media.find(md => md.type == 'image') : {};
                return event;
            });

            // 

            userModel.findUserByUsername(username, function(err, userprofile) {
                if(err) {
                    res.send(err);
                }

                // add user profile (points)
                let userId = userprofile[0].user_id;
                userModel.getUserProfile(userId, function(err, profile) {
                    if(err) {
                        res.send(err);
                    }

                    console.log("Following Model");
                    console.log(userId);
                    console.log(req.user.user_id);
                    
                    followerModel.getFollowData(userId, function(err, response) {
                        if(err) throw errr;
                        
                        console.log("User Id");
                        console.log(response.find(d => d => d.follower_id == req.user.user_id));

                        let context = {
                            user:req.user,
                            userprofile:userprofile[0],
                            profile:profile[0],
                            notifications:req.notifications,
                            section:'user profile',
                            events:results.filter(event => !event.is_contribution) || [],
                            contributions:results.filter(event => event.is_contribution) || [],
                            followers:response.filter(d => d.user_id == userId),
                            following:response.filter(d => d.follower_id == userId),
                            is_following:response.find(d => d.follower_id == req.user.user_id)
                        };
                        
                        // res.send(context);
                        res.render("pages/user_profile", context);
                    });

                    

                });
                
            });

        });
    }
}

exports.lockAccount = function(req, res, next) {
    let { username } = req.params;
    userModel.lockUserAccount(username, function(err, result) {
        if (err) {
            res.send(err);
        }
        
        res.status(200).send({message:'successfully locked'});
    });
}

exports.unlockAccount = function(req, res, next) {
    let { username } = req.params;
    userModel.unlockUserAccount(username, function(err, result) {
        if (err) {
            res.send(err);
        }
        
        res.status(200).send({message:'successfully locked'});
    });
}


exports.getReportedAccounts = function(req, res, next) {
    userModel.getReportedAccounts(function(err, result) {
        if (err) {
            res.send(err);
        }

        let context = {
            user:req.user,
            section:'Reported Accounts',
            users:result,
            notifications:req.notifications,
        };

        res.render('pages/reported_accounts', context)
    });
}

exports.reportAccount = function(req, res, next) {
    let { username, reported_by } = req.params;
    let { reason } = req.body;

    let report = {
        reported_by:reported_by,
        account_name:username,
        reason:reason
    };

    userModel.getReportedAccountByReportedByReporter(reported_by, username, function(err, result) {
        if(err) {
            res.send(err);
        }

        if(result && result[0]) {
            res.status(200).send({message:'You have already reported this Account'});
        } else {
            userModel.reportAccount(report, function(err, result) {
                if (err) {
                    res.send(err);
                }
                
                res.status(200).send({message:'Successfully reported account'});
            });
        }
    });

}

exports.deleteReport = function(req, res, next) {
    let { report_id } = req.params;

    userModel.deleteReportById(report_id, function(err, result) {
        if (err) {
            res.send(err);
        }
        
        res.status(200).send({message:'successfully deleted the report'});
    });
}

exports.getReportedAccount = function(req, res, next) {
    let { report_id } = req.params;

    userModel.getReportedAccountById(report_id, function(err, result) {
        if (err) {
            res.send(err);
        }

        let context = {
            user:req.user,
            report:result,
            section:'Report Account Detail',
            notifications:req.notifications,
        }

        res.render("pages/reported-accounts-details", context)
    });
}

// SEND REFFERAL mails
exports.referPeople = function(req, res) {
    let context = {
        user:req.user,
        uuid:uuidv4(),
        host:`http://localhost:${process.env.PORT}/`,
        section:'Refer for Points',
        notifications:req.notifications,
    };

    // save the uuid to db
    let referral = new referralModel({
        userId:req.user.user_id,
        uuid:context.uuid
    });

    referralModel.createReferral(referral, function(err, result) {
        if(err) res.send(err);

        res.render("pages/refer_people", context)
    });

}

exports.getReferral = function(req, res) {
    let { referral_uuid } = req.params;

    // check if the uuid exist
    referralModel.checkReferalId(referral_uuid, function(err, result) {
        if(err) {
           res.send(err);
        }

        if(!result[0]) {
            res.status(404).send('Invalid referal link');
            return;
        }

        // store th referall to the session
        req.session.referral_uuid = referral_uuid;

        // redirect the user to login page
        res.redirect("/register");
    })
}

exports.sendEmailInvite = async function(req, res) {
    let { uuid, email } = req.body;

    req.user = {
        username:'mwangi'
    };

    // markup
    const markUp = "<p><b>" + req.user.username + "</b> is inviting you to join World Event Tracker. </p>" +
        "<p>Click the link  below to create your account</p>" +
        "<div><a href='"+ process.env.DOMAIN + ":"+ process.env.PORT +"/referral/" + uuid + "' style='text-decoration:none; background-color:#477CD8; color:white; padding:0.5em 0.75em'>Join Now</a></div>";

    // mailing options
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Invitation to World Event Tracker',
        html: markUp
    }

    console.log("Sending Mail");

    transporter.sendMail(mailOptions, function(err, info) {
        console.log("Response");
        if(err) {
            console.log("Response: "+ err);
            res.status(500).send({
                error:err
            });

            return;
        }

        // add the entry to the database
        console.log("response: " + info.response);
        res.status(200).send({
            message:'Mail Successfully sent'
        });

    });
}

// add the uuid to the database
exports.commitLink = function(req, res) {
    // 
}

// update user profile
exports.updateUserAccount = function(req, res) {
    // get user profile
    userModel.getUserProfile(req.user.user_id, function(err, response) {
        if(err) throw err;

        let context = {
            section:"",
            notification:[],
            user:{...req.user, ...response[0]},
            notifications:req.notifications,
        };

        req.user.image = context.user.image;
    
        res.render("pages/account/update_account", context);
    });

}

exports.postUpdateUserAccount = function(req, res) {
    // get the data
    let {country, job } = req.body;
    console.log(req.body);
    console.log(req.files);

    let imageFiles = Object.values(req.files);

    console.log(imageFiles);

    // update the user
    userModel.updateUserDetails(req.user.user_id, country, function(err, result) {
        if(err) throw err;

        if(imageFiles.length > 0) {
            let image = imageFiles[0];
            
            // console.log(image);

            let fileName = uuidv4();
            let extension = image.mimetype.split("/")[1];
            let path = './uploads/profile/' + fileName + "." + extension;

            image.mv(path, function(err) {
                if(err) {
                    console.log(err);

                    // let the user know the image were not uploaded
                    return ;
                }

                updateProfile(path);
            });

        } else {
            let image = req.user.image;

            // update the profile
            updateProfile(image);
        }   

        function updateProfile(image) {
            userModel.updateProfile(req.user.user_id, job, image, function(err, result) {
                if(err) throw err;

                // message for account update

                // redirect to account profile
                return res.redirect("/user_profile/" + req.user.username);
            });
        }
    });
   
}

exports.changePassword = function(req, res) {
    let context = {
        section:"",
        notification:[],
        user:req.user,
        errors:[],
        old_password:"",
        password:"",
        password2:"",
        notifications:req.notifications,
    };

    res.render("pages/account/change_password", context);
}

exports.postChangePassword = function(req, res) {
    let { old_password, password, password2 } = req.body;
    console.log(req.body);

    let errors = [];

    // compare the old password with the one saved on the db
    bcrypt.compare(old_password, req.user.password, (err, isMatch) => {
        if(err) {
            throw err;
        };

        if(!isMatch) {
            errors.push({msg:"Incorrect Password"});
            console.log('Incorrect Password');
        }

        // check if the two password are similar
        if(password != password2) {
            errors.push({msg:"Passwords do not match"});
        }

        if(password.length < 8) {
            errors.push({msg:"Password should have 8 characters or more"});
        }

        let context  = {
            errors,
            old_password,
            password,
            password2,
            notifications:req.notifications,
        };

        if(errors.length > 0) {
            console.log(errors);
            res.render("pages/account/change_password", context);
        } else {
            // encrypt the password
            bcrypt.genSalt(10, function(err, salt) {
                bcrypt.hash(password, salt, function(err, encrypted_password) {
                    if(err) throw err;

                    // save to db redirect to profile 
                    userModel.updatePassword(encrypted_password, req.user.email, function(err, response) {
                        if(err) throw err;

                        let notification = new notificationModel({
                            text:`<a href="/user_profile/${req.user.username}/">Your password has been successfully changed!</a>`,
                            user_id:req.user.user_id,
                            is_read:0
                        });

                        notificationModel.addNotification(notification, function(err, result) {
                            if(err) throw err;

                            res.redirect("/user_profile/" + req.user.username);
                        });

                        
                    });

                })
            });
        }
    });
   
}

// forgot password
exports.forgotPassword = function(req, res) {
    console.log(req.user);

    // 
    let context = {
        section:"",
        notifications:[],
        user:undefined
    };

    res.render("pages/account/forgot_password", context);
}

exports.postForgotPassword = function(req, res) {
    let { email } = req.body;

    // check if the mail is registered to a user
    userModel.findOne('', email, function(err, users) {
        if(err) throw err;
        
        if(users[0]) {
            // token expiry date
            let currentDate = new Date();
            currentDate.setHours(currentDate.getHours() + 24);
            
            // create a token
            let token = new tokenModel({
                token:uuidv4(),
                email:users[0].email,
                expiration:toDatetime(currentDate),
                is_expired:false
            });

            tokenModel.createToken(token, function(err, response) {
                if(err) throw err;

                // send the password recovery to the mail
                sendPasswordForgotLink(res, token.email, token.token);
            });

            

        } else {
            let errors = [{msg:"Email is not registered"}];
            let context = {
                errors,
                notifications:[],
                user:undefined,
                section:''
            };

            res.render("pages/account/forgot_password", context);
        }
    });

}

function sendPasswordForgotLink(res, email, token) {
    console.log("http://localhost:"+ process.env.PORT +"/reset_password/" + token);
    
    const markUp = "<p>Click the link  below to to reset your password</p>" +
    "<div><a href='"+ process.env.DOMAIN +":"+ process.env.PORT +"/reset_password/" + token + "' style='text-decoration:none; background-color:#477CD8; color:white; padding:0.5em 0.75em'>Reset Password</a></div>";

    // mailing options
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Reset Account Password',
        html: markUp
    }

    transporter.sendMail(mailOptions, function(err, info) {
        console.log("Response");
        if(err) {
            console.log("Response: "+ err);
            res.status(500).send({
                error:err
            });

            return;
        }

        // add the entry to the database
        console.log("response: " + info.response);

        // on success return a http response
        res.status(200).send("An email has been sent with a link to reset your password");
       
    });
}

// reset password section
exports.resetPassword = function(req, res) {
    // validate the password reset link
    let { token } = req.params;

    tokenModel.isActiveToken(token, function(err, tokenResponse) {
        if(err) throw err;

        if(tokenResponse[0]) {
            let { email, token } = tokenResponse[0];
            req.session.token = tokenResponse[0];

            // render the forgot password commit
            res.render("pages/account/reset_password", 
                {
                    user:undefined, 
                    email, 
                    token, 
                    notifications:[],
                    section:''
                }
            );

        } else {
            res.send("Invalid Link");
        }
    });
    
}

exports.postResetPassword = function(req, res) {
    // extract the user details from the link
    let errors = [];

    console.log("req session");
    console.log(req.session.token);

    console.log(req.body);

    // get the passwrord
    let { password, password2, email, token } = req.body;

    // check if the two password are similar
    if(password != password2) {
        errors.push({msg:"Passwords do not match"});
    }

    if(password.length < 8) {
        errors.push({msg:"Password should have 8 characters or more"});
    }

    let context  = {
        errors,
        password,
        password2
    };

    if(errors.length > 0) {
        return res.render("pages/account/reset_password", context);
    } else {
         // hash the password 
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, function(err, encrypted_password) {
                if(err) throw err;

                console.log("password hash");
                console.log(req.email);

                // save to db redirect to profile 
                userModel.updatePassword(encrypted_password, email, function(err, response) {
                    if(err) throw err;

                    console.log("password update");

                     // update the token
                    tokenModel.updateToken(token, function(err, response) {
                        if(err) throw err;
                        console.log("token update");

                        // redirect to login
                        return res.redirect("/login/");
                    });

                });

            })
        });       
        
    }
    
}

// Following
exports.follow = function(req, res) {
    // get the user_id 
    let { user_id, follower_id } = req.body;

    console.log(req.body);
    console.log("Following");
    console.log(user_id);
    console.log(follower_id);
    console.log("Following");

    let followerInstance = new followerModel({
        user_id,
        follower_id
    });

    followerModel.addFollower(followerInstance, function(err, response) {
        if(err) throw err;

        let notification = new notificationModel({
            text:`<a href="/user_profile/${req.user.username}/">You have a new follower!</a>`,
            user_id:user_id,
            is_read:0
        });

        notificationModel.addNotification(notification, function(err, response) {
            if(err) throw err;

            return res.status(200).send({msg:"Following request successfull"});
        });

    });
}

// unfollow
exports.unfollow = function(req, res) {
    // get the user_id 
    let { user_id, follower_id } = req.body;

    console.log("Unfollowing");
    console.log(user_id);
    console.log(follower_id);
    console.log("Unfollowing");
    
    followerModel.deleteFollower(user_id, follower_id, function(err, response) {
        if(err) throw err;

        // console.log(response);
        return res.status(200).send({msg:"Unfollowed request successfull"});
    });
}

// notificaiton
exports.markAsRead = function(req, res) {
    let { text, user_id } = req.body;

    let notification = new notificationModel({
        is_read:false,
        text,
        user_id,
    });

    notificationModel.addNotification(notification, function(err, response) {
        if(err) throw err;

        return res.status(200).send({"msg":"success"});
    });
}

exports.markAsRead = function(req, res) {
    let { notification_id } = req.params;

    notificationModel.markAsRead(notification_id, function(err, response) {
        if(err) throw err; 
        
        return res.status(200).send({"msg":"success"});
    });
}
