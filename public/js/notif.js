import { auth} from "./firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
const user = auth.currentUser;


auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = "/login";
    }
});

document.getElementById('button_log_out').addEventListener('click', () => {
    signOut(auth);
})

/* ====================== Переадресовка ====================== */

document.getElementById('button_feed').addEventListener('click', () =>{
    window.location.href = ('/');
});

document.getElementById('button_profile').addEventListener('click', () =>{
    window.location.href = ('/profile');
});