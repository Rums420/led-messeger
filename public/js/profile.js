import { auth, database } from "./firebase-config.js";
import { ref, get, set , update, push, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const user = await auth.currentUser;
const width = window.innerWidth;

const urlParams = new URLSearchParams(window.location.search);
const profileUid = urlParams.get('uid'); // uid из URL
let targetUid;

auth.onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = "/login";
    } else {
        targetUid = profileUid || auth.currentUser.uid;

        if(targetUid == auth.currentUser.uid){
            publishBtn.addEventListener('click', Publish_post);
            document.getElementById('subscribe_button').style.display = 'none';
        } else {
            document.getElementById('publish_post').style.display = 'none';
            if(width <= 768)
                document.querySelector('.subscribe_button_mobile').style.display = 'block';
            else
                document.querySelector('.subscribe_button').style.display = 'block';
                document.querySelector('.info').style.marginBottom = '30%'
        }
        loadProfile();
        loadPostsProfile();
    }
});

document.getElementById('button_log_out').addEventListener('click', () => {
    signOut(auth);
})

async function loadProfile() {
    const user = auth.currentUser;
    if (!user) return;
    
    const snapshot = await get(ref(database, `users/${targetUid}`));
    const data = snapshot.val();
    const subscribersCount = data.subscribers ? Object.keys(data.subscribers).length : 0;

    const createdAt = new Date(data.createdAt);
    const formattedDate = createdAt.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    document.getElementById('created-at').textContent = formattedDate;
    document.getElementById('username').textContent = data.username;
    document.getElementById('name').textContent = data.name;
    document.getElementById('avatar1').textContent = data.avatar;
    document.getElementById('avatar2').textContent = data.avatar;
    document.getElementById('subscribers').textContent = subscribersCount;


    // ====================== Кнопка подписаться ======================

    if (targetUid === auth.currentUser.uid) return;
    const userSnap = await get(ref(database, `users/${targetUid}/subscribers/${auth.currentUser.uid}`));
    
    const subscribe_button = document.getElementById('subscribe_button');
    const plusik = document.getElementById('plusik');
    const galochka = document.getElementById('galochka');
    var heSubscribed = false;

    if(userSnap.exists())
        heSubscribed = true;    
    else
        heSubscribed = false;
    

    if(heSubscribed == false){
        plusik.style.display = 'block';
        galochka.style.display = 'none';
        plusik.style.color = '#000';
        galochka.style.color = '#000';
        subscribe_button.querySelector('span').textContent = 'Подписаться';
        subscribe_button.querySelector('span').style.color = '#000';
        subscribe_button.style.backgroundColor = 'whitesmoke';
        subscribe_button.style.display = 'flex';
        subscribe_button.style.alignItems = 'center';
        subscribe_button.style.justifyContent = 'center';
        subscribe_button.style.gap = '5px';
    } else {
        plusik.style.display = 'none';
        galochka.style.display = 'block';
        plusik.style.color = 'whitesmoke';
        galochka.style.color = 'whitesmoke';
        subscribe_button.querySelector('span').textContent = 'Вы подписаны';
        subscribe_button.querySelector('span').style.color = 'whitesmoke';
        subscribe_button.style.width = (subscribe_button.offsetWidth + 10) + 'px';
        subscribe_button.style.backgroundColor = '#222224';
        subscribe_button.style.display = 'flex';
        subscribe_button.style.alignItems = 'center';
        subscribe_button.style.justifyContent = 'center';
        subscribe_button.style.gap = '5px';
    }
}

// ====================== Лайк ======================


// Форматирование числа
function formatLikes(count) {
    if (count >= 1000) {
        return (count / 1000).toFixed(0) + 'K';
    }
    return count.toString();
}

