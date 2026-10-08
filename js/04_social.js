// ========== Ins社交圈：AI评论引擎 / 数据初始化 / 联系人 / 动态 / 个人页 ==========
// 职责：initInsData / 联系人管理 / 发帖 / 评论 / AI自动评论 / 生成AI动态 / 个人主页

// ========== Ins 社交圈交互与 AI 引擎 ==========

// ==========================================
// 🚀 新增：Ins 社交圈交互与 AI 引擎
// ==========================================

// 1. 用户提交评论，并触发 AI 盖楼
window.submitInsComment = async (postId) => {
    const input = document.getElementById(`cmt-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    const post = appData.chatData.posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];
    const myName = appData.customTexts['display-name'] || '@Master';

    // 存入用户评论
    post.comments.push({ id: Date.now(), authorId: 'me', authorName: myName, text: text, timestamp: Date.now() });
    input.value = '';
    await saveData();
    renderInsFeed();

    // 触发后台静默 AI 响应 (如果这不是用户自己发的贴，或者这是用户发的贴但别人刚评过)
    triggerAICommentReply(postId);
};

// 2. AI 判断是否回复用户的评论 (拉扯或终结话题)
async function triggerAICommentReply(postId) {
    const post = appData.chatData.posts.find(p => p.id === postId);
    if (!appData.lastApi.url || !appData.lastApi.key || !post || !post.comments || post.comments.length === 0) return;

    // 决定谁来回复：如果是 NPC 发的帖，NPC 肯定来回；如果是你发的帖，找最后评论的那个 NPC 来回
    let responderId = post.authorId;
    if (responderId === 'me') {
        // 找到除了我之外，最新留言的那个 NPC
        const lastNpcComment = [...post.comments].reverse().find(c => c.authorId !== 'me');
        if (!lastNpcComment) return; // 没人可回
        responderId = lastNpcComment.authorId;
    }

    const contact = appData.chatData.contacts.find(c => c.id === responderId);
    if (!contact) return;

    // 组装上下文
    const myName = appData.customTexts['display-name'] || '@Master';
    let contextText = `【原贴内容】：${post.text || '一张图片'}\n【评论区历史】：\n`;
    post.comments.forEach(c => {
        contextText += `- ${c.authorName}: ${c.text}\n`;
    });

    const prompt = `你是“${contact.name}”（人设：${contact.prompt}）。
这是社交软件（类似Instagram）上的一个动态和评论区。
刚才 ${myName} 发了一条最新评论，你需要判断你是否要回复 Ta。

【规则】：
1. 如果话题还能继续聊（拉扯、斗嘴、关心），请回复一段简短的社交评论。
2. 如果话题已经结束（例如对方说了“晚安”、“拜拜”或者只发了个表情），请选择结束话题，不要硬回。
3. 严格输出 JSON 格式！
如果回复，返回：{"reply": "你的回复内容"}
如果结束话题，返回：{"reply": ""}

【当前上下文】：
${contextText}`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages: [{ role: "system", content: prompt }], temperature: 0.8 })
        });
        const data = await res.json();
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let result = JSON.parse(rawText);

        if (result.reply && result.reply.trim() !== "") {
            // 延迟几秒模拟打字
            setTimeout(async () => {
                post.comments.push({ id: Date.now(), authorId: contact.id, authorName: contact.name, text: result.reply, timestamp: Date.now() });
                await saveData();
                renderInsFeed();
            }, 3000);
        }
    } catch (e) { console.error("AI 评论响应失败:", e); }
}

// 3. 用户发帖后，AI 自动前排点赞点评
async function triggerAIAutoComment(postId) {
    const post = appData.chatData.posts.find(p => p.id === postId);
    if (!appData.lastApi.url || !appData.lastApi.key || !post || !appData.chatData.contacts || appData.chatData.contacts.length === 0) return;

    // 随机抽 1~2 个联系人来评论
    const shuffled = [...appData.chatData.contacts].sort(() => 0.5 - Math.random());
    const commenters = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

    const myName = appData.customTexts['display-name'] || '@Master';

    for (let i = 0; i < commenters.length; i++) {
        const contact = commenters[i];
        const prompt = `你是“${contact.name}”（人设：${contact.prompt}）。
你的好友 ${myName} 刚刚在社交软件上发了一条新动态。
动态文案：${post.text || '没有文案'}
（如果动态有图片，AI描述为：${post.imageDesc || '一张用户自己上传的图片'}）

请以你的身份，在下面留一条符合你人设的简短评论（比如吐槽、关心、发狗粮等）。
严格返回 JSON：{"comment": "你的评论内容"}`;

        try {
            const model = appData.lastApi.model || "gpt-3.5-turbo";
            const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
                body: JSON.stringify({ model, messages: [{ role: "system", content: prompt }], temperature: 0.85 })
            });
            const data = await res.json();
            let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
            let result = JSON.parse(rawText);

            if (result.comment) {
                setTimeout(async () => {
                    if (!post.comments) post.comments = [];
                    post.comments.push({ id: Date.now(), authorId: contact.id, authorName: contact.name, text: result.comment, timestamp: Date.now() });
                    await saveData();
                    renderInsFeed();
                }, (i + 1) * 4000); // 错开时间模拟真实
            }
        } catch (e) { console.error("AI 自动评论失败:", e); }
    }
}

// 4. 生成 AI 自己的动态
window.generateInsAIPosts = async () => {
    if (!appData.lastApi.url || !appData.lastApi.key) { alert("请先去 API 页面配置 API！"); return; }
    if (!appData.chatData.contacts || appData.chatData.contacts.length === 0) { alert("你需要先在通讯录创建 AI 角色！"); return; }

    const btn = document.getElementById('btn-gen-ins-posts');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite;"></i>';
    btn.style.pointerEvents = 'none';

    // 随机选 1-2 个角色发动态
    const shuffled = [...appData.chatData.contacts].sort(() => 0.5 - Math.random());
    const posters = shuffled.slice(0, Math.floor(Math.random() * 2) + 1);

    for (let contact of posters) {
        const prompt = `你是“${contact.name}”（人设：${contact.prompt}）。
请为你自己在类似 Instagram 的社交软件上，发一条【带图片的最新日常动态】。
要求：
1. 文案 (text)：符合你人设的语气，简短生活化。
2. 照片画面描述 (imageDesc)：一句话描述你这张照片里拍了什么，必须提供！系统会根据这个渲染照片卡片。（如：“一杯拉花咖啡”、“一张对着镜子的自拍”）
3. 位置 (location)：可有可无，如果你在外面可以填一个地点，在家里可以留空。

严格返回 JSON：
{
    "text": "今天天气真好",
    "imageDesc": "一张在海边夕阳下的背影照",
    "location": "某某海滩"
}`;

        try {
            const model = appData.lastApi.model || "gpt-3.5-turbo";
            const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
                body: JSON.stringify({ model, messages: [{ role: "system", content: prompt }], temperature: 0.9 })
            });
            const data = await res.json();
            let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
            let result = JSON.parse(rawText);

            const newPost = {
                id: 'post_' + Date.now() + Math.floor(Math.random() * 1000),
                authorId: contact.id,
                text: result.text,
                imageDesc: result.imageDesc,
                location: result.location || '',
                visibleTo: ['all'],
                timestamp: Date.now() - Math.floor(Math.random() * 1000000),
                comments: []
            };

            if (!appData.chatData.posts) appData.chatData.posts = [];
            appData.chatData.posts.unshift(newPost);
            
        } catch (e) { console.error("AI 动态生成失败:", e); }
    }

    await saveData();
    renderInsFeed();
    showToast("AI 好友们已更新动态！");
    
    btn.innerHTML = oldHtml;
}
// ==========================================
    // Ins 风 社交应用交互逻辑
    // ==========================================
    
    let currentInsTab = 'chats';

    // 1. 初始化数据结构防报错
function initInsData() {
        if(!appData.chatData) appData.chatData = {};
        if(!appData.chatData.contacts) appData.chatData.contacts =[];
        if(!appData.chatData.messages) appData.chatData.messages =[];
        if(!appData.chatData.posts) appData.chatData.posts =[];
        // 新增面具数组
        if(!appData.userMasks) appData.userMasks =[];
    }


    // 3. 点击右上角 + 号
    window.handleInsPlus = () => {
        if(currentInsTab === 'chats' || currentInsTab === 'contacts') {
            document.getElementById('ins-char-name').value = '';
            document.getElementById('ins-char-note').value = '';
            document.getElementById('ins-char-prompt').value = '';
            // 使用 Base64 SVG 避免网络加载导致的闪烁
            document.getElementById('ins-char-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f2f2f7' rx='20' ry='20'/%3E%3Cpath d='M75 45V105M45 75H105' stroke='%23ccc' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E";
            document.getElementById('ins-char-preview').removeAttribute('data-base64');
            document.getElementById('modal-ins-char').classList.add('show');
        } 
        else if(currentInsTab === 'feed') {
            document.getElementById('ins-post-text').value = '';
            document.getElementById('ins-post-loc').value = '';
            
            // 重置全新的图片上传框
            const imgPreview = document.getElementById('ins-post-img-preview');
            imgPreview.src = '';
            imgPreview.style.display = 'none';
            imgPreview.removeAttribute('data-base64');
            document.getElementById('ins-post-img-icon').style.display = 'block';
            document.getElementById('ins-post-img-text').style.display = 'block';

            renderPostVisibilityPicker();
            document.getElementById('modal-ins-post').classList.add('show');
        }
    };

    window.closeInsModal = (id) => {
        document.getElementById(id).classList.remove('show');
    };



    // 4. 图片本地上传预览逻辑
window.previewInsPostImg = (input) => {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.getElementById('ins-post-img-preview');
                img.src = e.target.result;
                img.style.display = 'block';
                img.setAttribute('data-base64', e.target.result);
                
                // 隐藏中间的加号和提示文字
                document.getElementById('ins-post-img-icon').style.display = 'none';
                document.getElementById('ins-post-img-text').style.display = 'none';
            }
            reader.readAsDataURL(input.files[0]);
        }
    };

    // 获取图片(根据ID或Base64)
    window.getRealImgSrc = function getRealImgSrc(src, fallbackName) {
        // 如果没有图片，用名字生成简洁默认头像；没有名字则用通用占位
        const getDefault = () => fallbackName
            ? makeDefaultAvatar(fallbackName)
            : makeDefaultAvatar('?');
        if(!src) return getDefault();
        if(src.startsWith('http') || src.startsWith('data:')) return src;
        return appData.images[src] || getDefault();
    }

    // ==========================================
    // 业务：新建并保存联系人
    // ==========================================

    // 渲染消息列表 (只有发过消息的才显示，因为目前没有发消息功能，暂做空态过滤)
    window.renderInsChats = () => {
        const list = document.getElementById('ins-chat-list');
        list.innerHTML = '';
        
        // 过滤出有聊天记录的联系人ID
        const activeIds = new Set(appData.chatData.messages.map(m => m.chatId));
        const activeContacts = appData.chatData.contacts.filter(c => activeIds.has(c.id));

        if(activeContacts.length === 0) {
            list.innerHTML = `
                <div style="text-align:center; padding:50px 20px; color:#999;">
                    <i class="ri-message-3-line" style="font-size:40px; color:#ccc; margin-bottom:10px; display:block;"></i>
                    No messages yet.<br>Go to Contacts to start a conversation.
                </div>`;
            return;
        }

        activeContacts.forEach(c => {
            const row = document.createElement('div');
            row.className = 'ins-row';
            row.onclick = () => openChatRoom(c.id);
            row.innerHTML = `
                <img src="${getRealImgSrc(c.avatar)}" class="ins-avatar">
                <div class="ins-row-meta">
                    <div class="ins-name">${c.name}</div>
                    <div class="ins-sub" style="color:#007AFF">Tap to view history</div>
                </div>
            `;
            list.appendChild(row);
        });
    };

    // ==========================================
    // 业务：发布动态与渲染
    // ==========================================
    
    // 生成可见性选择器
    window.renderPostVisibilityPicker = () => {
        const picker = document.getElementById('ins-post-visibility');
        picker.innerHTML = '';
        if(!appData.chatData.contacts || appData.chatData.contacts.length === 0) {
            picker.innerHTML = '<div style="color:#ccc; font-size:12px;">No contacts to tag.</div>';
            return;
        }
        
        appData.chatData.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'ins-picker-item selected'; // 默认全选可见
            item.setAttribute('data-id', c.id);
            item.onclick = () => item.classList.toggle('selected');
            item.innerHTML = `
                <img src="${getRealImgSrc(c.avatar)}">
                <span>${c.name}</span>
            `;
            picker.appendChild(item);
        });
    };

    // 保存动态
    window.saveInsPost = async () => {
    const text = document.getElementById('ins-post-text').value.trim();
    const loc = document.getElementById('ins-post-loc').value.trim();
    const base64 = document.getElementById('ins-post-img-preview').getAttribute('data-base64');
    
    if(!text && !base64) { alert("写点文案或发张图吧。"); return; }

    const postBtn = document.querySelector('.ins-sheet-top span:last-child');
    postBtn.innerHTML = '发布中...';
    postBtn.style.pointerEvents = 'none';

    let imgKey = null;
    if(base64) {
        imgKey = 'post_' + Date.now();
        try { await idbHelper.saveImage(imgKey, base64); } catch(e){}
        appData.images[imgKey] = base64;
    }

    const newPost = {
        id: 'post_' + Date.now(), authorId: 'me', 
        text: text, image: imgKey, location: loc,
        timestamp: Date.now(), comments: []
    };

    if(!appData.chatData.posts) appData.chatData.posts = [];
    appData.chatData.posts.unshift(newPost);
    await saveData();
    
    closeInsModal('modal-ins-post');
    switchInsTab('feed');
    showToast("发布成功！");

    postBtn.innerHTML = 'Share';
    postBtn.style.pointerEvents = 'auto';

    // 核心联动：发布后，群像AI自动识别你的图片和文案来评论！
    triggerGroupFeedReaction(newPost, base64);
};

async function triggerGroupFeedReaction(post, base64Img) {
    if(!appData.lastApi.url || !appData.lastApi.key || !appData.chatData.contacts || appData.chatData.contacts.length === 0) return;

    let myName = appData.customTexts['display-name'] || '@User';
    let npcsInfo = appData.chatData.contacts.map(c => `ID:[${c.id}] 名字:[${c.name}] 人设:[${c.prompt}]`).join('\n');

    const prompt = `你是社交圈模拟引擎。用户“${myName}”刚刚发了一条朋友圈动态。
动态文案：“${post.text || '没有配文'}”
（若附带了图片，系统已传入图片，请仔细查看图片内容）。

这是通讯录里的好友名单和他们的人设：
${npcsInfo}

【任务】：
请扮演这些好友，看看谁会对这条动态感兴趣？挑选 1 到 4 个人出来，在底下热烈评论。如果图片有意思，他们必须根据图片细节做出惊叹或吐槽。
严格输出 JSON 数组格式（不要Markdown）：
[
  { "authorId": "刚才列表里的某个人ID", "text": "符合他人设的评论内容" }
]`;

    let apiMessages = [];
    if (base64Img) {
        // 多模态视觉！大模型能直接看你发的本地图
        apiMessages.push({
            role: "user",
            content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: base64Img } }
            ]
        });
    } else {
        apiMessages.push({ role: "user", content: prompt });
    }

    try {
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model: appData.lastApi.model || "gpt-4o", messages: apiMessages, temperature: 0.9 })
        });
        const data = await res.json();
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let commentsArr = JSON.parse(rawText);

        if (Array.isArray(commentsArr)) {
            commentsArr.forEach((cmt, idx) => {
                setTimeout(async () => {
                    const cInfo = appData.chatData.contacts.find(x => x.id === cmt.authorId);
                    if (cInfo) {
                        post.comments.push({ id: Date.now(), authorId: cInfo.id, authorName: cInfo.name, text: cmt.text, timestamp: Date.now() });
                        await saveData();
                        if (document.getElementById('ins-tab-feed').classList.contains('active')) renderInsFeed();
                    }
                }, (idx + 1) * 3000 + Math.random() * 2000); // 随机错开时间，模拟活人打字
            });
        }
    } catch (e) { console.error("群像评论失败:", e); }
}

// 用户手动回复评论，触发 AI 拉扯
window.submitUserComment = async (postId) => {
    const input = document.getElementById(`cmt-input-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    const post = appData.chatData.posts.find(p => p.id === postId);
    if (!post) return;
    if (!post.comments) post.comments = [];
    const myName = appData.customTexts['display-name'] || '@Master';

    post.comments.push({ id: Date.now(), authorId: 'me', authorName: myName, text: text, timestamp: Date.now() });
    input.value = '';
    await saveData();
    renderInsFeed();

    triggerAICommentReply(postId);
};

// AI 根据你的回复决定要不要继续盖楼
async function triggerAICommentReply(postId) {
    const post = appData.chatData.posts.find(p => p.id === postId);
    if (!post || !post.comments) return;

    let responderId = post.authorId;
    if (responderId === 'me') {
        const lastNpc = [...post.comments].reverse().find(c => c.authorId !== 'me');
        if (!lastNpc) return;
        responderId = lastNpc.authorId;
    }

    const contact = appData.chatData.contacts.find(c => c.id === responderId);
    if (!contact) return;

    // 提取你们俩最近的私聊记忆（聊天室和朋友圈打通！）
    const recentChats = (appData.chatData.messages || []).filter(m => m.chatId === contact.id).slice(-6);
    const chatMemory = recentChats.map(m => `${m.sender==='me'?'我':contact.name}: ${m.content}`).join('\n');

    let contextText = `【原贴】：${post.text || (post.imageDesc ? post.imageDesc : '一张图片')}\n【评论区历史】：\n` + post.comments.map(c => `- ${c.authorName}: ${c.text}`).join('\n');

    const prompt = `你是“${contact.name}”（人设：${contact.prompt}）。你和我的近期私聊记忆是：\n${chatMemory || '暂无'}\n
现在在朋友圈，我刚刚回复了评论。结合你们的聊天关系，判断你要不要继续回我。
【规则】：
1. 如果还能继续聊（斗嘴、补充），给简短回复。
2. 如果话题死了（比如我说了哦、拜拜），果断结束话题，不回。
严格输出 JSON：
回复则返回：{"reply": "回复内容"}
不回则返回：{"reply": ""}

【朋友圈上下文】：\n${contextText}`;

    try {
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model: appData.lastApi.model || "gpt-3.5-turbo", messages: [{ role: "system", content: prompt }], temperature: 0.8 })
        });
        const data = await res.json();
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let result = JSON.parse(rawText);

        if (result.reply && result.reply.trim() !== "") {
            setTimeout(async () => {
                post.comments.push({ id: Date.now(), authorId: contact.id, authorName: contact.name, text: result.reply, timestamp: Date.now() });
                await saveData();
                if (document.getElementById('ins-tab-feed').classList.contains('active')) renderInsFeed();
            }, 3000); 
        }
    } catch (e) {}
}

