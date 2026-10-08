// ========== 设置中心：聊天设置 / 世界书 / API配置与预设 ==========
// 职责：openChatSettings / 世界书词条管理 / API测试 / loadAPIPreset / saveAPIPreset


// ==========================================
// 聊天室高级设置页 (Settings Sheet) 核心逻辑 v2.1
// ==========================================

// 1. 打开主设置页
window.openChatSettings = () => {
    if(!currentChatContact) return;
    
    document.getElementById('set-char-name').value = currentChatContact.name || '';
    document.getElementById('set-char-note').value = currentChatContact.note || '';
    document.getElementById('set-char-prompt').value = currentChatContact.prompt || '';
    
    // 强制清理可能残留的暂存，并重新加载真实图片
    document.getElementById('set-char-avatar').removeAttribute('data-base64');
    document.getElementById('set-bg-preview').removeAttribute('data-base64');
    document.getElementById('set-bg-preview').removeAttribute('data-clear');
    
    document.getElementById('set-char-avatar').src = getRealImgSrc(currentChatContact.avatar);
    
    document.getElementById('set-mem-slider').value = currentChatContact.memDepth || 20;
    document.getElementById('set-mem-val').innerText = currentChatContact.memDepth || 20;
    document.getElementById('set-reply-min').value = currentChatContact.minReply || 1;
    document.getElementById('set-reply-max').value = currentChatContact.maxReply || 3;
    
    // 渲染世界书多选下拉框
const wbDropdown = document.getElementById('set-worldbook-dropdown');
wbDropdown.innerHTML = '';
const cats = new Set();
if(appData.world) appData.world.forEach(w => { if(w.cat) cats.add(w.cat); });

let selectedCats = currentChatContact.worldbookCat || [];
if (typeof selectedCats === 'string') selectedCats = selectedCats ?[selectedCats] :[]; // 兼容旧版

cats.forEach(cat => {
    const isChecked = selectedCats.includes(cat) ? 'checked' : '';
    wbDropdown.innerHTML += `
        <label class="cms-option">
            <input type="checkbox" value="${cat}" ${isChecked} onchange="updateWbLabel()"> ${cat}
        </label>`;
});

// 绑定一个更新文本的全局函数
window.updateWbLabel = () => {
    const boxes = document.querySelectorAll('#set-worldbook-dropdown input:checked');
    const label = document.getElementById('set-worldbook-label');
    if(boxes.length === 0) label.innerText = '-- 不关联 --';
    else if(boxes.length === 1) label.innerText = boxes[0].value;
    else label.innerText = `已选 ${boxes.length} 项`;
};
window.updateWbLabel();
    
    const timeTgl = document.getElementById('set-time-tgl');
    if(currentChatContact.timeAwareness) timeTgl.classList.add('on'); else timeTgl.classList.remove('on');

    const translateTgl = document.getElementById('set-translate-tgl');
    if(currentChatContact.autoTranslate) translateTgl.classList.add('on'); else translateTgl.classList.remove('on');

    // 👇 这里是刚刚新增的：读取 HTML 动态模块的开关状态 👇
    const htmlTgl = document.getElementById('set-html-tgl');
    if(currentChatContact.htmlModules) htmlTgl.classList.add('on'); else htmlTgl.classList.remove('on');
    // 👆 新增结束 👆
    
    document.getElementById('set-css-input').value = currentChatContact.customCss || '';
    
    const avSelect = document.getElementById('set-avatar-visibility');
    avSelect.innerHTML = `
        <option value="both">显示双方</option>
        <option value="hide-bot">隐藏对方</option>
        <option value="hide-me">隐藏自己</option>
        <option value="hide-both">隐藏全部</option>
    `;
    avSelect.value = currentChatContact.avatarVisibility || 'both';
    
    const bgTgl = document.getElementById('set-bg-tgl');
    const bgImgId = 'chat_bg_' + currentChatContact.id;
    document.getElementById('set-bg-preview').src = appData.images[bgImgId] || '';
    if (appData.images[bgImgId]) bgTgl.classList.add('on'); else bgTgl.classList.remove('on');
    
    updatePreviews();
    document.getElementById('at-settings').classList.add('open');
};

// 2. 独立的总结页面控制 (多区块版)
window.openSummaryPage = () => {
    if(!currentChatContact) return;
    
    // 初始化数据结构
    if(!currentChatContact.memoryBlocks) currentChatContact.memoryBlocks =[];
    if(currentChatContact.lastSummaryIndex === undefined) currentChatContact.lastSummaryIndex = 0;

    const sumTgl = document.getElementById('set-sum-tgl-page');
    if(currentChatContact.autoSummary !== false) sumTgl.classList.add('on'); else sumTgl.classList.remove('on');
    document.getElementById('set-sum-interval-page').value = currentChatContact.sumInterval || 30;
    document.getElementById('set-sum-prompt-page').value = currentChatContact.sumPrompt || '';
    
    // 渲染总条数提示，方便用户填写区间
    const totalMsgs = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id).length;
    document.getElementById('manual-sum-end').placeholder = totalMsgs;
    
    renderMemoryBlocks(); // 渲染多个记忆框
    document.getElementById('page-summary').classList.add('open');
};

window.closeSummaryPage = () => {
    currentChatContact.autoSummary = document.getElementById('set-sum-tgl-page').classList.contains('on');
    currentChatContact.sumInterval = parseInt(document.getElementById('set-sum-interval-page').value) || 30;
    currentChatContact.sumPrompt = document.getElementById('set-sum-prompt-page').value;
    
    // 保存所有记忆框的内容
    const textareas = document.querySelectorAll('.mem-block-textarea');
    currentChatContact.memoryBlocks = Array.from(textareas).map(ta => ta.value.trim()).filter(v => v);
    
    document.getElementById('page-summary').classList.remove('open');
};

