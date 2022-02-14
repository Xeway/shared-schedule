let banners = document.querySelectorAll(".banner");

banners.forEach(banner => {
    let firstName = banner.firstElementChild.childNodes[0];
    let secondName = banner.firstElementChild.childNodes[1];
    let placeInfoWidth;

    if(banner.childNodes[1] !== undefined) {
        placeInfoWidth = banner.childNodes[1].offsetWidth;
    } else {
        placeInfoWidth = 0;
    }

    let originalFirstName = firstName.textContent;
    let originalSecondName = secondName.textContent;

    let bannerResizeObserver = new ResizeObserver((entries) => {

        // Reset name shortened when banner become normal
        if(firstName.classList.contains("shortened")) {
            if(entries[0].contentRect.width > firstName.offsetWidth + placeInfoWidth) {
                firstName.textContent = originalFirstName;
                firstName.classList.remove("shortened");
            }
        }
        if(secondName.classList.contains("shortened")) {
            if(entries[0].contentRect.width > secondName.offsetWidth + placeInfoWidth) {
                secondName.textContent = originalSecondName;
                secondName.classList.remove("shortened");
            }
        }

        // Shorten name when banner become too small
        if(!firstName.classList.contains("shortened")) {
            if(entries[0].contentRect.width < firstName.offsetWidth + placeInfoWidth) {
                let name = firstName.textContent.split(' ');
                if(name.length === 2) {
                    firstName.textContent = `${name[0]} ${name[1].slice(0, 1)}`;
                } else if(name.length === 3) {
                    firstName.textContent = `${name[0].slice(0, 1)}-${name[1].slice(0, 1)} ${name[2]}`;
                }
                firstName.classList.add("shortened");
            }
        }
        if(!secondName.classList.contains("shortened")) {
            if(entries[0].contentRect.width < secondName.offsetWidth + placeInfoWidth) {
                let name = secondName.textContent.split(' ');
                if(name.length === 2) {
                    secondName.textContent = `${name[0]} ${name[1].slice(0, 1)}`;
                } else if(name.length === 3) {
                    secondName.textContent = `${name[0].slice(0, 1)}-${name[1].slice(0, 1)} ${name[2]}`;
                }
                secondName.classList.add("shortened");
            }
        }

    });

    bannerResizeObserver.observe(banner);
});

let responsiveResizeObserver = new ResizeObserver((entries) => {
    if(entries[0].contentRect.width < 640) {
        activateDayIndicator();
    }
});
responsiveResizeObserver.observe(document.body);

let count = 0;

function activateDayIndicator() {

    if(count < 1) {
        let firstDay = document.querySelector(".boxday1");
        let setFirstDay = document.querySelector(`.${new Date(firstDay.className.split(" ")[2].slice(5), firstDay.className.split(" ")[1].slice(6) - 1, firstDay.className.split(" ")[0].slice(6)).toString().slice(0, 3).toLowerCase()}-day-indicator`);
        setFirstDay.classList.remove("bg-white");
        setFirstDay.classList.add("bg-gray-800", "text-white");
    }

    let days = document.querySelectorAll(".days");
    let heightDateIndicator = Math.abs(document.querySelector(".day-indicator").offsetHeight + (0.5*16));

    let intersectionObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if(entry.isIntersecting) {
                let classBoxDay = entry.target.className.split(" ")[0].slice(6);
                let classMonth = entry.target.className.split(" ")[1].slice(6);
                let classYear = entry.target.className.split(" ")[2].slice(5);

                document.querySelectorAll(".days-indicator").forEach(dayIndicator => {
                    if(dayIndicator.classList.contains("bg-gray-800")) {
                        dayIndicator.classList.remove("bg-gray-800");
                        dayIndicator.classList.add("bg-white");
                    }
                    if(dayIndicator.classList.contains("text-white")) {
                        dayIndicator.classList.remove("text-white");
                    }
                });

                let dayIndicatorElement = document.querySelector(`.${new Date(classYear, classMonth - 1, classBoxDay).toString().slice(0, 3).toLowerCase()}-day-indicator`);
                dayIndicatorElement.classList.remove("bg-white");
                dayIndicatorElement.classList.add("bg-gray-800", "text-white");
            }
        });
    },
    {
        root: null,
        rootMargin: `${-heightDateIndicator}px 0px ${(-Math.abs(window.innerHeight - heightDateIndicator)) + (2*0.5*16) - 1}px 0px`,
        threshold: 0
    });

    days.forEach(day => {
        intersectionObserver.observe(day);
    });

    function checkToRemovePositionFixed() {
        let dayIndicatorObserverNotFixed = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.classList.add("hidden");
                    document.querySelector(".day-indicator").classList.remove("fixed-day-indicator");
                }
            });
        },
        {
            root: null,
            rootMargin: `-${0.5*16}px 0px 0px 0px`,
            threshold: 1.0
        });
        
        dayIndicatorObserverNotFixed.observe(document.querySelector(".spot-day-indicator"));
    }

    let dayIndicatorObserverFixed = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if(!entry.isIntersecting) {
                entry.target.classList.add("fixed-day-indicator");
                document.querySelector(".spot-day-indicator").classList.remove("hidden");
                checkToRemovePositionFixed();
            }
        });
    },
    {
        root: null,
        rootMargin: `-${0.5*16}px 0px 0px 0px`,
        threshold: 1.0
    });

    dayIndicatorObserverFixed.observe(document.querySelector(".day-indicator"));

    count++;

}

let checkbox = document.querySelector(".activate-day-indicator");

checkbox.addEventListener("change", (e) => {
    if(e.target.checked) {
        document.cookie = `daysInBoxes=true; max-age=${365*24*3600}; samesite=strict`;
        displayDaysInBoxes();
    } else {
        document.cookie = `daysInBoxes=false; max-age=${365*24*3600}; samesite=strict`;
        removeDaysInBoxes();
    }
});

function displayDaysInBoxes() {
    document.querySelector(".day-indicator").classList.add("blind");
    document.querySelector(".spot-day-indicator").classList.add("blind");

    document.querySelectorAll(".french-day-name").forEach(frenchDayName => {
        frenchDayName.classList.remove("blind");
    });
}

function removeDaysInBoxes() {
    document.querySelector(".day-indicator").classList.remove("blind");
    document.querySelector(".spot-day-indicator").classList.remove("blind");

    document.querySelectorAll(".french-day-name").forEach(frenchDayName => {
        frenchDayName.classList.add("blind");
    });
}

let checkboxInput = document.querySelector(".checkbox");

if(document.cookie.split("=")[1] === "false") {
    checkboxInput.checked = false;
}

if(document.cookie.split("=")[1] === "true" || checkboxInput.checked) {
    displayDaysInBoxes();
} else {
    removeDaysInBoxes();
}