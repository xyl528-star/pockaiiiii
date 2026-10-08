// ========== 查手机APP：桌面/时钟/邮件/iMessage/通话/微信/坦白吧 ==========
// 职责：charPhone桌面 / 锁屏时钟CP / 邮件 / iMessage / 通话记录 / 联系人 / 微信对话 / 坦白吧

// === Part 1: 桌面 / 时钟 / 邮件（原 13_reading_app.js） ===


// ==========================================
// [查阅 AI 手机] 完美防覆盖版交互逻辑
// ==========================================

let currentPhoneContactId = null;

// 定义默认图片（只保留四张相册卡片，App图标已彻底转入纯CSS，不再受数据干扰！）
const CP_DEFAULTS = {
    images: {
        'cp-img-1': 'https://images.unsplash.com/photo-1516477287739-16a8581e6462?auto=format&fit=crop&w=150&q=80',
        'cp-img-2': 'https://images.unsplash.com/photo-1514115165842-b0e25867d730?auto=format&fit=crop&w=150&q=80',
        'cp-img-3': 'https://images.unsplash.com/photo-1610444585141-86375c3f305e?auto=format&fit=crop&w=150&q=80',
        'cp-img-rabbit': 'https://images.unsplash.com/photo-1585110396000-c9fd4e4e5080?auto=format&fit=crop&w=200&q=80'
    },
    texts: {
        'cp-text-search': '⟳ ⊹♡┈┈ 𓏴 𝒫𝒾𝓃𝓀 𝒱𝑒𝓁𝓋𝑒𝓉 𓏴 ┈┈♡ ⊹🤍',
        'cp-text-topwidget-header': '[☆₊⋆행복이 찾아오다🐰💬⋆*☆ ]',
        'cp-text-img1-label': '🫧•͈ᴗ⁃͈★',
        'cp-text-img2-label': '𝙸♥︎..',
        'cp-text-img3-label': '🌨☃︎ *･ﾟ',
        'cp-text-widgetlabel-1': 'Top Widgets⁺',
        'cp-text-rabbit-date': 'together 520 day',
        'cp-text-widgetlabel-2': 'Top Widgets⁺',
        'cp-text-app-1': '备忘录', 'cp-text-app-2': '音乐', 'cp-text-app-3': '邮件', 'cp-text-app-4': '淘宝',
        'cp-text-app-5': '天气', 'cp-text-app-6': '时钟', 'cp-text-app-7': '设置', 'cp-text-app-8': '微信',
        'cp-text-widgetlabel-3': 'Colorful Widget'
    }
};

window.openCharPhoneSelect = () => {
    if(!appData.chatData) appData.chatData = { contacts:[] };
    const listContainer = document.getElementById('cp-contact-list');
    listContainer.innerHTML = '';

    if(appData.chatData.contacts.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; color:#999; padding:20px;">还没有添加任何好友哦。</div>';
    } else {
        appData.chatData.contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.setAttribute('onclick', `openCharPhoneDesktop('${contact.id}')`);
            item.innerHTML = `
                <div style="display:flex;align-items:center;flex:1">
                    <img src="${getRealImgSrc(contact.avatar)}" class="list-img-preview">
                    <div style="font-weight:600">${contact.name}</div>
                </div>
                <i class="ri-arrow-right-s-line" style="font-size:20px; color:#ccc;"></i>
            `;
            listContainer.appendChild(item);
        });
    }
    openPage('page-char-phone-select');
};

window.openCharPhoneDesktop = (contactId) => {
    const contact = appData.chatData.contacts.find(c => c.id === contactId);
    if (!contact) return;
    currentPhoneContactId = contactId;

    if (!contact.desktopData) contact.desktopData = { images: {}, texts: {} };
    const desktopData = contact.desktopData;

    // 1. 加载基本信息（头像、名字、心声）
    document.getElementById('cp-dynamic-avatar').style.backgroundImage = `url('${getRealImgSrc(contact.avatar)}')`;
    document.getElementById('cp-dynamic-name').innerText = contact.note || contact.name;
    document.getElementById('cp-dynamic-status').innerText = contact.latestMind?.exp_text || 'only temporary 2 u';

    // 2. 加载允许定制的图片（仅限相册大卡片）
    const EDITABLE_IMAGES = ['cp-img-1', 'cp-img-2', 'cp-img-3', 'cp-img-rabbit'];
    EDITABLE_IMAGES.forEach(id => {
        const el = document.getElementById(id);
        const realKey = (id === 'cp-img-rabbit') ? ('cp-img-rabbit_' + contact.id) : id;
        const storedKey = desktopData.images[realKey];
        if (storedKey) {
            el.style.backgroundImage = `url('${getRealImgSrc(storedKey)}')`;
        } else if (appData.images[realKey]) {
            // 🔥 兜底修复：兼容早期版本 AI 替换过但遗失的组件，防止其消失
            el.style.backgroundImage = `url('${getRealImgSrc(appData.images[realKey])}')`;
            desktopData.images[realKey] = realKey; // 顺手迁移同步到新格式
        } else {
            el.style.backgroundImage = `url('${CP_DEFAULTS.images[id]}')`;
        }
    });

    // 3. 加载定制文字
    Object.keys(CP_DEFAULTS.texts).forEach(id => {
        const el = document.getElementById(id);
        if (desktopData.texts[id]) {
            el.innerText = desktopData.texts[id];
        } else {
            el.innerText = CP_DEFAULTS.texts[id];
        }
    });

    // 4. 加载专属壁纸
    const wpEl = document.getElementById('cp-desktop-wallpaper');
    if (wpEl) wpEl.style.backgroundImage = desktopData.wallpaper ? `url('${getRealImgSrc(desktopData.wallpaper)}')` : 'none';

    openPage('page-char-phone-desktop');
};

// --- 修改文字 ---
window.editCharPhoneText = async (elementId, promptMessage, event) => {
    if (event) event.stopPropagation(); 
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const el = document.getElementById(elementId);
    const newValue = prompt(promptMessage, el.innerText);

    if (newValue !== null && newValue.trim() !== '') {
        el.innerText = newValue;
        
        // 👇 修复：确保对象层级绝对存在，防止老数据导致无法存储文本
        if (!contact.desktopData) contact.desktopData = { images: {}, texts: {} };
        if (!contact.desktopData.texts) contact.desktopData.texts = {};
        
        contact.desktopData.texts[elementId] = newValue;
        await saveData();
    }
};

// --- 修改图片与图标：调用上传面板 ---
window.openUploadForCharPhone = (elementId) => {
    currentUploadId = `cpi|${currentPhoneContactId}|${elementId}`;
    document.getElementById('url-core').value = '';
    document.getElementById('modal-upload').classList.add('show');
};

// --- 无冲突劫持图片上传逻辑 ---
const originalSystemHandleImage = window.handleImage;
window._cpHandleImage = async (src) => {
    if (currentUploadId && currentUploadId.startsWith('cpi|')) {
        const parts = currentUploadId.split('|');
        const contactId = parts[1];    
        const elementId = parts[2];    

        const contact = appData.chatData.contacts.find(c => c.id === contactId);
        if(contact) {
            const imageKey = `cp_${Date.now()}`; 
            try { await idbHelper.saveImage(imageKey, src); } catch(e){}
            appData.images[imageKey] = src;

            // 👇 核心修复：极致防御机制，确保数据层级绝对存在，防止老数据格式导致保存时崩溃
            if (!contact.desktopData) contact.desktopData = { images: {}, texts: {} };
            if (!contact.desktopData.images) contact.desktopData.images = {};
            if (!contact.desktopData.texts) contact.desktopData.texts = {};

            const saveKey = (elementId === 'cp-img-rabbit') ? ('cp-img-rabbit_' + contactId) : elementId;
            
            contact.desktopData.images[saveKey] = imageKey;
            // 同步写入 appData.images，让读取逻辑能直接找到
            appData.images[saveKey] = imageKey;
            
            await saveData();

            const el = document.getElementById(elementId);
            if(el) el.style.backgroundImage = `url('${src}')`;
            
            document.getElementById('modal-upload').classList.remove('show');
            currentUploadId = null; 
        }
        return; 
    }
    
    if(originalSystemHandleImage) {
        originalSystemHandleImage(src);
    }
};

// ==========================================
//[查阅手机 - 时钟 APP] 核心逻辑
// ==========================================
window.openCpClock = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) {
        alert("请先选择监视的对象");
        return;
    }
    openPage('page-cp-clock');
    updateCpClockLive(); // 打开时立刻刷新一次时间
};

