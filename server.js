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

// 프로필 설정 API (닉네임 + RC)
app.post('/api/set-profile', (req, res) => {
    const { userId, nickname, rc } = req.body;

    // 입력값 검증
    if (!userId || !nickname || !rc) {
        return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    // 공백 체크
    if (nickname.trim() === '') {
        return res.status(400).json({ success: false, message: '닉네임을 입력해주세요.' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 닉네임 중복 체크
    const existingNickname = users.find(u => u.nickname === nickname.trim() && u.id !== userId);
    if (existingNickname) {
        return res.status(400).json({ success: false, message: '이미 사용중인 닉네임입니다.' });
    }

    // RC 유효성 검증
    const validRCs = ['토레이 College', '손양원 College', '카이퍼 College', '장기려 College', '카마이클 College'];
    if (!validRCs.includes(rc)) {
        return res.status(400).json({ success: false, message: '올바른 RC를 선택해주세요.' });
    }

    users[userIndex].nickname = nickname.trim();
    users[userIndex].rc = rc;
    writeUsers(users);

    res.json({ success: true, message: '프로필이 설정되었습니다.' });
});

// 닉네임 변경 API
app.post('/api/update-nickname', (req, res) => {
    const { userId, nickname } = req.body;

    // 입력값 검증
    if (!userId || !nickname) {
        return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    // 공백 체크
    if (nickname.trim() === '') {
        return res.status(400).json({ success: false, message: '닉네임을 입력해주세요.' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // 닉네임 중복 체크
    const existingNickname = users.find(u => u.nickname === nickname.trim() && u.id !== userId);
    if (existingNickname) {
        return res.status(400).json({ success: false, message: '이미 사용중인 닉네임입니다.' });
    }

    users[userIndex].nickname = nickname.trim();
    writeUsers(users);

    res.json({ success: true, message: '닉네임이 변경되었습니다.' });
});

// RC 변경 API
app.post('/api/update-rc', (req, res) => {
    const { userId, rc } = req.body;

    // 입력값 검증
    if (!userId || !rc) {
        return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    // RC 유효성 검증
    const validRCs = ['토레이 College', '손양원 College', '카이퍼 College', '장기려 College', '카마이클 College'];
    if (!validRCs.includes(rc)) {
        return res.status(400).json({ success: false, message: '올바른 RC를 선택해주세요.' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    users[userIndex].rc = rc;
    writeUsers(users);

    res.json({ success: true, message: 'RC가 변경되었습니다.' });
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
            nickname: user.nickname || null,
            rc: user.rc || null
        }
    });
});

// 게시글 목록 조회 API (RC 필터링)
app.get('/api/posts', (req, res) => {
    const { rc } = req.query;
    let posts = readPosts();

    // RC 필터링
    if (rc) {
        posts = posts.filter(post => post.rc === rc);
    }

    // 최신글이 위로 오도록 정렬
    posts.sort((a, b) => b.id - a.id);
    res.json({ success: true, posts });
});

// 게시글 작성 API
app.post('/api/posts', (req, res) => {
    const { title, content, author, authorId, rc } = req.body;

    // 입력값 검증
    if (!title || !content || !author) {
        return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }

    // 공백 체크
    if (title.trim() === '' || content.trim() === '') {
        return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' });
    }

    const posts = readPosts();

    const newPost = {
        id: Date.now(),
        title: title.trim(),
        content: content.trim(),
        author,
        authorId,
        rc: rc || null,
        likes: 0,
        likedBy: [],
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

// 게시글 좋아요(하트) API
app.post('/api/posts/like', (req, res) => {
    const { postId, userId } = req.body;

    if (!postId || !userId) {
        return res.status(400).json({ success: false, message: '필수 정보가 없습니다.' });
    }

    const posts = readPosts();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
    }

    // 좋아요 배열 초기화 (기존 게시글 호환성)
    if (!posts[postIndex].likedBy) {
        posts[postIndex].likedBy = [];
        posts[postIndex].likes = 0;
    }

    // 좋아요 토글
    const likedIndex = posts[postIndex].likedBy.indexOf(userId);

    if (likedIndex > -1) {
        // 이미 좋아요를 누른 경우 -> 취소
        posts[postIndex].likedBy.splice(likedIndex, 1);
        posts[postIndex].likes = posts[postIndex].likedBy.length;
        writePosts(posts);
        res.json({ success: true, message: '좋아요가 취소되었습니다.', liked: false });
    } else {
        // 좋아요 추가
        posts[postIndex].likedBy.push(userId);
        posts[postIndex].likes = posts[postIndex].likedBy.length;
        writePosts(posts);
        res.json({ success: true, message: '좋아요!', liked: true });
    }
});

// 서버 시작
initDataFiles();
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행중입니다.`);
});