async function addLike(event) {
    const likeButton = event.target.closest('.like_button');
    const postId = likeButton.id.replace("_like_button", "");
    const user = auth.currentUser;
    const userId = targetUid;
    
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    const data = snapshot.val();
    
    // Проверяем лайкнул ли уже этот юзер
    const isLiked = data.likedBy?.[userId] === true;
    let likesCount = data.likes_count || 0;
    
    const postElement = document.getElementById(postId);
    const likeSvg = postElement.querySelector('.like svg');
    const likeCountSpan = postElement.querySelector('.like .count');
    
    if (!isLiked) {
        likeSvg.style.fill = '#f91818';
        likeSvg.style.stroke = 'transparent';
        likeSvg.style.transform = 'scale(1.3)';
        likesCount++;
        setTimeout(() => likeSvg.style.transform = 'scale(1)', 100);
        
        update(postRef, {
            [`likedBy/${userId}`]: true,
            likes_count: likesCount
        });
    } else {
        likeSvg.style.fill = 'transparent';
        likeSvg.style.stroke = '#ffffffb4';
        likesCount--;
        
        update(postRef, {
            [`likedBy/${userId}`]: null,
            likes_count: likesCount
        });
    }
    
    likeCountSpan.textContent = formatLikes(likesCount);
}

// ======================  Кнопка публикации поста(телефон) ======================

var isShow = false;
const publishPost = document.getElementById('publish_post');

document.getElementById("add-post").addEventListener('click', (event) => {
    event.stopPropagation(); 
    publishPost.style.display = 'flex';
    isShow = true;
})

document.addEventListener('click', function(event) {
    if(!event.target.closest('#publish_post') && isShow && !isFileChoosing){
        publishPost.style.display = 'none';
        isShow = false;
        hasImage = false;
        watnewText.value = "";
        preview.innerHTML = null;
        checkPost();
    }
})

// ====================== Публикация поста💀 ======================

const watnewText = document.getElementById('wat_new');
const publishBtn = document.getElementById('publish_btn');
const preview = document.getElementById('preview');

function checkPost() {
    publishBtn.disabled = watnewText.value.trim() === '';
}

watnewText.addEventListener('input', checkPost);
checkPost();