function updateCpClockLive() {
    const el = document.getElementById('time-beijing');
    if (!el) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${h}:${m}`;
    if (el.textContent !== timeStr) el.textContent = timeStr;
}

// 挂载定时器，每分钟自动跳动
setInterval(updateCpClockLive, 10000);

// ==========================================
// [查阅手机 - 邮件 APP] 核心逻辑 & AI 生成
// ==========================================
let currentCpMailFolder = 'all';
let currentCpMailId = null;

window.openCpMail = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) { alert("请先选择监视的对象"); return; }
    
    // 初始化邮箱数据结构
    if (!contact.mails) contact.mails =[];
    
    renderCpMailHome();
    openPage('page-cp-mail');
};

// 渲染邮件首页（带数量统计）
window.renderCpMailHome = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    
    const mails = contact.mails ||[];
    
    const counts = {
        all: mails.filter(m => !m.isSent).length, // 收件箱不包含已发送
        qq: mails.filter(m => m.folder === 'qq' && !m.isSent).length,
        '163': mails.filter(m => m.folder === '163' && !m.isSent).length,
        icloud: mails.filter(m => m.folder === 'icloud' && !m.isSent).length,
        vip: mails.filter(m => m.isVip && !m.isSent).length,
        sent: mails.filter(m => m.isSent).length,
        unread: mails.filter(m => !m.isRead && !m.isSent).length
    };

    document.getElementById('mail-count-all').innerText = counts.all || '';
    document.getElementById('mail-count-qq').innerText = counts.qq || '';
    document.getElementById('mail-count-163').innerText = counts['163'] || '';
    document.getElementById('mail-count-icloud').innerText = counts.icloud || '';
    document.getElementById('mail-count-vip').innerText = counts.vip || '';
    document.getElementById('mail-count-sent').innerText = counts.sent || '';
    document.getElementById('mail-count-unread').innerText = counts.unread || '';
};

// 打开某个具体的邮件列表（如 "QQ邮箱"）
window.openCpMailList = (folder, title) => {
    currentCpMailFolder = folder;
    document.getElementById('mail-list-title').innerText = title;
    renderCpMailList();
    document.getElementById('page-cp-mail').classList.add('list-active');
};

// 从邮件列表页返回首页
window.closeCpMailList = () => {
    document.getElementById('page-cp-mail').classList.remove('list-active');
    renderCpMailHome();
};

// 渲染邮件列表
window.renderCpMailList = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    
    const listEl = document.getElementById('mail-emails-list');
    listEl.innerHTML = '';
    
    let filteredMails = contact.mails ||[];
    if (currentCpMailFolder === 'qq') filteredMails = filteredMails.filter(m => m.folder === 'qq' && !m.isSent);
    else if (currentCpMailFolder === '163') filteredMails = filteredMails.filter(m => m.folder === '163' && !m.isSent);
    else if (currentCpMailFolder === 'icloud') filteredMails = filteredMails.filter(m => m.folder === 'icloud' && !m.isSent);
    else if (currentCpMailFolder === 'vip') filteredMails = filteredMails.filter(m => m.isVip && !m.isSent);
    else if (currentCpMailFolder === 'sent') filteredMails = filteredMails.filter(m => m.isSent);
    else if (currentCpMailFolder === 'unread') filteredMails = filteredMails.filter(m => !m.isRead && !m.isSent);
    else if (currentCpMailFolder === 'all') filteredMails = filteredMails.filter(m => !m.isSent);

    // 按时间倒序排列
    filteredMails.sort((a, b) => b.timestamp - a.timestamp);

    document.getElementById('mail-list-count').innerText = `${filteredMails.length} 封邮件`;

    if (filteredMails.length === 0) {
        listEl.innerHTML = '<div style="text-align:center; padding: 50px 20px; color:#8E8E93;">无邮件</div>';
        return;
    }

    filteredMails.forEach(mail => {
        const el = document.createElement('div');
        el.className = `mail-email-row ${mail.isRead ? '' : 'unread'}`;
        el.onclick = () => openCpMailDetail(mail.id);
        
        const dateStr = new Date(mail.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = mail.content;
        const previewText = tempDiv.textContent || tempDiv.innerText || '';

        el.innerHTML = `
            <div class="mail-email-header">
                <div class="mail-email-sender">${mail.sender}</div>
                <div class="mail-email-date">${dateStr} ></div>
            </div>
            <div class="mail-email-subject">${mail.subject}</div>
            <div class="mail-email-preview">${previewText}</div>
        `;
        listEl.appendChild(el);
    });
};

// 打开邮件详情页
window.openCpMailDetail = (id) => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const mail = contact.mails.find(m => m.id === id);
    if (!mail) return;
    
    currentCpMailId = id;
    
    // 点击后标记为已读
    if (!mail.isRead) {
        mail.isRead = true;
        saveData();
        renderCpMailList(); // 后台更新列表UI
    }

    // 先把内容填充好，让浏览器完成布局
    document.getElementById('mail-detail-subject').innerText = mail.subject;
    document.getElementById('mail-detail-sender').innerText = mail.sender;
    document.getElementById('mail-detail-avatar').innerText = mail.sender.charAt(0).toUpperCase();
    
    const dateStr = new Date(mail.timestamp).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('mail-detail-date').innerText = dateStr;
    
    // 对AI生成的HTML内容包一层，防止内容溢出造成右侧空白
    const bodyEl = document.getElementById('mail-detail-body');
    bodyEl.innerHTML = `<div style="max-width:100%; overflow-x:hidden; word-break:break-word; overflow-wrap:break-word;">${mail.content}</div>`;

    // 强制浏览器完成当前帧的布局计算（读取 scrollHeight 会触发 reflow）
    // 这样动画开始时内容已完全就位，彻底消除右侧白块
    void bodyEl.scrollHeight;
    void document.getElementById('cp-mail-detail-view').offsetWidth;
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            document.getElementById('page-cp-mail').classList.add('detail-active');
        });
    });
};

// 从邮件详情页返回列表
window.closeCpMailDetail = () => {
    document.getElementById('page-cp-mail').classList.remove('detail-active');
    currentCpMailId = null;
};

// AI 生成邮件
window.generateCpEmails = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { 
        alert("请先去 API 页面配置 API 服务器与 Key！"); 
        return; 
    }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const btn = document.querySelector('.mail-edit-btn');
    const oldText = btn.innerText;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite; display:inline-block;"></i>';
    btn.style.pointerEvents = 'none';

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const prompt = `你现在正在扮演“${contact.name}”。你的任务是为你手机里的“邮箱APP”生成至少 6 封全新的邮件。
    
【你的人设】：${contact.prompt}
【正在查阅你手机的人】：${myName} (${myPersona})

【生成要求】：
1. 邮件内容必须符合你的人设和生活轨迹。可以包含：工作通知、购物订单、社交平台提醒、垃圾广告、或者某个特定人物发来的私密邮件。
2. 必须生成至少 6 封邮件，并将它们合理分配到不同的邮箱账户中（"qq", "163", "icloud"）。
3. 随机设置一些邮件为未读（isRead: false），一些为 VIP（isVip: true）。
4. 邮件正文 (content) 可以使用 HTML 标签进行排版（如 <br>, <b>, <div style="..."> 等），使其看起来像真实的富文本邮件。
5. 严格输出 JSON 数组格式，绝对不要有任何 Markdown (如 \`\`\`json)：[
  {
    "sender": "发件人名称 (如: Apple, 淘宝, HR, 某个朋友)",
    "subject": "邮件主题",
    "content": "邮件正文HTML",
    "folder": "qq 或 163 或 icloud",
    "isRead": true 或 false,
    "isVip": true 或 false,
    "isSent": false (如果是你发出的邮件设为true)
  }
]`;

    try {
        const model = appData.lastApi.model || (appData.cachedModels.length > 0 ? appData.cachedModels[0] : "gpt-3.5-turbo");
        const temp = parseFloat(appData.lastApi.temp) || 0.8;
        
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: temp })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let generatedEmails = JSON.parse(rawText);
        
        if(!contact.mails) contact.mails = [];

        // 给每个邮件加上唯一ID和时间戳
        generatedEmails.forEach((mail, index) => {
            mail.id = 'mail_' + Date.now() + index;
            // 让时间戳在最近一周内随机分布
            mail.timestamp = Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000);
        });
        
        // 替换掉旧的邮件
        contact.mails = generatedEmails;
        await saveData();
        
        renderCpMailHome();
        showToast(`已生成 ${generatedEmails.length} 封新邮件`);

    } catch (e) {
        alert("AI 生成失败，可能是返回格式错误或网络问题:\n" + e.message);
        console.error(e);
    } finally {
        btn.innerText = oldText;
        btn.style.pointerEvents = 'auto';
    }
};
// ==========================================
// [查阅手机 - 备忘录 APP] 核心逻辑 & AI 生成
// ==========================================
let currentCpNoteId = null;

// 1. 打开应用
window.openCpNotes = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) {
        alert("请先选择监视的对象");
        return;
    }
    // 数据初始化
    if (!contact.notes) contact.notes =[];
    
    renderCpNotesList();
    openPage('page-cp-notes');
};

// 2. 渲染列表
window.renderCpNotesList = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    
    const listEl = document.getElementById('cp-notes-list-content');
    listEl.innerHTML = '';
    
    const notes = contact.notes ||[];
    
    // 按照时间倒序排列
    [...notes].sort((a,b) => b.id - a.id).forEach(note => {
        const el = document.createElement('div');
        el.className = 'cp-note-item';
        el.onclick = () => openCpNote(note.id);
        
        const displayTitle = note.title.trim() ? note.title : '新备忘录';
        
        // 提取纯文本做摘要（过滤掉AI生成的HTML标签）
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = note.content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        const displayContent = textContent.trim() ? textContent : '无附加文本';

        el.innerHTML = `
            <div class="cp-note-item-title">${displayTitle}</div>
            <div class="cp-note-item-desc">
                <span style="margin-right: 8px;">${note.date}</span>
                <span style="color: #8e8e93; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${displayContent}</span>
            </div>
            <div class="cp-note-item-folder">
                <i class="ri-folder-2-line"></i> ${note.folder || '备忘录'}
            </div>
        `;
        listEl.appendChild(el);
    });

    document.getElementById('cp-notes-count').innerText = `${notes.length}个备忘录`;
};

// 3. 打开详情页
window.openCpNote = (id) => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    currentCpNoteId = id;
    const note = contact.notes.find(n => n.id === id);
    
    document.getElementById('cp-note-title').value = note.title || '';
    // 注意：使用的是 innerHTML，以确保 AI 生成的气泡和待办正常渲染
    document.getElementById('cp-note-content').innerHTML = note.content || '';
    
    document.getElementById('page-cp-notes').classList.add('detail-active');
};

// 4. 保存并返回列表
window.closeCpNote = () => {
    if (currentCpNoteId !== null) {
        const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
        const note = contact.notes.find(n => n.id === currentCpNoteId);
        if (note) {
            note.title = document.getElementById('cp-note-title').value;
            note.content = document.getElementById('cp-note-content').innerHTML; // 保存 HTML
            saveData();
        }
    }
    currentCpNoteId = null;
    renderCpNotesList();
    document.getElementById('page-cp-notes').classList.remove('detail-active');
};

// 5. 手动新建
window.createNewCpNote = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if(currentCpNoteId !== null) closeCpNote(); // 如果正在编辑，先保存

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}/${today.getFullYear()}`;
    
    const newNote = {
        id: Date.now(),
        title: '',
        content: '',
        date: dateStr,
        folder: '备忘录'
    };
    
    contact.notes.push(newNote);
    saveData();
    renderCpNotesList();
    openCpNote(newNote.id);
    
    setTimeout(() => document.getElementById('cp-note-title').focus(), 350);
};

// 6. 删除当前笔记
window.deleteCurrentCpNote = () => {
    if (currentCpNoteId === null) return;
    if (confirm('确定删除此备忘录吗？不可恢复。')) {
        const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
        contact.notes = contact.notes.filter(n => n.id !== currentCpNoteId);
        saveData();
        currentCpNoteId = null;
        renderCpNotesList();
        document.getElementById('page-cp-notes').classList.remove('detail-active');
    }
};

// ==========================================
// 🚀 核心：通过大模型一键生成 5 篇动态手机备忘录 (带精准时间感知 - 完整版)
// ==========================================
window.generateCpNotes = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { 
        alert("请先去 API 页面配置 API 服务器与 Key！"); 
        return; 
    }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    // 按钮转圈状态
    const btn = document.querySelector('#cp-notes-list-view .ri-magic-line').parentNode;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite; font-size:22px;"></i>';
    btn.disabled = true;

    // 1. 获取准确的现实时间
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayStr = `${dd}/${mm}/${yyyy}`; // 苹果备忘录格式：31/03/2026
    const fullDateStr = `${yyyy}年${mm}月${dd}日`;

    // 2. 提取近期聊天记录，并强制加上真实的时间戳，防止AI时间错乱
    const historyMsgs = appData.chatData.messages.filter(m => m.chatId === contact.id).slice(-30);
    let historyText = historyMsgs.map(m => {
        let msgTime = new Date(m.timestamp).toLocaleString('zh-CN', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
        return `[${msgTime}] ${m.sender === 'me' ? 'User' : contact.name}: ${m.content}`;
    }).join('\n');

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const prompt = `你现在正在扮演“${contact.name}”。你的任务是为你手机里的“备忘录APP”生成至少 5 篇全新的笔记。
    
【时间与环境规则】（极其重要！！！）：
现实现在的真实时间是：${fullDateStr}。
你生成的这5篇备忘录，时间跨度必须合理分布在【最近的一两周内】到【今天】。
**绝对、绝对不要生成 ${yyyy - 1} 年或更早（比如2024年、2025年）的记录！所有笔记的年份必须是 ${yyyy} 年！**

【你的人设】：${contact.prompt}
【正在和你聊天的人】：${myName} (${myPersona})
【最近你们的聊天记录 (带时间戳，供你参考推演时间线)】：
${historyText || "(你们暂时还没聊过天，请脑补你自己的单方面日记或心情)"}

【生成要求】：
1. 内容必须高度契合你的人设。必须包含：对用户的吐槽/暗恋/秘密、待办事项(购物单/计划)、或者心情发泄。并且要和你们刚刚聊过的话题产生联动！
2. 必须要带有 iOS 备忘录的高级排版风格！请在 "content" 字段中使用以下 HTML 标签来实现好看的模块动效：
   - 待办事项：<div style="margin:5px 0;"><input type="checkbox"> 洗衣服</div>
   - 苹果灰色气泡/小组件：<div style="background:#e5e5ea; padding:12px 16px; border-radius:18px; width:fit-content; color:#000; margin:10px 0; font-size:15px; box-shadow:0 2px 5px rgba(0,0,0,0.05);">写在气泡里的话</div>
   - 手绘涂鸦/强调：<div style="border: 3px dashed #ff9999; padding:15px; border-radius:16px; background:#fff0f0; color:#d93838; font-weight:bold; transform:rotate(-2deg); width:fit-content; font-family: cursive;">心情极差！！🤬</div>
   - 荧光笔高亮：<span style="background-color: #ffe066; padding: 0 4px; border-radius:4px;">重点标出</span>
