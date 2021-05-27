'use strict'


let addTaskButton = document.querySelector('.tasks__add-button');
let modalWindow = document.querySelector('.popup.popup_type_task');

addTaskButton.addEventListener('click', () => {
    let options = {
        'keyboard': true, // teardown when <esc> key is pressed (default: true)
        'static': false, // maintain overlay when clicked (default: false)
        'onclose': () => { hidePopup(modalWindow) } // execute function when overlay is closed
    };
    showPopup(modalWindow);
    mui.overlay('on', modalWindow);
});

function hidePopup(popup) {
    popup.style.display = "none";
}
function showPopup(popup) {
    popup.style.display = "block";
}