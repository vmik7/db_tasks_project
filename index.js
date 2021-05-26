const express = require("express");
const mysql = require("mysql2");

// Номер порта задаём константой
const PORT = 80;
const app = express();

// Подключаем шаблонизатор
app.set('view engine', 'ejs');

// Подключаемся к MySQL
const connection = mysql.createConnection({
    host: "localhost",
    port: 8889,
    user: "root",
    database: "tasks_projects",
    password: "root"
});
// connection.connect(function (err) {
//     if (err) {
//         return console.error("Ошибка: " + err.message);
//     }
//     else {
//         console.log("Подключение к серверу MySQL успешно установлено");
//     }
// });

// Обрабатываем корневой запрос
app.get("/", (req, res) => {

    let tasks;
    connection.query("SELECT * FROM Задания", (err, results, fields) => {
        if (err) {
            console.log(err);
        }
        else {
            tasks = results;
        }

        res.render('index', {
            msg: JSON.stringify(tasks)
        });
    });
});

// Слушаем порт
app.listen(PORT, () => {
    console.log(`Server has been started... port: ${PORT}`);
});