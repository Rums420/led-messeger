const express = require('express')
const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))

app.get('/login', (req, res) => {
    res.render('index')
})

app.get('/register', (req, res) => {
    res.render('register')
})

app.get('/register/email-verification', (req, res) => {
    res.render('em_veref')
})

app.get('/baget/baget', (req, res) => {
    res.render('baget')
})

app.get('/', (req, res) => {
    res.render('feed')
})

app.get('/notifications', (req, res) => {
    res.render('notif')
})

app.get('/profile', (req, res) => {
    res.render('profile')
})


app.listen(3000, '0.0.0.0', () => { 
    console.log('Сервер запущен🚀: http://localhost:3000');
    console.log('Для телефонов и других устройств🚀: http://192.168.0.139:3000') 
})