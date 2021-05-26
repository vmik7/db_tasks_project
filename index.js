const express = require("express");
 
// Номер порта задаём константой
const PORT = 80;
const app = express();
 
// Подключаем шаблонизатор
app.set('view engine', 'ejs');

// Обрабатываем корневой запрос
app.get("/", (req, res) => {
    res.render('index', {
        msg: "Hello world! I'm using EJS :)"
    });
});

// Слушаем порт
app.listen(PORT, () => {
    console.log(`Server has been started... port: ${PORT}`);
});