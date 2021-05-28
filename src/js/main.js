'use strict'

// HTML-коллекции
const filterTagLine = document.querySelector('.filter .tag-line');
const filterClearButton = document.querySelector('.filter__clear-button');
let filterTags;

const addTaskButton = document.querySelector('.tasks__add-button');
const tasksContainer = document.querySelector('.tasks__container');
const sidebarContent = document.querySelector('.sidebar__content');
let taskItems;

let modalWindow;
let myform;
let myformTitle;
let myformDate;
let myformText;
let myformSubmitButton;

let popupTagLine;
let popupTags;
let popupClearTagsButton;

let popupNewTagName;
let popupColorSelect;
let popupAddTagButton;

// Добавляем функцию конвертации даты в формат mysql
(function() {
    Date.prototype.toYMD = Date_toYMD;
    function Date_toYMD() {
        var year, month, day;
        year = String(this.getFullYear());
        month = String(this.getMonth() + 1);
        if (month.length == 1) {
            month = "0" + month;
        }
        day = String(this.getDate());
        if (day.length == 1) {
            day = "0" + day;
        }
        return year + "-" + month + "-" + day;
    }
})();

// Доступные цвета для тегов
const Colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'lime', 'yellow', 'amber', 'orange', 'brown'];

// Тут будет html всех тегов
let allTagsHtml;

// Тут будет массив актуальных заданий
let tasksData;

// Данные для фильтра
let filterData = [];

// Прячем и показываем попап
function hidePopup(popup) {
    popup.style.display = "none";
}
function showPopup(popup) {
    popup.style.display = "block";
    trimSubminButton();
}

function createPopup(type, data) {
    modalWindow = document.createElement('div');
    modalWindow.classList.add('mui-panel');
    modalWindow.classList.add('popup');
    modalWindow.classList.add('popup_type_task');

    let colorsHTML = Colors.map(color => `<option value="${ color }">${ color }</option>`).join('');

    modalWindow.innerHTML = `
        <form class="mui-form myform" data-type="${ type }"${ type === 'edit' ? ' data-task="' + data.id + '"' : '' }>
            <legend>${ type === 'add' ? 'Новое задание' : (type === 'edit' ? 'Редактировать' : '')}</legend>
            <div class="mui-textfield mui-textfield--float-label">
                <input type="text" name="title" class="myform__title"${ type === 'edit' ? ' value="' + data.title + '"' : ''}>
                <label>Название</label>
            </div>
            <div class="mui-textfield">
                <input type="date" name="date" class="myform__date"${ type === 'edit' ? ' value="' + new Date(data.deadline).toYMD() + '"' : ''}>
                <label>Дедлайн</label>
            </div>
            <div class="mui-textfield mui-textfield--float-label">
                <textarea name="text" class="myform__text">${ type === 'edit' ? data.text : ''}</textarea>
                <label>Текст задания</label>
            </div>
            <div class="popup-tags">
                <div class="popup-tags__head">
                    <h3>Теги</h3>
                    <button type="button" class="mui-btn mui-btn--small mui-btn--flat mui-btn--danger popup-tags__clear-button">Сбросить</button>
                </div>
                <div class="tag-line">
                    ${ allTagsHtml }
                </div>
                <h3>Новый тег</h3>
                <div class="mui-form--inline">
                    <div class="mui-textfield">
                        <input type="text" name="tag-title" class="myform__tag-title" placeholder="Имя тега">
                        <label>Имя</label>
                    </div>
                    <div class="mui-select">
                        <select name="tag-color" class="myform__tag-color">
                            ${ colorsHTML }
                        </select>
                        <label>Цвет</label>
                    </div>
                    <button type="button" class="mui-btn myform__add-tag-btn">Создать</button>
                </div>
            </div>
            <button type="submit" class="mui-btn mui-btn--primary myform__submit">${ type === 'add' ? 'Добавить' : (type === 'edit' ? 'Сохранить' : '')}</button>
        </form>
    `;

    myform = modalWindow.querySelector('.myform');
    myformTitle = myform.querySelector('.myform__title');
    myformDate = myform.querySelector('.myform__date');
    myformText = myform.querySelector('.myform__text');
    myformSubmitButton = myform.querySelector('.myform__submit');

    popupTagLine = modalWindow.querySelector('.tag-line');
    popupTags = popupTagLine.querySelectorAll('.tag');
    popupClearTagsButton = modalWindow.querySelector('.popup-tags__clear-button');

    popupNewTagName = modalWindow.querySelector('.myform__tag-title');
    popupColorSelect = modalWindow.querySelector('.myform__tag-color');
    popupAddTagButton = modalWindow.querySelector('.myform__add-tag-btn');

    trimSubminButton();
    trimAddTagButton();

    myformTitle.addEventListener('input', trimSubminButton);
    myformDate.addEventListener('input', trimSubminButton);
    popupNewTagName.addEventListener('input', trimAddTagButton);
    myform.addEventListener('submit', formOnSubmitListener);

    if (type === 'edit') {
        data.tags.forEach(item => {
            for (let tag of popupTags) {
                if (tag.dataset.id == item.id) {
                    tag.classList.add('tag_active');
                    break;
                }
            }
        });
    }

    for (let tag of popupTags) {
        tag.addEventListener('click', popupTagCallback);
    }

    popupAddTagButton.addEventListener('click', (event) => {
        popupTagLine.innerHTML += `<button type="button" class="tag tag_color_${ popupColorSelect.value }" data-color="${ popupColorSelect.value }">${ popupNewTagName.value }</button>`;
        popupNewTagName.value = '';
        popupTags = popupTagLine.querySelectorAll('.tag');
        for (let tag of popupTags) {
            tag.addEventListener('click', popupTagCallback);
        }
    });

    popupClearTagsButton.addEventListener('click', () => {
        for (let tag of popupTags) {
            tag.classList.remove('tag_active');
        }
    });

    return modalWindow;
}

