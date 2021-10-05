const connection = require('../../db.js');
const { response } = require('express');

const userModel = function(user) {
    this.username = user.username;
    this.email = user.email;
    this.country = user.country;
    this.password = user.password
};

const userProfile = function(user) {
    this.points = user.points;
    this.userId = user.userId;
    this.image = user.image;
    this.job = user.job;

}

// login function
userModel.login = function(username, password) {
    connection.query();
}

// register 
userModel.createUser = function(user, result) {
    connection.query('INSERT INTO users SET?', user, function(err, responseUser) {
        if(err) throw err;

        let userprofile = new userProfile({
            points:0,
            userId:responseUser.insertId,
            image:"/profile/user.png",
            job:""
        });

        connection.query('INSERT INTO user_profile SET?', userprofile , function(err, response) {
            if(err) throw err;

            result(null, responseUser);
        });
       
    });
}  

userModel.findOne = function(username, email, result) {
    connection.query('SELECT * FROM users WHERE username = ? OR email = ? AND is_active=?', [username, email, true], function(err, response) {
        if(err) throw err;

        console.log(response);
        result(null, response);
    });
}

userModel.updateUserDetails = function(user_id, country, result) {
    connection.query('UPDATE users SET country=? WHERE user_id=?', [country, user_id], function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.updateIsActive = function(email, result) {
    connection.query('UPDATE users SET is_active=? WHERE email=?', [true, email], function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.updateProfile = function(user_id, job, image, result) {
    connection.query('UPDATE user_profile SET job=?, image=? WHERE userId=?', [job, image, user_id], function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.updatePassword = function(password, email, result) {
    console.log(password);
    console.log(email);

    connection.query('UPDATE users SET password=? WHERE email=?', [password, email], function(err, response) {
        if(err) throw err;

        console.log("password updated");
        console.log(response);
        result(null, response);
    });   
}

userModel.findUserByUsername = function(username, result) {
    connection.query('SELECT user_id, username, email, country, account_type, is_locked, is_admin FROM users WHERE username = ?', [username], function(err, response) {
        if(err) throw err;

        console.log(response);
        result(null, response);
    });
}

userModel.findById = function(user_id, result) {
    connection.query('SELECT * FROM users WHERE user_id = ?', user_id, function(err, response) {
        if(err) throw err;

        result(null, response[0]);
    });
}

userModel.getAllUsers = function(result) {
    connection.query('SELECT * FROM users', function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.getReportedAccounts = function(result) {
    connection.query('SELECT * FROM reported_accounts', function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.getReportedAccountById = function(report_id, result) {
    connection.query('SELECT * FROM reported_accounts WHERE report_id =? ',report_id , function(err, response) {
        if(err) throw err;

        result(null, response[0]);
    });
}

userModel.getReportedAccountByReportedByReporter = function(reportedBy, username, result) {
    connection.query('SELECT * FROM reported_accounts WHERE reported_by=? AND account_name=? ', [reportedBy, username] , function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.deleteReportById = function(report_id, result) {
    connection.query('DELETE FROM reported_accounts WHERE report_id =? ',report_id , function(err, response) {
        if(err) throw err;

        result(null, response[0]);
    });
}

userModel.reportAccount = function(report, result) {
    connection.query('INSERT INTO reported_accounts SET? ', report, function(err, response) {
        if(err) throw err;

        result(null, response[0]);
    });
}

userModel.getReportedAccounts = function(result) {
    connection.query('SELECT * FROM reported_accounts', function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.lockUserAccount = function(username, result) {
    connection.query('UPDATE users SET is_locked=? WHERE username=? ',[true, username] , function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.unlockUserAccount = function(username, result) {
    connection.query('UPDATE users SET is_locked=? WHERE username=? ',[false, username] , function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.getLockedAccounts = function(result) {
    connection.query('SELECT * FROM users WHERE is_locked=?', true, function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

// update points:UPDATE `user_profile` SET `points`= `points` + 10 WHERE `userId` = 8
userModel.updatePoints = function(userId, points, result) {
    connection.query('UPDATE `user_profile` SET `points`= `points` + ? WHERE `userId` = ?', [points, userId], function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

userModel.getUserProfile = function(userId, result) {
    connection.query('SELECT * FROM `user_profile` WHERE `userId` = ?', userId, function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}


// referral model
const referralModel = function(referral) {
    this.uuid = referral.uuid;
    this.userId = referral.userId
};

referralModel.createReferral = function(referral, result) {
    connection.query('INSERT INTO user_referral SET?', referral, function(err, response) {
        if(err) throw err;

        result(null, response);
    });

}

referralModel.checkReferalId = function(referral_uuid, result) {
    connection.query('SELECT * FROM user_referral WHERE uuid = ? AND is_active=?', [referral_uuid, true], function(err, response) {
        if(err) throw err;

        result(null, response);
    });

}

referralModel.inActivateCode = function(uuid, result) {
    connection.query('UPDATE `user_referral` SET `is_active`=? WHERE uuid=?', [false, uuid], function(err, response) {
        if(err) throw err;

        result(null, response);
    })
}

const tokenModel = function(token) {
    this.token = token.token;
    this.email = token.email;
    this.expiration = token.expiration;
    this.is_expired = token.is_expired;
}

tokenModel.createToken = function(token, result) {
    connection.query("INSERT INTO tokens SET?", token, function(err, Response) {
        if(err) throw err;

        result(null, response);
    });   
}

tokenModel.isActiveToken = function(token, result) {
    let time = new Date().toISOString();

    connection.query("SELECT * FROM tokens WHERE token=? AND expiration>?", [token, time], function(err, response) {
        if(err) throw err;

        console.log(response[0]);
        
        result(null, response);
    });
}

tokenModel.updateToken = function(token, result) {
    connection.query("UPDATE tokens SET is_expired=? WHERE token=?", [1, token], function(err, response) {
        if(err) throw err;

        console.log("db token updated");
        console.log("$2b$10$SrC8jXG3/1J3/VRMskjLPu/3s4B9VZUR4Jyz3.cGfIUbM0Y5bEmUW");
        
        console.log(response);

        result(null, response);
    });   
}


const followerModel = function(follow) {
    this.user_id = follow.user_id;
    this.follower_id = follow.follower_id
};

followerModel.addFollower = function(followInstance, result) {
    connection.query("INSERT INTO user_follower SET?", followInstance, function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

followerModel.deleteFollower = function(user_id, follower_id, result) {
    console.log(user_id +" and "+ follower_id);
    
    connection.query("DELETE FROM user_follower WHERE user_id=? AND follower_id=?",[user_id, follower_id], function(err, response) {
        if(err) throw err;
        
        result(null, response);
    });
}

followerModel.getFollowData = function(user_id, result) {
    connection.query("SELECT * FROM user_follower WHERE user_id =? OR follower_id=? ", [user_id, user_id], function(err, response) {
        if(err) throw err;
        
        result(null, response);
    });
}

followerModel.getFollowers = function(user_id, result) {
    connection.query("SELECT * FROM user_follower WHERE user_id =?", user_id, function(err, response) {
        if(err) throw err;
        
        result(null, response);
    });
}

followerModel.getFollowing = function(follower_id, result) {
    connection.query("SELECT * FROM user_follower WHERE follower_id =?", follower_id, function(err, response) {
        if(err) throw err;
        
        result(null, response);
    });
}

const notificationModel = function(notification) {
    this.is_read = notification.is_read;
    this.text = notification.text;
    this.created_on = notification.created_on;
    this.user_id = notification.user_id;
}


notificationModel.addNotification = function(notificaton, result) {
    connection.query("INSERT INTO notifications SET? ", notificaton, function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

notificationModel.markAsRead = function(notificaton_id, result) {

    connection.query("UPDATE notifications SET is_read=? WHERE id=?", [1, notificaton_id], function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

notificationModel.getUserNotification = function(user_id, result) {
    connection.query("SELECT * FROM notifications WHERE user_id=? AND is_read=? ORDER BY created_on DESC", [user_id, false], function(err, response) {
        if(err) throw err;

        result(null, response);
    });
}

// report an account
module.exports = { referralModel, userModel, tokenModel, followerModel, notificationModel};
