var userRoles = {
    guest:1,
    user:2,
    admin:4
};

exports.accessLevels = {
    guest: userRoles.guest | userRoles.user | userRoles.admin,    // ...111
    user: userRoles.user | userRoles.admin,                       // ...110
    admin: userRoles.admin                                        // ...100
};

// create a middleware
exports.allowOnly = function(accessLevel, callback) {
    function checkUserRole(req, res) {
        if(!(accessLevel & req.user.role)) {
            res.sendStatus(403);
            return;
        }

        callback(req, res);
    }

    return checkUserRole;
}