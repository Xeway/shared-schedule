// THIS CODE WILL NOT BE USED BUT I WANT TO KEEP IT ANYWAY

/*let yourName = document.querySelector('#yourname');
let hisName = document.querySelector('#hisname');

function remove(value) {
    value.parentNode.removeChild(value);
}

let hisNamePrecedentOne = [];
let yourNamePrecedentOne = [];

hisNamePrecedentOne.push(document.querySelector(`#hisname > option[value="${yourName.value}"]`));
yourNamePrecedentOne.push(document.querySelector(`#hisname > option[value="${hisName.value}"]`));

remove(document.querySelector(`#hisname > option[value="${yourName.value}"]`));
remove(document.querySelector(`#yourname > option[value="${hisName.value}"]`));

yourName.addEventListener('change', (e) => {
    hisNamePrecedentOne[0] = document.querySelector(`#hisname > option[value="${e.target.value}"]`);
    remove(document.querySelector(`#hisname > option[value="${e.target.value}"]`));
    console.log(hisNamePrecedentOne);
});

hisName.addEventListener('change', (e) => {
    yourNamePrecedentOne[0] = document.querySelector(`#hisname > option[value="${e.target.value}"]`);
    remove(document.querySelector(`#yourname > option[value="${e.target.value}"]`));
    console.log(yourNamePrecedentOne);
});

//document.createElement("option").setAttribute("value", `${}`)
*/