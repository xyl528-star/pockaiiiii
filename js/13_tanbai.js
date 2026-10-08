// ========== 坦白说APP：题库 / AI生成题目 / 好友网格 / 匿名发信 ==========
// 职责：openCpTanbai / nextTbQuestion / fetchTbTitlesFromAI / selectTbFriend
// 后续丰富方向：更多主题包、自定义题库、发送记录查看、颜色主题设置

// [查阅手机 - 坦白说 APP] 核心引擎
// ==========================================

// 极其纯净的链接数组，绝对不能带有 url() 字母！
const TB_MATERIALS = [
    'https://i.postimg.cc/mgzLtBTR/retouch-2026042522445874.png',
    'https://i.postimg.cc/9Q6W9KQS/retouch-2026042522452963.png',
    'https://i.postimg.cc/2SbkVrCf/retouch-2026042522455347.png',
    'https://i.postimg.cc/Nj9s5BBd/retouch-2026042522464035.png'
];

const TB_THEMES = [
    { bg: '#f85b5b', card: '#facc15', text: '#8c7355' }, // 西瓜红 + 明黄卡
    { bg: '#2b56f6', card: '#21d09e', text: '#0a4f3b' }, // 蓝绿
    { bg: '#8a2be2', card: '#ff69b4', text: '#6b1f48' }, // 迷幻紫粉
    { bg: '#ff9500', card: '#ffffff', text: '#ff9500'}   // 活力橙白
];

let tbQuestionPool = [
    "出场自带 BGM", "男朋友理想型", "能吃能睡第一名", 
    "有可能跑过刘翔", "深夜Emo王者", "隐藏的富二代"
];

window.openCpTanbai = () => {
    openPage('page-cp-tanbai');
    if (tbQuestionPool.length < 5) fetchTbTitlesFromAI();
    nextTbQuestion(true);
};

// 2. 渲染散落背景 (完美遮罩渲染版)
function renderTbBackground() {
    const canvas = document.getElementById('tb-bg-canvas');
    canvas.style.opacity = '0'; 
    
    setTimeout(() => {
        canvas.innerHTML = '';
        const colors = ['#ffffff', '#000000', '#facc15', '#21d09e', '#ff69b4'];

        const getSafePos = () => {
            let t, l;
            for(let i=0; i<30; i++) {
                t = Math.random() * 90;
                l = Math.random() * 90;
                if (!(t > 15 && t < 65 && l > 10 && l < 90)) break;
            }
            return { top: t + '%', left: l + '%' };
        };

       // 🌟 生成 15 只手掌 (散落，自动变色防跨域版)
        for (let i = 0; i < 15; i++) {
            const el = document.createElement('div');
            el.className = 'tb-bg-item';
            
            const randomImg = TB_MATERIALS[Math.floor(Math.random() * TB_MATERIALS.length)];
            const chosenColor = colors[Math.floor(Math.random() * colors.length)];
            
            // 创造一个 img 标签装进 div 里
            const imgEl = document.createElement('img');
            imgEl.src = randomImg;
            // 核心黑科技：通过阴影投射出带颜色的手掌轮廓到正中央
            imgEl.style.filter = `drop-shadow(140px 0px 0px ${chosenColor})`;
            
            el.appendChild(imgEl);
            
            // 随机散落的位置
            const pos = getSafePos();
            el.style.top = pos.top; 
            el.style.left = pos.left;
            el.style.transform = `scale(${Math.random() * 0.8 + 1.0})`; // 放大1到1.8倍
            canvas.appendChild(el);
        }

        // 🌟 杂物大幅缩减：只有 6 个
        const svgs = [
            '<span class="tb-svg-star" style="color:#fff;">✨</span>', 
            '<span style="color:#facc15;">🕶️</span>', 
            '<span style="color:#fff;">🦴</span>', 
            '<span style="color:#21d09e;">⚪</span>'
        ];
        
        for (let i = 0; i < 6; i++) {
            const el = document.createElement('div');
            el.className = 'tb-bg-svg';
            el.innerHTML = svgs[Math.floor(Math.random() * svgs.length)];
            
            const pos = getSafePos();
            el.style.top = pos.top; 
            el.style.left = pos.left;
            el.style.transform = `scale(${Math.random() * 0.4 + 0.4}) rotate(${Math.floor(Math.random()*360)}deg)`;
            canvas.appendChild(el);
        }

        canvas.style.opacity = '1';
    }, 300);
}
// 3. 渲染四宫格好朋友
function renderTbGrid() {
    const gridBox = document.getElementById('tb-grid-box');
    gridBox.innerHTML = '';
    
    let pool = appData.chatData && appData.chatData.contacts ? [...appData.chatData.contacts] : [];
    if (pool.length < 4) {
        pool.push(
            { id:'sys_1', name:'神秘人', avatar: makeDefaultAvatar('神秘人') },
            { id:'sys_2', name:'小学同学', avatar: makeDefaultAvatar('小学同学') },
            { id:'sys_3', name:'路人甲', avatar: makeDefaultAvatar('路人甲') },
            { id:'sys_4', name:'外卖小哥', avatar: makeDefaultAvatar('外卖小哥') }
        );
    }
    
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 4);
    
    shuffled.forEach(f => {
        let displayName = f.name || (appData.customTexts['display-name'] || "我");
        let displayAvatar = f.avatar ? getRealImgSrc(f.avatar) : getRealImgSrc(appData.images['user-avatar']);
        
        const card = document.createElement('div');
        card.className = 'tb-card';
        card.onclick = () => selectTbFriend(f.id, displayName);
        card.innerHTML = `
            <img src="${displayAvatar}" class="tb-card-avatar">
            <span class="tb-card-name">${displayName}</span>
        `;
        gridBox.appendChild(card);
    });
}

