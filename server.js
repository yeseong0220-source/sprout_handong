const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 데이터 파일 경로
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');

// 데이터 파일 초기화
function initDataFiles() {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(POSTS_FILE)) {
        fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
    }
}

// 데이터 읽기 함수
function readUsers() {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
}

function readPosts() {
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    return JSON.parse(data);
}

// 데이터 쓰기 함수
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function writePosts(posts) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// 회원가입 API
app.post('/api/signup', (req, res) => {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
    }

    const users = readUsers();

    // 중복 아이디 체크
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).json({ success: false, message: '이미 존재하는 아이디입니다.' });
    }

    // 새 사용자 추가
    users.push({
        id: Date.now(),
        username,
        password, // 실제로는 암호화해야 하지만 예제용으로 단순화
        name,
        createdAt: new Date().toISOString()
    });

    writeUsers(users);
    res.json({ success: true, message: '회원가입이 완료되었습니다.' });
});

// 닉네임 설정 API
app.post('/api/set-nickname', (req, res) => {
    const { userId, nickname } = req.body;

    if (!userId || !nickname) {
        return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 닉네임 중복 체크
    const existingNickname = users.find(u => u.nickname === nickname && u.id !== userId);
    if (existingNickname) {
        return res.status(400).json({ success: false, message: '이미 사용중인 닉네임입니다.' });
    }

    users[userIndex].nickname = nickname;
    writeUsers(users);

    res.json({ success: true, message: '닉네임이 설정되었습니다.' });
});

// 로그인 API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: '아이디와 비밀번호를 입력해주세요.' });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }

    res.json({
        success: true,
        message: '로그인 성공',
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            nickname: user.nickname || null
        }
    });
});

// 게시글 목록 조회 API
app.get('/api/posts', (req, res) => {
    const posts = readPosts();
    // 최신글이 위로 오도록 정렬
    posts.sort((a, b) => b.id - a.id);
    res.json({ success: true, posts });
});

// 게시글 작성 API
app.post('/api/posts', (req, res) => {
    const { title, content, author, authorId } = req.body;

    if (!title || !content || !author) {
        return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }

    const posts = readPosts();

    const newPost = {
        id: Date.now(),
        title,
        content,
        author,
        authorId,
        createdAt: new Date().toISOString()
    };

    posts.push(newPost);
    writePosts(posts);

    res.json({ success: true, message: '게시글이 작성되었습니다.', post: newPost });
});

// 특정 게시글 조회 API
app.get('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id);
    const posts = readPosts();
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
    }

    res.json({ success: true, post });
});

// 서버 시작
initDataFiles();
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행중입니다.`);
});
