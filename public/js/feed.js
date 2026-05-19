import { auth, database } from "./firebase-config.js";
import { ref, get, set, update, push, increment  } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { signOut, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
var width = window.innerWidth;

// ====================== Проверка логина ======================
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = "/login";
        return;
    }
    
    const snapshot = await get(ref(database, `users/${user.uid}`));
    const data = snapshot.val();
    document.getElementById('avatarka').textContent = data.avatar;
});

// ====================== Кнопки меню ======================

// Выход
document.getElementById('button_log_out').addEventListener('click', () => {
    signOut(auth);
    window.location.href = "/login";
});

// Уведомления
document.getElementById('button_notif').addEventListener('click', () => {
    window.location.href = '/notifications';
});

// Профиль
document.getElementById('button_profile').addEventListener('click', () => {
    window.location.href = '/profile';
});

// Лента
document.getElementById('button_feed').addEventListener('click', () => {
    window.location.href = '/';
});

// ====================== Лайк ======================


// Форматирование числа
function formatLikes(count) {
    if (count >= 1000) {
        return (count / 1000).toFixed(0) + 'K';
    }
    return count.toString();
}

const likeSvg = document.getElementById('like_svg');

async function addLike(event) {
    const likeButton = event.target.closest('.like_button');
    
    const postId = likeButton.id.replace("_like_button", "");
    const user = auth.currentUser;
    const userId = user.uid;
    
    const postRef = ref(database, `posts/${postId}`);
    const snapshot = await get(postRef);
    const data = snapshot.val();
    
    const isLiked = data.likedBy?.[userId] === true;   // из тех же данных
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

// ====================== Добавление изображения ======================
const preview = document.getElementById('preview');
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

// ====================== Публикация поста💀 ======================

const watnewText = document.getElementById('wat_new');
const publishBtn = document.getElementById('publish_btn');


function checkPost() {
    publishBtn.disabled = watnewText.value.trim() === '';
}

watnewText.addEventListener('input', checkPost);
checkPost();

publishBtn.addEventListener('click', Publish_post);

async function Publish_post(){
    if(width <= 768){
        publishPost.style.display = 'none';
        isShow = false;
    }
    
    const user = await auth.currentUser;
    const snapshot = await get(ref(database, `users/${user.uid}`));
    const data = snapshot.val();

    const textArea = document.getElementById('wat_new').value;

    const preview = document.getElementById('preview');
    const imgElement = preview.querySelector('img');
    const img = imgElement ? imgElement.src : null;

    const username = data.username;
    const name = data.name;
    const avatar = data.avatar;

    const postsRef = ref(database, 'posts/') 
    const newPostRef = push(postsRef);
    const customId = newPostRef.key;

    set(ref(database, 'posts/' + customId), {
        photo: img,
        text: textArea,
        likes_count: 0,
        comments_count: 0,
        autor: name,
        autorUID: user.uid,
        views: 0,
        likedBy: {}
    })
    set(ref(database, `users/${user.uid}/posts/${customId}` ), true)
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg" viewbox="-5 -8 30 30"><path  stroke-linecap="round" stroke-linejoin="round" stroke-width="1.667" d="M10 4.583C8.75 2.917 6.25 2.5 4.583 3.75 2.917 5 2.083 7.5 3.333 10S10 16.667 10 16.667 15.417 12.5 16.667 10s0-5-1.667-6.25-4.167-.833-5 .833Z"></path></svg>
                    <span class="count like_count" id="like_count"></span>
                </button>
            </div>

            <div class="comment">
                <button type="button">
                    <svg xmlns="http://www.w3.org/2000/svg" id="comment_svg" viewBox="-6 -8 30 30"><path stroke-width="2" d="M14.953 5.046c-2.73-2.728-7.173-2.728-9.903 0-2.07 2.07-2.634 5.247-1.41 7.888.136.336.232.59.232.798 0 .247-.105.553-.205.849-.195.573-.416 1.222.058 1.696.475.475 1.125.251 1.697.055.294-.1.598-.205.84-.205.215 0 .486.109.798.235a7.034 7.034 0 0 0 7.893-1.412c2.73-2.73 2.73-7.172 0-9.904Z" clip-rule="evenodd" ></path></svg>
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

    var text = postDiv.querySelector('#text');
    text.textContent = postData.text;
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
    const likeButtons = postDiv.querySelector('.like_button');
    if(likeButtons) likeButtons.addEventListener('click', addLike);
    
}

// ====================== Скрол постов ======================

let allPostIds = [];
let allData = null;
let currentIndex = 0;
const BATCH_SIZE = 7;
let isLoading = false;
let scrollTrigger = null;

function setupInfiniteScroll() {
    scrollTrigger = document.createElement('div');
    scrollTrigger.id = 'scroll-trigger';
    document.getElementById('posts-container').appendChild(scrollTrigger);

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            showNextBatch();
        }
    }, { rootMargin: '200px' });

    observer.observe(scrollTrigger);
}