// 4. 下一题
window.nextTbQuestion = (isFirst = false) => {
    const wrap = document.getElementById('tb-content-wrap');
    if (!isFirst) { wrap.style.opacity = '0'; wrap.style.transform = 'scale(0.9)'; }

    setTimeout(() => {
        const question = tbQuestionPool.shift();
        tbQuestionPool.push(question); // 循环利用
        document.getElementById('tb-question-text').innerText = question;

        const theme = TB_THEMES[Math.floor(Math.random() * TB_THEMES.length)];
        const container = document.getElementById('page-cp-tanbai');
        container.style.setProperty('--tb-bg', theme.bg);
        container.style.setProperty('--tb-card', theme.card);
        container.style.setProperty('--tb-card-text', theme.text);
        
        renderTbBackground();
        renderTbGrid();

        wrap.style.opacity = '1'; wrap.style.transform = 'scale(1)';
        if (tbQuestionPool.length < 3) fetchTbTitlesFromAI();
    }, isFirst ? 0 : 300);
};

// 5. 换一批 (旋转按钮，重置四个头像)
window.changeTbBatch = () => {
    const icon = document.getElementById('tb-refresh-icon');
    icon.style.transition = 'transform 0.5s ease';
    icon.style.transform = `rotate(${Math.random() > 0.5 ? 360 : -360}deg)`;
    setTimeout(() => { icon.style.transition = 'none'; icon.style.transform = 'rotate(0deg)'; }, 500);

    const gridBox = document.getElementById('tb-grid-box');
    gridBox.style.opacity = '0';
    setTimeout(() => { renderTbGrid(); gridBox.style.opacity = '1'; }, 200);
};

// 6. 选中好友发信息
window.selectTbFriend = (targetId, targetName) => {
    try { if(navigator.vibrate) navigator.vibrate(40); } catch(e){}
    showToast(`已向【${targetName}】发送匿名坦白！`);
    
    const currentQ = document.getElementById('tb-question-text').innerText;
    if (!targetId.startsWith('sys_') && appData.chatData) {
        const now = Date.now();
        const msgHtml = `<div class="time-divider">你向 Ta 发送了一条匿名坦白：<br>「${currentQ}」</div>`;
        appData.chatData.messages.push({ id: 'm_'+now, chatId: targetId, sender: 'me', content: msgHtml, timestamp: now, quote: null });
        saveData();
    }
    nextTbQuestion();
};

// 7. 点击头部大LOGO，强制召唤AI发大招
window.forceFetchTbTitles = async () => {
    showToast("正在请求大模型生成新题目...");
    await fetchTbTitlesFromAI(true);
};

// 8. 召唤 AI 后台静默生成
async function fetchTbTitlesFromAI(manual = false) {
    if(!appData.lastApi.url || !appData.lastApi.key) { 
        if(manual) alert("请先去 API 页面配置你的服务器和 Key！"); 
        return; 
    }

    const prompt = `你正在设计类似 QQ“坦白说”的整蛊、搞笑或夸赞的提问短语。
请生成 10 个富有中国年轻人网感、好玩的短句标题。
要求：字数在 4 到 12 个字以内。必须严格输出 JSON 字符串数组格式，不带 Markdown：
["人间有你而值得", "出场自带BGM", "熬夜秃头第一名"]`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.9 })
        });
        const data = await res.json();
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let newTitles = JSON.parse(rawText);
        
        if (Array.isArray(newTitles)) {
            tbQuestionPool = newTitles.concat(tbQuestionPool); // 把新的塞到最前面
            tbQuestionPool = [...new Set(tbQuestionPool)]; // 去重
            if(manual) {
                showToast("全新题库已注入！");
                nextTbQuestion(); // 手动请求的话，成功后立刻看下一题
            }
        }
    } catch (e) {
        if(manual) alert("生成失败，请检查网络或 API 配置。");
    }
}

