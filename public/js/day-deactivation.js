let daysCalendar = document.querySelector('.days-calendar');

function changeAByDiv(day) {
    let classes = day.classList;
    let div = document.createElement("div");
    classes.forEach(classe => {
        div.classList.add(classe);
    });
    div.appendChild(day.firstElementChild);
    daysCalendar.appendChild(div);
    day.replaceWith(div);
}

function desactivateDay(dayOfTheWeek) {
    for(let i = dayOfTheWeek; i < daysCalendar.children.length; i += 7) {
        daysCalendar.children[i].classList.add("bg-gray-200");
        if(daysCalendar.children[i].tagName === "A") {
            daysCalendar.children[i].classList.replace("text-red-800", "text-gray-400");
            changeAByDiv(daysCalendar.children[i]);
        }
    }
}

//Pour changer de jour à désactiver, insérez le nombre qui convient : Lundi - 0, Mardi - 1, Mercredi - 2, Jeudi - 3, Vendredi - 4, Samedi - 5, Dimanche - 6
desactivateDay(6);
desactivateDay(2);