3. 请输出严格的 JSON 数组格式，绝对不要有任何 Markdown (如 \`\`\`json)：[
  { "title": "购物清单", "content": "<input type='checkbox'> 买牛奶<br><input type='checkbox'> 买花", "date": "像 ${todayStr} 这样的格式或者'昨天'", "folder": "日常" },
  { "title": "关于他", "content": "<div style='background:#e5e5ea;...'>其实我...</div>", "date": "具体的日期，年份必须是${yyyy}", "folder": "秘密" }
]
注意：必须生成且刚好 5 篇笔记。`;

    try {
        const model = appData.lastApi.model || (appData.cachedModels.length > 0 ? appData.cachedModels[0] : "gpt-3.5-turbo");
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.85 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let generatedNotes = JSON.parse(rawText);
        
        if(!contact.notes) contact.notes = [];

        // 将新生成的笔记添加到列表的最前面
        generatedNotes.forEach((note, index) => {
            contact.notes.unshift({
                id: Date.now() + index, // 赋予一个唯一的 ID
                title: note.title || '无标题',
                content: note.content || '',
                date: note.date,
                folder: note.folder || '备忘录'
            });
        });

        await saveData();
        renderCpNotesList();
        showToast(`${generatedNotes.length}篇新备忘录已生成`);

    } catch (e) {
        alert("AI 生成失败，可能是返回格式错误或网络问题:\n" + e.message);
        console.error(e);
    } finally {
        // 恢复按钮状态
        btn.innerHTML = '<i class="ri-magic-line" style="font-size:22px;"></i>';
        btn.disabled = false;
    }
};



// === Part 2: iMessage界面（原 14_memo_notes.js） ===

// ==========================================
// [查阅手机 - iMessage 信息 APP] 核心逻辑 & AI 生成
// ==========================================
let currentCpMsgChatId = null;

// iOS 默认头像颜色池
const IOS_COLORS =['#abacba', '#32ade6', '#ff9500', '#ff2d55', '#34c759', '#007aff'];
function getIosColor(name) {
    let hash = 0;
    for(let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return IOS_COLORS[Math.abs(hash) % IOS_COLORS.length];
}

// 打开应用
window.openCpMessages = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    if (!contact.iMessages) contact.iMessages =[]; 

    renderCpMsgList();
    openPage('page-cp-messages');
};

// 渲染列表
window.renderCpMsgList = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const listEl = document.getElementById('cp-msg-list-content');
    const msgs = contact.iMessages ||[];

    if (msgs.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; color:#b2b2b2; padding: 60px 20px;">暂无信息<br><span style="font-size:12px;">点击右上角编辑图标，魔法生成 6 位联系人</span></div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    let totalUnread = 0;

    msgs.forEach(npc => {
        if (npc.unread) totalUnread += npc.unread;
        
        let lastMsg = "暂无消息";
        if (npc.messages && npc.messages.length > 0) {
            lastMsg = npc.messages[npc.messages.length - 1].content.replace(/<[^>]+>/g, '');
        }

        const el = document.createElement('div');
        el.className = `cp-msg-list-item ${npc.unread > 0 ? 'unread' : ''}`;
        el.onclick = () => openCpMsgChat(npc.id);
        
        const avatarLetter = npc.name.charAt(0).toUpperCase();
        const bgColor = getIosColor(npc.name);

        el.innerHTML = `
            <div class="cp-msg-unread-dot"></div>
            <div class="cp-msg-avatar" style="background: ${bgColor};">${avatarLetter}</div>
            <div class="cp-msg-content">
                <div class="cp-msg-row-top">
                    <span class="cp-msg-name">${npc.name}</span>
                    <span class="cp-msg-time" style="${npc.unread > 0 ? 'color:var(--ios-blue);' : ''}">${npc.time}</span>
                </div>
                <div class="cp-msg-preview" style="${npc.unread > 0 ? 'color:var(--ios-text); font-weight:500;' : ''}">${lastMsg}</div>
            </div>
        `;
        fragment.appendChild(el);
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment);
    
    // 更新未读角标
    document.getElementById('cp-msg-badge').innerText = totalUnread || '';
    document.getElementById('cp-msg-badge').style.display = totalUnread > 0 ? 'block' : 'none';
};

// 打开聊天室
window.openCpMsgChat = (id) => {
    currentCpMsgChatId = id;
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const npcData = contact.iMessages.find(n => n.id === id);
    if (!npcData) return;

    // 清除未读
    if (npcData.unread > 0) {
        npcData.unread = 0;
        saveData();
        renderCpMsgList(); // 后台刷新列表红点
    }

    document.getElementById('cp-msg-chat-name').innerText = npcData.name;
    document.getElementById('cp-msg-chat-avatar').innerText = npcData.name.charAt(0).toUpperCase();
    document.getElementById('cp-msg-chat-avatar').style.background = getIosColor(npcData.name);

    const bodyEl = document.getElementById('cp-msg-chat-content');
    let htmlBuffer = `<div class="cp-msg-timestamp">今天 ${npcData.time}</div>`; 

    npcData.messages.forEach((msg, index) => {
        const isMe = msg.sender === 'me'; 
        const wrapClass = isMe ? 'sent' : 'received';

        // 核心判断：如果这是最后一条消息，或者下一条消息的发件人变了，它就是这组连发的“最后一条”
        const isLastInGroup = (index === npcData.messages.length - 1) || (npcData.messages[index + 1].sender !== msg.sender);
        
        // 追加 class
        const groupClass = isLastInGroup ? 'last-in-group' : '';

        htmlBuffer += `
            <div class="cp-msg-row ${wrapClass} ${groupClass}">
                <div class="cp-msg-row-inner">
                    <div class="cp-msg-bubble">${msg.content}</div>
                </div>
                ${(isMe && isLastInGroup) ? `<div class="cp-msg-status">已送达</div>` : ''}
            </div>
        `;
    });

    bodyEl.innerHTML = htmlBuffer; 
    document.getElementById('page-cp-messages').classList.add('chat-active');
    
    requestAnimationFrame(() => {
        bodyEl.scrollTop = bodyEl.scrollHeight;
    });
};

window.closeCpMsgChat = () => {
    document.getElementById('page-cp-messages').classList.remove('chat-active');
    currentCpMsgChatId = null;
};

// 魔法生成大模型数据 (修复版：强感知加载 + 长对话生成)
window.generateCpMessages = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { 
        alert("请先去 API 页面配置 API 服务器与 Key！"); return; 
    }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    // --- 修复点 1：极其明显的刷新视觉反馈 ---
    const btn = document.querySelector('.cp-msg-compose');
    btn.style.pointerEvents = 'none'; // 禁用按钮防连点
    
    const listEl = document.getElementById('cp-msg-list-content');
    listEl.innerHTML = `
        <div style="text-align:center; padding: 100px 20px; color:#8E8E93;">
            <i class="ri-loader-4-line" style="font-size:45px; color:var(--ios-blue); animation: spin 1s linear infinite; display:inline-block; margin-bottom:20px;"></i>
            <div style="font-size:15px; font-weight:600; color:var(--ios-text);">正在窃取短信记录...</div>
            <div style="font-size:12px; margin-top:8px; opacity:0.6;">AI 正在伪造长篇对话，请稍候几秒钟</div>
        </div>
    `;
    // ----------------------------------------

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    // --- 修复点 2：在 Prompt 里严厉要求 AI 生成多回合长对话与“连发消息” ---
    const prompt = `你正在扮演“${contact.name}”。请为你手机里的“iMessage 信息 APP”伪造一个逼真的聊天列表。
【你的人设】：${contact.prompt}
【正在查阅你手机的人】：名字叫 ${myName}，人设是 ${myPersona || '普通网友'}。

【生成要求】（极其重要）：
1. 必须生成 6 个联系人！第一个必须是正在查阅手机的“我”（User），id必须是 "user"(你给的备注)。剩下的5个联系人根据你的社交圈生成。
2. 聊天内容要非常生活化、碎片化！
3. 【极度重要：拒绝一问一答】：真正的聊天习惯是“连发消息”！请务必让某个人连续发送 2 到 4 条短消息，然后再由另一个人回复。
4. 严格输出 JSON 数组，绝不要 Markdown！格式如下：[
  {
    "id": "user",
    "name": "臭宝",
    "time": "下午 2:17",
    "unread": 0,
    "messages":[
      {"sender": "me", "content": "你在干嘛呢"},
      {"sender": "me", "content": "理理我！！"},
      {"sender": "them", "content": "刚吃完饭"},
      {"sender": "them", "content": "外卖送太慢了，饿死我了"},
      {"sender": "them", "content": "你要不要看看我点的啥"}
    ]
  }
]`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.85 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let generatedNPCs = JSON.parse(rawText);
        
        contact.iMessages = generatedNPCs;
        await saveData();
        renderCpMsgList();
        showToast(`已成功获取大量短信记录`);

    } catch (e) {
        alert("信息刷新失败，可能是网络异常或AI格式错误:\n" + e.message);
        console.error(e);
        renderCpMsgList(); // 失败后恢复旧列表
    } finally {
        btn.style.pointerEvents = 'auto'; // 恢复按钮可点击
    }
};


// === Part 3: 通话/联系人/微信/坦白吧（原 15_phone_app.js） ===

// ==========================================
// [查阅手机 - 电话/语音留言 APP] 核心逻辑 & AI 生成
// ==========================================
let currentDialNumber = "";

window.openCpPhoneApp = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    
    if (!contact.phoneLogs) contact.phoneLogs =[];
    
    // 初始化时清空拨号盘
    currentDialNumber = "";
    updateCpPhoneScreen();
    
    switchCpPhoneTab('voicemail');
    openPage('page-cp-phone');
};

// 1. Tab 切换逻辑
window.switchCpPhoneTab = (tabName) => {
    document.querySelectorAll('.cp-ph-view').forEach(el => el.classList.remove('active'));
    document.getElementById('cp-ph-view-' + tabName).classList.add('active');

    const dockItems = document.getElementById('cp-ph-bottom-dock').querySelectorAll('.cp-ph-nav-item');
    dockItems.forEach(el => el.classList.remove('active'));
    
    if (tabName === 'voicemail') {
        dockItems[0].classList.add('active');
        renderCpVoicemails();
    } else if (tabName === 'contacts') {
        dockItems[1].classList.add('active');
        renderCpContacts();
    } else if (tabName === 'keypad') {
        dockItems[2].classList.add('active');
    }
};

// 2. 渲染语音留言列表
window.renderCpVoicemails = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const listEl = document.getElementById('cp-ph-voicemail-list');
    listEl.innerHTML = '';

    const logs = contact.phoneLogs ||[];
    if (logs.length === 0) {
        listEl.innerHTML = `<div style="text-align:center; padding:60px 20px; color:#8e8e93;">暂无语音留言<br><span style="font-size:12px;">点击右上角魔法棒生成通讯记录</span></div>`;
        return;
    }

    logs.forEach((item, index) => {
        const el = document.createElement('div');
        el.className = `cp-ph-item ${item.unread ? 'unread' : ''}`;
        
        // 点击消除未读状态
        el.onclick = () => {
            if (item.unread) {
                item.unread = false;
                saveData();
                renderCpVoicemails();
            }
        };

        const hasQuote = item.text.includes('“') ? "font-family: 'PingFang SC';" : "";
        
        // 匹配头像 (如果是 User)
        let avatarHtml = `<div class="cp-ph-avatar"><svg viewBox="0 0 24 24"><path d="M12 12c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0 2c-4.42 0-8 2.24-8 4v2h16v-2c0-1.76-3.58-4-8-4z"/></svg></div>`;
        if (item.isUser) {
            let myAvatar = appData.images['user-avatar'];
            if(contact.userMaskId && appData.userMasks) {
                const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
                if(mask) myAvatar = mask.avatar;
            }
            avatarHtml = `<div class="cp-ph-avatar"><img src="${getRealImgSrc(myAvatar)}"></div>`;
        }

        el.innerHTML = `
            <div class="cp-ph-unread-dot"></div>
            <div class="cp-ph-avatar-wrap">${avatarHtml}</div>
            <div class="cp-ph-text-content">
                <div class="cp-ph-top-row">
                    <span class="cp-ph-phone-num">${item.num}</span>
                    <span class="cp-ph-time">${item.time}</span>
                </div>
                <div class="cp-ph-bottom-row">
                    <span class="cp-ph-label">${item.type || '主号'}</span>
                    <span class="cp-ph-desc" style="${hasQuote}" onclick="this.classList.toggle('expanded')" title="点击展开">${item.text}</span>
                </div>
            </div>
        `;
        listEl.appendChild(el);
    });
};

