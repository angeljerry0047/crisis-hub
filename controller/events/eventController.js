// get event model
const { eventLocationModel, eventDescriptionModel, eventMedia} = require("../../models/events/eventsModel");
const { userModel, notificationModel, followerModel } = require("../../models/user/userModel");
const { request } = require("express");
const { reportAccount } = require("../user/userController");
const { v4: uuidv4 } = require('uuid');
const { text } = require("body-parser");
const transporter = require('../../services/emailService');

exports.getEventsList = function(req, res) {
    console.log("Admin");
    eventLocationModel.getEventList(function(err, events) {
        if(err)  throw err;

        res.render("pages/event_list", {
            events:events,
            user:req.user,
            section:"Events List",
            notifications:req.notifications
        });

    });
}

exports.getContributionList = function(req, res) {
    console.log("Admin");
    eventLocationModel.getContributionList(function(err, events) {
        if(err)  throw err;

        res.render("pages/event_list", {
            events:events,
            user:req.user,
            section:"Contribution List",
            notifications:req.notifications
        });

    });
}

exports.getAllEvents = function(req, res) {
    console.log(req.query);
    // console.log(req.body);
    let query = req.query;
    console.log(query);

    if(req.user && req.user.is_admin) {
        // 
        console.log("Admin");
        eventLocationModel.getAllEvents(query, function(err, events) {
            if(err) {
                res.send(err);
            }

            eventLocationModel.getPostedContributions(function(err, contribution) {
                if(err) {
                    res.send(err);
                }

                let eventsList = [...events, ...contribution];
                addMediaFiles(eventsList);
            });
            
        });
    } else {
        console.log("Basic Users");
        eventLocationModel.getPostedEvents(query, function(err, events) {
            if(err) {
                res.send(err);
            }

            eventLocationModel.getPostedContributions(function(err, contribution) {
                if(err) {
                    res.send(err);
                }

                let eventsList = [...events, ...contribution];
                addMediaFiles(eventsList);
            });
           
        });
    }

    function addMediaFiles(events) {

        // console.log("Evnts: ",events);

        // return res.send(events);

        eventMedia.getAllMedia(function(err, mediaEntries) {
            if(err) {
                res.send(err);
            }

            let allEvents = events.reduce((r, a) => {
                r[a.event_id] =  r[a.event_id] || [];
                r[a.event_id].push(a);

                return r;
            }, Object.create(null));

            let descriptionMedia = mediaEntries.reduce((r, a) => {
                r[a.description_id] =  r[a.description_id] || [];
                r[a.description_id].push(a);

                return r;
            }, Object.create(null));

            // combine the two datasets
            for (const key in allEvents) {
                let event = allEvents[key]
                // console.log(event);
                event.forEach(ev => {
                    let media = descriptionMedia[ev.description_id];

                    if(media) {
                        ev.media =  media;
                    } else {
                        ev.media = [];
                    }
                });
            }

            

            // convert the object to flat array
            let eventsArray = [];
            for (const key in allEvents) {
                let event = allEvents[key];

                let mainEvent = event.find(ev => ev.is_contribution == 0);
                if(mainEvent) {
                    let contribution = event.filter(ev => ev.is_contribution == 1);

                    mainEvent.contribution = contribution;

                    eventsArray.push(mainEvent);
                }
                
            }

            res.send(eventsArray);
        });

    }
}

exports.getUnPostedEvents = function(req, res) {
    // create the event location
    eventLocationModel.getUnPostedEvents(function(err, response) {
        if(err) {
            res.send(err);
        }

        // res.send(response);
        res.render("pages/pending_events", {
            events:response,
            user:req.user,
            section:"Pending Events",
            notifications:req.notifications
        });
    });
}

exports.createEventLocation = function(req, res) {
    // console.log(req.body);
    let { street_number } = req.body;
    street_number = street_number ? street_number : null;

    let eventLocation = new eventLocationModel({
        ...req.body.data,
        street_number,
        user_id:req.user.user_id,
        added_by:req.user.username
    });

    // eventLocation.added_by = req.user.username;
    // console.log(eventLocation);

    // create the event location
    eventLocationModel.createEvent(eventLocation, function(err, response) {
        if(err) {
            res.send(err);
        }

        res.send(response);
    });
}

