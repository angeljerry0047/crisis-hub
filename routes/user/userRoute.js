const express = require("express");
const passport  = require('passport');

const user = require("../../controller/user/userController");
const { isAuthenticated } = require("../../config/auth");
const { allowOnly, accessLevels  } = require("../../config/roles");

const userRouter = express.Router();

userRouter.get("/register", user.register);
userRouter.get("/verify/:token/", user.verifyAccount);
userRouter.get("/login", user.login);
userRouter.get("/logout", function(req, res) {
    req.logout();
    delete req.user;
    
    // req.flash('success_msg','Now logged out');
    res.redirect("/login");
});

userRouter.get("/user_profile/:username/", isAuthenticated, user.userEvents);

userRouter.post("/login", passport.authenticate('local', {
    successRedirect:"/map",
    failureRedirect:"/login",
    failureFlash:true
}));

userRouter.post("/register", user.post_register);
userRouter.get("/accounts", isAuthenticated, allowOnly(accessLevels.admin, user.getAllUsers));
userRouter.post("/lock_account/:username/", isAuthenticated, allowOnly(accessLevels.admin, user.lockAccount))
userRouter.post("/unlock_account/:username/", isAuthenticated, allowOnly(accessLevels.admin, user.unlockAccount))

// referral
userRouter.get("/refer_people", isAuthenticated, user.referPeople)
userRouter.post("/send_invite-email", user.sendEmailInvite);
userRouter.get("/referral/:referral_uuid/", user.getReferral);

// report user account
userRouter.get("/reported-accounts/", isAuthenticated, allowOnly(accessLevels.user, user.getReportedAccounts));
userRouter.post("/report-account/:username/:reported_by/", isAuthenticated, allowOnly(accessLevels.user, user.reportAccount));
userRouter.post("/reported-account/remove/:report_id/",isAuthenticated, allowOnly(accessLevels.admin, user.deleteReport));
userRouter.get("/reported-accounts/:report_id/", isAuthenticated, allowOnly(accessLevels.admin, user.getReportedAccount));


// password reset page
userRouter.get("/forgot_password", user.forgotPassword);
userRouter.post("/forgot_password", user.postForgotPassword);

userRouter.get("/reset_password/:token/", user.resetPassword);
userRouter.post("/reset_password/:token/", user.postResetPassword);

// user account management
userRouter.get("/update_account/", isAuthenticated, allowOnly(accessLevels.user, user.updateUserAccount));
userRouter.post("/update_account/", isAuthenticated, allowOnly(accessLevels.user, user.postUpdateUserAccount));

userRouter.get("/change_password/", isAuthenticated, allowOnly(accessLevels.user, user.changePassword));
userRouter.post("/change_password/", isAuthenticated, allowOnly(accessLevels.user, user.postChangePassword));

userRouter.post("/follow/", isAuthenticated, allowOnly(accessLevels.user, user.follow));
userRouter.post("/unfollow/", isAuthenticated, allowOnly(accessLevels.user, user.unfollow));

userRouter.post("/add_notification/",isAuthenticated, allowOnly(accessLevels.user, user.addNotification));
userRouter.post("/read_notification/:notification_id/", isAuthenticated, allowOnly(accessLevels.user, user.markAsRead));

// userRouter.get("/change_password", isAuthenticated, allowOnly(accessLevels.user, user.changePassword));
// userRouter.post("/change_password", isAuthenticated, allowOnly(accessLevels.user, user.changePassword));
// userRouter.
// userRouter.

module.exports = userRouter;