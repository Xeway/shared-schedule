require('dotenv').config();
let express = require("express");
let app = express();
let bodyParser = require('body-parser');
let md5 = require('md5');
let session = require('express-session');
let MongoStore = require('connect-mongo');
let { google } = require('googleapis');

let verifParams = require('./verif-params.js');
let dbConnection = require("./db-connection.js");
let calendarDate = require("./Date.js");
let sendEmail = require('./send-email.js');

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(session({
    secret: md5(process.env.SESSION_PASSWORD),
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: process.env.DB_LOCALHOST }),
    cookie: { secure: false }
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//This is an old version to add users, you can use the second one and add your users into a dotenv file like that : "<name>:<email>:<password>"
// and separate each users by a semicolon (do all of that only if you don't plan to have your users into a db)
/*let IDs = [];
process.env.USERS.split(";").forEach(user_infos => {
    let user_info = user_infos.split(":");
    IDs.push({ name: user_info[0], email: user_info[1], password: user_info[2] });
});*/

const IDs = [
    { name: process.env.USER1, password: process.env.PASSWORD1, email: process.env.EMAIL1 },
    { name: process.env.USER2, password: process.env.PASSWORD2, email: process.env.EMAIL2 },
    { name: process.env.USER3, password: process.env.PASSWORD3, email: process.env.EMAIL3 },
    { name: process.env.USER4, password: process.env.PASSWORD4, email: process.env.EMAIL4 }
];

// In my private repo, my users database is in a Google Sheets documents, this code bellow is to connect with the API.
// For this repo, you can use the code above.
/*
let IDs = [];

app.use(async function(req, res, next) {
    let auth = new google.auth.GoogleAuth({
        keyFile: "secrets.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    });

    let client = await auth.getClient();

    let googleSheets = google.sheets({ version: "v4", auth: client });

    let getRows = await googleSheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: process.env.SHEET_ID,
        range: "users_list!2:9999"
    });

    let getUsers = getRows.data.values;

    getUsers.forEach(user_info => {
        if(IDs.find(ID => ID.name === user_info[0] && ID.email === user_info[1] && ID.password === user_info[2]) === undefined) {
            IDs.push({ name: user_info[0], email: user_info[1], password: user_info[2] });
        }
    });
    
    next();
});
*/

const places = {
    Mon: {
        first: process.env.MONDAY_FIRST,
        second: process.env.MONDAY_SECOND
    },
    Tue: process.env.TUESDAY,
    Thu: process.env.THURSDAY,
    Fri: process.env.FRIDAY,
    Sat: {
        first: process.env.SATURDAY_FIRST,
        second: process.env.SATURDAY_SECOND
    }
}

app.get("/login", (req, res) => {
    if(req.session.isConnected) {
        res.redirect("/");
    } else {
        if(req.session.error !== undefined) {
            res.locals.error = req.session.error;
        }
        res.render("login.ejs", {
            peoples: IDs
        });
    }
});

app.post("/login", (req, res) => {
    if(IDs.find(ID => ID.name === req.body.people).password === req.body.password) {
        req.session.error = undefined;
        req.session.isConnected = true;
        req.session.name = req.body.people;
        req.session.cookie.maxAge = 1000*60*60*24*365;
        res.redirect("/");
    } else if(req.body.password === process.env.ADMINPASSWORD) {
        req.session.error = undefined;
        req.session.isConnected = true;
        req.session.isAdmin = true;
        req.session.cookie.maxAge = 1000*60*60*24*365;
        res.redirect("/");
    } else {
        req.session.error = "Utilisateur ou mot de passe incorrect";
        res.status(401).redirect("/login");
    }
});

app.post("/disconnect", (req, res) => {
    req.session.error = undefined;
    req.session.isConnected = false;
    req.session.name = undefined;
    req.session.isAdmin = false;
    req.session.cookie.maxAge = 0;
    res.redirect("/login");
});

app.get("/", (req, res) => {
    if(req.session.isConnected) {
        if(req.query.month === undefined && req.query.year === undefined) {
            res.redirect(`/?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
        } else {
            let monthParam = verifParams.verifMonthParam(req.query.month);
            let yearParam = verifParams.verifYearParam(req.query.year);
        
            let classDate = new calendarDate(
                monthParam,
                yearParam
            );
        
            dbConnection.connect("events")
            .then(queryEvents => {
                queryEvents.find({
                    month: monthParam,
                    year: yearParam
                })
                .toArray()
                .then((data) => {
                    dbConnection.connect("specialdays")
                    .then(querySpecialDays => {
                        querySpecialDays.find({
                            month: monthParam,
                            year: yearParam
                        })
                        .toArray()
                        .then((specialdays) => {
                            if(parseInt(classDate.month) + 1 === 13) {
                                res.locals.nextMonth = 1;
                                res.locals.prevMonth = parseInt(classDate.month) - 1;
                                res.locals.nextYear = parseInt(classDate.year) + 1;
                                res.locals.prevYear = parseInt(classDate.year);
                            } else if(parseInt(classDate.month) - 1 === 0) {
                                res.locals.nextMonth = parseInt(classDate.month) + 1;
                                res.locals.prevMonth = 12;
                                res.locals.nextYear = parseInt(classDate.year);
                                res.locals.prevYear = parseInt(classDate.year) - 1;
                            } else {
                                res.locals.nextMonth = parseInt(classDate.month) + 1;
                                res.locals.prevMonth = parseInt(classDate.month) - 1;
                                res.locals.nextYear = parseInt(classDate.year);
                                res.locals.prevYear = parseInt(classDate.year);
                            }
                    
                            res.render("index.ejs", {
                                month: classDate.month,
                                year: classDate.year,
                                monthAndYear: classDate.monthAndYear(),
                                numberOfDays: classDate.numberOfDays(),
                                firstDay: classDate.firstDay(),
                                eventsData: data,
                                specialDaysData: specialdays,
                                placesName: places,
                                name: req.session.name,
                                isAdmin: req.session.isAdmin === undefined ? false : req.session.isAdmin
                            });
                        })
                        .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                    })
                    .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));                    
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
            })
            .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
        }
    } else {
        res.status(401).redirect("/login");
    }
});

app.get("/formulaire", (req, res) => {

    if(req.session.isConnected) {
        if(req.query.day === undefined && req.query.month === undefined && req.query.year === undefined) {
            res.redirect(`/formulaire?day=${new Date().getDate()}month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
        } else {
            let dayParam = verifParams.verifDayParam(req.query.day);
            let monthParam = verifParams.verifMonthParam(req.query.month);
            let yearParam = verifParams.verifYearParam(req.query.year);
    
            let classDate = new calendarDate(
                monthParam,
                yearParam
            );

            res.locals.isAdmin = req.session.isAdmin;
    
            let isMultiplePlace = false;
    
            let dayName = new Date(yearParam, monthParam - 1, dayParam).toString().slice(0, 3);
            
            if(dayName === "Sat") {
    
                isMultiplePlace = true;
    
                dbConnection.connect("events")
                .then(queryIsAlreadyTaken => {
                    queryIsAlreadyTaken.find({
                        day: dayParam,
                        month: monthParam,
                        year: yearParam
                    })
                    .toArray()
                    .then((data) => {
                        if(data.length > 0) {
                            res.locals.placeAlreadyTaken = data[0].place;
                            res.locals.firstPublisher = data[0].firstPublisher;
                            res.locals.secondPublisher = data[0].secondPublisher;
                            res.locals.firstConfirmed = data[0].isConfirmed;
                            if(data.length === 1) {
                                res.locals.oneIsAlreadyTaken = true;
                            } else if(data.length === 2) {
                                res.locals.twoIsAlreadyTaken = true;
    
                                res.locals.secondPlaceAlreadyTaken = data[1].place;
                                res.locals.thirdPublisher = data[1].firstPublisher;
                                res.locals.fourthPublisher = data[1].secondPublisher;
                                res.locals.secondConfirmed = data[1].isConfirmed;
                            }
                        }
                        res.render("form.ejs", {
                            monthAndYear: classDate.monthAndYear(),
                            isMultiplePlace: isMultiplePlace,
                            dayName: dayName,
                            year: yearParam,
                            month: monthParam,
                            day: dayParam,
                            peoples: IDs,
                            placeName: places[dayName],
                            name: req.session.name
                        });
                    })
                    .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
    
            } else if(dayName === "Mon") {
                dbConnection.connect("specialdays")
                .then(queryJourFoire => {
                    queryJourFoire.find({
                        day: dayParam,
                        month: monthParam,
                        year: yearParam
                    })
                    .toArray()
                    .then((data) => {
                        if(typeof data[0] !== "undefined") {
                            res.locals.itsSpecialDay = true;
                            isMultiplePlace = true;
    
                            dbConnection.connect("events")
                            .then(queryMultiplePlace => {
                                queryMultiplePlace.find({
                                    day: dayParam,
                                    month: monthParam,
                                    year: yearParam
                                })
                                .toArray()
                                .then((data) => {
                                    if(data.length > 0) {
                                        res.locals.placeAlreadyTaken = data[0].place;
                                        res.locals.firstPublisher = data[0].firstPublisher;
                                        res.locals.secondPublisher = data[0].secondPublisher;
                                        res.locals.firstConfirmed = data[0].isConfirmed;
                                        if(data.length === 1) {
                                            res.locals.oneIsAlreadyTaken = true;
                                        } else if(data.length === 2) {
                                            res.locals.twoIsAlreadyTaken = true;
                
                                            res.locals.secondPlaceAlreadyTaken = data[1].place;
                                            res.locals.thirdPublisher = data[1].firstPublisher;
                                            res.locals.fourthPublisher = data[1].secondPublisher;
                                            res.locals.secondConfirmed = data[1].isConfirmed;
                                        }
                                    }
                                    res.render("form.ejs", {
                                        monthAndYear: classDate.monthAndYear(),
                                        isMultiplePlace: isMultiplePlace,
                                        dayName: dayName,
                                        year: yearParam,
                                        month: monthParam,
                                        day: dayParam,
                                        peoples: IDs,
                                        placeName: places[dayName],
                                        name: req.session.name
                                    });
                                })
                                .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                            })
                            .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                        } else {
                            res.locals.itsSpecialDay = false;
                            isMultiplePlace = false;
    
                            dbConnection.connect("events")
                            .then(queryIsAlreadyTaken => {
                                queryIsAlreadyTaken.find({
                                    day: dayParam,
                                    month: monthParam,
                                    year: yearParam
                                })
                                .toArray()
                                .then((data) => {
                                    if(data.length > 0) {
                                        res.locals.placeAlreadyTaken = data[0].place;
                                        res.locals.isAlreadyTaken = true;
                                        res.locals.firstPublisher = data[0].firstPublisher;
                                        res.locals.secondPublisher = data[0].secondPublisher;
                                        res.locals.firstConfirmed = data[0].isConfirmed;
                                    } else {
                                        res.locals.isAlreadyTaken = false;
                                    }
                                    res.render("form.ejs", {
                                        monthAndYear: classDate.monthAndYear(),
                                        isMultiplePlace: isMultiplePlace,
                                        dayName: dayName,
                                        year: yearParam,
                                        month: monthParam,
                                        day: dayParam,
                                        peoples: IDs,
                                        placeName: places[dayName],
                                        name: req.session.name
                                    });
                                })
                                .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                            })
                            .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                        }
                    })
                    .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
            } else {
                dbConnection.connect("events")
                .then(queryIsAlreadyTaken => {
                    queryIsAlreadyTaken.find({
                        day: dayParam,
                        month: monthParam,
                        year: yearParam
                    })
                    .toArray()
                    .then((data) => {
                        if(data.length > 0) {
                            res.locals.placeAlreadyTaken = data[0].place;
                            res.locals.isAlreadyTaken = true;
                            res.locals.firstPublisher = data[0].firstPublisher;
                            res.locals.secondPublisher = data[0].secondPublisher;
                            res.locals.firstConfirmed = data[0].isConfirmed;
                        } else {
                            res.locals.isAlreadyTaken = false;
                        }
                        res.render("form.ejs", {
                            monthAndYear: classDate.monthAndYear(),
                            isMultiplePlace: isMultiplePlace,
                            dayName: dayName,
                            year: yearParam,
                            month: monthParam,
                            day: dayParam,
                            peoples: IDs,
                            placeName: places[dayName],
                            name: req.session.name
                        });
                    })
                    .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${monthParam}&year=${yearParam}`));
            }
        }
    } else {
        res.status(401).redirect("/login");
    }
});

app.get("/error", (req, res) => {
    if(req.session.isConnected) {
        let monthParam = verifParams.verifMonthParam(req.query.month);
        let yearParam = verifParams.verifYearParam(req.query.year);
    
        res.render("error.ejs", {
            message: req.query.message,
            month: monthParam,
            year: yearParam
        });
    } else {
        res.status(401).redirect("/login");
    }
});

app.post("/formulaire", (req, res) => {
    
    if(req.session.isConnected) {
        let date = new Date(req.body.year, req.body.month - 1, req.body.day).toString().slice(0, 3);
        if(date !== "Wed" && date !== "Sun") {
    
            dbConnection.connect("events")
            .then(queryForm => {

                let isFree;
                queryForm.find({
                    place: req.body.place,
                    day: req.body.day,
                    month: req.body.month,
                    year: req.body.year
                })
                .toArray()
                .then((data) => data == "" ? isFree = true : isFree = false)
                .then(() => {
                    if(isFree) {

                        let newDate = new Date(req.body.year, req.body.month - 1, req.body.day).toString().slice(0, 3);
                        let isTheRightPlace = false;
                        if(places[newDate] === req.body.place) {
                            isTheRightPlace = true;
                        }

                        if(typeof places[newDate] === "object") {
                            if(places[newDate]["first"] === req.body.place) {
                                isTheRightPlace = true;
                            } else if(places[newDate]["second"] === req.body.place) {
                                isTheRightPlace = true;
                            }
                        }

                        if(isTheRightPlace
                        && req.body.yourName !== req.body.hisName
                        && req.body.yourName === req.session.name
                        && IDs.find(ID => ID.name === req.body.hisName) !== undefined
                        && IDs.find(ID => ID.name === req.body.yourName) !== undefined) {

                            dbConnection.connect("events")
                            .then(result => {
                                result.insertOne({
                                    firstPublisher: req.body.yourName,
                                    secondPublisher: req.body.hisName,
                                    place: req.body.place,
                                    day: req.body.day,
                                    month: req.body.month,
                                    year: req.body.year,
                                    isConfirmed: false
                                })
                                .then(() => res.redirect(`/?month=${req.body.month}&year=${req.body.year}`))
                                .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
                            })
                            .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));

                        } else {
                            res.redirect(`/error?message=datasentincorrect&month=${req.body.month}&year=${req.body.year}`);
                        }
                    } else {
                        res.redirect(`/error?message=notfree&month=${req.body.month}&year=${req.body.year}`);
                    }
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));

            })
            .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
    
        } else {
            res.redirect(`/error?message=wrongday&month=${req.body.month}&year=${req.body.year}`);
        }
    } else {
        res.status(401).redirect("/login");
    }
});

app.post("/cancel", (req, res) => {
    if(req.session.isConnected) {
        if(req.session.name === req.body.firstPublisher) {
            dbConnection.connect("events")
            .then(queryDelete => {
                queryDelete.deleteOne({
                    day: req.body.day,
                    month: req.body.month,
                    year: req.body.year,
                    place: req.body.place,
                    firstPublisher: req.body.firstPublisher,
                    secondPublisher: req.body.secondPublisher
                })
                .then((response) => {
                    if(response.deletedCount > 0) {
                        res.redirect(`/?month=${req.body.month}&year=${req.body.year}`);
                    } else {
                        res.redirect(`/error?message=nothingdeleted&month=${req.body.month}&year=${req.body.year}`);
                    }
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
            })
            .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
        } else {
            res.redirect(`/error?message=datasentincorrect&month=${req.body.month}&year=${req.body.year}`);
        }
    } else {
        res.status(401).redirect("/login");
    }
});

app.post("/admin", (req, res) => {
    if(req.session.isAdmin) {
        if(req.body.action === "Accepter") {
            dbConnection.connect("events")
            .then(queryAdminUpdate => {
                queryAdminUpdate.updateOne({
                    day: req.body.day,
                    month: req.body.month,
                    year: req.body.year,
                    place: req.body.place,
                    firstPublisher: req.body.firstPublisher,
                    secondPublisher: req.body.secondPublisher
                },
                {
                    $set: { isConfirmed: true }
                })
                .then((value) => {
                    if(value.modifiedCount === 1 && value.matchedCount === 1) {
                        sendEmail.main(
                            IDs.find(ID => ID.name === req.body.firstPublisher).email,
                            IDs.find(ID => ID.name === req.body.secondPublisher).email,
                            req.body.action,
                            req.body.day,
                            req.body.month,
                            req.body.year,
                            req.body.place,
                            req.body.firstPublisher,
                            req.body.secondPublisher,
                            (req.body.comment !== undefined && req.body.comment.replace(/\s/g, '').length > 0) ? true : false,
                            req.body.comment
                        ).then(info => {
                            res.redirect(`/?month=${req.body.month}&year=${req.body.year}`);
                        })
                        .catch((e) => res.redirect(`/error?message=erroremail&month=${req.body.month}&year=${req.body.year}`));
                    } else {
                        res.redirect(`/error?message=nothingupdated&month=${req.body.month}&year=${req.body.year}`);
                    }
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
            })
            .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
        } else if(req.body.action === "Rejeter") {
            dbConnection.connect("events")
            .then(queryAdminDelete => {
                queryAdminDelete.deleteOne({
                    day: req.body.day,
                    month: req.body.month,
                    year: req.body.year,
                    place: req.body.place,
                    firstPublisher: req.body.firstPublisher,
                    secondPublisher: req.body.secondPublisher
                })
                .then((value) => {
                    if(value.deletedCount === 1) {
                        sendEmail.main(
                            IDs.find(ID => ID.name === req.body.firstPublisher).email,
                            IDs.find(ID => ID.name === req.body.secondPublisher).email,
                            req.body.action,
                            req.body.day,
                            req.body.month,
                            req.body.year,
                            req.body.place,
                            req.body.firstPublisher,
                            req.body.secondPublisher,
                            (req.body.comment !== undefined && req.body.comment.replace(/\s/g, '').length > 0) ? true : false,
                            req.body.comment
                        ).then(info => {
                            res.redirect(`/?month=${req.body.month}&year=${req.body.year}`);
                        })
                        .catch((e) => res.redirect(`/error?message=erroremail&month=${req.body.month}&year=${req.body.year}`));
                    } else {
                        res.redirect(`/error?message=nothingdeleted&month=${req.body.month}&year=${req.body.year}`);
                    }
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
            })
            .catch((e) => res.redirect(`/error?message=errordb&month=${req.body.month}&year=${req.body.year}`));
        } else {
            res.redirect(`/error?message=unknowninstruction&month=${req.body.month}&year=${req.body.year}`);
        }
    } else {
        res.status(403).redirect("/login");
    }
});

app.get("/specialday", (req, res) => {
    if(req.session.isAdmin) {
        dbConnection.connect("specialdays")
        .then(searchAlreadyJourFoire => {
            searchAlreadyJourFoire.find()
            .toArray()
            .then((dates) => {
                let datesSorted = [];
                dates.forEach(date => {
                    datesSorted.push(new Date(date.year, date.month - 1, date.day));
                });
                datesSorted.sort(function(a, b) {
                    return a - b;
                });
                res.render("specialday.ejs", { dates: datesSorted });
            })
            .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
        })
        .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
    } else {
        res.status(403).redirect("/login");
    }
});

app.post("/specialday", (req, res) => {
    if(req.session.isAdmin) {
        if(req.body.add !== undefined) {

            if(req.body.date !== undefined && req.body.date !== "") {
                let dateSent = new Date(req.body.date);
                if(dateSent.toString().slice(0, 3) === "Mon") {
                    dbConnection.connect("specialdays")
                    .then(searchAlreadyJourFoire => {
                        searchAlreadyJourFoire.find({
                            day: `${dateSent.getDate()}`,
                            month: `${dateSent.getMonth() + 1}`,
                            year: `${dateSent.getFullYear()}`
                        })
                        .toArray()
                        .then((data) => {
                            if(data.length === 0) {
                                dbConnection.connect("specialdays")
                                .then(insertJourFoire => {
                                    insertJourFoire.insertOne({
                                        day: `${dateSent.getDate()}`,
                                        month: `${dateSent.getMonth() + 1}`,
                                        year: `${dateSent.getFullYear()}`
                                    })
                                    .then(() => res.redirect("/specialday"))
                                    .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                                })
                                .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                            } else {
                                res.redirect(`/error?message=valuealreadyexist&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
                            }
                        })
                        .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                    })
                    .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                } else {
                    res.redirect(`/error?message=invaliddate&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
                }
            } else {
                res.redirect(`/error?message=invaliddate&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
            }

        } else if(req.body.delete !== undefined) {

            let dateSent = new Date(req.body.delete);
            if(dateSent.toString().slice(0, 3) === "Mon" && req.body.delete !== "") {
                dbConnection.connect("specialdays")
                .then(removeJourFoire => {
                    removeJourFoire.deleteMany({
                        day: `${dateSent.getDate()}`,
                        month: `${dateSent.getMonth() + 1}`,
                        year: `${dateSent.getFullYear()}`
                    })
                    .then((response) => {
                        if(response.deletedCount > 0) {
                            dbConnection.connect("events")
                            .then(removeDayJourFoire => {
                                removeDayJourFoire.deleteOne({
                                    day: `${dateSent.getDate()}`,
                                    month: `${dateSent.getMonth() + 1}`,
                                    year: `${dateSent.getFullYear()}`,
                                    place: process.env.MONDAY_FIRST
                                })
                                .then(() => res.redirect("/specialday"))
                                .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                            })
                            .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                        } else {
                            res.redirect(`/error?message=nothingdeleted&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
                        }
                    })
                    .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
                })
                .catch((e) => res.redirect(`/error?message=errordb&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`));
            } else {
                res.redirect(`/error?message=invaliddate&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
            }

        } else {
            res.redirect(`/error?message=unknowninstruction&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
        }
    } else {
        res.status(403).redirect("/login");
    }
});

app.use(function(req, res) {
    res.status(404).redirect(`/error?message=404&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
});

app.use(function(err, req, res, next) {
    res.status(500).redirect(`/error?message=500&month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`);
});

app.listen(8080);