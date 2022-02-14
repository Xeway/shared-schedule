function verifDayParam(day) {
    if((day < 1 || day > 31) || isNaN(day) || day === undefined) {
        day = new Date().getDate();
    } else {
        if(day < 10) {
            day = day.slice(-1);
        } else {
            day = day.slice(-2);
        }
    }

    return day;
}

function verifMonthParam(month) {
    if((month < 1 || month > 12) || isNaN(month) || month === undefined) {
        month = new Date().getMonth() + 1;
    } else {
        if(month < 10) {
            month = month.slice(-1);
        } else {
            month = month.slice(-2);
        }
    }

    return month;
}

function verifYearParam(year) {
    if(year < 1970 || isNaN(year) || year === undefined) {
        year = new Date().getFullYear();
    } else {
        year = year.slice(-4);
    }

    return year;
}

module.exports = {
    verifDayParam,
    verifMonthParam,
    verifYearParam
}