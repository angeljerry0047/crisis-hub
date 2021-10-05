const express = require("express");
const events = require("../../controller/events/eventController");
const { isAuthenticated } = require("../../config/auth");
const { allowOnly, accessLevels  } = require("../../config/roles");

// express route
var router = express.Router();

// event location path
router.get("/dashboard",isAuthenticated, allowOnly(accessLevels.admin, events.dashboard));
router.get("/events", events.getAllEvents);
router.post("/create_event_location/", events.createEventLocation);
router.get("/event/:event_name/:event_id/", events.getEventById);
router.get("/event/update/:event_name/:description_id/", events.getEventDescription);
router.get("/event/add-description/:event_name/:event_id/", events.addEventDescription);
router.post('/event/update_count/', events.incrementEventViews);
router.get("/event_list/", isAuthenticated, allowOnly(accessLevels.admin, events.getEventsList))
router.get("/contribution_list/", isAuthenticated, allowOnly(accessLevels.admin, events.getContributionList))

// description path
router.post("/create_event_description/", isAuthenticated, events.createEventDescription);
router.post("/update_event_description/", isAuthenticated, events.updateEventDescription);

// default path
router.get("/", (req, res, next) => {
    res.render("pages/index", {
        user:req.user || {}, 
        section:"home", 
        notifications:[]
    });
});

router.get("/map", (req, res) => {
    let context = {
        section:'map',
        user:req.user || {},
        notifications:req.notifications
    };
    
    res.render("pages/map", context)
});


router.get("/pending_events", isAuthenticated, allowOnly(accessLevels.admin, events.getUnPostedEvents));
router.get("/pending_contribution", isAuthenticated, allowOnly(accessLevels.admin, events.getUnPublishedDescription));

// delete or update events
router.post("/post_event/:event_id/:description_id/:user_id/", isAuthenticated, allowOnly(accessLevels.admin, events.postEvent))
router.post("/delete_event/:event_id/", isAuthenticated, allowOnly(accessLevels.admin, events.deleteEventLocation))

// contribution
router.post("/publish_contribution/:description_id/:user_id/", isAuthenticated, allowOnly(accessLevels.admin, events.publishContribution))
router.post("/delete_contribution/:description_id/", isAuthenticated, allowOnly(accessLevels.admin, events.deleteEventContribution))

// reporting
router.get('/reported-events/', isAuthenticated, allowOnly(accessLevels.user, events.getReportedEvents));
router.get('/reported-contributions/', isAuthenticated, allowOnly(accessLevels.user, events.getReportedContributions));

router.post('/report-event/', isAuthenticated, allowOnly(accessLevels.user, events.reportEvent));
router.post('/report-events/delete/:report_id/', isAuthenticated, allowOnly(accessLevels.admin, events.deleteEventReport));
router.get('/reported-events/:report_id/', isAuthenticated, allowOnly(accessLevels.user, events.getReportedEvent));

module.exports = router;

// TODO:
// Add author access to delete routes.