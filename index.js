const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Номер порта задаём константой
const PORT = 80;
const app = express();

// Подключаемся к MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    port: 8889,
    user: 'root',
    database: 'tasks_projects',
    password: 'root'
});
connection.connect(function (err) {
    if (err) {
        return console.error('Ошибка: ' + err.message);
    }
    else {
        console.log('Подключение к серверу MySQL успешно установлено');
    }
});
const query = util.promisify(connection.query).bind(connection);


// Делаем папку dist статичной
app.use(express.static(path.resolve(__dirname, 'dist')));

// Обрабатываем корневой запрос
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/dist/index.html');
});

app.get('/src/mui.min.css', (req, res) => {
    res.sendFile(__dirname + '/node_modules/muicss/dist/css/mui.min.css');
});
app.get('/src/mui.min.js', (req, res) => {
    res.sendFile(__dirname + '/node_modules/muicss/dist/js/mui.min.js');
});

// Запрос всех заданий, каждое задание выводится со списком тегов
app.post('/api/tasks', express.json(), (req, res) => {
    connection.query('SELECT Задания.id AS id, Задания.Название AS title, Задания.Текст AS text, Задания.Дедлайн AS deadline, Теги.id AS tag_id, Теги.Название AS tag, Теги.Цвет AS color FROM Задания LEFT JOIN Назначение ON Задания.id = Назначение.Задание LEFT JOIN Теги ON Назначение.Тег = Теги.id ORDER BY Задания.id', (err, results, fields) => {
        if (err) { console.log(err); }
        else {
            let data = [];
            for (let i = 0; i < results.length; i++) {
                if (data.length === 0 || results[i].id !== data[data.length - 1].id) {
                    let obj = {
                        id: results[i].id,
                        title: results[i].title,
                        text:  results[i].text,
                        deadline: results[i].deadline,
                        tags: []
                    }
                    data.push(obj);
                }
                if (results[i].tag !== null) {
                    data[data.length - 1].tags.push({
                        id: results[i].tag_id,
                        name: results[i].tag,
                        color: results[i].color
                    });
                }
            }
            res.send(data);
        }
    });
});

// Запрос всех заданий, каждое задание выводится со списком тегов
app.post('/api/tags', (req, res) => {
    connection.query('SELECT Теги.id AS id, Теги.Название AS name, Теги.Цвет AS color, COUNT(Назначение.Задание) AS count FROM Теги LEFT JOIN Назначение ON Теги.id = Назначение.Тег GROUP BY Теги.id;', (err, results, fields) => {
        if (err) { console.log(err); }
        else {
            res.send(results);
        }
    });
});

// Добавление нового тега
app.post('/api/addtag', express.json(), (req, res) => {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    
    (async () => {
        try {
            const rows = await query('INSERT INTO `Теги` (`Название`, `Цвет`) VALUES (\'' + req.body.name + '\', \'' + req.body.color + '\')');
            res.send({ id: rows.insertId });
        } catch (e) {
            throw e;
        }
    })();
});

// Добавление нового задания
app.post('/api/addtask', express.json(), (req, res) => {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    (async () => {
        try {
            const rows = await query('INSERT INTO Задания (Название, Текст, Дедлайн) VALUES (\'' + req.body.title + '\', \'' + req.body.text + '\', \'' + req.body.deadline + '\')');
            let id = rows.insertId;

            for (let i = 0; i < req.body.tags.length; i++) {
                await query('INSERT INTO Назначение (Задание, Тег) VALUES (' + id + ', '  + req.body.tags[i] + ')');
            }

            res.send({ id: id });
        } catch (e) {
            throw e;
        }
    })();
});

// Редактирование задания
app.post('/api/edittask', express.json(), (req, res) => {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    (async () => {
        try {
            const rows = await query('UPDATE Задания SET Название = \'' + req.body.title + '\', Текст = \'' + req.body.text + '\', Дедлайн = \'' + req.body.deadline + '\' WHERE id = ' + req.body.id);

            await query('DELETE FROM Назначение WHERE Задание = ' + req.body.id);

            for (let i = 0; i < req.body.tags.length; i++) {
                await query('INSERT INTO Назначение (Задание, Тег) VALUES (' + req.body.id + ', '  + req.body.tags[i] + ')');
            }

            await query('DELETE FROM Теги WHERE NOT EXISTS (SELECT * FROM Назначение WHERE Назначение.Тег = Теги.id)');

            res.send({ id: req.body.id });
        } catch (e) {
            throw e;
        }
    })();
});

// Редактирование задания
app.post('/api/deletetask', express.json(), (req, res) => {
    if (!req.body) return res.sendStatus(400);
    console.log(req.body);
    (async () => {
        try {
            await query('DELETE FROM Задания WHERE id = ' + req.body.id);
            await query('DELETE FROM Теги WHERE NOT EXISTS (SELECT * FROM Назначение WHERE Назначение.Тег = Теги.id)');

            res.send({ id: req.body.id });
        } catch (e) {
            throw e;
        }
    })();
});

// Слушаем порт
app.listen(PORT, () => {
    console.log(`Server has been started... port: ${PORT}`);
});