window.renderMemoryBlocks = () => {
    const container = document.getElementById('memory-blocks-container');
    container.innerHTML = '';
    
    if(!currentChatContact.memoryBlocks || currentChatContact.memoryBlocks.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#999; font-size:12px; padding:20px;">暂无记忆区块，快去提取或等待自动总结吧。</div>';
        return;
    }

    currentChatContact.memoryBlocks.forEach((block, idx) => {
        container.innerHTML += `
            <div style="position:relative; background:#fff; border-radius:12px; padding:10px; border:1px solid #eee;">
                <div style="font-size:10px; color:#aaa; margin-bottom:6px; font-weight:bold;">记忆区块[${idx + 1}]</div>
                <textarea class="textarea-bare mem-block-textarea" rows="4" style="background:#F8F8F8;">${block}</textarea>
            </div>
        `;
    });
};

// 3. 保存所有设置
window.saveChatSettings = async () => {
    if(!currentChatContact) return;

    currentChatContact.name = document.getElementById('set-char-name').value.trim();
    currentChatContact.note = document.getElementById('set-char-note').value.trim();
    currentChatContact.prompt = document.getElementById('set-char-prompt').value.trim();
    const wbBoxes = document.querySelectorAll('#set-worldbook-dropdown input:checked');
currentChatContact.worldbookCat = Array.from(wbBoxes).map(b => b.value);
    currentChatContact.timeAwareness = document.getElementById('set-time-tgl').classList.contains('on');
    currentChatContact.autoTranslate = document.getElementById('set-translate-tgl').classList.contains('on');
    
    // 👇 这里是刚刚新增的：保存 HTML 动态模块的开关状态 👇
    currentChatContact.htmlModules = document.getElementById('set-html-tgl').classList.contains('on');
    // 👆 新增结束 👆

    currentChatContact.memDepth = document.getElementById('set-mem-slider').value;
    currentChatContact.minReply = document.getElementById('set-reply-min').value;
    currentChatContact.maxReply = document.getElementById('set-reply-max').value;
    currentChatContact.customCss = document.getElementById('set-css-input').value.trim();
    currentChatContact.avatarVisibility = document.getElementById('set-avatar-visibility').value;
    
    // --- 修复：头像实时保存 ---
    const newAvaBase64 = document.getElementById('set-char-avatar').getAttribute('data-base64');
    if(newAvaBase64) {
        const key = 'avatar_' + currentChatContact.id;
        try { await idbHelper.saveImage(key, newAvaBase64); } catch(e){}
        appData.images[key] = newAvaBase64;
        currentChatContact.avatar = key;
        document.getElementById('set-char-avatar').removeAttribute('data-base64');
    }

    // --- 修复：背景清除与保存逻辑 ---
    const bgKey = 'chat_bg_' + currentChatContact.id;
    if(document.getElementById('set-bg-preview').getAttribute('data-clear') === 'true') {
        // 执行清除背景
        delete appData.images[bgKey];
        try { idbHelper.db.transaction('images', 'readwrite').objectStore('images').delete(bgKey); } catch(e){}
        currentChatContact.showBg = false;
        document.getElementById('set-bg-preview').removeAttribute('data-clear');
    } else {
        // 执行保存新背景
        const newBgBase64 = document.getElementById('set-bg-preview').getAttribute('data-base64');
        if(newBgBase64) {
            try { await idbHelper.saveImage(bgKey, newBgBase64); } catch(e){}
            appData.images[bgKey] = newBgBase64;
            document.getElementById('set-bg-preview').removeAttribute('data-base64');
        }
        currentChatContact.showBg = !!appData.images[bgKey];
    }

    await saveData();
    
    // 更新外部界面（优先显示备注）
    document.getElementById('at-room-name').innerText = currentChatContact.note || currentChatContact.name;
    renderInsContacts(); 
    applyChatRoomVisuals();

    document.getElementById('at-settings').classList.remove('open');
    showToast();
};

// 4. 预览与上传交互
function updatePreviews() {
    const tempAva = document.getElementById('set-char-avatar').getAttribute('data-base64');
    document.getElementById('mock-bot-avatar').src = tempAva || getRealImgSrc(currentChatContact.avatar);
    
    // === 新增：精准计算“我方”头像的优先级 ===
    let myAvatarSrc = appData.images['user-avatar']; // 兜底：最低优先级，全局主页头像
    
    // 获取当前界面上的状态（包括还没保存的修改）
    const overrideEl = document.getElementById('set-my-avatar-override');
    const tempOverride = overrideEl.getAttribute('data-base64');
    const isCleared = overrideEl.getAttribute('data-clear') === 'true';
    const selectedMaskId = document.getElementById('set-my-mask').value;

    if (tempOverride) {
        // 优先级 1：刚刚上传还没点击保存的“房间专属头像”
        myAvatarSrc = tempOverride;
    } else if (!isCleared && currentChatContact && currentChatContact.userAvatarOverride) {
        // 优先级 2：之前已经保存过的“房间专属头像”
        myAvatarSrc = currentChatContact.userAvatarOverride;
    } else if (selectedMaskId && appData.userMasks) {
        // 优先级 3：当前下拉框选中的“人设面具头像”
        const mask = appData.userMasks.find(m => m.id === selectedMaskId);
        if (mask && mask.avatar) {
            myAvatarSrc = mask.avatar;
        }
    }
    
    // 渲染到预览气泡上
    document.getElementById('mock-me-avatar').src = getRealImgSrc(myAvatarSrc);
    // =======================================

    togglePrevBg(document.getElementById('set-bg-tgl'), true); 
    applyCssPreview();
    applyAvatarVisibilityPreview();
}

window.previewSetAvatar = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const src = e.target.result;
            document.getElementById('set-char-avatar').src = src; // 修复：立即显示在设置大图标上
            document.getElementById('set-char-avatar').setAttribute('data-base64', src);
            updatePreviews(); // 立即同步到预览气泡头像
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.previewSetBg = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('set-bg-preview').src = e.target.result;
            document.getElementById('set-bg-preview').setAttribute('data-base64', e.target.result);
            document.getElementById('set-bg-preview').removeAttribute('data-clear'); // 取消清除标记
            const tgl = document.getElementById('set-bg-tgl');
            if(!tgl.classList.contains('on')) tgl.classList.add('on');
            updatePreviews();
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// 新增：清除背景图按钮逻辑
window.clearChatBg = () => {
    document.getElementById('set-bg-preview').src = '';
    document.getElementById('set-bg-preview').removeAttribute('data-base64');
    document.getElementById('set-bg-preview').setAttribute('data-clear', 'true'); // 打上清除标记，保存时生效
    const tgl = document.getElementById('set-bg-tgl');
    tgl.classList.remove('on');
    updatePreviews();
};