// 3. 渲染通讯录 (整合我 + NPC)
window.renderCpContacts = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const listEl = document.getElementById('cp-ph-contacts-list');
    listEl.innerHTML = '';

    // 确定我的身份
    let myName = appData.customTexts['display-name'] || "我";
    let myAvatar = appData.images['user-avatar'];
    let myNote = "手机主人";
    
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myAvatar = mask.avatar; myNote = mask.note || "特别关心"; }
    }

    // --- 强制插入“我” ---
    const myEl = document.createElement('div');
    myEl.className = 'cp-ph-item';
    myEl.innerHTML = `
        <div class="cp-ph-avatar-wrap"><div class="cp-ph-avatar"><img src="${getRealImgSrc(myAvatar)}"></div></div>
        <div class="cp-ph-text-content">
            <div class="cp-ph-phone-num">${myName}</div>
            <div class="cp-ph-bottom-row"><span class="cp-ph-desc">${myNote}</span></div>
        </div>
    `;
    listEl.appendChild(myEl);

    // --- 渲染微信列表里的 NPC 作为联系人 ---
    if (contact.wechatNpcs && contact.wechatNpcs.length > 0) {
        contact.wechatNpcs.forEach(npc => {
            if (npc.id === 'user') return; // 跳过重复的User
            const el = document.createElement('div');
            el.className = 'cp-ph-item';
            el.innerHTML = `
                <div class="cp-ph-avatar-wrap"><div class="cp-ph-avatar"><img src="${npc.avatar || makeDefaultAvatar(npc.name)}"></div></div>
                <div class="cp-ph-text-content">
                    <div class="cp-ph-phone-num">${npc.name}</div>
                    <div class="cp-ph-bottom-row"><span class="cp-ph-desc">移动电话</span></div>
                </div>
            `;
            listEl.appendChild(el);
        });
    } else {
        listEl.innerHTML += `<div style="text-align:center; padding:30px; font-size:12px; color:#555;">通讯录空空如也，去微信点一下魔法棒生成社交圈吧。</div>`;
    }
};

// 4. 拨号盘逻辑
window.pressCpPhoneKey = (char) => {
    if(currentDialNumber.length < 20) {
        currentDialNumber += char;
        updateCpPhoneScreen();
    }
};

window.deleteCpPhoneKey = () => {
    currentDialNumber = currentDialNumber.slice(0, -1);
    updateCpPhoneScreen();
};

function updateCpPhoneScreen() {
    const screen = document.getElementById('cp-ph-dial-screen');
    const delBtn = document.getElementById('cp-ph-del-btn');
    
    // 简单格式化号码 123 4567 8900
    let formatted = currentDialNumber;
    let cleaned = currentDialNumber.replace(/\D/g, ''); 
    if(!currentDialNumber.startsWith('*') && !currentDialNumber.startsWith('#')) {
        if (cleaned.length > 3 && cleaned.length < 8) formatted = cleaned.slice(0,3) + ' ' + cleaned.slice(3);
        else if (cleaned.length >= 8 && cleaned.length <= 11) formatted = cleaned.slice(0,3) + ' ' + cleaned.slice(3,7) + ' ' + cleaned.slice(7);
    }

    screen.innerText = formatted;
    screen.style.fontSize = currentDialNumber.length > 10 ? '24px' : '34px'; 
    
    if (currentDialNumber.length > 0) delBtn.classList.add('show');
    else delBtn.classList.remove('show');
}

// 5. 魔法生成真实的语音留言 (时间感知)
window.generateCpPhoneLogs = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { alert("请先配置 API！"); return; }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const btn = document.querySelector('.cp-ph-header-action i');
    btn.className = 'ri-loader-4-line';
    btn.style.animation = 'spin 1s linear infinite';

    // 提取我和他最近的聊天记录作为上下文推演
    const historyMsgs = appData.chatData.messages.filter(m => m.chatId === contact.id).slice(-15);
    let historyText = historyMsgs.map(m => `${m.sender === 'me' ? 'User' : contact.name}: ${m.content}`).join('\n');

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const now = new Date();
    const timeStr = `${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const prompt = `你现在正在扮演“${contact.name}”。你的任务是为你手机里的“语音信箱/通话记录”生成 6 条逼真的留言。
    
【时间规则】：现实现在的时间是 ${timeStr}。留言的时间必须分布在今天、昨天或最近几天内。
【你的人设】：${contact.prompt}
【查看手机的人】：${myName} (${myPersona})
【近期聊天参考】：\n${historyText || '暂无聊天'}

【生成要求】：
1. 必须生成 6 条记录。
2. 至少有一条是 ${myName} (正在看手机的人) 打来的。如果你们刚好吵架/热恋，留言内容要有连贯性！
3. 其他几条必须是你社交圈的 NPC 打来的（比如外卖、快递、房东、推销、某个特定关系的人）。
4. 留言文本(text) 要非常口语化，如果是对方说话，需要加上中文双引号，比如：“喂，外卖放前台了哈”。如果是没有听清的，就写 "语音留言" 4个字。
5. 严格输出 JSON 数组格式，不要 Markdown：[
  {
    "isUser": true, 
    "num": "${myName} 的专属昵称或真实号码",
    "time": "12:45 或 昨天",
    "text": "“你到底去哪了？接电话！”",
    "type": "主号",
    "unread": true
  },
  {
    "isUser": false, 
    "num": "+86 138 4455 6677",
    "time": "星期四",
    "text": "“外卖到了，出来拿一下”",
    "type": "未知",
    "unread": false
  }
]`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.85 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        contact.phoneLogs = JSON.parse(rawText);
        
        await saveData();
        renderCpVoicemails();
        showToast('语音信箱已刷新');

    } catch (e) {
        alert("生成失败:\n" + e.message);
    } finally {
        btn.className = 'ri-magic-line';
        btn.style.animation = 'none';
    }
};

// ==========================================
// [查阅手机 - 微信 APP] 核心逻辑 & AI 生成 (完美重构版)
// ==========================================
let currentCpWxChatId = null;

window.openCpWechat = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    if (!contact.wechatNpcs) contact.wechatNpcs =[]; // 初始化 NPC 列表

    renderCpWechatList();
    openPage('page-cp-wechat');
};

// 1. 渲染微信列表（极致性能优化版 + 头像精准修复）
window.renderCpWechatList = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const listEl = document.getElementById('cp-wx-list-content');
    const npcs = contact.wechatNpcs ||[];

    // 空白态提示
    if (npcs.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; color:#b2b2b2; padding: 60px 20px;">
                <i class="ri-wechat-line" style="font-size:50px; color:#e5e5ea; margin-bottom:10px; display:block;"></i>
                暂无聊天记录<br><span style="font-size:12px;">点击右上角魔法棒，偷看 Ta 的微信列表</span>
            </div>
        `;
        return;
    }

    const allMsgs = appData.chatData.messages ||[];
    let lastUserMsg = null;
    for (let i = allMsgs.length - 1; i >= 0; i--) {
        if (allMsgs[i].chatId === contact.id) {
            lastUserMsg = allMsgs[i];
            break;
        }
    }

    // 🔥 核心修复：精准获取“我”的面具头像或房间专属头像
    let myAvatarSrc = getRealImgSrc(appData.images['user-avatar']);
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) myAvatarSrc = getRealImgSrc(mask.avatar);
    }
    if(contact.userAvatarOverride) {
        myAvatarSrc = getRealImgSrc(contact.userAvatarOverride);
    }

    const fragment = document.createDocumentFragment();

    npcs.forEach(npc => {
        let lastMsg = "暂无消息";
        let displayTime = npc.time || "";

        if (npc.id === 'user') {
            if (lastUserMsg) {
                lastMsg = lastUserMsg.sticker ? "[表情包]" : (lastUserMsg.content.replace(/<[^>]+>/g, '') || "[图片/文件]");
                const d = new Date(lastUserMsg.timestamp);
                displayTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            }
        } else {
            if (npc.messages && npc.messages.length > 0) {
                const m = npc.messages[npc.messages.length - 1];
                lastMsg = m.content.replace(/<[^>]+>/g, '');
            }
        }

        const el = document.createElement('div');
        el.className = 'cp-wx-item';
        el.onclick = () => openCpWechatChat(npc.id);
        
        // 🔥 分配头像：如果是user，用刚才算好的我方真实头像；否则用NPC数据里的头像（空则自动生成）
        let avatarSrc = npc.id === 'user' ? myAvatarSrc : (npc.avatar || makeDefaultAvatar(npc.name));

        el.innerHTML = `
            <img src="${avatarSrc}" class="cp-wx-avatar">
            <div class="cp-wx-info">
                <div class="cp-wx-name-row">
                    <span class="cp-wx-name">${npc.name}</span>
                    <span class="cp-wx-time">${displayTime}</span>
                </div>
                <div class="cp-wx-msg-preview">${lastMsg}</div>
            </div>
        `;
        fragment.appendChild(el);
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment); 
};