async function Publish_post(){
    if(width <= 768){
        publishPost.style.display = 'none';
        isShow = false;
    }
    
    const user = await auth.currentUser;
    const snapshot = await get(ref(database, `users/${targetUid}`));
    const data = snapshot.val();

    const textArea = document.getElementById('wat_new').value;

    const imgElement = preview.querySelector('img');
    const img = imgElement ? imgElement.src : null;

    const username = data.username;
    const name = data.name;
    const avatar = data.avatar;

    const postsRef = ref(database, 'posts/')
    const newPostRef = push(postsRef);
    const customId = newPostRef.key;

    await set(ref(database, 'posts/' + customId), {
        photo: img,
        text: textArea,
        likes_count: 0,
        comments_count: 0,
        autor: name,
        autorUID: user.uid,
        views: 0
    })
    set(ref(database, `users/${targetUid}/posts/${customId}` ), true)
    watnewText.value = "";
    preview.innerHTML = null;
    checkPost();

    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.id = customId;
    postDiv.innerHTML = `
        <div class="user_info">
            <span class="avatarka">${avatar}</span>
            <span class="username">${name}</span>
        </div>
        <span id="text">${text}</span>
        <img src="https://static.wikia.nocookie.net/e142de6d-c068-4a38-bc31-b899d013ddab/scale-to-width/755" alt="Пост фото" id="post_img">
        <div class="post-actions">
            <div class="like">
                <button type="button" class="like_button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg" viewbox="-5 -8 30 30"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M10 4.583C8.75 2.917 6.25 2.5 4.583 3.75 2.917 5 2.083 7.5 3.333 10S10 16.667 10 16.667 15.417 12.5 16.667 10s0-5-1.667-6.25-4.167-.833-5 .833Z"></path></svg>
                    <span class="count like_count" id="like_count"></span>
                </button>
            </div>
            <div class="comment">
                <button type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" id="comment_svg" viewBox="-6 -8 30 30"><path stroke-width="2" d="M14.953 5.046c-2.73-2.728-7.173-2.728-9.903 0-2.07 2.07-2.634 5.247-1.41 7.888.136.336.232.59.232.798 0 .247-.105.553-.205.849-.195.573-.416 1.222.058 1.696.475.475 1.125.251 1.697.055.294-.1.598-.205.84-.205.215 0 .486.109.798.235a7.034 7.034 0 0 0 7.893-1.412c2.73-2.73 2.73-7.172 0-9.904Z" clip-rule="evenodd"></path></svg>
                    <span class="count comment_count">10</span>
                </button>
            </div>
            <div class="views">
                <svg xmlns="http://www.w3.org/2000/svg" id="views_svg" fill="none" viewBox="-4 -8 30 30"><path stroke="#ffffffb4" stroke-width="1.5" d="M2 10s2.91-6 8-6 8 6 8 6-2.91 6-8 6-8-6-8-6Z"></path><path stroke="#ffffffb4" stroke-width="1.5" d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path></svg>
                <span id="count_views">5K</span>
            </div>
        </div>
    `

    const postSnapshot = await get(ref(database, "posts/" + customId));
    const postData = postSnapshot.val();

    const post_img = postDiv.querySelector('#post_img');

    var likeCount = postData.likes_count;
    likeCount = formatLikes(likeCount);
    await update(ref(database, `posts/${customId}` ), {
        likes_count: likeCount,
    })

    if (!postData.photo || postData.photo === '') {
        post_img.style.display = 'none'; 
    } else {
        post_img.style.display = 'block';  
        post_img.src = postData.photo;
    }
    postDiv.querySelector('.like svg').id = `${customId}_like`
    postDiv.querySelector('.like button').id = `${customId}_like_button`
    postDiv.querySelector('.like .count').textContent = likeCount; 
    postDiv.querySelector('.comment_count').textContent = postData.comments_count; 
    postDiv.querySelector('#count_views').textContent = postData.views; 

    const container = document.getElementById('posts-container');
    container.prepend(postDiv);
    const likeButtons = document.querySelector('.like_button');
    if(likeButtons) likeButtons.addEventListener('click', addLike);
}

// ====================== Добавление изображения ======================

let hasImage = false;
var isFileChoosing = false;

const fileInput = Object.assign(document.createElement('input'), {
    type: 'file',
    accept: 'image/*',
    style: 'display:none'
});
document.body.appendChild(fileInput);

document.getElementById('attach_btn').onclick = () => {
    isFileChoosing = true;
    fileInput.click();
};

fileInput.onchange = (e) => {
    isFileChoosing = false;
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
        hasImage = true;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `<img id="img_publish" src="${e.target.result}" style="max-width: 100%; border-radius: 12px;">`;
            publishBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }
};

// ====================== Загрузка постов автора ======================
document.getElementById('no_posts').style.display = 'none';

