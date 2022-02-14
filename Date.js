module.exports =
class CalendarDate {

    #months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    #daysWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    constructor(month, year) {
        if(month < 1 || month > 12) {
            throw "Mois non valide !";
        } else if(year < 1970) {
            throw "Année inférieure à 1970 / ne correspond pas";
        } else if((month < 1 || month > 12) && year < 1970) {
            throw "Le mois et l'année sont non valides !";
        } else {
            this.month = month;
            this.year = year;
        }
    }

    monthAndYear() {
        return this.#months[this.month - 1] + " " + this.year;
    }

    numberOfDays() {
        let lastDayMonth = new Date(this.year, this.month, 0).getDate();
        return lastDayMonth;
    }

    firstDay() {
        let currentDate = new Date(this.year, this.month - 1, 1).toString();
        for(let day of this.#daysWeek) {
            if(currentDate.slice(0, 3) === day) {
                return currentDate.slice(0, 3);
            }
        }
        return this.#daysWeek;
    }

};