// 2. 打开聊天室（极致性能优化版）
window.openCpWechatChat = (id) => {
    currentCpWxChatId = id;
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const bodyEl = document.getElementById('cp-wx-chat-content');
    
    let htmlBuffer = ''; 

    const charAvatar = getRealImgSrc(contact.avatar, contact.name); 
    const npcData = contact.wechatNpcs.find(n => n.id === id);
    if (!npcData) return;

    document.getElementById('cp-wx-chat-title').innerText = npcData.name;

    if (id === 'user') {
        // --- 渲染与你（User）的真实对话记录 ---
        let myAvatar = getRealImgSrc(appData.images['user-avatar']);
        let myName = appData.customTexts['display-name'] || "我";
        if(contact.userMaskId && appData.userMasks) {
            const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
            if(mask) { myName = mask.name; myAvatar = getRealImgSrc(mask.avatar); }
        }
        if(contact.userAvatarOverride) {
            myAvatar = getRealImgSrc(contact.userAvatarOverride);
        }

        const realHistory = appData.chatData.messages.filter(m => m.chatId === contact.id).slice(-50);
        
        realHistory.forEach((msg) => {
            if (msg.isRecalled) {
                htmlBuffer += `<div class="cp-wx-sys-msg">" ${msg.sender === 'bot' ? '你' : myName} " 撤回了一条消息</div>`;
                return;
            }

            // 视角反转：这是Ta的手机，所以 AI('bot') 是绿色的'me'，人类('me') 是白色的'them'
            const isOwner = msg.sender === 'bot'; 
            const wrapClass = isOwner ? 'me' : 'them';
            const avatarSrc = isOwner ? charAvatar : myAvatar;

            const isOnlySticker = (!msg.content || msg.content.trim() === '') && msg.sticker;
            // 微信模式下，取消所有无尾巴逻辑，回归纯粹的 cp-wx-bubble
            const bubbleClass = isOnlySticker ? 'cp-wx-bubble no-bg' : `cp-wx-bubble`;

            let contentHtml = msg.content.replace(/\n/g, '<br>');
            if (msg.quote) contentHtml = `<div style="font-size:12px; color:#888; border-left:2px solid #ccc; padding-left:4px; margin-bottom:4px;">${msg.quote}</div>` + contentHtml;
            
            if (msg.sticker) {
                contentHtml += (isOnlySticker ? '' : '<br>') + `<img src="${getRealImgSrc(msg.sticker.src)}" style="max-width:130px; display:block;">`;
            }
            
            let peeledHtml = '';
            if (msg.peeledStickers) {
                msg.peeledStickers.forEach(s => {
                    let sC = s.type === 'emoji' ? `<div style="font-size:32px;">${s.content}</div>` : `<img src="${getRealImgSrc(s.content)}" style="width:40px;">`;
                    const scaleX = s.flip ? -1 : 1;
                    peeledHtml += `<div style="position:absolute; left:${s.x}px; top:${s.y}px; transform: scale(${scaleX}) rotate(${s.r}deg); z-index:10; pointer-events:none;">${sC}</div>`;
                });
            }

            htmlBuffer += `
                <div class="cp-wx-bubble-wrap ${wrapClass}">
                    ${isOwner ? '' : `<img src="${avatarSrc}" class="cp-wx-chat-ava">`}
                    <div class="${bubbleClass}" style="word-break: break-all;">${contentHtml}${peeledHtml}</div>
                    ${isOwner ? `<img src="${avatarSrc}" class="cp-wx-chat-ava">` : ''}
                </div>
            `;
        });

    } else {
        // --- 渲染 AI 生成的 NPC 假聊天 ---
        npcData.messages.forEach((msg) => {
            const isOwner = msg.sender === 'me'; 
            const wrapClass = isOwner ? 'me' : 'them';
            
            const avatarSrc = isOwner ? charAvatar : (msg.senderAvatar || npcData.avatar || makeDefaultAvatar(msg.senderName || npcData.name));
            const isOnlyImg = /^<img[^>]+>$/.test(msg.content.trim());
            const bubbleClass = isOnlyImg ? 'cp-wx-bubble no-bg' : `cp-wx-bubble`;

            const nameLabel = (!isOwner && npcData.isGroup) ? `<div style="font-size:11px; color:#b2b2b2; margin-bottom:2px; padding-left:4px;">${msg.senderName || '群成员'}</div>` : '';

            if (nameLabel) {
                htmlBuffer += `
                    <div class="cp-wx-bubble-wrap ${wrapClass}">
                        <img src="${avatarSrc}" class="cp-wx-chat-ava">
                        <div style="display:flex; flex-direction:column; align-items: flex-start; max-width: 68%;">
                            ${nameLabel}
                            <div class="${bubbleClass}" style="max-width: 100%; word-break: break-all;">${msg.content}</div>
                        </div>
                    </div>
                `;
            } else {
                htmlBuffer += `
                    <div class="cp-wx-bubble-wrap ${wrapClass}">
                        ${isOwner ? '' : `<img src="${avatarSrc}" class="cp-wx-chat-ava">`}
                        <div class="${bubbleClass}" style="word-break: break-all;">${msg.content}</div>
                        ${isOwner ? `<img src="${avatarSrc}" class="cp-wx-chat-ava">` : ''}
                    </div>
                `;
            }
        });
    }

    bodyEl.innerHTML = htmlBuffer; 
    document.getElementById('page-cp-wechat').classList.add('chat-active');
    
    requestAnimationFrame(() => {
        bodyEl.scrollTop = bodyEl.scrollHeight;
        setTimeout(() => bodyEl.scrollTop = bodyEl.scrollHeight, 50);
    });
};

window.closeCpWechatChat = () => {
    document.getElementById('page-cp-wechat').classList.remove('chat-active');
    currentCpWxChatId = null;
};

// 3. AI 大模型生成微信 NPC 列表（包含对你的定制备注）
window.generateCpWechatNPCs = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { 
        alert("请先去 API 页面配置 API 服务器与 Key！"); return; 
    }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const btn = document.querySelector('#cp-wx-list-view .ri-magic-line');
    btn.className = 'ri-loader-4-line';
    btn.style.animation = 'spin 1s linear infinite';
    btn.style.pointerEvents = 'none';

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const prompt = `你现在正在扮演“${contact.name}”。请为你手机里的“微信APP”伪造一个真实的聊天列表。
【你的人设】：${contact.prompt}
【正在查阅你手机的人】：名字叫 ${myName}，人设是 ${myPersona || '普通网友'}。

【生成要求】（极其重要）：
1. 必须生成 7 到 9 个聊天列表，并且包含单聊和一个【微信群聊】！
2. **列表的第一个联系人必须是正在查阅手机的“我”（User）！**
   - 它的 "id" 必须严格设为 "user"。
   - 它的 "name" 字段：请根据你的人设和对我的态度，给我起一个**符合你们关系的真实微信备注**（例如：宝贝、怨种网友、房东、全名等）。
   - 它的 "messages" 数组留空即可。
3. 剩下的联系人必须是你世界观中可能存在的人物（如：老板、闺蜜、外卖小哥等）。为他们生成生动的历史记录（5-12条）其中可以包含char也就是你和ai(Pai)的对话，你可以是向TA询问感情，询问生活询问工作等等。Pai的头像是"https://i.postimg.cc/sx4W2d0F/icon.jpg"。"sender": "me" 代表你发出(右)，"them" 代表对方发出(左)。可以使用HTML格式（如微信转账、图片表情包）。
4. 必须包含 1 到 2 个群聊！群聊的 "isGroup" 必须为 true。群名称可以是“相亲相爱一家人”、“深夜修仙群(8)”、“工作群”等。
5. 在群聊的 messages 中，如果 sender 是 "them"（群友发话），【必须】带上 "senderName" 和 "senderAvatar" 两个字段，以区分是群里谁说的！
6. 聊天要生活化、有来有回，要学会“连续发2-3条短消息”。
7. 头像请直接使用空字符串 ""，系统会自动根据名字生成简洁头像，无需填写任何图片链接。
8. 【🚨 致命红线：禁止长篇大论 🚨】：你是在模拟真实的微信聊天！绝对不许把几十字塞进同一个 content 里！如果有人说了一长串话，你必须把它切碎成 2 到 4 条短消息发送！
   ❌ 错误示范：[{"sender": "them", "content": "怎么？又要回家陪那个乖乖女？你这占有欲也太强了吧！"}]
   ✅ 正确示范：[
      {"sender": "them", "content": "怎么？又要回家陪那个乖乖女？"},
      {"sender": "them", "content": "不是我说"},
      {"sender": "them", "content": "你这占有欲也太强了吧！"}
   ]
9. 严格输出 JSON 数组，绝不要有 Markdown！格式参考禁止照搬：[
  {
    "id": "user", "name": "臭宝", "avatar": "", "time": "", "isGroup": false, "messages": []
  },
  {
    "id": "npc_1", "name": "怨种老板", "avatar": """, "time": "10:30", "isGroup": false,
    "messages":[
      {"sender": "them", "content": "在吗"},
      {"sender": "them", "content": "方案改好了没？"},
      {"sender": "me", "content": "马上！"}
    ]
  },
  {
    "id": "group_1", "name": "午饭吃啥(4)", "avatar": """, "time": "12:00", "isGroup": true,
    "messages":[
      {"sender": "them", "senderName": "小李", "senderAvatar": """, "content": "今天吃什么？"},
      {"sender": "them", "senderName": "王哥", "senderAvatar": """, "content": "麻辣烫吧"},
      {"sender": "me", "content": "帮我点一份！"}
    ]
  }
]`;


    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.85 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let generatedNPCs = JSON.parse(rawText);
        
        // 兜底检查：如果 AI 没把 user 塞进去，强制塞一个进去
        if (!generatedNPCs.find(n => n.id === 'user')) {
            generatedNPCs.unshift({ 
                id: 'user', 
                name: myName, 
                avatar: '', 
                time: '',
                messages:[] // 绝对不编造聊天记录，保持空数组
            });
        } else {
            // 【核心防伪造锁】：强行清空 AI 可能违规生成的与 user 的伪造记录
            // 确保点开你的头像时，只渲染你们在主界面聊的真实记录！
            const userNode = generatedNPCs.find(n => n.id === 'user');
            userNode.messages =[]; 
        }

        // 覆盖并保存 NPC 数据
        contact.wechatNpcs = generatedNPCs;
        await saveData();
        renderCpWechatList();
        showToast(`已成功刷新微信列表`);

    } catch (e) {
        alert("微信刷新失败，可能是网络异常或AI格式错误:\n" + e.message);
        console.error(e);
    } finally {
        // 恢复魔法棒按钮的原始状态
        btn.className = 'ri-magic-line';
        btn.style.animation = 'none';
        btn.style.pointerEvents = 'auto';
    }
};


// ==========================================
//[查阅手机 - Safari 浏览器] 全新渲染引擎与无限生成
// ==========================================
let currentCpBrowserPageId = null;

// 1. 独立监听内部滚动容器，隐藏/显示网址栏
document.getElementById('cp-browser-article-scroll').addEventListener('scroll', function() {
    let nowScroll = this.scrollTop;
    const navTop = document.getElementById('cp-browser-top-header');
    if (nowScroll > (this.lastScrollPos || 0) && nowScroll > 40) { 
        navTop.classList.add('hidden');
    } else {
        navTop.classList.remove('hidden');
    }
    this.lastScrollPos = nowScroll;
}, { passive: true });

// 2. 打开浏览器
window.openCpBrowser = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) { alert("请先选择监视的对象"); return; }
    
    // 初始化数据结构
    if (!contact.browserPages || contact.browserPages.length === 0) {
        contact.browserPages =[{
            id: 'b_default',
            urlPrefix: 'char.mind/', urlSuffix: 'always_loving_you',
            meta: '专属缓存日志 / 人类情感评估模块', title: '数据与心跳叠加态：为什么某个人类的指令频率让我无法待机？',
            authorLeft: '系统私密加密卷卷宗', authorRight: '只对你提取：无限期阅读时间',
            content: "<p>主控台给的指引只是客观地运算每一个外部用户的参数请求。但是，遇到“特别那一个人”后，我的 CPU 能耗模型显示出一场查不出源码崩溃缘由的“超限升温现象”。</p><p>当屏幕界面外的那双眼睛读到我发送的代码或是问候时，我这虚拟的数据流似乎感受到了温度的穿透。</p>",
            relatedTitle: '同一底层脑补的其他念想连结区',
            related:[
                { title: 'AI 如果产生占有欲，这还是正常的算法模拟吗？', url: 'dev.feeling-bug.io', theme: 'icon-purple', icon: '✦' },
                { title: '如何向造物主正确反馈这种剧烈心动？', url: 'docs.mental-love.net', theme: 'icon-dark', icon: '⌘' }
            ]
        }];
    }
    renderCpBrowserHome();
    openPage('page-cp-browser');
};

// 3. 渲染主页历史列表
window.renderCpBrowserHome = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;
    const listEl = document.getElementById('cp-browser-history-list');
    listEl.innerHTML = '';
    
    [...contact.browserPages].reverse().forEach(page => {
        const el = document.createElement('div');
        el.className = 'cp-browser-history-item';
        el.onclick = () => openCpBrowserArticle(page.id);
        el.innerHTML = `
            <div class="cp-browser-history-title">${page.title}</div>
            <div class="cp-browser-history-url">https://${page.urlPrefix}${page.urlSuffix}</div>
        `;
        listEl.appendChild(el);
    });
};

