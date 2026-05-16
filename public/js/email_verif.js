import { auth } from "./firebase-config.js";
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "/register";
        return;
    }
    
    // Показываем email
    document.getElementById('user-email').textContent = user.email;
    
    if (!user.emailVerified) {
        await sendEmailVerification(user);
    }
    
    document.getElementById('verify-btn').addEventListener('click', async () => {
        await user.reload();
        
        if (user.emailVerified) {
            alert('Email подтверждён!');
            await auth.signOut();
            window.location.href = "/login";
        }
    });
});