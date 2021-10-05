exports.toDatetime = function (dateObj) {
    let month = dateObj.getMonth() + 1;
    let date = dateObj.getFullYear() + "-" + month + "-" + dateObj.getDate();

    let time = dateObj.toLocaleTimeString();
    time = time.slice(0, -3);

    console.log(date + " " + time);
    return date + " " + time;
}