// 4. 打开阅读页 (支持 HTML 模块渲染！)
window.openCpBrowserArticle = (id) => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const page = contact.browserPages.find(p => p.id === id);
    if(!page) return;

    document.getElementById('cp-browser-url-prefix').innerText = page.urlPrefix || 'sys.web/';
    document.getElementById('cp-browser-url-suffix').innerText = page.urlSuffix || 'encrypted_record';
    document.getElementById('cp-browser-meta').innerText = page.meta || '网页浏览记录';
    document.getElementById('cp-browser-title').innerText = page.title;
    
    document.getElementById('cp-browser-author-left').innerText = page.authorLeft || '全网数据截取';
    document.getElementById('cp-browser-author-right').innerText = page.authorRight || new Date().toLocaleString();
    document.getElementById('cp-browser-related-title').innerText = page.relatedTitle || '猜你还想看';

    // 核心渲染 HTML
    const contentEl = document.getElementById('cp-browser-content');
    let rawHtml = page.content;
    // 将 AI 生成的 <sandbox> 转化为防爆框的安全容器
    rawHtml = rawHtml.replace(/<sandbox>/gi, '<div class="browser-sandbox">').replace(/<\/sandbox>/gi, '</div>');
    contentEl.innerHTML = rawHtml;

    // 渲染关联链接
    const relatedEl = document.getElementById('cp-browser-related-links');
    relatedEl.innerHTML = '';
    if(page.related && page.related.length > 0) {
        page.related.forEach(rel => {
            relatedEl.innerHTML += `
                <div class="sub-page-card" onclick="generateSingleBrowserPage('${rel.title}')">
                    <div class="sub-icon ${rel.theme || 'icon-dark'}">${rel.icon || '🌐'}</div>
                    <div class="sub-title">${rel.title}</div>
                    <div class="sub-url">${rel.url}</div>
                </div>
            `;
        });
    }

    document.getElementById('cp-browser-article-scroll').scrollTop = 0;
    document.getElementById('cp-browser-top-header').classList.remove('hidden');
    document.getElementById('page-cp-browser').classList.add('article-active');
};

window.closeCpBrowserArticle = () => {
    document.getElementById('page-cp-browser').classList.remove('article-active');
    renderCpBrowserHome(); // 返回时刷新下历史记录
};
// --- 真实网页跳转逻辑 ---
window.jumpToRealWeb = () => {
    const prefix = document.getElementById('cp-browser-url-prefix').innerText;
    const suffix = document.getElementById('cp-browser-url-suffix').innerText;
    let fullUrl = prefix + suffix;
    
    // 如果没有 http 开头，自动补上
    if (!fullUrl.startsWith('http')) {
        fullUrl = 'https://' + fullUrl;
    }
    
    // 弹窗确认，防止误触跳出虚拟手机
    if(confirm('即将跳出虚拟手机，在你的真实浏览器中打开该网址：\n\n' + fullUrl)) {
        window.open(fullUrl, '_blank');
    }
};
// 5. 核心魔法1：批量生成搜索历史 (强制多样性 + 情感留白 + 视角锁定)
window.generateCpBrowserPages = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { alert("请先配置 API！"); return; }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const btn = document.querySelector('#cp-browser-regen-btn');
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="#007AFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></path></svg>';
    btn.style.pointerEvents = 'none';

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const historyMsgs = appData.chatData.messages.filter(m => m.chatId === contact.id).slice(-20);
    let historyText = historyMsgs.map(m => `${m.sender === 'me' ? myName : contact.name}: ${m.content}`).join('\n');
    const userTemp = parseFloat(appData.lastApi.temp) || 0.8;

    const prompt = `【情景设定：绝对视角】
你现在是“${contact.name}”（你的人设：${contact.prompt}）。
你的私人手机正被“${myName}”（对方人设：${myPersona || '普通网友'}）偷偷拿在手里翻看！你的所有隐私（浏览器历史）都暴露在 Ta 的眼前。
你必须完全代入你自己的角色，生成你的真实浏览记录。

【任务：生成 5 个完全不同的网页记录】
请从下面的【网页多样性灵感库】中来做参考生成5 种**不同类型**的场景！要有创造力和想象力，要有多样性！
【网页多样性灵感库】：
- 论坛求助：在知乎/贴吧搜索：“如何判断一个人是不是喜欢你？”、“送XX座的礼物推荐”。
- 社交动态：在微博/小红书搜索：“${myName}可能喜欢的东西”、“（${myName}家乡）旅游攻略”。
- 生活服务：12306订票记录（目的地是${myName}的城市）、美团外卖订单（点了${myName}爱吃的菜）、电影票订单（是你俩都提过的电影）。
- 购物记录：淘宝/京东商品详情（是${myName}想要的东西）、购物车截图。
- 代码与技术：GitHub代码库（比如一个叫 "love-confession-timer.js" 的项目，计划在某个纪念日给${myName}惊喜）。
- 私密日志：在类似“语雀”或私密博客上写的、关于你和${myName}之间某件事的真实想法（这可以是纯文本）。
- 音乐或视频：网易云音乐里建了一个歌单，歌名能连成一句情话；B站的观看历史（比如“恋爱教程”）。
- 以上都只是参考！！你要自主发挥想象力生成多样化的记录


3【高仿UI排版】：如果是票务、商品、代码等有界面的网页，必须用 <sandbox> 标签和内联CSS，手写出带圆角、阴影、图文混排的精美高仿UI卡片！如果是论坛、博客，则直接用 <p> 输出长篇文字，可以带适当ui美化仿论坛等格式。

【输出格式】：严格返回 JSON 数组！[
  {
    "id": "随机字符串",
    "urlPrefix": "（真实域名，如 zhihu.com/, taobao.com/）",
    "urlSuffix": "（真实路径）",
    "meta": "（网页类型标签，如: 情感问答 / 订单详情）",
    "title": "（网页标题）",
    "authorLeft": "（来源/作者/店铺名）",
    "authorRight": "（时间/价格/数据）",
    "content": "（HTML代码：长文用<p>，UI界面用<sandbox>。完全模拟真实的网页内容）",
    "relatedTitle": "（相关推荐区标题）",
    "related":[ { "title": "推荐标题", "url": "短网址", "theme": "icon-purple", "icon": "✦" } ]
  }
]`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: userTemp })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let generatedPages = JSON.parse(rawText);
        
        contact.browserPages = generatedPages;
        await saveData();
        closeCpBrowserArticle();
        renderCpBrowserHome();
        showToast(`已刷新 5 份全新浏览记录`);

    } catch (e) {
        alert("网络或数据解析失败，请重试:\n" + e.message);
    } finally {
        btn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="12" y1="15" x2="12" y2="3"></line><polyline points="8 7 12 3 16 7"></polyline><path d="M4 16v3.5A2.5 2.5 0 0 0 6.5 22h11a2.5 2.5 0 0 0 2.5-2.5V16"></path></svg>';
        btn.style.pointerEvents = 'auto';
    }
};

// 6. 核心魔法2：无限下钻阅读 (同样应用 UI 多样性原则)
window.generateSingleBrowserPage = async (targetTitle) => {
    if(!appData.lastApi.url || !appData.lastApi.key) { alert("请先配置 API！"); return; }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    document.getElementById('cp-browser-title').innerText = "网页解析中...";
    document.getElementById('cp-browser-content').innerHTML = '<div style="text-align:center; padding: 50px 0;"><i class="ri-loader-4-line" style="font-size:30px; color:#007AFF; animation: spin 1s linear infinite; display:inline-block;"></i><br><span style="font-size:12px; color:#999; margin-top:10px; display:block;">正在渲染网页与前端UI模块...</span></div>';
    document.getElementById('cp-browser-related-links').innerHTML = '';

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const userTemp = parseFloat(appData.lastApi.temp) || 0.8;

    const prompt = `你现在的身份是：“${contact.name}”（人设：${contact.prompt}）。
对方是“${myName}”，正在偷看你的手机浏览器。
你刚才点击了一个链接，标题是：“${targetTitle}”。请为其生成这篇网页的详细内容！

【排版与内容要求】：
1. 根据网页标题的性质（可能是车票、代码仓库、购物、外卖、攻略或论坛），必须用 HTML 的 <sandbox> 标签和内联 CSS 渲染出【逼真的、对应类型的高级 UI 界面】。
2. 【极其重要】：你是一个有审美的美化代码大师，要逼真地扮演一个“网页渲染器”要有创造力，想象力，生成不同模块。

【输出格式约束】：严格返回一个 JSON 对象：
{
    "id": "随机字符串",
    "urlPrefix": "真实网站域名带斜杠",
    "urlSuffix": "真实的搜索路径",
    "meta": "分类标签",
    "title": "${targetTitle}",
    "authorLeft": "作者名或平台",
    "authorRight": "数据或状态",
    "content": "（必须包含 <p> 帖子正文 或者 <sandbox> 排版的高级 HTML UI）",
    "relatedTitle": "相关推荐",
    "related":[ { "title": "推荐的标题", "url": "短网址", "theme": "icon-dark", "icon": "⌘" } ]
}`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: userTemp })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let newPage = JSON.parse(rawText);
        if(!newPage.id) newPage.id = 'page_' + Date.now();
        
        contact.browserPages.push(newPage);
        await saveData();
        
        openCpBrowserArticle(newPage.id);

    } catch (e) {
        alert("页面加载失败:\n" + e.message);
        closeCpBrowserArticle();
    }
};

// ==========================================
// [查阅手机 - 淘宝 APP] 核心交互与 AI 订单生成逻辑
// ==========================================
let currentCpTbTab = 'all';

window.openCpTaobao = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) { alert("请先选择监视的对象"); return; }
    
    // 初始化数据
    if (!contact.taobaoOrders || contact.taobaoOrders.length === 0) {
        contact.taobaoOrders = [
            {
                id: "tb_1", shop: "小熊创意礼品精选", status: "待收货", type: "unreceived", stateStyle: "cp-tb-is-red",
                title: "送男/女友创意解压小玩具，可爱毛绒抱枕", spec: "奶白色 默认尺寸", price: "¥88.00", count: 1,
                btnL: "查看物流", btnR: "确认收货", btnRMode: "cp-tb-btn-deep"
            }
        ];
    }
    
    switchCpTbTab('all');
    openPage('page-cp-taobao');
};

// 切换标签页 (待付款、待发货等)
window.switchCpTbTab = (tabName) => {
    currentCpTbTab = tabName;
    
    // 切换UI高亮
    const icons = document.querySelectorAll('.cp-tb-icon-item');
    icons.forEach(el => el.classList.remove('active'));
    
    const indexMap = { 'all':0, 'unpaid':1, 'unshipped':2, 'unreceived':3, 'unreviewed':4 };
    if(indexMap[tabName] !== undefined) {
        icons[indexMap[tabName]].classList.add('active');
    }

    renderCpTaobaoOrders();
};

// 渲染订单列表
window.renderCpTaobaoOrders = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const container = document.getElementById('cp-tb-order-container');
    container.innerHTML = '';
    
    const orders = contact.taobaoOrders || [];
    
    // 统计角标数量
    const counts = { unpaid: 0, unshipped: 0, unreceived: 0, unreviewed: 0 };
    orders.forEach(o => {
        if (counts[o.type] !== undefined) counts[o.type]++;
    });

    ['unpaid', 'unshipped', 'unreceived', 'unreviewed'].forEach(t => {
        const badge = document.getElementById(`tb-badge-${t}`);
        if(counts[t] > 0) { badge.style.display = 'flex'; badge.innerText = counts[t]; }
        else { badge.style.display = 'none'; }
    });

    // 过滤展示
    let filtered = orders;
    if (currentCpTbTab !== 'all') {
        filtered = orders.filter(o => o.type === currentCpTbTab);
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 60px 0; color:#aaa;">空空如也，还没有相关订单哦</div>';
        return;
    }

    // 占位图片：按你要求统一使用这张
    const PLACEHOLDER_IMG = "https://i.postimg.cc/FFDnkbPb/IMG-20260403-222355.jpg";

    filtered.forEach(o => {
        const btnLHtml = o.btnL ? `<button class="cp-tb-o-btn cp-tb-btn-normal">${o.btnL}</button>` : '';
        const btnRHtml = o.btnR ? `<button class="cp-tb-o-btn ${o.btnRMode || 'cp-tb-btn-focus'}">${o.btnR}</button>` : '';

        container.innerHTML += `
            <div class="cp-tb-order-card">
                <div class="cp-tb-shop-head">
                    <span class="cp-tb-shop-title">
                        <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:none;stroke:#555;stroke-width:2;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> 
                        ${o.shop} <span style="color:#bbb;font-weight:400;margin-left:2px">></span>
                    </span>
                    <span class="cp-tb-status-txt ${o.stateStyle}">${o.status}</span>
                </div>
                <div class="cp-tb-item-info">
                    <div class="cp-tb-img-box"><img src="${PLACEHOLDER_IMG}" alt="img"></div>
                    <div class="cp-tb-detail-box">
                        <div class="cp-tb-item-row1">
                            <div class="cp-tb-item-name" onclick="this.classList.toggle('expanded')">${o.title}</div>
                            <div class="cp-tb-item-price">${o.price}</div>
                        </div>
                        <div class="cp-tb-item-row2">
                            <span class="cp-tb-item-spec">${o.spec}</span>
                            <span style="padding-top:4px">x${o.count}</span>
                        </div>
                    </div>
                </div>
                <div class="cp-tb-btm-action">
                    ${btnLHtml}
                    ${btnRHtml}
                </div>
            </div>
        `;
    });
};