exports.getEventById = function(req, res) {
    // get the route params
    let title = req.params.event_name;
    let event_id = req.params.event_id;
    let { user } = req;

    console.log("Event title");
    console.log(title);

    if(req.user && req.user.is_admin) {
        eventLocationModel.getEventById(title, event_id, function(err, response) {
            if(err) {
                res.send(err);
            }

            // console.log(response);
            if(!response[0]) {
                return res.redirect('/404/page');
            }

            addMediaFiles(response, user, event_id);
            // res.send(response);
        });
    } else {
        eventLocationModel.getPostedEventById(title, event_id, function(err, response) {
            if(err) {
                res.send(err);
            }

            console.log(response);
            if(!response[0]) {
                return res.redirect('/404/page');
            }
            addMediaFiles(response, user, event_id);
            // res.send(response);
        });

    }

    function addMediaFiles(response, user, event_id) {
        eventMedia.getMediaByEventId(event_id, function(err, descriptionMedia) {
            if(err) {
                res.send(err);
            }

            // merge media to respective description id
            response.forEach(event => {
                let media = descriptionMedia.filter(mediaItem => mediaItem.description_id == event.description_id);
                
                event.media = media ? media : [];                
                return event;
            });

            let userContributed = user ? response.find(event => event.user_id == user.user_id) : false;

            let context = {
                event:response.find(event => event.is_contribution == 0),
                contribution:response.filter(event => event.is_contribution == 1),
                user:req.user || {},
                section:'event_details',
                notifications:req.notifications,
                hasContributed:userContributed ? true : false
            }

            // res.send(context);

            // let usersDescription = ["david", "maina"];
            // console.log(context);
            res.render('pages/event_details', context);
        });
        
    }

}

exports.getUnPublishedDescription = function(req, res) {
    // create the event location
    eventDescriptionModel.getUnpublishedEventContribution(function(err, response) {
        if(err) {
            res.send(err);
        }

        res.render("pages/pending_contribution", {
            events:response,
            user:req.user,
            section:"Pending Contribution",
            notifications:req.notifications
        });
    });
}

// event description
exports.createEventDescription = function(req, res) {
    let imageFiles = Object.values(req.files || {});
    console.log(imageFiles);

    let { event_id, start_date, end_date, start_time, end_time } = req.body;

    end_date = end_date ? end_date : null;
    end_time = end_time ? end_time : null;

    start_date = start_date ? start_date : null;
    start_time = start_time ? start_time : null;


    let { username, user_id } = req.user;
    let points = 0;

    // console.log("Create a Description");
    // console.log(req.body);
    let eventDescription = new eventDescriptionModel({
        user_id:user_id,
        ...req.body,
        added_by:req.user.username,
        start_date:start_date,
        start_time:start_time,
        end_date:end_date,
        end_time:end_time
    });

    // update the description object
    eventDescriptionModel.createEventDescription(eventDescription, function(err, response){
        if(err) {
            res.send(err);
        }
        
        // console.log(response);

        // update points by file types
        // let image = imageFiles.find(image => image.mimetype.includes('image'))
        // let video = imageFiles.find(image => image.mimetype.includes('video'))
       

        // update the files;
        // console.log("User Update Points");
        // console.log("Points: " + points);

        insertMediaFiles(response.insertId, imageFiles, event_id, username);
        res.send({message:'success'});       
    });  
}

function followNotification(user_id, username, event_id, eventName, is_contribution) {
    followerModel.getFollowers(user_id, function(err, followers) {
        if(err) throw err;

        console.log(followers);
        console.log(username);

        followers.forEach(follower => {
            userModel.findById(follower.follower_id, function(err, user) {
                if(err) throw err;

                let text = is_contribution ? 'has contributed to an event!' : ' has posted a new event.';
                let notification = new notificationModel({
                    is_read:false,
                    text:`<a href="/event/${eventName}/${event_id}/">${username}  ${text}</a>`,
                    user_id:user.user_id,
                });
            
                notificationModel.addNotification(notification, function(err, response) {
                    if(err) throw err;
                    //
                });
            });
        })
    })
}