// 提取近期朋友圈记忆，喂给聊天室AI
function getRecentFeedMemory(contactId) {
    if (!appData.chatData.posts) return '暂无朋友圈互动。';
    const recentPosts = appData.chatData.posts.slice(0, 5);
    let memory = '';
    recentPosts.forEach(p => {
        if (p.authorId === 'me' || p.authorId === contactId) {
            const author = p.authorId === 'me' ? '我' : '你';
            memory += `【${author}发的朋友圈】: "${p.text || (p.imageDesc || '发了一张图片')}"\n`;
            if (p.comments && p.comments.length > 0) {
                memory += `  评论区互动:\n` + p.comments.map(c => `  - ${c.authorId==='me'?'我':'你'}: ${c.text}`).join('\n') + '\n';
            }
        }
    });
    return memory || '暂无朋友圈互动。';
}


// ==========================================
    // 个人主页 (Profile/Me) 设置逻辑
    // ==========================================
    window.renderInsProfile = () => {
        // 渲染基础信息
        document.getElementById('ins-my-avatar').src = getRealImgSrc(appData.images['user-avatar']) || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E%3Crect width='150' height='150' fill='%23000'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='30' fill='%23fff' text-anchor='middle' dy='.3em'%3EMe%3C/text%3E%3C/svg%3E";
        document.getElementById('ins-my-name').innerText = appData.customTexts['display-name'] || '@Master';
        document.getElementById('ins-my-bio').innerText = appData.customTexts['ins-bio'] || 'Virtual Space Creator';
        
        // 渲染3个网格图
        for(let i=1; i<=3; i++) {
            const key = 'ins-grid-' + i;
            const el = document.getElementById(key);
            if(el) {
                el.src = appData.images[key] || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23999' text-anchor='middle' dy='.3em'%3EPhoto ${i}%3C/text%3E%3C/svg%3E`;
            }
        }
    };

    window.uploadInsMyAvatar = async (input) => {
        if(input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result;
                document.getElementById('ins-my-avatar').src = base64;
                try { await idbHelper.saveImage('user-avatar', base64); } catch(err){}
                appData.images['user-avatar'] = base64;
                saveData();
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.uploadInsGrid = async (input, idKey) => {
        if(input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = e.target.result;
                document.getElementById(idKey).src = base64;
                try { await idbHelper.saveImage(idKey, base64); } catch(err){}
                appData.images[idKey] = base64;
                saveData();
            };
            reader.readAsDataURL(input.files[0]);
        }
    };

    window.editInsMyName = () => {
        const current = appData.customTexts['display-name'] || '@Master';
        const val = prompt('Enter your Name or ID:', current);
        if(val !== null && val.trim() !== '') {
            appData.customTexts['display-name'] = val.trim();
            document.getElementById('ins-my-name').innerText = val.trim();
            saveData();
        }
    };

    window.editInsMyBio = () => {
        const current = appData.customTexts['ins-bio'] || 'Virtual Space Creator';
        const val = prompt('Enter your Bio / Introduction:', current);
        if(val !== null) {
            appData.customTexts['ins-bio'] = val.trim() || 'Virtual Space Creator';
            document.getElementById('ins-my-bio').innerText = appData.customTexts['ins-bio'];
            saveData();
        }
    };

    // ==========================================
    // 弹窗辅助与删除逻辑
    // ==========================================
    // 加防抖：URL输入框每隔600ms才触发一次图片加载，避免每个字符都发请求卡UI
    const _previewInsUrlImmediate = (url, imgId) => {
        if(url && (url.startsWith('http') || url.startsWith('data:'))) {
            const img = document.getElementById(imgId);
            img.src = url;
            // 清理本地上传残留，保证 URL 优先
            img.removeAttribute('data-base64');
        }
    };
    window.previewInsUrl = debounce(_previewInsUrlImmediate, 600);

    window.deleteInsContact = (id, event) => {
        event.stopPropagation(); // 阻止触发点击事件进入聊天
        if(confirm('Are you sure you want to delete this character? (This will also delete your chats with them)')) {
            appData.chatData.contacts = appData.chatData.contacts.filter(c => c.id !== id);
            // 顺便清除聊天记录
            appData.chatData.messages = appData.chatData.messages.filter(m => m.chatId !== id);
            saveData();
            renderInsContacts();
            showToast();
        }
    };

    window.deleteInsPost = (id, event) => {
        event.stopPropagation();
        if(confirm('Delete this post permanently?')) {
            appData.chatData.posts = appData.chatData.posts.filter(p => p.id !== id);
            saveData();
            renderInsFeed();
            showToast();
        }
    };

    // ==========================================
    // 修改原有的 Tab 和 渲染逻辑
    // ==========================================
    window.switchInsTab = (tab) => {
        initInsData();
        currentInsTab = tab;
        
        const items = document.querySelectorAll('.ins-tab-item');
        const pages = document.querySelectorAll('.ins-page');
        
        items.forEach(el => {
            el.classList.remove('active');
            let icon = el.querySelector('i');
            if(icon.className.includes('-fill')) icon.className = icon.className.replace('-fill', '-line');
        });
        
        const indexMap = {'chats':0, 'contacts':1, 'feed':2, 'me':3};
        const activeItem = items[indexMap[tab]];
        activeItem.classList.add('active');
        let activeIcon = activeItem.querySelector('i');
        if(activeIcon.className.includes('-line')) activeIcon.className = activeIcon.className.replace('-line', '-fill');

        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('ins-tab-' + tab).classList.add('active');

        const titles = {'chats':'Chats', 'contacts':'Contacts', 'feed':'Discover', 'me':'Profile'};
        document.getElementById('ins-app-title').innerText = titles[tab];

        // 挂载数据渲染
        if(tab === 'contacts') renderInsContacts();
        if(tab === 'chats') renderInsChats();
        if(tab === 'feed') renderInsFeed();
        if(tab === 'me') renderInsProfile(); // 新增：切换到我时，渲染相册与资料
    };

    // (注意：这里需要覆盖修改你之前的 renderInsContacts 和 renderInsFeed，给它们加上删除按钮)
    window.renderInsContacts = () => {
        const favList = document.getElementById('ins-favorites-list');
        const allList = document.getElementById('ins-contact-list');
        favList.innerHTML = '';
        allList.innerHTML = '';

        const contacts = appData.chatData.contacts ||[];

        // --- 1. 渲染 Favorites 列表 ---
        const favorites = contacts.filter(c => c.isFavorite);
        favorites.forEach(c => {
            const fav = document.createElement('div');
            fav.className = 'fav-item';
            fav.onclick = () => openChatRoom(c.id);
            fav.innerHTML = `
                <img src="${getRealImgSrc(c.avatar, c.name)}" class="fav-avatar">
                <span class="fav-name">${c.name.split(' ')[0]}</span>
            `;
            favList.appendChild(fav);
        });

        // 恒定存在的 "+ Add" 按钮
        const addBtn = document.createElement('div');
        addBtn.className = 'fav-item';
        addBtn.onclick = () => alert("Tip: 点击下方列表中联系人右侧的【星星 ⭐】图标，即可将他们添加到 Favorites！");
        addBtn.innerHTML = `
            <div class="fav-add-btn"><i class="ri-add-line"></i></div>
            <span class="fav-name">Add</span>
        `;
        favList.appendChild(addBtn);

        // --- 2. 渲染 All Contacts 列表 ---
        if(contacts.length === 0) {
            allList.innerHTML = '<div style="text-align:center; padding:30px; color:#ccc;">No contacts yet. Tap + on top right to create.</div>';
            return;
        }

        contacts.forEach(c => {
            const row = document.createElement('div');
            row.className = 'contact-card';
            row.onclick = () => openChatRoom(c.id); 
            
            // 星星状态
            const starClass = c.isFavorite ? 'ri-star-fill' : 'ri-star-line';
            const starColor = c.isFavorite ? '#FFD700' : '#E5E5EA'; // 亮黄色 或 浅灰色

            row.innerHTML = `
                <img src="${getRealImgSrc(c.avatar, c.name)}">
                <div class="name-info">
                    <div class="name">${c.name}</div>
                </div>
                <i class="${starClass}" style="color:${starColor}; font-size:24px; padding:8px; cursor:pointer;" onclick="toggleInsFavorite('${c.id}', event)"></i>
                <i class="ri-more-2-fill" style="color:#ccc; font-size:22px; padding:8px 0 8px 8px; cursor:pointer;" onclick="deleteInsContact('${c.id}', event)"></i>
            `;
            allList.appendChild(row);
        });
    };

    // 切换喜爱状态的函数
    window.toggleInsFavorite = (id, event) => {
        event.stopPropagation(); // 防止触发点击进入聊天的事件
        const contact = appData.chatData.contacts.find(c => c.id === id);
        if(contact) {
            contact.isFavorite = !contact.isFavorite; // 反转状态
            saveData();
            renderInsContacts(); // 重新渲染页面
        }
    };

    window.saveInsCharacter = async () => {
        const name = document.getElementById('ins-char-name').value.trim();
        const note = document.getElementById('ins-char-note').value.trim();
        const prompt = document.getElementById('ins-char-prompt').value.trim();
        const base64 = document.getElementById('ins-char-preview').getAttribute('data-base64');
        const urlInput = document.getElementById('ins-char-url').value.trim();

        if(!name) { alert("Please enter a name."); return; }

        let avatarKey = makeDefaultAvatar(name); // 本地生成简洁灰色头像，不依赖网络
        const uid = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2);

        // 逻辑更新：如果有本地文件，走本地存库；如果没有，看看有没有输网址
        if(base64) {
            avatarKey = 'avatar_' + uid;
            try { await idbHelper.saveImage(avatarKey, base64); } catch(e){}
            appData.images[avatarKey] = base64;
        } else if (urlInput && urlInput.startsWith('http')) {
            avatarKey = urlInput;
        }

        const newContact = { id: uid, name, note, prompt, avatar: avatarKey };
        appData.chatData.contacts.push(newContact);
        
        await saveData();
        closeInsModal('modal-ins-char');
        switchInsTab('contacts'); 
        showToast();
    };

    window.renderInsFeed = () => {
    const list = document.getElementById('ins-feed-list');
    list.innerHTML = '';

    const storyBar = document.getElementById('ins-story-bar');
    storyBar.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
            <div style="width:60px; height:60px; border-radius:50%; border:2px dashed #ccc; display:flex; align-items:center; justify-content:center; color:#ccc; cursor:pointer;" onclick="handleInsPlus()">
                <i class="ri-add-line" style="font-size:24px;"></i>
            </div>
            <span style="font-size:10px; color:#999;">Your Story</span>
        </div>`;
    
    (appData.chatData.contacts || []).slice(0, 8).forEach(c => {
        storyBar.innerHTML += `
        <div style="display:flex; flex-direction:column; align-items:center; gap:5px;">
            <img src="${getRealImgSrc(c.avatar, c.name)}" style="width:60px; height:60px; border-radius:50%; border:2px solid #D92B7A; padding:2px; object-fit:cover;">
            <span style="font-size:10px; color:#333; max-width:60px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.name}</span>
        </div>`;
    });

    if(!appData.chatData.posts || appData.chatData.posts.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:50px; color:#ccc;">暂无动态，点击左上角发一条吧。</div>';
        return;
    }

    appData.chatData.posts.forEach(p => {
        let authorName = 'Someone';
        let authorImg = '';
        if (p.authorId === 'me') {
            authorName = appData.customTexts['display-name'] || '@Master';
            authorImg = getRealImgSrc(appData.images['user-avatar']);
        } else {
            const contact = appData.chatData.contacts.find(c => c.id === p.authorId);
            if (contact) { authorName = contact.name; authorImg = getRealImgSrc(contact.avatar, contact.name); }
        }

        const locHtml = p.location ? `<div class="ins-post-loc"><i class="ri-map-pin-2-fill"></i> ${p.location}</div>` : '';
        
        let imgHtml = '';
        if (p.image) {
            // 你发的本地真图
            imgHtml = `<img src="${getRealImgSrc(p.image)}" class="ins-post-img">`;
        } else if (p.imageDesc) {
            // AI发的虚拟相片，点开看描述
            const placeholder = "https://i.postimg.cc/TP34wxpW/IMG-20260402-220042.jpg";
            let safeDesc = p.imageDesc.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
            imgHtml = `<div style="position:relative;">
                <img src="${placeholder}" class="ins-post-img" style="cursor:pointer; filter: brightness(0.95);" onclick="viewVirtualPhoto('${safeDesc}', event)">
                <div style="position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.6); color:#fff; font-size:11px; padding:6px 10px; border-radius:12px; pointer-events:none; backdrop-filter:blur(4px);"><i class="ri-camera-lens-line"></i> 虚拟影像</div>
            </div>`;
        }
        
        // 渲染评论区
        let commentsHtml = '';
        if (p.comments && p.comments.length > 0) {
            commentsHtml = '<div class="ins-comments-area">';
            p.comments.forEach(cmt => {
                let cAva = cmt.authorId === 'me' ? getRealImgSrc(appData.images['user-avatar']) : getRealImgSrc(appData.chatData.contacts.find(x=>x.id===cmt.authorId)?.avatar);
                commentsHtml += `
                    <div class="ins-comment-item">
                        <img src="${cAva}" class="cmt-ava">
                        <div class="ins-comment-content">
                            <span class="ins-comment-author">${cmt.authorName}</span><span class="ins-comment-text">${cmt.text}</span>
                        </div>
                    </div>`;
            });
            commentsHtml += '</div>';
        }

        const postEl = document.createElement('div');
        postEl.className = 'ins-post';
        postEl.innerHTML = `
            <div class="ins-post-header">
                <div class="ins-post-author"><img src="${authorImg}"><div style="display:flex; flex-direction:column;"><span>${authorName}</span>${locHtml}</div></div>
                ${p.authorId === 'me' ? `<i class="ri-more-fill" style="cursor:pointer; color:#999; font-size:20px; padding:5px;" onclick="deleteInsPost('${p.id}', event)"></i>` : ''}
            </div>
            ${imgHtml}
            <div class="ins-post-actions"><i class="ri-heart-3-line"></i><i class="ri-chat-3-line" onclick="document.getElementById('cmt-input-${p.id}').focus()"></i><i class="ri-send-plane-line"></i></div>
            ${p.text ? `<div class="ins-post-content" style="margin-bottom:12px;"><b style="margin-right:6px;">${authorName}</b>${p.text}</div>` : ''}
            ${commentsHtml}
            <div style="padding:0 15px 10px; font-size:10px; color:#ccc;">${new Date(p.timestamp).toLocaleString()}</div>
            <div class="ins-comment-input-bar">
                <img src="${getRealImgSrc(appData.images['user-avatar'])}" class="ins-comment-ava">
                <input type="text" id="cmt-input-${p.id}" class="ins-comment-input" placeholder="回复..." onkeypress="if(event.key === 'Enter') submitUserComment('${p.id}')">
                <div class="ins-comment-send" onclick="submitUserComment('${p.id}')">发送</div>
            </div>
        `;
        list.appendChild(postEl);
    });
};
    
    // 打开此页面时的入口初始化
    window.openChatApp = () => {
        openPage('app-chat-root');
        switchInsTab('chats'); 
    };
    