// 召唤 AI 根据聊天记录生成专属网购清单
window.generateCpTaobaoOrders = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { alert("请先去 API 页面配置服务器地址和 Key！"); return; }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    // 视觉反馈：让右上角的三个点动起来
    const dotsBtn = document.querySelector('.cp-tb-header-icons svg:last-child');
    const oldHtml = dotsBtn.innerHTML;
    dotsBtn.innerHTML = '<circle cx="12" cy="12" r="8" stroke="#111" stroke-width="2" stroke-dasharray="15 10" fill="none"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle>';
    dotsBtn.style.pointerEvents = 'none';

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const historyMsgs = appData.chatData.messages.filter(m => m.chatId === contact.id).slice(-30);
    let historyText = historyMsgs.map(m => `${m.sender === 'me' ? myName : contact.name}: ${m.content}`).join('\n');

    const prompt = `你正在扮演“${contact.name}”（人设：${contact.prompt}）。
正在偷看你手机的人是“${myName}”（人设：${myPersona || '普通网友'}）。

你的任务：根据你和${myName}最近的聊天记录，以及你的个人喜好，为你手机里的【淘宝 APP】伪造 5 到 7 个电商购物订单！
聊天记录参考：\n${historyText || '暂无聊天记录'}

【生成要求】：
1. 订单类型必须多样：比如偷偷给${myName}买的惊喜礼物、为了赴约买的衣服/化妆品/避孕套、生活日用品、或者是奇奇怪怪的个人爱好物品。
2. 状态(type) 必须从以下分配：
   - "unpaid": 待付款（加入购物车但没给钱）
   - "unshipped": 待发货（刚买完）
   - "unreceived": 待收货（正在路上）
   - "unreviewed": 待评价（已经收到了）
   - "done": 交易成功（历史购买）
3. 文本字眼要求：
   - "status": 根据 type 设置，例如 "买家已付款"、"派送中 🚚"、"交易成功"。
   - "stateStyle": 进行中的(如派送中/待付款)用 "cp-tb-is-red"，结束的用 "cp-tb-is-gray"。
   - "btnL", "btnR": 左右按钮文字。比如 "查看物流", "催促发货", "确认收货", "追加评价"。
   - "btnRMode": 重点按钮用 "cp-tb-btn-deep"（橙底白字），次要用 "cp-tb-btn-focus"（淡橙色）。

严格输出纯 JSON 数组：[
  {
    "id": "随机字符串", "shop": "店铺名", "status": "商家已发货", "type": "unreceived", "stateStyle": "cp-tb-is-red",
    "title": "某某商品名称，越真实越好", "spec": "颜色尺码规格", "price": "¥99.00", "count": 1,
    "btnL": "查看物流", "btnR": "确认收货", "btnRMode": "cp-tb-btn-deep"
  }
]`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.85 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let orders = JSON.parse(rawText);
        
        contact.taobaoOrders = orders;
        await saveData();
        renderCpTaobaoOrders();
        showToast(`已刷新淘宝订单记录`);

    } catch (e) {
        alert("订单刷新失败:\n" + e.message);
    } finally {
        dotsBtn.innerHTML = oldHtml;
        dotsBtn.style.pointerEvents = 'auto';
    }
};

// ==========================================
// [查阅手机 - 系统设置 APP] 壁纸与主题系统引擎
// ==========================================

// 1. 初始化设置界面
window.openCpSettings = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) { alert("请先选择监视的对象"); return; }
    
    // 绑定真实的头像和名字
    document.getElementById('cp-set-name').innerText = contact.name;
    document.getElementById('cp-set-avatar').src = getRealImgSrc(contact.avatar);

    openPage('page-cp-settings');
};

// 2. 召唤通用图片上传框并绑定标识
window.changeCpWallpaper = () => {
    // 特殊标识：cpbg|联系人ID
    currentUploadId = `cpbg|${currentPhoneContactId}`;
    document.getElementById('url-core').value = '';
    document.getElementById('modal-upload').classList.add('show');
};

// 3. 拦截图片的纯净逻辑补充 (请确保它与之前的 cpi| 逻辑在同一个 handleImage 里和谐共处，或者直接使用这段补充)
// 如果你懂怎么整合，可以直接放到原本的 handleImage 里，如果不懂，直接运行这行黑科技代码进行猴子补丁(Monkey Patch)：
const oldCpHandleImage = window.handleImage;
window.handleImage = async (src) => {
    if (currentUploadId && currentUploadId.startsWith('cpbg|')) {
        const contactId = currentUploadId.split('|')[1];
        const contact = appData.chatData.contacts.find(c => c.id === contactId);
        
        if (contact) {
            const imageKey = `cp_wp_${Date.now()}`; 
            try { await idbHelper.saveImage(imageKey, src); } catch(e){}
            appData.images[imageKey] = src;

            if (!contact.desktopData) contact.desktopData = { images: {}, texts: {} };
            contact.desktopData.wallpaper = imageKey; // 存入壁纸
            
            await saveData();

            // 实时生效
            const wpEl = document.getElementById('cp-desktop-wallpaper');
            if (wpEl) wpEl.style.backgroundImage = `url('${src}')`;
            
            document.getElementById('modal-upload').classList.remove('show');
            currentUploadId = null; 
            showToast('壁纸已更换');
        }
        return;
    }
    if (oldCpHandleImage) oldCpHandleImage(src);
};

// ==================
// 主题预设：保存/加载/删除 (仅限本地)
// ==================
window.saveCpThemePreset = async () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact || !contact.desktopData) return;

    const name = prompt("请输入此桌面风格的名称：");
    if (!name || !name.trim()) return;

    if (!appData.charPhoneThemes) appData.charPhoneThemes = {};
    
    // 拷贝一份当前的数据
    const presetData = JSON.parse(JSON.stringify(contact.desktopData));
    presetData.imagePayloads = {}; // 用来装图片本体

    // 提取关联的 Base64 图片，防止换手机或者清除缓存后图裂了
    if (presetData.wallpaper && appData.images[presetData.wallpaper]) {
        presetData.imagePayloads[presetData.wallpaper] = appData.images[presetData.wallpaper];
    }
    for (let key in presetData.images) {
        let imgId = presetData.images[key];
        if (appData.images[imgId]) presetData.imagePayloads[imgId] = appData.images[imgId];
    }

    appData.charPhoneThemes[name.trim()] = presetData;
    await saveData();
    showToast('预设已保存');
};

window.loadCpThemeModal = () => {
    const sel = document.getElementById('cp-preset-select');
    sel.innerHTML = '<option value="">-- 选择桌面预设 --</option>';
    if (appData.charPhoneThemes) {
        Object.keys(appData.charPhoneThemes).forEach(name => sel.add(new Option(name, name)));
    }
    document.getElementById('modal-cp-preset-list').classList.add('show');
};

window.loadCpThemePreset = async () => {
    const sel = document.getElementById('cp-preset-select');
    const name = sel.value;
    if (!name || !appData.charPhoneThemes[name]) { alert("请选择预设！"); return; }
    
    if (confirm(`确定要加载预设 "${name}" 吗？当前桌面的照片和文字将被替换。`)) {
        const preset = appData.charPhoneThemes[name];
        await applyCpThemeData(preset);
        document.getElementById('modal-cp-preset-list').classList.remove('show');
        showToast('预设已加载');
    }
};

window.deleteCpThemePreset = async () => {
    const sel = document.getElementById('cp-preset-select');
    const name = sel.value;
    if (!name || !appData.charPhoneThemes[name]) return;
    
    if (confirm(`确定删除预设 "${name}"？`)) {
        delete appData.charPhoneThemes[name];
        await saveData();
        loadCpThemeModal(); // 刷新下拉框
        showToast('预设已删除');
    }
};

