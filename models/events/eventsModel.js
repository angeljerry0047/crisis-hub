const connection = require('../../db.js');

const eventLocationModel = function(eventLocation){
    // this.event_id = eventLocation.event_id, 
    this.added_by = eventLocation.added_by, 
    this.street_number = eventLocation.street_number, 
    this.street_name = eventLocation.street_name, 
    this.suburb = eventLocation.suburb, 
    this.city = eventLocation.city, 
    this.state = eventLocation.state, 
    this.country = eventLocation.country, 
    this.latitude = eventLocation.latitude, 
    this.longitude = eventLocation.longitude,
    this.user_id = eventLocation.user_id,
    this.place_name = eventLocation.place_name,
    this.locality = eventLocation.locality
};

eventLocationModel.createEvent = function(eventLocation, result) {
    console.log(eventLocation);
    
    connection.query("INSERT INTO event_location set ?", eventLocation, function(error, response) {
        if(error) throw error;
        result(null, response);
    });

}

eventLocationModel.getEventList = function(result) {
    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE is_contribution=?', false, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getContributionList = function(result) {
    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE is_contribution=?', true, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getPostedContributions = function(result) {
    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE is_contribution=? AND is_published=?', [true, true], function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getAllEvents = function(timeFrame, result) {
    let { from, to } = timeFrame;

    if(from == to) {
        console.log("Current Events");
        connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE is_contribution=? AND ed.start_date < ? AND ed.end_date > ?',[false, from, to], function (error, results, fields) {
            if (error) throw error;
            // console.log('The solution is: ', results[0]);
    
            result(null, results);
        });

        return;
    }

    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE is_contribution=? AND ed.start_date BETWEEN ? AND ?',[false, from, to], function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getPostedEvents = function(timeFrame, result) {
    let { from, to } = timeFrame;
    if(from == to) {
        connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE el.is_posted=? AND ed.is_published=? AND ed.start_date < ? AND ed.end_date > ?',[true, true, from, to], function (error, results, fields) {
            if (error) throw error;
            // console.log('The solution is: ', results[0]);
    
            result(null, results);
        });

        return;
    }

    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE el.is_posted=? AND ed.is_published=? AND ed.start_date BETWEEN ? AND ?',[true, true, from, to], function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getUnPostedEvents = function(result) {
    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE el.is_posted=? AND ed.is_contribution=?',[false, false], function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getEventById = function(title, event_id, result) {
    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE el.event_id=?', event_id, function (error, events) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, events);
    });
}

