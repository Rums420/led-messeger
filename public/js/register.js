import { auth, database } from "./firebase-config.js";
import { createUserWithEmailAndPassword, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { ref, set, get, update, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

document.getElementById('login_form').addEventListener("submit", checkForm);

/* =============== Функция выбора аватарки =============== */

const avatarCircle = document.getElementById('avatar-circle');
const container = document.getElementById('picker-container');
const avatar = document.getElementById('avatar');
var avatarSelected = false;

avatarCircle.addEventListener("click", async () => {
    // Если пикер уже открыт — закрываем его
    if (container.innerHTML !== '') {
        container.innerHTML = '';
        return;
    }
    
    // Загружаем данные с эмодзи из интернета (один раз)
    const data = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')
        .then(response => response.json());
    
    // Создаём пикер
    const picker = new EmojiMart.Picker({
        data: data,                      // данные с эмодзи
        theme: 'dark',                
        onEmojiSelect: (emoji) => {      // когда выбрали эмодзи
            avatar.innerHTML = emoji.native;  // меняем аватарку
            avatar.style.fontSize = '40px';
            avatarSelected = true;
            container.innerHTML = '';               // закрываем пикер
        },
        previewPosition: 'none',         // убирает предпросмотр внизу
        searchPosition: 'none',          // убирает поле поиска
        skinTonePosition: 'none', 
        navPosition: 'none',       // убирает выбор цвета кожи
        emojiSize: 32,                  
        perLine: 5                      
    });
    
    // Добавляем пикер на страницу
    container.appendChild(picker);
});

document.onclick = (event) => {
    // Если кликнули НЕ по кружку аватарки
    if (!avatarCircle.contains(event.target)) {
        container.innerHTML = ''; 
    }
};

/* =============== Функция регистрации ===============*/
const width = window.innerWidth;

async function checkForm(event) {
    event.preventDefault();

    const obj = document.getElementById('login_form');
    const name = obj.name.value.trim();
    const pass = obj.pass.value.trim();
    const repass = obj.repass.value.trim();
    const username = obj.user_name.value.trim();
    var avatar = document.getElementById('avatar').textContent;
    const email = obj.email.value.trim();
    var error_div = document.getElementById('error_div');

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    var error_text = "";
    let has_error = false;

    // =============== ПРОВЕРКИ ===============
    if (!name) {
        error_text = "Заполни поле username";        //=============== Проверка ИМЯ ===============
        has_error = true;
    } else if (name.length <= 3) {
        error_text = "Слишком короткое имя (мин. 4 символа)";
        has_error = true;
    } else if (name == "Багет")
        window.location.href = "/baget/baget"

    if (!pass) {
        error_text = "Заполни поле username";        //=============== Проверка ПАРОЛЬ ===============
        has_error = true;
    } else if (pass.length < 8) {
        error_text = "Пароль слишком короткий (мин. 8 символов)";
        has_error = true;
    }

    if (!repass) {
        error_text = "Заполни поле повт. пароля";      //=============== Проверка ПОВТ. ПАРОЛЯ ===============
        has_error = true;
    } else if (pass !== repass) {
        error_text = "Пароли не совпадают";
        has_error = true;
    }

    //=============== Проверка username ===============

    if (!username) {
        error_text = "Заполни поле username";
        has_error = true;
    } else if (!username.startsWith('@')) {
        error_text = "Username должен начинаться с @";
        has_error = true;
    } else if (username.length <= 3) {
        error_text = "Слишком короткий username (мин. 4 символа с @)";
        has_error = true;
    } else {
        const usernameRef = ref(database, 'usernames/' + username);
        
        try {
            const snapshot = await get(usernameRef);  
            
            if (snapshot.exists()) {
                error_text = "Username уже занят";
                has_error = true;
            }
        } catch (error) {
            error_text = "Ошибка проверки username";
            has_error = true;
        }
    }

    if (!email) {
        error_text = "Заполни поле email";        //=============== Проверка ЭМАИЛ ===============
        has_error = true;
    } else if (!email.includes('@') || !email.includes('.')) {
        error_text = "Некорректный email";
        has_error = true;
    }

    if(!avatarSelected) {        //=============== Проверка АВАТАРКИ ===============
        error_text = "Аватарка не выбрана";
        has_error = true;
    }

    if(has_error && width <= 768){
        document.getElementById('error_text').innerHTML = error_text;
        error_div.style.opacity = 1;
        error_div.style.bottom = '1%';
        error_div.style.display = 'flex';
        
        await wait(2000);

        error_div.style.opacity = 0;
        error_div.style.bottom = '0.1%';
        return;
    } else if(has_error && width >=1024 ){
        document.getElementById('error_text').innerHTML = error_text;
        error_div.style.opacity = 1;
        error_div.style.bottom = '10%';
        
        await wait(2000);

        error_div.style.opacity = 0;
        error_div.style.bottom = '5%';
        return;
    }

    // =============== РЕГИСТРАЦИЯ ===============
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        await set(ref(database, 'users/' + user.uid), {
            name: name,
            username: username,
            avatar: avatar,
            email: email,
            subscribers: {},
            createdAt: new Date().toISOString()
        });
        await set(ref(database, 'usernames/' + username), user.uid);
        

        alert("Регистрация прошла успешно! Проверьте почту для подтверждения.");
        window.location.href = "/register/email-verification";
        
    } catch (error){
        console.error("ОШИБКА В РЕГИСТРАЦИИ:", error);
        let error_text = "";
        const width = window.innerWidth;
        
        if (error.code === 'auth/email-already-in-use') {
            error_text = "Email уже используется";
        } else if (error.code === 'auth/weak-password') {
            error_text = "Пароль слишком слабый";
        } else {
            error_text = error.code;
        }

        if(width <= 768){
            document.getElementById('error_text').innerHTML = error_text;
            error_div.style.opacity = 1;
            error_div.style.bottom = '1%';
            error_div.style.display = 'flex';
            
            await wait(2000);

            error_div.style.opacity = 0;
            error_div.style.bottom = '0.1%';
            return;

        } else if(width >=1024 ){
            document.getElementById('error_text').innerHTML = error_text;
            error_div.style.opacity = 1;
            error_div.style.bottom = '10%';
            
            await wait(2000);

            error_div.style.opacity = 0;
            error_div.style.bottom = '5%';
            return;
        }
    }
}