async function loadPostsProfile() {
    const user = auth.currentUser;
    if (!user) return;

    const userSnap = await get(ref(database, `users/${targetUid}`));
    const avatar = userSnap.val().avatar;

    const userPostsSnap = await get(ref(database, `users/${targetUid}/posts`));
    if (!userPostsSnap.exists()) { 
        document.getElementById('no_posts').style.display = 'flex'; 
        return; 
    }

    const postsIds = Object.keys(userPostsSnap.val());

    for (const id of postsIds) {
        const postSnap = await get(ref(database, `posts/${id}`));
        if (!postSnap.exists()) continue;
        showPost(id, postSnap.val(), avatar);
    }
}
function showPost(postId, post, avatar) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.id = postId;
    postDiv.innerHTML = `
        <div class="user_info">
            <span class="avatarka">${avatar}</span> 
            <span class="username">${post.autor}</span>
        </div>
        <span id="text">${post.text}</span>
        <img alt="Пост фото" id="post_img">
        <div class="post-actions">
            <div class="like">
                <button type="button" class="like_button">
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg" viewbox="-5 -8 30 30"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M10 4.583C8.75 2.917 6.25 2.5 4.583 3.75 2.917 5 2.083 7.5 3.333 10S10 16.667 10 16.667 15.417 12.5 16.667 10s0-5-1.667-6.25-4.167-.833-5 .833Z"></path></svg>
                    <span class="count like_count" id="like_count"></span>
                </button>
            </div>
            <div class="comment">
                <button type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" id="comment_svg" viewBox="-6 -8 30 30"><path stroke-width="2" d="M14.953 5.046c-2.73-2.728-7.173-2.728-9.903 0-2.07 2.07-2.634 5.247-1.41 7.888.136.336.232.5.232.798 0 .247-.105.553-.205.849-.195.573-.416 1.222.058 1.696.475.475 1.125.251 1.697.055.294-.1.598-.205.84-.205.215 0 .486.109.798.235a7.034 7.034 0 0 0 7.893-1.412c2.73-2.73 2.73-7.172 0-9.904Z" clip-rule="evenodd"></path></svg>
                    <span class="count comment_count"></span>
                </button>
            </div>
            <div class="views">
                <svg xmlns="http://www.w3.org/2000/svg" id="views_svg" fill="none" viewBox="-4 -8 30 30"><path stroke="#ffffffb4" stroke-width="1.5" d="M2 10s2.91-6 8-6 8 6 8 6-2.91 6-8 6-8-6-8-6Z"></path><path stroke="#ffffffb4" stroke-width="1.5" d="M10 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path></svg>
                <span id="count_views"></span>
            </div>
        </div>
    `;

    const post_img = postDiv.querySelector('#post_img');
    if (!post.photo || post.photo === '') {
        post_img.style.display = 'none';
    } else {
        post_img.style.display = 'block';
        post_img.src = post.photo;
    }

    postDiv.querySelector('.like svg').id = `${postId}_like`;
    postDiv.querySelector('.like button').id = `${postId}_like_button`;
    postDiv.querySelector('.like .count').textContent = post.likes_count;
    postDiv.querySelector('.comment_count').textContent = post.comments_count;
    postDiv.querySelector('#count_views').textContent = post.views;

    document.getElementById('posts-container').appendChild(postDiv);
    postDiv.querySelector('.comment button').addEventListener('click', () => {
        openComments(postId);
    });
    postDiv.querySelector('.like_button').addEventListener('click', addLike);
}

document.getElementById('subscribe_button').addEventListener('click', subscribe);

// ====================== Подписка ======================
async function subscribe() {
    const user = auth.currentUser;
    if (!user) return;
    if (targetUid === auth.currentUser.uid) return;
    const userSnap = await get(ref(database, `users/${targetUid}/subscribers/${auth.currentUser.uid}`));

    const subscribe_button = document.getElementById('subscribe_button');
    const plusik = document.getElementById('plusik');
    const galochka = document.getElementById('galochka');
    var heSubscribed;

    if(userSnap.exists())
        heSubscribed = true;    
    else
        heSubscribed = false;
    
    // ====================== Логика клика ======================

    if (heSubscribed == false) {
        // не подписан → подписываем
        plusik.style.display = 'none';
        galochka.style.display = 'block';
        galochka.style.color = 'whitesmoke';
        subscribe_button.querySelector('span').textContent = 'Вы подписаны';
        subscribe_button.querySelector('span').style.color = 'whitesmoke';
        subscribe_button.style.backgroundColor = '#222224';
        subscribe_button.style.display = 'flex';
        subscribe_button.style.alignItems = 'center';
        subscribe_button.style.justifyContent = 'center';
        subscribe_button.style.gap = '5px';
        await set(ref(database, `users/${targetUid}/subscribers/${auth.currentUser.uid}`), true);
    } else {
        // подписан → отписываем
        plusik.style.display = 'block';
        galochka.style.display = 'none';
        plusik.style.color = '#000';
        subscribe_button.querySelector('span').textContent = 'Подписаться';
        subscribe_button.querySelector('span').style.color = '#000';
        subscribe_button.style.backgroundColor = 'whitesmoke';
        subscribe_button.style.display = 'flex';
        subscribe_button.style.alignItems = 'center';
        subscribe_button.style.justifyContent = 'center';
        subscribe_button.style.gap = '5px';
        await remove(ref(database, `users/${targetUid}/subscribers/${auth.currentUser.uid}`));
    }
}