// Функция для выполнения AJAX запросов
function ajax(url, callback, options) {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(options || {}),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then((response) => {
            if (response.status !== 200) {
                console.log('Looks like there was a problem. Status Code: ' +
                    response.status);
                return;
            }
            response.json().then(function (data) {
                callback(data);
            });
        })
        .catch(function (err) {
            console.log('Fetch Error :-S', err);
        });
}

// Запрос и отрисовка заданий
function renderTaskList() {
    ajax('/api/tasks', data => {
        data = data.filter(item => {
            let ok = true;
            filterData.forEach(id => {
                if (!item.tags.some(tag => tag.id === id)) {
                    ok = false;
                }
            })
            return ok;
        });
        tasksData = data;
        tasksContainer.innerHTML = data.length
            ? data.map(renderTask).join('')
            : `<div>Список занятий пуст!</div>`;
        taskItems = tasksContainer.querySelectorAll('.task');
        for (let task of taskItems) {
            task.querySelector('.task__ok').addEventListener('click', event => {
                let id = findTaskId(event.target);
                deleteTask(id);
            });
            task.querySelector('.task__edit').addEventListener('click', event => {
                let id = findTaskId(event.target);
                editTask(id);
            });
            task.querySelector('.task__delete').addEventListener('click', event => {
                let id = findTaskId(event.target);
                deleteTask(id);
            });
        }
    });
}

function editTask(id) {
    let currentTask = tasksData.filter(item => item.id === id)[0];

    createPopup('edit', currentTask);

    let options = {
        // teardown when <esc> key is pressed (default: true)
        'keyboard': true,
        // maintain overlay when clicked (default: false)
        'static': false,
        // execute function when overlay is closed
        'onclose': () => {
            hidePopup(modalWindow);
        }
    };
    showPopup(modalWindow);
    mui.overlay('on', options, modalWindow);
}

async function deleteTask(id) {
    const response = await fetch('/api/deletetask', {
        method: 'POST',
        body: JSON.stringify({ id: id }),
        headers: {
            'Content-Type': 'application/json'
        }
    });
    const json = await response.json();

    renderTaskList();
    renderTags();
}

function findTaskId(target) {
    while (target && !target.classList.contains('task')) {
        target = target.parentElement;
    }
    if (target && target.classList.contains('task')) {
        return +target.dataset.id;
    }
}

// Запрос и отрисовка тегов
function renderTags() {
    ajax('/api/tags', (data) => {
        // Теги в сайдбаре
        sidebarContent.innerHTML = data.length
            ? data.map(renderSidebarItem).join('')
            : `<div>Тегов не обнаружено.</div>`;

        // Теги в фильтре и модалке
        allTagsHtml = data.map(renderTag).join('');
        filterTagLine.innerHTML = allTagsHtml;

        // Вешаем обработчик при клике на тег в фильтре
        filterTags = filterTagLine.querySelectorAll('.filter .tag');
        for (let tag of filterTags) {
            tag.addEventListener('click', filterCallback);
        }
    });
}

// Отрисовка задания
function renderTask(obj) {
    return `
        <div class="mui-panel task" data-id="${ obj.id }">
            <div class="task__body">
                <div class="task__title">${ obj.title }</div>
                <div class="task__text">${ obj.text }</div>
                <div class="tag-line task__text">${ obj.tags.reduce((res, cur) => res += `<button class="tag tag_color_${ cur.color } tag_active" data-id="${ cur.id }" disabled>${ cur.name }</button>`, '') }</div>
                <div class="task__date">${ new Date(obj.deadline).toLocaleDateString() }</div>
            </div>
            <div class="task__actions">
                <button class="task__icon task__ok">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 448.8 448.8" style="enable-background:new 0 0 448.8 448.8;" xml:space="preserve" ><polygon points="142.8,323.85 35.7,216.75 0,252.45 142.8,395.25 448.8,89.25 413.1,53.55"/></svg>
                </button>
                <button class="task__icon task__edit">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 383.947 383.947" style="enable-background:new 0 0 448.8 448.8;" xml:space="preserve"><polygon points="0,303.947 0,383.947 80,383.947 316.053,147.893 236.053,67.893"/> <path d="M377.707,56.053L327.893,6.24c-8.32-8.32-21.867-8.32-30.187,0l-39.04,39.04l80,80l39.04-39.04 C386.027,77.92,386.027,64.373,377.707,56.053z"/></svg>
                </button>
                <button class="task__icon task__delete">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 384 384" style="enable-background:new 0 0 448.8 448.8;" xml:space="preserve"> <path d="M64,341.333C64,364.907,83.093,384,106.667,384h170.667C300.907,384,320,364.907,320,341.333v-256H64V341.333z"/> <polygon points="266.667,21.333 245.333,0 138.667,0 117.333,21.333 42.667,21.333 42.667,64 341.333,64 341.333,21.333"/></svg>
                </button>
            </div>
        </div>
    `;
}