function insertMediaFiles(description_id, imageFiles, event_id, username) {
    console.log("Saving Media Files");

    return eventMedia.deleteMedia(description_id, function(err, response) {
        if(err) {
            return;
        }

        imageFiles.forEach(image => {
            let fileName = uuidv4();
            let extension = image.mimetype.split("/")[1];
            let path = './uploads/images/' + fileName + '.' + extension;

            image.mv(path, function(err) {
                if(err) {
                    console.log(err);
                    return ;
                }

                let type = image.mimetype.includes('image') ? 'image': 'video';
                let media = {
                    event_id:event_id,
                    description_id:description_id,
                    type:type,
                    added_by:username,
                    file:path
                }

                let event = new eventMedia(media);

                // create the media
                eventMedia.createMedia(event, function(err, response) {
                    if(err) {
                        console.log("Error while updating file");
                        return res.status(500).send(err);
                    }

                    console.log("Updated File")
                });

            });
        });
    });
}

exports.updateEventDescription = function(req, res) {
    let imageFiles = req.files ? Object.values(req.files) : [];
    console.log(imageFiles);

    let { username, user_id } = req.user;
    let { event_id, description_id, start_date, end_date, start_time, end_time } = req.body;

    end_date = end_date ? end_date : null;
    end_time = end_time ? end_time : null;

    start_date = start_date ? start_date : null;
    start_time = start_time ? start_time : null;


    
    let eventDescription = new eventDescriptionModel({
        user_id:user_id,
        ...req.body,
        added_by:req.user.username,
        start_date:start_date,
        start_time:start_time,
        end_date:end_date,
        end_time:end_time
    });
   
    eventDescriptionModel.updateEventDescription(eventDescription, description_id, function(err, response) {
        if(err) {
            res.send(err);
        }

        insertMediaFiles(description_id, imageFiles, event_id, username);
        res.send(response);
    });
}

exports.getEventDescription = function(req, res) {
    let { description_id } = req.params;

    console.log("Files")
    console.log(description_id);
    eventDescriptionModel.getDescriptionById(description_id, function(err, results) {
        if(err) {
            res.send(err);
        }

        if(!results[0]) {
            res.redirect("404");
            return;
        }

        // console.log(results);
        let context = {
            user:req.user,
            section:'update event',
            event:results[0],
            notifications:req.notifications,
        };
        
        // res.send(context);
        if(context.event.is_contribution) {
            res.render('pages/update_contribution', context);
        } else{
            res.render('pages/update_event', context);
        }
    });

}

exports.addEventDescription = function(req, res) {
    let { event_name, event_id } = req.params;

    eventLocationModel.getEventById(event_name, event_id, function(err, results) {
        if(err) {
            res.send(err);
        }

        console.log(results);

        let context = {
            user:req.user,
            notifications:req.notifications,
            section:'Create Event',
            event:{
                event_name:results[0].event_name,
                event_id:results[0].event_id,
                start_time:'',
                start_date:'',
                end_date:'',
                end_time:'',
                event_description:'',
                is_contribution:1,
            }
        }

        res.render('pages/add_contribution', context);
    });
}

exports.deleteEventContribution = function(req, res, next) {
    let { description_id } = req.params;
    eventDescriptionModel.deleteEventDescription(description_id, function(err, results) {
        if(err) {
            res.send(err);
        }

        eventMedia.deleteMedia(description_id, function(err, results) {
            if(err) {
                res.send(err);
            } 
            
            res.send({'message':'success'})
        });

        // res.send({'message':'success'})
    });
}

exports.deleteEventLocation = function(req, res, next) {
    let { event_id } = req.params;
    eventLocationModel.deleteEventLocation(event_id, function(err, results) {
        if(err) {
            res.send(err);
        }  

        eventDescriptionModel.deleteEventDescriptionByEventId(event_id, function(err, results) {
            if(err) {
                res.send(err);
            }  
            
            eventMedia.deleteMediaByEventId(event_id, function(err, results) {
                if(err) {
                    res.send(err);
                } 

                res.send({'message':'success'})
            });
           
        });
    });
    
}

