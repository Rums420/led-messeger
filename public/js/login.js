import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

document.getElementById('login_form').addEventListener("submit", checkForm)

const width = window.innerWidth;
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function checkForm(event){
    event.preventDefault();

    var obj = document.getElementById('login_form');           //Сылки на объекты
    var pass = obj.pass.value;
    var email = obj.email.value;
    var error_div = document.getElementById('error_div');

    var error_text = "";                                      //Ошибки
    var has_error = false;

    if(email == ""){                                             //Проверки поля EMAIL
        error_text = "Введите email";
        has_error = true;
    }

    if(pass == ""){                                              //Проверки поля PASS
        error_text = "Введите пароль";
        has_error = true;
    }else if(pass.includes(' ')){
        error_text = "Пароле не должен содержать пробелы";
        has_error = true;
    }

    if(has_error) {
        error_show(error_text);
        return;
    }

   try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    await user.reload();

    if(!user.emailVerified){ 
        error_show("Подтвердите email");
        await wait(2000);
        window.location.href = '/register/email-verification';
        return;
    }

    window.location.href = '/';
   } catch(error) {

    var error_text = "";
    switch (error.code) {
        case 'auth/user-not-found':
            error_text = "Пользователь не найден";
            break;
        case 'auth/wrong-password':
            error_text = "Неверный пароль";
            break;
        case 'auth/invalid-credential':
            error_text = "Неверный email или пароль";
            break;
        default:
            error_text = error;
            console.log(error)
    }
    error_show(error_text);
    }
}

async function error_show(error_text) {
    if(width <= 768){
        document.getElementById('error_text').innerHTML = error_text;
        error_div.style.opacity = 1;
        error_div.style.bottom = '4%';
                
        await wait(2000);

        error_div.style.opacity = 0;
        error_div.style.bottom = '0.5%';

    } else if(width >= 1024){
        document.getElementById('error_text').innerHTML = error_text;
        error_div.style.opacity = 1;
        error_div.style.bottom = '22%';
                
        await wait(2000);

        error_div.style.opacity = 0;
        error_div.style.bottom = '18%';
    }
}