eventLocationModel.getPostedEventById = function(title, event_id, result) {
    connection.query('SELECT * FROM event_location AS el LEFT JOIN event_description AS ed ON el.event_id = ed.event_id WHERE el.event_id=? AND el.is_posted=? AND ed.is_published=?',[ event_id, true, true], function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getEventByUser = function(user, result) {
    connection.query('SELECT * FROM event_description AS el WHERE el.added_by=?', user, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.getPublishedEventByUser = function(user, result) {
    connection.query('SELECT * FROM event_description AS el WHERE el.added_by=? AND is_published=?',[ user, true], function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.postEvent = function(event_id, result) {
    connection.query('UPDATE event_location SET is_posted=true WHERE event_id =?', event_id, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventLocationModel.deleteEventLocation = function(event_id, result) {
    connection.query('DELETE FROM event_location WHERE event_id =?', event_id, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

const eventDescriptionModel = function(eventDescription) {
    this.event_id = eventDescription.event_id, 
    this.added_by = eventDescription.added_by, 
    this.event_name = eventDescription.event_name, 
    this.start_date = eventDescription.start_date, 
    this.end_date = eventDescription.end_date, 
    this.start_time = eventDescription.start_time, 
    this.end_time = eventDescription.end_time, 
    this.event_description = eventDescription.event_description, 
    this.is_contribution = eventDescription.is_contribution,
    this.user_id = eventDescription.user_id
};

eventDescriptionModel.getEventsCount = function(result) {
    connection.query('SELECT COUNT(*) FROM `event_description` WHERE is_contribution=?', false, function(err, count) {
        if(err) throw err;

        result(null, count[0]);
    });
}

eventDescriptionModel.getContributionCount = function(result) {
    connection.query('SELECT COUNT(*) FROM `event_description` WHERE is_contribution=?', true, function(err, count) {
        if(err) throw err;

        result(null, count[0]);
    });
}

eventDescriptionModel.createEventDescription = function(eventDescription, result) {

    // file upload
    connection.query('INSERT INTO event_description set ?', eventDescription, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results);

        result(null, results);
    });
}

eventDescriptionModel.updateEventDescription = function(eventDescription, description_id, result) {
    let values = Object.values(eventDescription);
    // console.log(values);

     // file upload
     connection.query("UPDATE event_description SET ? WHERE description_id = ?", [eventDescription, description_id], function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results);

        result(null, results);
    });
}

eventDescriptionModel.getDescriptionById = function(description_id, result) {
    connection.query("SELECT * FROM event_description WHERE description_id=?", description_id, function(error, results) {
        if(error) throw error;
        result(null, results);
    });
}

eventDescriptionModel.getUnpublishedEventContribution = function(result) {
    connection.query("SELECT * FROM event_description WHERE is_published=? AND 	is_contribution=?",[false, true] , function(error, results) {
        if(error) throw error;
        result(null, results);
    });
}

eventDescriptionModel.deleteEventDescription = function(description_id, result) {
    connection.query("DELETE FROM `event_description` WHERE description_id=?", description_id, function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results);

        result(null, results);
    });
}

eventDescriptionModel.deleteEventDescriptionByEventId = function(event_id, result) {
    connection.query("DELETE FROM `event_description` WHERE event_id=?", event_id, function (error, results, fields) {
        if (error) throw error;
        console.log('The solution is: ', results);

        result(null, results);
    });
}

eventDescriptionModel.publishEventContribution  = function(description_id, result) {
    connection.query('UPDATE event_description SET is_published=true WHERE description_id=?', description_id, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventDescriptionModel.getReportedEventByUsernameAndId = function(description_id, username, result) {
    connection.query('SELECT * FROM reported_events WHERE description_id=? AND reported_by=?', [description_id, username], function(err, results) {
        if(err) throw err;

        result(null, results);
    });
}

eventDescriptionModel.getReportedEvents = function(result) {
    connection.query('SELECT * FROM reported_events WHERE is_contribution=?', false, function (error, results, fields) {
        if (error) throw error;

        result(null, results);
    });
}

eventDescriptionModel.getReportedContributions = function(result) {
    connection.query('SELECT * FROM reported_events WHERE is_contribution=?', true, function (error, results, fields) {
        if (error) throw error;

        result(null, results);
    });
}

eventDescriptionModel.reportEvent = function(report, result) {
    connection.query('INSERT INTO reported_events set ?', report, function (error, results, fields) {
        if (error) throw error;

        result(null, results);
    });
}


eventDescriptionModel.deleteEventReportById = function(report_id, result) {
    connection.query('DELETE FROM reported_events WHERE report_id=?', report_id, function (error, results, fields) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventDescriptionModel.getReportedEventById = function(report_id, result) {
    connection.query('SELECT * from reported_events WHERE report_id=?', report_id, function(error, results) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results);
    });
}

eventDescriptionModel.updateViewsCount = function(event_id, result) {
    connection.query('UPDATE `event_description` SET views_count=views_count+ 1 WHERE event_id=?', event_id, function(error, results) {
        if (error) throw error;
        // console.log('The solution is: ', results[0]);

        result(null, results); 
    });
}

// Events media files
var eventMedia = function(media) {
    this.event_id = media.event_id;
    this.description_id = media.description_id;
    this.added_on = media.added_on;
    this.type = media.type;
    this.media = media.file;
    this.added_by = media.added_by;
}

eventMedia.createMedia = function(eventMedia, result) {
    connection.query("INSERT INTO event_media set ?", eventMedia, function(error, response) {
        if(error) throw error;
        result(null, response);
    });
}

eventMedia.updateMedia = function(eventMedia, result) {
    connection.query("UPDATE INTO event_media set ?", eventMedia, function(error, response) {
        if(error) throw error;
        result(null, response);
    });
}

eventMedia.deleteMedia = function(description_id, result) {
    connection.query("DELETE FROM event_media WHERE description_id= ?", description_id, function(error, response) {
        if(error) throw error;
        result(null, response);
    });
}

eventMedia.deleteMediaByEventId = function(event_id, result) {
    connection.query("DELETE FROM event_media WHERE event_id=?", event_id, function(error, response) {
        if(error) throw error;
        result(null, response);
    });
}

eventMedia.getAllMedia = function(result) {
    connection.query("SELECT * FROM event_media", function(error, results) {
        if(error) throw error;
        result(null, results);
    });
}

eventMedia.getMediaByEventId = function(event_id, result) {
    connection.query("SELECT * FROM event_media WHERE event_id=?", event_id, function(error, results) {
        if(error) throw error;
        result(null, results);
    });
}

module.exports = { eventLocationModel, eventDescriptionModel, eventMedia}