exports.postEvent = function(req, res, next) {
    let { event_id, description_id, user_id } = req.params;
    let {eventName } = req.body;

    console.log("Hitting url endpoint");
    console.log(eventName);

    eventLocationModel.postEvent(event_id, function(err, results) {
        if(err) {
            res.send(err);
        }  

        // update the main event description 
        eventDescriptionModel.publishEventContribution(description_id, function(err, results) {
            if(err) {
                res.send(err);
            }

            // console.log(results);

            let notification = new notificationModel({
                text:`<a href="/event/${eventName}/${event_id}/">Your event <b>${eventName}</b> has been approved.</a>`,
                user_id:user_id,
                is_read:0
            });
    
            notificationModel.addNotification(notification, function(err, response) {
                if(err) throw err;
    
                // console.log(results);
                // SEND MAIL NOTIFICATION
                userModel.findById(user_id, function(err, user) {
                    if(err) throw err;
        
                    // SEND MAIL NOTIFICATION
                    let message = `Your event on ${eventName} has been approved.`;
                    let email = user.email;
    
                    sendPublishMail(res, email, message);
                    updateUserPoints(event_id, user_id, false);

                    addNotifications(event_id, user, eventName, false);
                    res.send({'message':'success'});
                });
            });

            
        });
        
    });
}

exports.publishContribution = function(req, res, next) {
    let { description_id, user_id } = req.params;
    let {eventName, event_id } = req.body;

    console.log("Hitting url endpoint");
    console.log(eventName);

    eventDescriptionModel.publishEventContribution(description_id, function(err, results) {
        if(err) {
            res.send(err);
        }  

        let notification = new notificationModel({
            text:`<a href="/event/${eventName}/${event_id}/">Your contribution on ${eventName} has been approved.</a>`,
            user_id:user_id,
            is_read:0
        });

        notificationModel.addNotification(notification, function(err, response) {
            if(err) throw err;

            // console.log(results);

            userModel.findById(user_id, function(err, user) {
                if(err) throw err;
    
                // SEND MAIL NOTIFICATION
                let message = `Your contribution on ${eventName} has been approved.`;
                let email = user.email;

                sendPublishMail(res, email, message);
                updateUserPoints(event_id, user_id, true);

                addNotifications(event_id, user, eventName, true);

                res.send({'message':'success'});
            });
        });
        
    });
}

function addNotifications(event_id, user, eventName, is_contribution) {
    if(is_contribution) {
        console.log('Adding notification');
        console.log(user.username);

        eventLocationModel.getEventById("", event_id, function(err, results) {
            if(err) throw err;

            let { user_id, added_by } = results[0];

            let notification = new notificationModel({
                is_read:false,
                text:`<a href="/event/${eventName}/${event_id}">${user.username} has contributed to your event!</a>`,
                user_id,
            });

            notificationModel.addNotification(notification, function(err, response) {
                if(err) throw err;
                // res.send(response);
            });

            followNotification(user.user_id, user.username, event_id, eventName, true);
        });

        // 
    } else {
        followNotification(user.user_id, user.username, event_id, eventName, false);
    }
}

function sendPublishMail(res, email, message) {    
    // mailing options
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Event Published',
        html: message
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
            message:'success'
        });

    });
}

function updateUserPoints(event_id, user_id, is_contribution=false) {
    let points = 0;
    points = !is_contribution ? points + 3 : points + 1;
    eventMedia.getMediaByEventId(event_id, function(err, result) {
        if(err) throw err;

        console.log('Updating Points');
        // console.log(result);
        if(result[0]) {
            let images = result.filter(media => media.type == 'image');
            let videos = result.filter(media => media.type == 'video');

            points = images[0] ? points + 1 : points;
            points = videos[0] ? points + 2 : points;
        }

        userModel.updatePoints(user_id, points, function(err, result) {
            if(err) throw err;

            // console.log(result);
        })
    });
}