window.togglePrevBg = (btn, skipToggle = false) => {
    if(!skipToggle) btn.classList.toggle('on');
    const img = document.getElementById('set-bg-preview');
    img.style.display = btn.classList.contains('on') ? 'block' : 'none';
};

window.applyCssPreview = () => {
    const cssText = document.getElementById('set-css-input').value;
    // 使用带 ID 的高权重选择器，强制覆盖默认的蓝白色！
    document.getElementById('set-bubble-style').innerHTML = `
        #preview-stage-bg .mock-msg .mock-bubble { 
            ${cssText} 
        }
    `;
};

window.applyAvatarVisibilityPreview = () => {
    const vis = document.getElementById('set-avatar-visibility').value;
    
    // 修复：只隐藏 mock-avatar 头像，保留文本气泡
    document.getElementById('mock-bot-avatar').style.display = (vis === 'hide-bot' || vis === 'hide-both') ? 'none' : 'block';
    document.getElementById('mock-me-avatar').style.display = (vis === 'hide-me' || vis === 'hide-both') ? 'none' : 'block';
};

// 5. 应用视觉到真实聊天室
window.applyChatRoomVisuals = () => {
    if(!currentChatContact) return;
    let styleTag = document.getElementById('chat-custom-visuals');
    if(!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'chat-custom-visuals';
        document.head.appendChild(styleTag);
    }
    
    let css = '';
    const bgUrl = getRealImgSrc('chat_bg_' + currentChatContact.id);
    if(currentChatContact.showBg && bgUrl && !bgUrl.includes('placehold.co')) {
        css += `#at-body { background-image: url('${bgUrl}'); background-size: cover; background-position: center; background-attachment: fixed; }`;
    } else {
        css += `#at-body { background-image: none; }`;
    }
    
    // 修复：使用带 ID 的高权重选择器应用真实聊天室气泡样式
    if(currentChatContact.customCss) {
        css += `#at-body .at-msg .msg-core { ${currentChatContact.customCss} }`;
    }
    
    const vis = currentChatContact.avatarVisibility;
    if(vis === 'hide-bot') css += `.m-bot .avatar { display:none !important; } .m-bot .time { left:0 !important; }`;
    if(vis === 'hide-me') css += `.m-me .avatar { display:none !important; }`;
    if(vis === 'hide-both') css += `.at-msg .avatar { display:none !important; } .m-bot .time { left:0 !important; }`;
    
    styleTag.innerHTML = css;
};

const originalOpenChatRoom = window.openChatRoom;
window.openChatRoom = (contactId) => {
    originalOpenChatRoom(contactId);
    applyChatRoomVisuals(); 
};

// 6. 数据及危险区操作
window.clearChatHistory = () => {
    if(confirm('确定要清空与该角色的所有聊天记录吗？清空后不可恢复！')) {
        appData.chatData.messages = appData.chatData.messages.filter(m => m.chatId !== currentChatContact.id);
        saveData();
        document.getElementById('at-body').innerHTML = `<div class="time-divider">Chat history cleared</div>`;
        alert('聊天记录已清空。');
    }
};
window.exportChatHistory = () => {
    const history = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id);
    if(history.length === 0) { alert('没有可以导出的记录。'); return; }
    let text = `【与 ${currentChatContact.name} 的聊天记录】\n\n`;
    history.forEach(m => {
        const time = new Date(m.timestamp).toLocaleString();
        const role = m.sender === 'me' ? (appData.customTexts['display-name'] || 'User') : currentChatContact.name;
        
        let displayContent = m.content.replace(/<[^>]+>/g, ''); // 去除HTML标签
        if (m.sticker) displayContent += ` [表情包: ${m.sticker.desc}]`;
        if (m.chatImage) displayContent += ` [发送了一张图片]`;
        if (m.content.includes('<redpacket')) displayContent += ` [微信红包]`;
        if (m.content.includes('<transfer')) displayContent += ` [微信转账]`;
        if (m.content.includes('<vphoto>')) displayContent += ` [虚拟照片]`;
        if (!displayContent.trim()) displayContent = "[特殊消息]";

        text += `[${time}] ${role}：\n${displayContent}\n\n`;
    });
    const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChatHistory_${currentChatContact.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
};
window.importChatHistory = (input) => {
    if(!input.files[0]) return;
    alert("导入功能正在开发中！");
    input.value = '';
};
window.deleteContactFromSettings = () => {
    if(confirm('警告：此操作将彻底删除该角色及所有聊天记录，确定吗？')) {
        const id = currentChatContact.id;
        appData.chatData.contacts = appData.chatData.contacts.filter(c => c.id !== id);
        appData.chatData.messages = appData.chatData.messages.filter(m => m.chatId !== id);
        saveData();
        document.getElementById('at-settings').classList.remove('open');
        closePage('page-chat-room');
        renderInsContacts();
        alert('角色已删除。');
    }
};