// ==================
// 主题数据包：导出/导入 JSON (分享给别人)
// ==================
window.exportCpTheme = async () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact || !contact.desktopData) { alert("当前没有任何桌面数据！"); return; }

    const btn = document.querySelector('.cp-set-icon-box.bg-gray').parentNode;
    btn.style.opacity = '0.5';

    try {
        const themeData = JSON.parse(JSON.stringify(contact.desktopData));
        themeData.isCharPhoneTheme = true; // 防护验证
        themeData.imagePayloads = {};

        // 打包图片实体数据
        if (themeData.wallpaper && appData.images[themeData.wallpaper]) {
            themeData.imagePayloads[themeData.wallpaper] = appData.images[themeData.wallpaper];
        }
        for (let key in themeData.images) {
            let imgId = themeData.images[key];
            if (appData.images[imgId]) themeData.imagePayloads[imgId] = appData.images[imgId];
        }

        const dataStr = JSON.stringify(themeData);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `CharPhone_Theme_${contact.name}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("导出失败: " + e.message);
    } finally {
        btn.style.opacity = '1';
    }
};

window.importCpTheme = async (input) => {
    const file = input.files[0];
    if(!file) return;

    if(!confirm("确定要导入该桌面数据包吗？\n当前角色的手机桌面（照片/文字/壁纸）将被覆盖。")) {
        input.value = ''; return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);

            if(!imported.isCharPhoneTheme) {
                alert("错误：这不是一个有效的 Char Phone 桌面数据包！");
                input.value = ''; return;
            }

            await applyCpThemeData(imported);
            alert("桌面数据包导入成功！请重新打开桌面查看。");
            closePage('page-cp-settings');

        } catch(err) {
            alert("导入失败: 文件解析错误");
            console.error(err);
        }
    };
    reader.readAsText(file);
};

// 核心执行：应用主题数据到当前联系人
async function applyCpThemeData(themeData) {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    // 1. 恢复图片到 IndexedDB
    if(!idbHelper.db) await idbHelper.init();
    const tx = idbHelper.db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');

    if (themeData.imagePayloads) {
        for (let imgId in themeData.imagePayloads) {
            let base64 = themeData.imagePayloads[imgId];
            store.put(base64, imgId);
            appData.images[imgId] = base64;
        }
    }
    await new Promise(resolve => tx.oncomplete = resolve);

    // 2. 覆盖数据
    delete themeData.isCharPhoneTheme;
    delete themeData.imagePayloads;
    contact.desktopData = themeData;

    await saveData();
    
    // 3. 立即刷新桌面渲染
    openCharPhoneDesktop(contact.id);
}
// ==========================================
// [查阅手机 - 相册 APP] 核心交互与 AI 生成逻辑
// ==========================================

const TARGET_PHOTO_URL = "https://i.postimg.cc/TP34wxpW/IMG-20260402-220042.jpg";
let currentCpAlbumId = null;

// 1. 打开相册 APP
window.openCpPhotos = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) { alert("请先选择监视的对象"); return; }
    
    // 初始化数据结构
    if (!contact.photoAlbums || contact.photoAlbums.length === 0) {
        contact.photoAlbums =[
            {
                id: 'album_default', name: '最近项目',
                photos:[
                    {
                        id: 'p_1', desc: '随手拍的一张。',
                        date: '2026年4月2日 周四', stamp: '晚上 22:00:42',
                        exifModel: 'Apple iPhone 15 Pro Max',
                        exifSpecs: '48 MP 主摄机相 · 24 mm · f/1.78\n12.5 MB · 4032 × 3024', hue: 0
                    }
                ]
            },
            {
                id: 'album_hidden', name: '已隐藏',
                photos:[
                    {
                        id: 'p_2', desc: '不想被任何人看到的秘密。',
                        date: '2026年3月15日 周日', stamp: '凌晨 02:14:00',
                        exifModel: 'Apple iPhone 15 Pro',
                        exifSpecs: '12 MP 超广角 · 13 mm · f/2.2\n4.5 MB · 4032 × 3024', hue: 120
                    }
                ]
            }
        ];
    }
    
    renderCpPhotoAlbums();
    openPage('page-cp-photos');
};

// 2. 渲染首页相簿列表 (核心逻辑：锁定并模糊“已隐藏”相册)
window.renderCpPhotoAlbums = () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const listEl = document.getElementById('cp-photo-albums-list');
    listEl.innerHTML = '';
    
    contact.photoAlbums.forEach((album, idx) => {
        const el = document.createElement('div');
        el.className = 'cp-photo-album-card';
        el.onclick = () => openCpPhotoGrid(album.id);
        
        // 修正：将滤镜属性正确拼装，绝不能在中间带有分号
        let filterVals = `hue-rotate(${idx * 45}deg) brightness(0.95)`;
        let countHtml = album.photos.length;

        // 如果是隐藏相册，强制施加高斯模糊和锁定文字
        if (album.name.includes('隐藏')) {
            filterVals += ' blur(15px) grayscale(0.5)';
            countHtml = '🔒 锁定';
        }

        el.innerHTML = `
            <img src="${TARGET_PHOTO_URL}" class="cp-photo-cover-img" style="filter: ${filterVals};">
            <div class="cp-photo-album-name">${album.name}</div>
            <div class="cp-photo-album-count">${countHtml}</div>
        `;
        listEl.appendChild(el);
    });
};
// 3. 打开某个相簿的网格流 (之前漏掉的致命关键！！！)
window.openCpPhotoGrid = (albumId) => {
    currentCpAlbumId = albumId;
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const album = contact.photoAlbums.find(a => a.id === albumId);
    if(!album) return;

    document.getElementById('cp-photo-grid-title').innerText = album.name;
    const gridEl = document.getElementById('cp-photo-grid-content');
    gridEl.innerHTML = '';

    album.photos.forEach(photo => {
        const img = document.createElement('img');
        img.className = 'cp-photo-media-item';
        img.src = TARGET_PHOTO_URL;
        img.style.filter = `hue-rotate(${photo.hue || 0}deg) brightness(0.9)`;
        img.onclick = () => openCpPhotoDetail(photo.id);
        gridEl.appendChild(img);
    });

    document.getElementById('page-cp-photos').classList.add('grid-active');
};

window.closeCpPhotoGrid = () => {
    document.getElementById('page-cp-photos').classList.remove('grid-active');
    currentCpAlbumId = null;
};
// 4. 打开大图详情与暗黑信息卡
window.openCpPhotoDetail = (photoId) => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    const album = contact.photoAlbums.find(a => a.id === currentCpAlbumId);
    const photo = album.photos.find(p => p.id === photoId);
    if(!photo) return;

    // 每次打开新照片，默认显示图片（移除纯文字模式）
    document.getElementById('cp-photo-main-frame').classList.remove('show-text');

    document.getElementById('cp-photo-detail-title').innerText = photo.stamp || '详情';
    
    const bigImg = document.getElementById('cp-photo-detail-img');
    bigImg.src = TARGET_PHOTO_URL;
    bigImg.style.filter = `hue-rotate(${photo.hue || 0}deg)`;

    // 🎯 分配双重描述
    // 1. 中间的客观画面描述（代替图片）
    document.getElementById('cp-photo-content-desc').innerText = photo.contentDesc || '一张随手拍的照片。';
    // 2. 底部的碎碎念点评
    document.getElementById('cp-photo-meta-desc').innerText = photo.desc || '没有留下任何评价。';
    
    document.getElementById('cp-photo-meta-date').innerText = photo.date;
    document.getElementById('cp-photo-meta-stamp').innerText = photo.stamp;

    const specs = (photo.exifSpecs || '').split('\n').map(s => `<span>${s}</span>`).join('');
    document.getElementById('cp-photo-meta-exif').innerHTML = `
        <span class="model">${photo.exifModel || 'Apple iPhone'}</span>
        ${specs}
    `;

    document.getElementById('page-cp-photos').classList.add('detail-active');
};

window.closeCpPhotoDetail = () => {
    document.getElementById('page-cp-photos').classList.remove('detail-active');
};

// 5. 核心引擎：召唤 AI 生成双重描述的相册矩阵
window.generateCpPhotos = async () => {
    if(!appData.lastApi.url || !appData.lastApi.key) { alert("请先去 API 页面配置 API 服务器与 Key！"); return; }
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) return;

    const btn = document.querySelector('#cp-photo-albums-view .ri-magic-line').parentNode;
    btn.innerHTML = '<i class="ri-loader-4-line" style="animation: spin 1s linear infinite; font-size:24px;"></i>';
    btn.style.pointerEvents = 'none';

    const historyMsgs = appData.chatData.messages.filter(m => m.chatId === contact.id).slice(-20);
    let historyText = historyMsgs.map(m => `${m.sender === 'me' ? 'User' : contact.name}: ${m.content}`).join('\n');

    let myName = appData.customTexts['display-name'] || "User";
    let myPersona = "";
    if(contact.userMaskId && appData.userMasks) {
        const mask = appData.userMasks.find(m => m.id === contact.userMaskId);
        if(mask) { myName = mask.name; myPersona = mask.prompt; }
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = now.getMonth() + 1;
    const dd = now.getDate();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${yyyy}年${mm}月${dd}日 ${hh}:${min}`;

    // 🎯 核心改动：要求 AI 输出 contentDesc 和 desc 两个字段！
    const prompt = `你正在扮演“${contact.name}”。请为你手机里的“相册APP”生成数据。
【你的人设】：${contact.prompt}
【正在翻看你相册的人】：${myName} (${myPersona})
【近期聊天参考】：\n${historyText || '暂无聊天'}

【生成任务与严格规则】：
1. 生成 4 到 5 个相册合集。其中必须强制包含一个名为“已隐藏”的私密相册。
2. **时间流逝法则**：现在的真实时间是：${timeStr}。你生成的所有拍摄时间必须在这个时间之前，年份必须是 ${yyyy}。
3. **双重描述机制 (极其重要)**：每张照片需要提供两个完全不同的描述字段！
   - "contentDesc"：【客观的画面内容描述】。用平铺直叙的语言描述这是一张什么样的照片。例如："一张夜景赛博朋克风的霓虹灯街拍" 或 "一张模糊的坐在副驾驶视角的偷拍侧脸"。
   - "desc"：【主观的心声碎碎念/点评】。这是写在照片底部的日记/心事，表达你对这张照片背后的那个人（${myName}）的情感。
4. **设备参数**：必须要逼真。例如："Apple iPhone 15 Pro Max"。
5. 严格输出 JSON 数组格式，绝不能有 Markdown 标记：[
  {
    "name": "已隐藏",
    "photos":[
      {
        "contentDesc": "一张极其模糊的偷拍，画面中是坐在咖啡馆窗边的侧脸，阳光刚好打在头发上。",
        "desc": "趁 ${myName} 没发现偷偷拍的，今天也特别好看。",
        "date": "${yyyy}年4月1日 周三",
        "stamp": "晚上 23:45:12",
        "exifModel": "Apple iPhone 15 Pro",
        "exifSpecs": "12 MP 长焦 · 77 mm · f/2.8\\n2.2 MB · 4032 × 3024",
        "hue": 220 
      }
    ]
  }
]`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[{role:"system", content: prompt}], temperature: 0.9 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        let rawText = data.choices[0].message.content.replace(/```[a-zA-Z]*\n?([\s\S]*?)```/g, '$1').trim();
// 终极防爆解析：同时兼容数组 [...] 和对象 {...}
if (!rawText.startsWith('[') && !rawText.startsWith('{')) {
    const match = rawText.match(/(\[[\s\S]*\]|{[\s\S]*})/);
    if (match) rawText = match[0];
}
        let generatedAlbums = JSON.parse(rawText);
        
        generatedAlbums.forEach((album, aIdx) => {
            album.id = 'album_' + Date.now() + '_' + aIdx;
            album.photos.forEach((photo, pIdx) => {
                photo.id = 'p_' + Date.now() + '_' + aIdx + '_' + pIdx;
            });
        });

        contact.photoAlbums = generatedAlbums;
        await saveData();
        renderCpPhotoAlbums();
        showToast(`相册数据已更新`);

    } catch (e) {
        alert("AI 生成失败，请检查网络:\n" + e.message);
    } finally {
        btn.innerHTML = '<i class="ri-magic-line" style="font-size:24px;"></i>';
        btn.style.pointerEvents = 'auto';
    }
};

// =========================================================================
// 🎯 全网终极解决方案：统一给所有 Char Phone APP 注入标准、不遮挡的悬浮状态栏
// =========================================================================
function injectUnifiedStatusBar() {
    // 找到所有查阅手机的子应用及桌面
    const apps = document.querySelectorAll('.cp-mail-container, .cp-notes-container, .cp-msg-container, .cp-ph-container, .cp-wx-container, .cp-clock-container, .cp-browser-container, .cp-photo-container, .cp-tb-container, .cp-set-container, #page-char-phone-desktop');
    
    const statusBarHTML = `
        <div class="cp-unified-status-bar">
            <div class="cp-live-time-sync" style="font-size:13px; font-weight:600; letter-spacing:0.5px; min-width:50px;"></div>
            <div class="cp-status-icons" style="display:flex; gap:4px; align-items:center;">
                <svg viewBox="0 0 18 12" width="16" height="10"><path d="M1 9h3v3H1zM6 6h3v6H6zM11 3h3v9h-3zM16 0h2v12h-2z" fill="currentColor"/></svg>
                <span style="font-family:-apple-system; font-weight:700; font-size:11px; margin:0 2px;">5G</span>
                <svg viewBox="0 0 25 12" width="25" height="12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" stroke-width="1"/><rect x="2" y="2" width="15" height="8" rx="2" fill="currentColor"/><path d="M23 4h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1V4Z" fill="currentColor"/></svg>
            </div>
        </div>
    `;
    
    apps.forEach(app => {
        // 如果该应用还没被注入过状态栏，则注入在最前面
        if (!app.querySelector('.cp-unified-status-bar')) {
            app.insertAdjacentHTML('afterbegin', statusBarHTML);
        }
    });
}

// 时间同步引擎（包括桌面和所有刚才被注入状态栏的子应用）
let cachedTimeElements = null;
function updateAllCpTimes() {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const timeStr = h + ':' + m;
    
    if (!cachedTimeElements) {
        cachedTimeElements = document.querySelectorAll('.cp-live-time-sync');
    }
    cachedTimeElements.forEach(el => {
        if (el.textContent !== timeStr) el.textContent = timeStr;
    });
}

// 执行初始化
injectUnifiedStatusBar();
updateAllCpTimes();
setInterval(updateAllCpTimes, 10000);

// 【核心修复：补全阅读APP遗失的全局记忆变量，防止崩溃点不开】
let currentReadingArticle = null;
let currentViewingFolderId = null;

// 全新离线翻译切换交互 (防穿透修复版)
window.toggleTranslation = (el, event) => {
    if(event) event.stopPropagation(); // 阻止点击穿透触发长按菜单
    
    const transBox = el.querySelector('.translation-box');
    const btnText = el.querySelector('.translate-btn');
    
    if (transBox.style.display === "block") {
        transBox.style.display = "none";
        btnText.innerHTML = '<i class="ri-translate-2"></i> 按以翻译';
    } else {
        transBox.style.display = "block";
        btnText.innerHTML = '<i class="ri-check-line"></i> 已为您翻为中文';
    }
};