// dashboard
exports.dashboard = function(req, res, next) {
    // get pending contribution
    eventLocationModel.getUnPostedEvents(function(err, events) {
        if(err) {
            res.send(err);
        }

        eventDescriptionModel.getUnpublishedEventContribution(function(err, unpublishedContribution) {
            if(err) {
                res.send(err);
            }

            userModel.getAllUsers(function(err, accounts) {
                if(err) {
                    res.send(err);
                }

                userModel.getReportedAccounts(function(err, reportedAccounts) {
                    if(err) {
                        res.send(err);
                    }

                    eventDescriptionModel.getReportedEvents(function(err, reportedEvents) {
                        if(err) {
                            res.send(err);
                        }

                        eventDescriptionModel.getReportedContributions(function(err, reportedContribution) {
                            if(err) {
                                res.send(err);
                            }

                            eventDescriptionModel.getEventsCount(function(err, eventsCount) {
                                if(err) res.send(err);

                                console.log("Events count:", eventsCount);


                                eventDescriptionModel.getContributionCount(function(err, contributionCount){
                                    if(err) res.send(err);

                                    console.log("Contribution count:", contributionCount);
                                    context = {
                                        user:req.user,
                                        unposted_events:events.length,
                                        contribution:unpublishedContribution.length,
                                        accounts:accounts.length,
                                        reportedAccounts:reportedAccounts.length,
                                        reportEvents:reportedEvents.length,
                                        reportedContribution:reportedContribution.length,
                                        section:'Dashboard',
                                        notifications:req.notifications,
                                        eventsCount:eventsCount['COUNT(*)'],
                                        contributionCount:contributionCount['COUNT(*)']
                                    };

                                    res.render('pages/dashboard', context);  

                                });
                            });
                        
                        });
                    });

                });
                
            });
        });
    });     
}

// 
exports.getReportedEvents = function(req, res, next) {
    eventDescriptionModel.getReportedEvents(function(err, result) {
        if(err) {
            res.send(err);
        }

        let context = {
            user:req.user,
            events:result,
            notifications:req.notifications,
            section:'Reported Events'
        };

        res.render("pages/reported_events", context);
    });
}

exports.getReportedContributions = function(req, res, next) {
    eventDescriptionModel.getReportedContributions(function(err, result) {
        if(err) {
            res.send(err);
        }

        let context = {
            user:req.user,
            events:result,
            notifications:req.notifications,
            section:'Reported Contribution'
        };

        res.render("pages/reported_contibution", context);
    })
}

// report events 
exports.reportEvent = function(req, res, next) {
    let { event_name, reason, is_contribution, description_id, event_id } = req.body;

    let report = {
        reported_by:req.user.username,
        event_name:event_name,
        reason:reason,
        is_contribution:is_contribution,
        description_id:description_id,
        event_id:event_id
    };

    eventDescriptionModel.getReportedEventByUsernameAndId(description_id, req.user.username, function(err, result) {
        if(err) {
            res.send(err);
        } 

        if(result && result[0]) {
            let text = is_contribution ? 'You have already reported this Event' : "You have already reported this contribution"
            res.status(200).send({message:text});
        } else {
            eventDescriptionModel.reportEvent(report, function(err, result) {
                if(err) {
                    res.send(err);
                } 
        
                res.status(200).send({message:'Successesfully reported the event'});
            });
        
        }
    });

}

// delete event report
exports.deleteEventReport = function(req, res, next) {
    let { report_id } = req.params;

    eventDescriptionModel.deleteEventReportById(report_id, function(err, result) {
        if(err) {
            res.send(err);
        } 

        res.status(200).send({message:'success'});
    });   
}

exports.getReportedEvent = function(req, res, next) {
    let { report_id } = req.params;

    eventDescriptionModel.getReportedEventById(report_id, function(err, result) {
        if(err) {
            res.send(err)
        }

        let context = {
            user:req.user,
            report:result[0] ? result[0] : {},
            section:'Report Detail',
            notifications:req.notifications,
        };

        res.render("pages/report_details", context)
    });
}

exports.incrementEventViews = function(req, res) {
    let { event_id } = req.body;

    eventDescriptionModel.updateViewsCount(event_id , function(err, result) {
        if(err) throw err;

        res.send({'message':'success'});
    })
}

/*
TODO:
    - Add the pending contribution to hasContributed flag.
*/