// 手动区间提取总结
window.triggerManualRangeSummary = async (btn) => {
    if(!appData.lastApi.url || !appData.lastApi.key) { alert("请先去 API 页面配置服务器地址和 Key！"); return; }
    
    const history = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id);
    let startIdx = parseInt(document.getElementById('manual-sum-start').value) || 1;
    let endIdx = parseInt(document.getElementById('manual-sum-end').value) || history.length;
    
    // 数据校验
    if(startIdx < 1) startIdx = 1;
    if(endIdx > history.length) endIdx = history.length;
    if(startIdx > endIdx) { alert("起始条数不能大于结束条数！"); return; }
    
    const targetMsgs = history.slice(startIdx - 1, endIdx);
    if(targetMsgs.length < 2) { alert("选中的消息太少，无法总结。"); return; }

    btn.innerText = '正在提取...';
    btn.disabled = true;

    const defaultPrompt = `As ${currentChatContact.name}, reflect on these past conversations with the user. Summarize briefly in the first person using bullet points:\n- Key events.\n- Information you learned about the user.`;
    const sumPrompt = document.getElementById('set-sum-prompt-page').value.trim() || defaultPrompt;
    
    let historyText = "";
    targetMsgs.forEach(m => historyText += `${m.sender === 'me' ? (appData.customTexts['display-name'] || 'User') : currentChatContact.name}: ${m.content}\n`);
    
    try {
        const model = appData.lastApi.model || (appData.cachedModels.length > 0 ? appData.cachedModels[0] : "gpt-3.5-turbo");
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[ {role:"system", content: sumPrompt}, {role:"user", content: historyText} ], temperature: 0.3 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        const summary = data.choices[0].message.content;
        
        // 存入新的区块
        if(!currentChatContact.memoryBlocks) currentChatContact.memoryBlocks = [];
        currentChatContact.memoryBlocks.push(`[区间 ${startIdx}-${endIdx}] ` + summary);
        
        await saveData();
        renderMemoryBlocks(); // 刷新 UI
        document.getElementById('manual-sum-start').value = '';
        document.getElementById('manual-sum-end').value = '';
        alert("记忆提取成功，已生成新区块！");
    } catch (e) {
        alert("提取失败: " + e.message);
    } finally {
        btn.innerText = '生成新记忆区块';
        btn.disabled = false;
    }
};

// 压缩精炼现有所有记忆框
window.refineMemoryBlocks = async (btn) => {
    if(!currentChatContact.memoryBlocks || currentChatContact.memoryBlocks.length <= 1) {
        alert("至少需要 2 个以上的记忆区块才需要精炼！"); return;
    }
    
    if(!confirm("确定要将当前的多个记忆区块精炼合并为一个终极记忆吗？")) return;

    btn.innerHTML = '精炼中...';
    btn.style.pointerEvents = 'none';

    let allMemories = currentChatContact.memoryBlocks.join('\n\n--- 下一个记忆片段 ---\n\n');
    let prompt = `你现在需要作为 ${currentChatContact.name}，整理你脑海中的这些记忆片段。请去除重复的废话，提炼出最核心的、不冲突的重点信息，融合成一段连贯的第一人称终极记忆（使用要点列表）。`;

    try {
        const model = appData.lastApi.model || "gpt-3.5-turbo";
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({ model, messages:[ {role:"system", content: prompt}, {role:"user", content: allMemories} ], temperature: 0.2 })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error.message);
        
        // 清空旧区块，填入精炼后的唯一新区块
        currentChatContact.memoryBlocks = [data.choices[0].message.content];
        await saveData();
        renderMemoryBlocks();
        alert("记忆精炼完成！");
    } catch (e) {
        alert("精炼失败: " + e.message);
    } finally {
        btn.innerHTML = '<i class="ri-magic-line"></i> 压缩精炼';
        btn.style.pointerEvents = 'auto';
    }
};

// ==========================================
// 8. 全新纯净版：对话发送与大模型调用系统
// (彻底废弃极易冲突的 fetch 拦截器)
// ==========================================



// 纯粹地将用户文本挂载到聊天流并存库
// 修改后的代码
// ⚠️ 【非常重要】拦截并修改发消息逻辑，让存入的数据带上 quote！
// 请用这段代码 覆盖 掉你原来的 sendOnlyUserMsg 函数：
window.sendOnlyUserMsg = async () => {
    const inp = document.getElementById('inp-txt');
    const text = inp.value.trim();
    if(!text) return false;

    document.getElementById('emoji-picker').classList.remove('show');
    inp.value = '';

    // 处理引用内容
    let quoteTextToSave = null;
    if(currentQuoteMsg) {
        const author = currentQuoteMsg.sender === 'me' ? (appData.customTexts['display-name'] || '我') : currentChatContact.name;
        quoteTextToSave = `${author}: ${currentQuoteMsg.content}`;
    }

    const now = Date.now();
    // 把 quoteTextToSave 存进数据库
    const myMsg = { id: 'm_'+now, chatId: currentChatContact.id, sender: 'me', content: text, timestamp: now, quote: quoteTextToSave };
    appData.chatData.messages.push(myMsg);
    saveData();

    // 显示在界面上
    appendMsgToUI(myMsg.id, 'me', text, now, quoteTextToSave);
    
    // 发送完清空引用状态
    cancelQuote();

    const bdy = document.getElementById('at-body');
    setTimeout(() => bdy.scrollTop = bdy.scrollHeight, 50);
    return true;
};

// --- 编辑功能 ---
window.editTargetMsg = () => {
    if(!currentActionMsgId) return;
    const msgData = appData.chatData.messages.find(m => m.id === currentActionMsgId);
    if(msgData) {
        let textToEdit = msgData.content;
        // 还原表情包时，直接使用中文描述，直观好改！
        if (msgData.sticker && msgData.sticker.desc) {
            textToEdit = textToEdit + (textToEdit ? ' ' : '') + `[表情:${msgData.sticker.desc}]`;
        }
        document.getElementById('edit-msg-input').value = textToEdit;
        document.getElementById('modal-msg-edit').classList.add('show');
    }
    closeMsgActionModal();
};


// 点击右下角发送键时执行：发字(如果有) -> 召唤AI
window.sendAtelierMsg = async () => {
    await sendOnlyUserMsg(); // 如果输入框有字，先发出去
    triggerAtelierAI();      // 强制呼叫 AI 响应
};
// ==================== 面具系统逻辑 ====================
let currentEditingMaskId = null;