// Отрисовка элемента сайдбара
function renderSidebarItem(obj) {
    return `
        <div class="sidebar__item sidebar-item">
            <div class="sidebar-item__count">${ obj.count }</div>
            <button type="button" class="sidebar-item__tag tag tag_color_${ obj.color } tag_active" data-id="${ obj.id }">${ obj.name }</button>
        </div>
    `;
}

// Отрисовка тега
function renderTag(obj) {
    return `
        <button type="button" class="tag tag_color_${ obj.color }" data-id="${ obj.id }">${ obj.name }</button>
    `;
}

// Обработчик нажатия на кнопки фильтра
function filterCallback(event) {
    let cur = event.target;
    let id = +cur.dataset.id;

    // Переключаем состояние
    cur.classList.toggle('tag_active');

    // Обновляем фильтр
    if (cur.classList.contains('tag_active')) {
        filterData.push(id);
    }
    else {
        filterData.splice(filterData.indexOf(id), 1);
    }

    // Обновляем данные
    renderTaskList();     
}

// Обработчик нажатия на кнопки фильтра
function popupTagCallback(event) {
    let cur = event.target;

    // Переключаем состояние
    cur.classList.toggle('tag_active');  
}

// Дизабл кнопки отправки, если пусты поля title и date
function trimSubminButton() {
    myformSubmitButton.disabled = (myformTitle.value.length === 0 || myformDate.value.length === 0);
}

function trimAddTagButton() {
    popupAddTagButton.disabled = (popupNewTagName.value.length === 0);
}

// Инициализация
window.addEventListener('load', () => {

    // Рендерим задачи
    renderTaskList();

    // Рендерим теги
    renderTags();

    filterClearButton.addEventListener('click', (event) => {
        for (let tag of filterTags) {
            tag.classList.remove('tag_active');
        }
        filterData = [];
        renderTaskList();
    });

    // При клике на кнопку '+' открываем попап
    addTaskButton.addEventListener('click', () => {

        createPopup('add');

        let options = {
            // teardown when <esc> key is pressed (default: true)
            'keyboard': true,
            // maintain overlay when clicked (default: false)
            'static': false,
            // execute function when overlay is closed
            'onclose': () => {
                hidePopup(modalWindow);
            }
        };
        showPopup(modalWindow);
        mui.overlay('on', options, modalWindow);
    });

});

async function formOnSubmitListener(event) {
    event.preventDefault();
        
    if (myform.dataset.type === 'add') {
        let data = {
            title: myformTitle.value,
            deadline: myformDate.value,
            text: myformText.value,
            tags: [],
        };

        for (let tag of popupTags) {
            if (tag.classList.contains('tag_active')) {
                if (!tag.dataset.id) {
                    let newTagData = {
                        name: tag.innerText,
                        color: tag.dataset.color,
                    }

                    const response = await fetch('/api/addtag', {
                        method: 'POST',
                        body: JSON.stringify(newTagData),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const json = await response.json();
                    tag.dataset.id = json.id;
                }
            }
        }

        for (let tag of popupTags) {
            if (tag.classList.contains('tag_active')) {
                data.tags.push(+tag.dataset.id);
            }
        }

        const response = await fetch('/api/addtask', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();

        renderTaskList();
        renderTags();

        mui.overlay('off');
    }
    else if (myform.dataset.type === 'edit') {
        let data = {
            id: myform.dataset.task,
            title: myformTitle.value,
            deadline: myformDate.value,
            text: myformText.value,
            tags: [],
        };

        for (let tag of popupTags) {
            if (tag.classList.contains('tag_active')) {
                if (!tag.dataset.id) {
                    let newTagData = {
                        name: tag.innerText,
                        color: tag.dataset.color,
                    }

                    const response = await fetch('/api/addtag', {
                        method: 'POST',
                        body: JSON.stringify(newTagData),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const json = await response.json();
                    tag.dataset.id = json.id;
                }
            }
        }

        for (let tag of popupTags) {
            if (tag.classList.contains('tag_active')) {
                data.tags.push(+tag.dataset.id);
            }
        }

        const response = await fetch('/api/edittask', {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();

        renderTaskList();
        renderTags();

        mui.overlay('off');
    }
}