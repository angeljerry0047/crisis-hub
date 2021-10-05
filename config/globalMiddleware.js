const { notificationModel } = require("../models/user/userModel");

module.exports = {
    accounts:function(req, res, next) {
        if(req.isAuthenticated() && req.user.is_admin) {
            // console.log("Authenticated");
            // get users
            // get pending events
            // get pending contribution
            // get notification
            return next();
        } 
    },
    notifications:function(req, res, next) {
        if(req.isAuthenticated()) {
            // get user notifications
            notificationModel.getUserNotification(req.user.user_id, function(err, result) {
                if(err) throw err;

                req.notifications = result;
                next();
            });
        } else {
            req.notifications = [];
            next();
        }
    }
}