async function loadPosts() {
    const snapshot = await get(ref(database, '/posts'));
    allData = snapshot.val();

    if (!allData.posts) {
        document.getElementById('loading').style.display = 'none';
        return;
    }

    // Берём все ID постов и перемешиваем их рандомно
    allPostIds = Object.keys(allData.posts).sort(() => Math.random() - 0.5);

    setupInfiniteScroll();
    showNextBatch();
}

// Показывает следующие BATCH_SIZE постов
function showNextBatch() {
    if (isLoading) return;
    isLoading = true;

    let batch = allPostIds.slice(currentIndex, currentIndex + BATCH_SIZE);

    if (batch.length === 0) {
        currentIndex = 0;
        allPostIds = allPostIds.sort(() => Math.random() - 0.5);
        batch = allPostIds.slice(currentIndex, currentIndex + BATCH_SIZE);
    }

    for (const id of batch) {
        if (document.getElementById(id)) continue;
        showPost(id);
    }

    currentIndex += batch.length;
    isLoading = false;
    document.getElementById('loading').style.display = 'none';

    // Перемещаем триггер в самый низ после добавления постов
    const trigger = document.getElementById('scroll-trigger');
    const container = document.getElementById('posts-container');
    container.appendChild(trigger); // appendChild перемещает уже существующий элемент в конец

}

// Показывает один пост по его ID
function showPost(postId) {
    const user = auth.currentUser;
    const post = allData.posts[postId];

    const autorUID = allData.posts[postId].autorUID;
    const avatar = allData.users[autorUID].avatar;
    const name = allData.users[autorUID].name;

    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.id = postId;
    postDiv.innerHTML = `
        <div class="user_info">
            <span class="avatarka">${avatar}</span> 
            <span class="username">${name}</span>
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
                    <svg xmlns="http://www.w3.org/2000/svg" id="comment_svg" viewBox="-6 -8 30 30"><path stroke-width="2" d="M14.953 5.046c-2.73-2.728-7.173-2.728-9.903 0-2.07 2.07-2.634 5.247-1.41 7.888.136.336.232.59.232.798 0 .247-.105.553-.205.849-.195.573-.416 1.222.058 1.696.475.475 1.125.251 1.697.055.294-.1.598-.205.84-.205.215 0 .486.109.798.235a7.034 7.034 0 0 0 7.893-1.412c2.73-2.73 2.73-7.172 0-9.904Z" clip-rule="evenodd"></path></svg>
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

    const container = document.getElementById('posts-container');
    container.appendChild(postDiv); // append а не prepend — новые посты снизу

    setupViewCounter(postDiv, postId);

    postDiv.querySelector('.like_button').addEventListener('click', addLike);
    const avatarka = postDiv.querySelector('.avatarka');
    avatarka.style.cursor = 'pointer';
    avatarka.addEventListener('click', () => {
        window.location.href = `/profile?uid=${autorUID}`;
    });
    postDiv.querySelector('.comment button').addEventListener('click', () => {
        openComments(postId);
    });
}
loadPosts();

const viewedPosts = new Set();

function setupViewCounter(postDiv, postId) {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            
            // Если пост уже просмотрен — пропускаем
            if (viewedPosts.has(postId)) {
                observer.unobserve(postDiv);
                return;
            }

            // Добавляем в просмотренные
            viewedPosts.add(postId);

            update(ref(database, `posts/${postId}`), {
                views: (allData.posts[postId].views || 0) + 1
            });

            allData.posts[postId].views += 1;
            postDiv.querySelector('#count_views').textContent = allData.posts[postId].views;

            observer.unobserve(postDiv);
        }
    }, { threshold: 0.5 });

    observer.observe(postDiv);
}

let currentPostId = null;

// ================= Открытие/закрытие коментариев  

function openComments(postId) {
    currentPostId = postId;
    document.getElementById('comments_overlay').style.display = 'block';
    document.getElementById('comments_panel').style.display = 'flex';
    document.getElementById('comments_avatar').textContent = allData.users[auth.currentUser.uid].avatar;
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