// ================= Открытие/закрытие коментариев  

let currentPostId = null;   
let allData = null;

async function openComments(postId) {
    currentPostId = postId;
    document.getElementById('comments_overlay').style.display = 'block';
    document.getElementById('comments_panel').style.display = 'flex';
    
    const userSnap = await get(ref(database, `users/${auth.currentUser.uid}`));
    document.getElementById('comments_avatar').textContent = userSnap.val().avatar;
    
    loadComments(postId);
}

document.getElementById('comments_send_btn').addEventListener('click', () => { 
    if (currentPostId) addComment(currentPostId);
});

function closeComments() {
    document.getElementById('comments_overlay').style.display = 'none';
    document.getElementById('comments_panel').style.display = 'none';
    currentPostId = null;
}

// ================= Сохранение коментариев =================

const comments_input = document.getElementById('comments_input');

function checkComment(){
    document.getElementById('comments_send_btn').disabled = comments_input.value.trim() === '';
}
comments_input.addEventListener('input', checkComment);
checkComment();

async function addComment(postId) {
    currentPostId = postId;
    const text = comments_input.value;
    const user = auth.currentUser;
    const name = allData.users[user.uid].name;
    const delay = async (ms) => await new Promise(resolve => setTimeout(resolve, ms));
    
    const commentsRef = ref(database, `posts/${currentPostId}/comments/`) 
    const newPostRef = push(commentsRef);

    await set(newPostRef, {
        text: text,
        autor: name,
        autorUID: user.uid,
        avatar: allData.users[user.uid].avatar
    });
    await update(ref(database, `posts/${postId}`), {
        comments_count: increment(1)
    });

    const snapshot = await get(ref(database, `posts/${postId}/`));
    const data = snapshot.val();
    const postElement = document.getElementById(currentPostId);
    document.getElementById(currentPostId).querySelector('.comment_count').textContent = data.comments_count;
    loadComments(currentPostId);
    comments_input.value = '';
    checkComment();
    await delay(2000);
}
document.getElementById('comments_close').addEventListener('click', closeComments);
document.getElementById('comments_overlay').addEventListener('click', closeComments);

// ================= Загрузка коментариев =================

async function loadComments(postId) {
    const commentsList = document.getElementById('comments_list');
    commentsList.innerHTML = ''; // очищаем список перед загрузкой

    const snap = await get(ref(database, `posts/${postId}/comments`));
    
    if (!snap.exists()) {
        commentsList.innerHTML = '<span style="color: #6b6b6d; text-align: center;">Комментариев пока нет</span>';
        return;
    }

    const comments = snap.val();
    for (const id of Object.keys(comments)) {
        const comment = comments[id];
        showComment(comment);
    }
}

function showComment(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.innerHTML = `
        <div class="comment-user">
            <span class="comment-avatar">${comment.avatar || '😀'}</span>
            <span class="comment-autor">${comment.autor}</span>
        </div>
        <span class="comment-text">${comment.text}</span>
    `;
    document.getElementById('comments_list').appendChild(commentDiv);
}

// ====================== Переадресовка ====================== 

document.getElementById('button_feed').addEventListener('click', () =>{
    window.location.href = '/';
});

document.getElementById('button_notif').addEventListener('click', () =>{
    window.location.href = '/notifications';
});