// 渲染面具列表 (个人主页)
window.renderUserMasks = () => {
    const list = document.getElementById('ins-mask-list');
    if(!list) return;
    list.innerHTML = '';
    
    appData.userMasks.forEach(m => {
        const div = document.createElement('div');
        div.className = 'mask-item';
        div.onclick = () => openMaskEditor(m.id);
        div.innerHTML = `<img src="${getRealImgSrc(m.avatar)}"><span>${m.name}</span>`;
        list.appendChild(div);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'mask-item';
    addBtn.onclick = () => openMaskEditor(null);
    addBtn.innerHTML = `<div class="mask-add-btn"><i class="ri-add-line"></i></div><span>New Mask</span>`;
    list.appendChild(addBtn);
};

    window.openMaskEditor = (id) => {
        currentEditingMaskId = id;
        const delBtn = document.getElementById('mask-delete-btn');
        if(id) {
            const mask = appData.userMasks.find(m => m.id === id);
            document.getElementById('mask-modal-title').innerText = 'Edit Mask';
            document.getElementById('ins-mask-name').value = mask.name || '';
            document.getElementById('ins-mask-note').value = mask.note || '';
            document.getElementById('ins-mask-prompt').value = mask.prompt || '';
            document.getElementById('ins-mask-preview').src = getRealImgSrc(mask.avatar);
            delBtn.style.display = 'block';
        } else {
            document.getElementById('mask-modal-title').innerText = 'New Mask';
            document.getElementById('ins-mask-name').value = '';
            document.getElementById('ins-mask-note').value = '';
            document.getElementById('ins-mask-prompt').value = '';
            document.getElementById('ins-mask-preview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f2f2f7' rx='20' ry='20'/%3E%3Cpath d='M75 45V105M45 75H105' stroke='%23ccc' stroke-width='5' stroke-linecap='round'/%3E%3C/svg%3E";
            delBtn.style.display = 'none';
        }
        document.getElementById('ins-mask-preview').removeAttribute('data-base64');
        document.getElementById('modal-ins-mask').classList.add('show');
    };

window.saveUserMask = async () => {
    const name = document.getElementById('ins-mask-name').value.trim();
    if(!name) { alert("Please enter a name."); return; }

    let mask = currentEditingMaskId ? appData.userMasks.find(m => m.id === currentEditingMaskId) : {};
    if(!currentEditingMaskId) {
        mask.id = 'mask_' + Date.now();
        appData.userMasks.push(mask);
    }
    mask.name = name;
    mask.note = document.getElementById('ins-mask-note').value.trim();
    mask.prompt = document.getElementById('ins-mask-prompt').value.trim();

    const base64 = document.getElementById('ins-mask-preview').getAttribute('data-base64');
    if(base64) {
        const key = mask.id + '_avatar';
        try { await idbHelper.saveImage(key, base64); } catch(e){}
        appData.images[key] = base64;
        mask.avatar = key;
    } else if (!mask.avatar) {
        mask.avatar = makeDefaultAvatar(name); // 本地生成简洁头像
    }

    await saveData();
    closeInsModal('modal-ins-mask');
    renderUserMasks();
    showToast();
};

window.deleteUserMask = async () => {
    if(confirm('确定删除此面具吗？绑定了此面具的聊天室将恢复默认身份。')) {
        appData.userMasks = appData.userMasks.filter(m => m.id !== currentEditingMaskId);
        await saveData();
        closeInsModal('modal-ins-mask');
        renderUserMasks();
        showToast();
    }
};

// 确保切换到“我”页面时渲染面具
const originalRenderInsProfile = window.renderInsProfile;
window.renderInsProfile = () => {
    originalRenderInsProfile();
    renderUserMasks();
};

// ==================== 覆盖聊天设置里的加载和保存逻辑 ====================
// 拦截原有的 openChatSettings 和 saveChatSettings 追加面具功能
const oldOpenChatSettings = window.openChatSettings;
window.openChatSettings = () => {
    oldOpenChatSettings(); // 调用之前的UI加载
    
    // 加载面具下拉框
    const maskSelect = document.getElementById('set-my-mask');
    maskSelect.innerHTML = '<option value="">-- 默认身份 (无面具) --</option>';
    if(appData.userMasks) {
        appData.userMasks.forEach(m => maskSelect.add(new Option(m.name, m.id)));
    }
    maskSelect.value = currentChatContact.userMaskId || '';

    // 加载专属头像覆盖
    const overrideAva = document.getElementById('set-my-avatar-override');
    overrideAva.src = getRealImgSrc(currentChatContact.userAvatarOverride || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23ccc' text-anchor='middle' dy='.3em'%3E无%3C/text%3E%3C/svg%3E");
    overrideAva.removeAttribute('data-base64');
    overrideAva.removeAttribute('data-clear');
};

const oldSaveChatSettings = window.saveChatSettings;
window.saveChatSettings = async () => {
    currentChatContact.userMaskId = document.getElementById('set-my-mask').value;
    
    // 处理头像覆盖
    const overrideEl = document.getElementById('set-my-avatar-override');
    const overrideKey = 'chat_my_ava_' + currentChatContact.id;
    if(overrideEl.getAttribute('data-clear') === 'true') {
        currentChatContact.userAvatarOverride = null;
    } else {
        const base64 = overrideEl.getAttribute('data-base64');
        if(base64) {
            try { await idbHelper.saveImage(overrideKey, base64); } catch(e){}
            appData.images[overrideKey] = base64;
            currentChatContact.userAvatarOverride = overrideKey;
        }
    }
    
    oldSaveChatSettings(); // 继续保存其它数据
};

window.previewSetMyAvatarOverride = (input) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('set-my-avatar-override');
            img.src = e.target.result;
            img.setAttribute('data-base64', e.target.result);
            img.removeAttribute('data-clear');
            updatePreviews(); // <--- 新增：上传覆盖头像后立刻刷新预览
        };
        reader.readAsDataURL(input.files[0]);
    }
};

window.clearMyAvatarOverride = () => {
    const img = document.getElementById('set-my-avatar-override');
    img.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23ccc' text-anchor='middle' dy='.3em'%3E无%3C/text%3E%3C/svg%3E";
    img.removeAttribute('data-base64');
    img.setAttribute('data-clear', 'true');
    updatePreviews(); // <--- 新增：点击清除后立刻刷新预览，它会自动回退到面具头像或全局头像
};

// === 新增工具函数：智能长句分割 (防爆格式保护版) ===
function smartSplitText(text, maxLen = 30) {
    // 1. 建立保护罩：先把所有特殊的 HTML 标签找出来，替换成无标点的占位符
    const protectedTags = [];
    // 匹配 voice, file, location, redpacket, transfer, vphoto, t, post 标签
    const tagRegex = /<(voice|file|location|redpacket|transfer|vphoto|t|post)\b[^>]*>[\s\S]*?<\/\1>/gi;
    
    let safeText = text.replace(tagRegex, (match) => {
        protectedTags.push(match);
        return `__PTAG_${protectedTags.length - 1}__`;
    });

    // 2. 对安全文本进行切割
    let blocks = safeText.split(/\|\|\||\n+/).map(t => t.trim()).filter(t => t);
    let finalParts = [];

    blocks.forEach(block => {
        // 如果包含受保护的模块，或者长度本来就很短，直接保留防切割
        if (block.includes('__SBOX_') || block.includes('__PTAG_') || block.length < maxLen) {
            finalParts.push(block);
        } else {
            // 兜底机制：按中文标点切碎
            let subParts = block.split(/([。！？…~]+)/);
            let buffer = "";
            
            for (let i = 0; i < subParts.length; i++) {
                let part = subParts[i];
                buffer += part;
                // 只要遇到句号/问号/叹号，且当前句子长度超过 8 个字，立刻切断成新气泡
                if (/^[。！？…~]+$/.test(part) && buffer.length >= 8) { 
                    finalParts.push(buffer.trim());
                    buffer = "";
                }
            }
            if (buffer.trim()) finalParts.push(buffer.trim());
        }
    });

    // 3. 卸下保护罩：把之前藏起来的完整标签还原回去
    return finalParts.map(part => {
        return part.replace(/__PTAG_(\d+)__/g, (match, idx) => protectedTags[idx]);
    });
}

// 独立纯净的 AI 请求引擎：极致活人感 + 强制多气泡切割 + 唯一消息ID + AI自主引用/撤回 + 潜意识自动读心

// ========== 世界书管理 ==========

// ==========================================
    // 世界书 (WorldBook) 核心逻辑 (分类打通版)
    // ==========================================
    let currentWbIndex = null;
    let currentWbFilter = 'All'; // 当前选中的小药丸分类

    // 渲染世界书列表 & 小药丸
    window.renderWbList = () => {
        const list = document.getElementById('ko-index-list');
        const filterBar = document.getElementById('ko-wb-filters');
        list.innerHTML = '';
        
        // 1. 动态提取所有已有的分类
        const cats = new Set(['General']);
        if(appData.world) {
            appData.world.forEach(w => {
                if(w.cat) cats.add(w.cat);
            });
        }
        
        // 2. 渲染顶部的小药丸 (Filter Pills)
        filterBar.innerHTML = '';
        const allPill = document.createElement('div');
        allPill.className = `ko-filter-pill ${currentWbFilter === 'All' ? 'active' : ''}`;
        allPill.innerText = 'All';
        allPill.onclick = () => { currentWbFilter = 'All'; renderWbList(); };
        filterBar.appendChild(allPill);

        cats.forEach(cat => {
            const pill = document.createElement('div');
            pill.className = `ko-filter-pill ${currentWbFilter === cat ? 'active' : ''}`;
            pill.innerText = cat;
            pill.onclick = () => { currentWbFilter = cat; renderWbList(); };
            filterBar.appendChild(pill);
        });

        if(!appData.world || appData.world.length === 0) {
            list.innerHTML = '<div style="text-align:center; color:#ccc; margin-top:60px; font-size:14px;">Archive is empty. Tap ADD ENTRY to start.</div>';
            return;
        }

        // 3. 渲染下方的词条列表 (根据小药丸过滤)
        let hasVisibleItems = false;

        appData.world.forEach((item, idx) => {
            const itemCat = item.cat || 'General';
            // 如果当前不在 'All' 分类下，且当前条目分类不匹配，则跳过
            if(currentWbFilter !== 'All' && itemCat !== currentWbFilter) return;

            hasVisibleItems = true;
            const article = document.createElement('article');
            article.className = 'ko-item';
            article.onclick = () => openWbEditor(idx);

            // 修改点：如果没有关键词，显示优雅的 "Global Context" (全局生效)
            let metaText = item.keys || 'Global Context';
            if(metaText.length > 30) metaText = metaText.substring(0, 30) + '...';

            article.innerHTML = `
                <div class="ko-item-top">
                    <span class="ko-cat-tag">${itemCat}</span>
                    <i class="ri-more-line" style="color:#d0d0d0"></i>
                </div>
                <div class="ko-item-title">${item.title}</div>
                <div class="ko-item-meta" style="${!item.keys ? 'color:#007AFF; font-weight:500;' : ''}">${metaText}</div>
            `;
            list.appendChild(article);
        });

        if (!hasVisibleItems) {
            list.innerHTML = '<div style="text-align:center; color:#ccc; margin-top:60px; font-size:14px;">No entries in this category.</div>';
        }
    };

    // 打开词条编辑器
    window.openWbEditor = (idx = null) => {
        currentWbIndex = idx;
        const editorPage = document.getElementById('ko-editor-page');
        const delBtn = document.getElementById('ko-wb-delete-btn');
        const catSelect = document.getElementById('ko-wb-cat');

        // 动态填充下拉框，去除写死的选项
        const cats = new Set(['General']);
        if(appData.world) appData.world.forEach(w => { if(w.cat) cats.add(w.cat); });
        
        catSelect.innerHTML = '';
        cats.forEach(cat => catSelect.add(new Option(cat, cat)));
        // 增加一个新建分类的专属按钮
        catSelect.add(new Option('➕ Add New Category...', '__NEW__'));

        if (idx !== null) {
            const item = appData.world[idx];
            document.getElementById('ko-wb-title').value = item.title || '';
            document.getElementById('ko-wb-keys').value = item.keys || '';
            document.getElementById('ko-wb-content').value = item.content || '';
            catSelect.value = item.cat || 'General';
            delBtn.style.display = 'block'; 
        } else {
            document.getElementById('ko-wb-title').value = '';
            document.getElementById('ko-wb-keys').value = '';
            document.getElementById('ko-wb-content').value = '';
            catSelect.value = 'General';
            delBtn.style.display = 'none'; 
        }
        
        editorPage.classList.add('active');
    };

    // 监听下拉框选择 (实现自定义分类)
    window.handleCatChange = (sel) => {
        if(sel.value === '__NEW__') {
            const newCat = prompt('Enter new category name (输入新分类名称):');
            if(newCat && newCat.trim() !== '') {
                const cleanCat = newCat.trim();
                const opt = new Option(cleanCat, cleanCat);
                // 把新选项插在“➕ 新建分类”的前面
                sel.add(opt, sel.options[sel.options.length - 1]);
                sel.value = cleanCat;
            } else {
                // 取消输入时，默认回到 General
                sel.value = 'General';
            }
        }
    };

    window.closeWbEditor = () => {
        document.getElementById('ko-editor-page').classList.remove('active');
    };

    window.saveWbEntryKo = async () => {
        const title = document.getElementById('ko-wb-title').value.trim();
        if(!title) { alert('Title cannot be empty (标题不能为空)'); return; }

        const entry = {
            title: title,
            cat: document.getElementById('ko-wb-cat').value,
            keys: document.getElementById('ko-wb-keys').value.trim(),
            content: document.getElementById('ko-wb-content').value
        };

        if(!appData.world) appData.world =[];

        if(currentWbIndex !== null) {
            appData.world[currentWbIndex] = entry; 
        } else {
            appData.world.push(entry); 
        }
        
        await saveData(); 
        renderWbList();   
        closeWbEditor();  
        showToast();      
    };

    window.deleteWbEntryKo = async () => {
        if(currentWbIndex !== null && confirm('Delete this archive? (永久删除此词条？)')) {
            appData.world.splice(currentWbIndex, 1);
            
            if(appData.chatData && appData.chatData.contacts) {
                appData.chatData.contacts.forEach(c => {
                    if(Array.isArray(c.linkedWorld)) {
                        c.linkedWorld = c.linkedWorld
                            .filter(i => i !== currentWbIndex)
                            .map(i => i > currentWbIndex ? i - 1 : i);
                    }
                });
            }

            await saveData();
            renderWbList();
            closeWbEditor();
            showToast();
        }
    };

    // === 导出备份功能 ===
    window.exportData = async () => {
        const btn = document.querySelector('button[onclick="exportData()"]');
        const oldTxt = btn.innerText;
        btn.innerText = "正在打包..."; 
        
        try {
            const exportPayload = JSON.parse(JSON.stringify(appData));
            
            if(!idbHelper.db) await idbHelper.init();
            
            const allImages = {};
            const tx = idbHelper.db.transaction('images', 'readonly');
            const store = tx.objectStore('images');
            
            await new Promise((resolve) => {
                const req = store.openCursor();
                req.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if(cursor) {
                        allImages[cursor.key] = cursor.value; 
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
            });

            exportPayload.images = allImages;
            
            const dataStr = JSON.stringify(exportPayload);
            const blob = new Blob([dataStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `MyPhone_Backup_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (e) {
            alert("Export Failed: " + e.message);
        } finally {
            btn.innerText = oldTxt;
        }
    };

    // === 导入备份功能 ===
    window.importData = async (input) => {
        const file = input.files[0];
        if(!file) return;
        
        if(!confirm("确定要恢复备份吗？当前数据将被覆盖！")) {
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);
                
                await idbHelper.init();
                await idbHelper.clear();
                
                if(imported.images) {
                    const tx = idbHelper.db.transaction('images', 'readwrite');
                    const store = tx.objectStore('images');
                    for(let key in imported.images) {
                        store.put(imported.images[key], key);
                    }
                    await new Promise(resolve => tx.oncomplete = resolve);
                }
                
                appData = imported;
                await idbHelper.saveMainData(appData); 
                
                localStorage.setItem(KEY, '{"images":{}}'); 
                
                alert("成功！数据已恢复。");
                location.reload();
                
            } catch(err) {
                alert("导入失败: " + err);
                console.error(err);
            }
        };
        reader.readAsText(file);
    };


// ==========================================
    // 桌面主题 (Theme) 导出与导入逻辑
    // ==========================================
    
    // 定义属于外观的图片Key列表
    const APPEARANCE_KEYS =[
        'wallpaper-layer', 'hero-img', 'user-avatar',
        'icon-chat', 'icon-world', 'icon-api', 'icon-forum',
        'dock-1', 'dock-2', 'dock-3', 'dock-4'
    ];

    window.exportTheme = async () => {
        const btn = document.querySelector('button[onclick="exportTheme()"]');
        const oldTxt = btn.innerText;
        btn.innerText = "正在打包主题...";

        try {
            // 组装纯净的主题包数据
            const themeData = {
                isMyPhoneTheme: true, // 特殊标识，防止与全量备份混淆
                customTexts: appData.customTexts || {},
                fontPresets: appData.fontPresets || {},
                activeFont: appData.activeFont || '系统默认',
                fontSize: appData.fontSize || 16,
                images: {}
            };

            if(!idbHelper.db) await idbHelper.init();
            const tx = idbHelper.db.transaction('images', 'readonly');
            const store = tx.objectStore('images');

            // 仅提取桌面图标、壁纸等相关图片，绝对不碰聊天发图的缓存
            await Promise.all(APPEARANCE_KEYS.map(key => {
                return new Promise((resolve) => {
                    const req = store.get(key);
                    req.onsuccess = (e) => {
                        if (e.target.result) themeData.images[key] = e.target.result;
                        resolve();
                    };
                    req.onerror = () => resolve();
                });
            }));

            const dataStr = JSON.stringify(themeData);
            const blob = new Blob([dataStr], {type: "application/json"});
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `MyPhone_Theme_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
        } catch (e) {
            alert("主题导出失败: " + e.message);
        } finally {
            btn.innerText = oldTxt;
        }
    };

    window.importTheme = async (input) => {
        const file = input.files[0];
        if(!file) return;

        if(!confirm("确定要导入该主题吗？\n当前的桌面图标、壁纸和文案将被完全替换。\n（你的聊天记录、API设置非常安全，不会受影响）")) {
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const imported = JSON.parse(e.target.result);

                if(!imported.isMyPhoneTheme) {
                    alert("错误：该文件不是有效的主题包！如果是全量备份，请去[API页面]进行恢复。");
                    input.value = '';
                    return;
                }

                // 1. 覆盖非图片的外观数据
                appData.customTexts = imported.customTexts || {};
                appData.fontPresets = imported.fontPresets || { '系统默认': '', '站酷小薇': 'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap' };
                appData.activeFont = imported.activeFont || '系统默认';
                appData.fontSize = imported.fontSize || 16;

                // 2. 处理外观相关的图片数据库读写
                if(!idbHelper.db) await idbHelper.init();
                const tx = idbHelper.db.transaction('images', 'readwrite');
                const store = tx.objectStore('images');

                for (let key of APPEARANCE_KEYS) {
                    if (imported.images && imported.images[key]) {
                        // 主题包里有这个图，写入
                        store.put(imported.images[key], key);
                        appData.images[key] = imported.images[key];
                    } else {
                        // 主题包里没这个图，说明是默认样式，需清空现有的避免残留
                        try { store.delete(key); } catch(err){}
                        delete appData.images[key];
                    }
                }
                
                // 等待数据库写入完成
                await new Promise(resolve => tx.oncomplete = resolve);

                // 3. 保存更新后的主数据并重载页面
                await idbHelper.saveMainData(appData);
                
                alert("主题导入成功！正在刷新桌面...");
                location.reload();

            } catch(err) {
                alert("导入失败: 文件解析错误");
                console.error(err);
            }
        };
        reader.readAsText(file);
    };
    

// ========== API配置 / 预设管理 ==========
  
    window.loadAPIPreset = (name) => {
        const p = appData.apiPresets[name];
        if(p) {
            document.getElementById('api-url').value = p.url;
            document.getElementById('api-key').value = p.key;
            appData.lastApi.url = p.url;
            appData.lastApi.key = p.key;

            const modelSel = document.getElementById('api-model');
            modelSel.innerHTML = ''; 
            
            let listToRender =[];
            if (p.cachedModels && p.cachedModels.length > 0) {
                listToRender = p.cachedModels;
                appData.cachedModels = p.cachedModels; 
            } else {
                listToRender = appData.cachedModels ||[];
            }

            if(listToRender.length === 0) {
                modelSel.innerHTML = '<option value="">无缓存模型</option>';
            } else {
                listToRender.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m;
                    opt.text = m;
                    modelSel.add(opt);
                });
            }

            if(p.model) {
                appData.lastApi.model = p.model; 
                modelSel.value = p.model;
                if(modelSel.value !== p.model) {
                    const opt = document.createElement('option');
                    opt.value = p.model;
                    opt.text = p.model + " (已保存)";
                    modelSel.add(opt);
                    modelSel.value = p.model;
                }
            } else {
                if(modelSel.options.length > 0) {
                    modelSel.selectedIndex = 0;
                    appData.lastApi.model = modelSel.value;
                } else {
                    appData.lastApi.model = '';
                }
            }
            saveData();
        }
    };
    
    window.saveAPIPreset = () => {
        const name = prompt('请输入预设名称:');
        if(name) {
            appData.apiPresets[name] = {
                url: document.getElementById('api-url').value,
                key: document.getElementById('api-key').value,
                model: document.getElementById('api-model').value,
                cachedModels: appData.cachedModels ||[] 
            };
            saveData(); 
            renderAPIPresets();
        }
    };

    window.renderAPIPresets = () => {
        const sel = document.getElementById('api-preset-sel');
        const currentVal = sel.value; 
        
        sel.innerHTML = '<option value="">选择预设...</option>';
        Object.keys(appData.apiPresets).forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.text = name;
            sel.add(opt);
        });
        sel.value = currentVal; 
        
        const modelSel = document.getElementById('api-model');
        if(modelSel.options.length === 0 || modelSel.innerHTML.includes('无缓存模型')) {
            modelSel.innerHTML = '';
            if(appData.cachedModels && appData.cachedModels.length > 0) {
                appData.cachedModels.forEach(m => {
                    modelSel.innerHTML += `<option value="${m}">${m}</option>`;
                });
            } else {
                modelSel.innerHTML = '<option value="">无缓存模型</option>';
            }
            if(appData.lastApi && appData.lastApi.model) {
                 modelSel.value = appData.lastApi.model;
            }
        }
    };

            window.testAPI = async () => {
        const url = document.getElementById('api-url').value.replace(/\/$/, "");
        const key = document.getElementById('api-key').value;
        appData.lastApi = { ...appData.lastApi, url, key }; // 保留原有的 model 设置
        saveData();
        
        const btn = document.querySelector('button[onclick="testAPI()"]');
        const oldTxt = btn.innerText;
        btn.innerText = "连接中...";

        try {
            const res = await fetch(`${url}/models`, { headers: { 'Authorization': `Bearer ${key}` } });
            const d = await res.json();
            
            // 1. 获取模型列表
            appData.cachedModels = Array.isArray(d.data) ? d.data.map(m=>m.id) : d.map(m=>m.id);
            
            // 2. 【关键修改】只有当你从来没选过模型时，才默认帮你选第一个
            // 如果你之前选过（比如 gemini-pro），这里绝对不会覆盖它！
            if (!appData.lastApi.model && appData.cachedModels.length > 0) {
                appData.lastApi.model = appData.cachedModels[0];
            }

            saveData(); 
            renderAPIPresets(); // 刷新下拉框
            
            alert('连接成功！请在下方下拉框选择你想要使用的模型，系统会自动保存。');
        } catch(e) { 
            alert('连接失败: ' + e); 
        } finally {
            btn.innerText = oldTxt;
        }
    };



    // ==========================================
    // 桌面入口点击事件
    // ==========================================
