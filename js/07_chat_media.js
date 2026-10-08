// ========== 聊天媒体：虚拟照片/语音/红包/转账/文件/位置 + 贴纸拖拽系统 ==========
// 职责：sendVirtualPhoto / sendVirtualVoice / sendVirtualRedPacket / sendVirtualTransfer / 贴纸引擎


// ==========================================
// 🚀 虚拟照片 (文字语C图) 发送与查看系统
// ==========================================
// ==========================================
// 🚀 虚拟照片 (文字语C图) 发送系统
// ==========================================
window.sendVirtualPhoto = async () => {
    // 1. 收起加号面板
    document.getElementById('chat-plus-panel').style.display = 'none'; 
    
    // 2. 弹窗让用户输入画面描述
    const desc = prompt("📷 [虚拟拍照模式]\n请输入照片画面的详细描述（AI 会把它当成真图）：\n例如：一张在海边看日落的自拍，手里拿着奶茶。");
    
    if(desc && desc.trim()) {
        const text = `<vphoto>${desc.trim()}</vphoto>`;
        const now = Date.now();
        
        // 4. 存入数据库
        const myMsg = { id: 'm_'+now, chatId: currentChatContact.id, sender: 'me', content: text, timestamp: now, quote: null };
        appData.chatData.messages.push(myMsg);
        saveData();
        
        // 5. 渲染上屏
        appendMsgToUI(myMsg.id, 'me', text, now, null);
        
        // ⚠️ 【注释禁令】：已彻底移除自动触发 AI ( triggerAtelierAI() )。
        // 现在包括发图、发语音在内的所有操作，都绝对不会自动触发AI，必须由用户手动点击右下角发送键才会响应！
    }
};

// ==========================================
// 🚀 虚拟语音 (带时长计算与点击转文字) 发送系统
// ==========================================
window.sendVirtualVoice = async () => {
    // 1. 收起加号面板
    document.getElementById('chat-plus-panel').style.display = 'none'; 
    
    // 2. 弹窗让用户输入语音要说的文字
    const text = prompt("🎤 [发送虚拟语音]\n请输入你想要发出的语音文字：\n（系统会根据字数自动计算语音秒数）");
    
    if(text && text.trim()) {
        // 3. 按照常人语速 (约每秒 4 个字) 自动计算时长，最少 1 秒
        const duration = Math.max(1, Math.ceil(text.trim().length / 4));
        
        // 4. 包装成极简特殊标签 <voice>文字</voice> (时长由引擎自动算)
        const rawContent = `<voice>${text.trim()}</voice>`;
        const now = Date.now();
        
        // 5. 存入数据库
        const myMsg = { id: 'm_'+now, chatId: currentChatContact.id, sender: 'me', content: rawContent, timestamp: now, quote: null };
        appData.chatData.messages.push(myMsg);
        saveData();
        
        // 6. 渲染上屏
        appendMsgToUI(myMsg.id, 'me', rawContent, now, null);
        
        // ⚠️ 核心要求实现：不自动调用 triggerAtelierAI()，必须用户手动点击“响应”才回复！
        showToast(`已发送 ${duration} 秒语音`);
    }
};

// ==========================================
// 🚀 虚拟红包：发送与拆解系统
// ==========================================
let currentRpMsgId = null;

// 1. 我主动发红包
window.sendVirtualRedPacket = async () => {
    document.getElementById('chat-plus-panel').style.display = 'none';
    const amount = prompt("请输入红包金额 (元)：", "52.00");
    if(!amount || isNaN(amount)) return;
    const note = prompt("请输入红包备注：", "专属红包") || "专属红包";
    
    const now = Date.now();
    // 极其纯净的标签格式！
    const rawContent = `<redpacket amount="${amount}" note="${note}" status="new"></redpacket>`;
    
    const myMsg = { id: 'm_' + now, chatId: currentChatContact.id, sender: 'me', content: rawContent, timestamp: now, quote: null };
    appData.chatData.messages.push(myMsg);
    saveData();
    appendMsgToUI(myMsg.id, 'me', rawContent, now, null);
    
    const bdy = document.getElementById('at-body');
    setTimeout(() => bdy.scrollTop = bdy.scrollHeight, 50);
};

// 2. 点击气泡打开弹窗
window.openRedPacketCenter = (el, msgId) => {
    currentRpMsgId = msgId;
    const msg = appData.chatData.messages.find(m => m.id === msgId);
    if(!msg) return;
    
    const amount = el.getAttribute('data-amount');
    const note = el.getAttribute('data-note');
    const sender = el.getAttribute('data-sender');
    const status = el.getAttribute('data-status');
    
    document.getElementById('rp-note').innerText = note;
    document.getElementById('rp-amount').innerText = parseFloat(amount).toFixed(2);
    
    if(sender === 'me') {
        document.getElementById('rp-avatar').src = getRealImgSrc(appData.images['user-avatar']);
        document.getElementById('rp-sender').innerText = appData.customTexts['display-name'] || '我';
    } else {
        document.getElementById('rp-avatar').src = getRealImgSrc(currentChatContact.avatar);
        document.getElementById('rp-sender').innerText = currentChatContact.name;
    }
    
    const openBtn = document.getElementById('rp-open-btn');
    const resultPanel = document.getElementById('rp-result-panel');
    const statusText = document.getElementById('rp-status-text');
    const acceptBtn = document.getElementById('rp-accept-btn');
    const returnBtn = document.getElementById('rp-return-btn');
    
    openBtn.classList.remove('open-spin');
    
    if(status === 'new') {
        if(sender === 'bot') {
            openBtn.style.display = 'flex'; resultPanel.style.display = 'none';
            statusText.style.display = 'none'; acceptBtn.style.display = 'block'; returnBtn.style.display = 'block';
        } else {
            openBtn.style.display = 'none'; resultPanel.style.display = 'flex';
            statusText.style.display = 'block'; statusText.innerText = '等待对方领取...';
            acceptBtn.style.display = 'none'; returnBtn.style.display = 'none';
        }
    } else {
        openBtn.style.display = 'none'; resultPanel.style.display = 'flex';
        statusText.style.display = 'block'; statusText.innerText = status === 'accepted' ? '红包已被领取' : '红包已被退回';
        acceptBtn.style.display = 'none'; returnBtn.style.display = 'none';
    }
    
    document.getElementById('rp-overlay').style.display = 'block';
    document.getElementById('rp-dialog').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('rp-overlay').style.opacity = '1';
        document.getElementById('rp-dialog').style.opacity = '1';
        document.getElementById('rp-dialog').style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);
};

window.closeRedPacket = () => {
    document.getElementById('rp-overlay').style.opacity = '0';
    document.getElementById('rp-dialog').style.opacity = '0';
    document.getElementById('rp-dialog').style.transform = 'translate(-50%, -46%) scale(0.9)';
    setTimeout(() => { document.getElementById('rp-overlay').style.display = 'none'; document.getElementById('rp-dialog').style.display = 'none'; }, 300);
};

window.openRedPacketAction = () => {
    const btn = document.getElementById('rp-open-btn');
    btn.classList.add('open-spin');
    setTimeout(() => {
        btn.style.display = 'none';
        const panel = document.getElementById('rp-result-panel');
        panel.style.display = 'flex';
        setTimeout(() => { panel.style.opacity = '1'; panel.style.transform = 'scale(1)'; }, 50);
    }, 1000);
};

// 3. 用户决定领或退 (修复了点不动的问题！)
window.confirmRedPacket = async (action) => {
    const msg = appData.chatData.messages.find(m => m.id === currentRpMsgId);
    if(!msg) return;
    
    // 精准修改纯净标签
    if (msg.content.includes('<redpacket')) {
        if (!msg.content.includes('status=')) {
            msg.content = msg.content.replace(/<redpacket /, `<redpacket status="${action}" `);
        } else {
            msg.content = msg.content.replace(/status=["']?new["']?/, `status="${action}"`);
        }
    }
    
    const sysText = action === 'accepted' ? '你领取了Ta的红包' : '你退回了Ta的红包';
    appData.chatData.messages.push({ id: 'm_'+Date.now(), chatId: currentChatContact.id, sender: 'me', content: `<div class="time-divider">${sysText}</div>`, timestamp: Date.now(), quote: null });
    
    saveData(); closeRedPacket();
    const oldScroll = document.getElementById('at-body').scrollTop;
    openChatRoom(currentChatContact.id);
    setTimeout(() => document.getElementById('at-body').scrollTop = oldScroll, 50);
    
    triggerAtelierAI(); // 通知 AI
};

// 4. AI 自动领/退红包
window.handleAiRedPacketAction = (action) => {
    const myPackets = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id && m.sender === 'me' && m.content.includes('<redpacket') && (!m.content.includes('status=') || m.content.includes('status="new"')));
    if(myPackets.length > 0) {
        const msg = myPackets[myPackets.length - 1];
        if (!msg.content.includes('status=')) {
            msg.content = msg.content.replace(/<redpacket /, `<redpacket status="${action}" `);
        } else {
            msg.content = msg.content.replace(/status=["']?new["']?/, `status="${action}"`);
        }
        saveData();
    }
};

// ==========================================
// 🚀 虚拟转账：发送与收款系统 (双向联动)
// ==========================================
let currentTfMsgId = null;

// 1. 我主动发起转账
window.sendVirtualTransfer = async () => {
    document.getElementById('chat-plus-panel').style.display = 'none';
    const amount = prompt("请输入转账金额 (元)：", "520.00");
    if(!amount || isNaN(amount)) return;
    const note = prompt("添加转账备注：", "转账") || "转账";
    
    const now = Date.now();
    // 极其纯净的标签格式！
    const rawContent = `<transfer amount="${amount}" note="${note}" status="new"></transfer>`;
    
    const myMsg = { id: 'm_' + now, chatId: currentChatContact.id, sender: 'me', content: rawContent, timestamp: now, quote: null };
    appData.chatData.messages.push(myMsg);
    saveData();
    appendMsgToUI(myMsg.id, 'me', rawContent, now, null);
    
    const bdy = document.getElementById('at-body');
    setTimeout(() => bdy.scrollTop = bdy.scrollHeight, 50);
};

// 2. 点击气泡打开转账详情弹窗
window.openTransferCenter = (el, msgId) => {
    currentTfMsgId = msgId;
    const msg = appData.chatData.messages.find(m => m.id === msgId);
    if(!msg) return;
    
    const amount = el.getAttribute('data-amount');
    const note = el.getAttribute('data-note');
    const sender = el.getAttribute('data-sender');
    const status = el.getAttribute('data-status');
    
    document.getElementById('tf-amount').innerText = parseFloat(amount).toFixed(2);
    document.getElementById('tf-note').innerText = note;
    
    const topHalf = document.getElementById('tf-top-half');
    const icon = document.getElementById('tf-icon');
    const title = document.getElementById('tf-status-title');
    const actionPanel = document.getElementById('tf-action-panel');
    const finishedText = document.getElementById('tf-finished-text');

    // 状态UI更新
    if (status === 'new') {
        topHalf.style.background = 'linear-gradient(135deg, #FFA929 0%, #F57D1D 100%)';
        icon.innerHTML = '<i class="ri-time-line"></i>';
        if (sender === 'bot') {
            title.innerText = '待收款';
            actionPanel.style.display = 'flex';
            finishedText.style.display = 'none';
        } else {
            title.innerText = '等待对方收款';
            actionPanel.style.display = 'none';
            finishedText.style.display = 'block';
            finishedText.innerText = '1天内未收款，将退还至零钱';
        }
    } else {
        actionPanel.style.display = 'none';
        finishedText.style.display = 'block';
        if (status === 'accepted') {
            topHalf.style.background = '#1AAD19'; // 微信绿
            icon.innerHTML = '<i class="ri-check-line"></i>';
            title.innerText = '已收款';
            finishedText.innerText = sender === 'bot' ? '已存入零钱' : '对方已确认收款';
        } else {
            topHalf.style.background = '#888888'; // 退款灰
            icon.innerHTML = '<i class="ri-arrow-go-back-line"></i>';
            title.innerText = '已退还';
            finishedText.innerText = '转账已被退还';
        }
    }

    document.getElementById('tf-overlay').style.display = 'block';
    document.getElementById('tf-dialog').style.display = 'flex';
    setTimeout(() => {
        document.getElementById('tf-overlay').style.opacity = '1';
        document.getElementById('tf-dialog').style.opacity = '1';
        document.getElementById('tf-dialog').style.transform = 'translate(-50%, -46%) scale(1)';
    }, 10);
};

window.closeTransfer = () => {
    document.getElementById('tf-overlay').style.opacity = '0';
    document.getElementById('tf-dialog').style.opacity = '0';
    document.getElementById('tf-dialog').style.transform = 'translate(-50%, -46%) scale(0.9)';
    setTimeout(() => { document.getElementById('tf-overlay').style.display = 'none'; document.getElementById('tf-dialog').style.display = 'none'; }, 300);
};

// 3. 我决定收下或退回 AI 的转账 (修复了点不动的问题！)
window.confirmTransfer = async (action) => {
    const msg = appData.chatData.messages.find(m => m.id === currentTfMsgId);
    if(!msg) return;
    
    // 精准修改纯净标签
    if (msg.content.includes('<transfer')) {
        if (!msg.content.includes('status=')) {
            msg.content = msg.content.replace(/<transfer /, `<transfer status="${action}" `);
        } else {
            msg.content = msg.content.replace(/status=["']?new["']?/, `status="${action}"`);
        }
    }
    
    const sysText = action === 'accepted' ? '你确认了收款' : '你退还了Ta的转账';
    appData.chatData.messages.push({ id: 'm_'+Date.now(), chatId: currentChatContact.id, sender: 'me', content: `<div class="time-divider">${sysText}</div>`, timestamp: Date.now(), quote: null });
    
    saveData(); closeTransfer();
    
    const oldScroll = document.getElementById('at-body').scrollTop;
    openChatRoom(currentChatContact.id);
    setTimeout(() => document.getElementById('at-body').scrollTop = oldScroll, 50);
    triggerAtelierAI(); // 通知 AI
};

// 4. AI 自动收/退款
window.handleAiTransferAction = (action) => {
    const myTransfers = appData.chatData.messages.filter(m => m.chatId === currentChatContact.id && m.sender === 'me' && m.content.includes('<transfer') && (!m.content.includes('status=') || m.content.includes('status="new"')));
    if(myTransfers.length > 0) {
        const msg = myTransfers[myTransfers.length - 1];
        if (!msg.content.includes('status=')) {
            msg.content = msg.content.replace(/<transfer /, `<transfer status="${action}" `);
        } else {
            msg.content = msg.content.replace(/status=["']?new["']?/, `status="${action}"`);
        }
        saveData();
    }
};
window.toggleVoiceText = (bubbleEl, event) => {
    if(event) event.stopPropagation(); // 防止触发气泡长按菜单

    // 消除小红点
    const dot = bubbleEl.querySelector('.unread-dot');
    if(dot) dot.style.display = 'none';

    // 👇 核心修复：找到这条消息的 ID，写入数据库并永久保存为“已读” 👇
    const msgDiv = bubbleEl.closest('.at-msg');
    if(msgDiv) {
        const msgId = msgDiv.getAttribute('data-id');
        const msgData = appData.chatData.messages.find(m => m.id === msgId);
        if(msgData && !msgData.voiceRead) {
            msgData.voiceRead = true; // 标记为已读
            saveData(); // 永久存入手机本地数据库
        }
    }

    // 播放波浪动画 2 秒后停止
    bubbleEl.classList.add('playing');
    setTimeout(() => bubbleEl.classList.remove('playing'), 2000); 

    // 展开或收起下方隐藏的文字
    const revealEl = bubbleEl.nextElementSibling;
    if(revealEl && revealEl.classList.contains('voice-text-reveal')) {
        revealEl.style.display = revealEl.style.display === 'block' ? 'none' : 'block';
    }
};
window.viewVirtualPhoto = (desc, event) => {
    if(event) event.stopPropagation(); // 防止触发气泡长按菜单
    document.getElementById('vphoto-desc-text').innerText = desc;
    document.getElementById('modal-vphoto-viewer').classList.add('show');
};

// ==========================================
// 🚀 聊天室：发送本地相册图片 (无感发送，不触发 AI)
// ==========================================
window.handleChatImageUpload = async (input) => {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();

    // 收起加号面板
    document.getElementById('chat-plus-panel').style.display = 'none';

    reader.onload = async (e) => {
        const base64 = e.target.result;
        const imgKey = 'chat_img_' + Date.now(); // 生成唯一防重名 ID

        // 1. 存入 IndexedDB 高速大容量缓存
        try { await idbHelper.saveImage(imgKey, base64); } catch(err){}
        appData.images[imgKey] = base64;

        const now = Date.now();
        // 2. 构建消息体 (纯图无字)
        const myMsg = { 
            id: 'm_' + now, 
            chatId: currentChatContact.id, 
            sender: 'me', 
            content: "", 
            timestamp: now, 
            quote: null,
            chatImage: imgKey // 👈 核心：记录这是一张发送的图
        };
        
        appData.chatData.messages.push(myMsg);
        saveData();
        
        // 3. 渲染到界面 (注意看最后一个参数)
        appendMsgToUI(myMsg.id, 'me', "", now, null, false, null, imgKey);
        
        const bdy = document.getElementById('at-body');
        setTimeout(() => bdy.scrollTop = bdy.scrollHeight, 50);
    };
    reader.readAsDataURL(file);
    input.value = ''; // 清空选择，方便下次传同一张
};

// 点击气泡内的图片放大查看
window.viewChatImage = (src, event) => {
    if(event) event.stopPropagation(); // 防止触发长按菜单
    document.getElementById('chat-image-viewer-img').src = src;
    document.getElementById('modal-chat-image-viewer').classList.add('show');
};

// 6. 聊天室：发送表情包消息
window.sendStickerMsg = async (stkId) => {
    document.getElementById('emoji-picker').classList.remove('show');
    
    // 找出这个表情包的详细信息
    let foundStk = null;
    appData.stickerVault.forEach(c => {
        const s = c.stickers.find(x => x.id === stkId);
        if(s) foundStk = s;
    });
    if(!foundStk) return;

    // 存入数据库
    const now = Date.now();
    const myMsg = { 
        id: 'm_' + now, 
        chatId: currentChatContact.id, 
        sender: 'me', 
        content: "", // 纯表情包不需要文字
        timestamp: now, 
        quote: null,
        sticker: { id: foundStk.id, src: foundStk.src, desc: foundStk.desc } // 核心数据(加上id用于后续编辑)
    };
    
    appData.chatData.messages.push(myMsg);
    saveData();
    
    // 渲染到界面
    appendMsgToUI(myMsg.id, 'me', "", now, null, false, myMsg.sticker);
    
    const bdy = document.getElementById('at-body');
    setTimeout(() => bdy.scrollTop = bdy.scrollHeight, 50);
    
};

// === 贴纸编辑功能 ===

// 单击：旋转 45 度
window.rotateSticker = async (msgId, idx, e) => {
    e.stopPropagation(); // 防止触发气泡的长按菜单
    const msg = appData.chatData.messages.find(m => m.id === msgId);
    if (msg && msg.peeledStickers && msg.peeledStickers[idx]) {
        // 每次加 45 度
        msg.peeledStickers[idx].r = (msg.peeledStickers[idx].r || 0) + 45;
        await saveData();
        
        // 局部刷新：直接修改 DOM，不重载页面
        const stickerEl = e.currentTarget;
        const currentFlip = msg.peeledStickers[idx].flip ? -1 : 1;
        stickerEl.style.transform = `scale(${currentFlip}) rotate(${msg.peeledStickers[idx].r}deg)`;
    }
};

// 双击：左右翻转
window.flipSticker = async (msgId, idx, e) => {
    e.stopPropagation();
    const msg = appData.chatData.messages.find(m => m.id === msgId);
    if (msg && msg.peeledStickers && msg.peeledStickers[idx]) {
        // 切换翻转状态
        msg.peeledStickers[idx].flip = !msg.peeledStickers[idx].flip;
        await saveData();
        
        // 局部刷新
        const stickerEl = e.currentTarget;
        const currentFlip = msg.peeledStickers[idx].flip ? -1 : 1;
        stickerEl.style.transform = `scale(${currentFlip}) rotate(${msg.peeledStickers[idx].r}deg)`;
        
        showToast(msg.peeledStickers[idx].flip ? "已翻转" : "已复原");
    }
};

// ==========================================
// Phase 3 & 4: 撤回 (Recall) 与 多选 (Multi-select)
// ==========================================

// --- 撤回功能 ---
window.recallTargetMsg = (isMe) => {
    if(!currentActionMsgId) return;
    const msgData = appData.chatData.messages.find(m => m.id === currentActionMsgId);
    if(msgData) {
        msgData.isRecalled = true; // 标记为已撤回
        saveData();
        
        // 动态替换界面DOM（不重新刷新整个页面，体验更丝滑）
        const oldDiv = document.querySelector(`.at-msg[data-id="${currentActionMsgId}"]`);
        if(oldDiv) {
            let newDiv = document.createElement('div');
            newDiv.className = 'at-msg-recalled';
            newDiv.setAttribute('data-id', currentActionMsgId);
            let checkbox = `<div class="multi-select-circle" onclick="toggleMsgSelect('${currentActionMsgId}', this, event)"></div>`;
            
            if(isMe) {
                newDiv.innerHTML = `${checkbox}<div class="time-divider">你撤回了一条消息</div>`;
            } else {
                let safeText = msgData.content.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
                newDiv.innerHTML = `${checkbox}<div class="time-divider">对方撤回了一条消息 <span class="msg-recalled-link" onclick="alert('【AI 原消息】\\n${safeText}')">查看</span></div>`;
            }
            oldDiv.parentNode.replaceChild(newDiv, oldDiv);
        }
    }
    closeMsgActionModal();
};

// --- 多选功能 ---
let isMultiSelectMode = false;
let selectedMsgs = new Set();

window.toggleMultiSelect = () => {
    closeMsgActionModal();
    isMultiSelectMode = true;
    selectedMsgs.clear();
    
    // 隐藏原生输入框，展示多选操作栏
    document.querySelector('.at-footer .dock').style.display = 'none';
    document.getElementById('multi-action-bar').style.display = 'flex';
    document.getElementById('at-body').classList.add('multi-select-mode');
    document.getElementById('multi-select-count').innerText = `已选 0 条`;
};

window.cancelMultiSelect = () => {
    isMultiSelectMode = false;
    document.getElementById('at-body').classList.remove('multi-select-mode');
    document.getElementById('multi-action-bar').style.display = 'none';
    document.querySelector('.at-footer .dock').style.display = 'flex';
    
    // 清除所有的打钩状态
    document.querySelectorAll('.multi-select-circle.checked').forEach(el => el.classList.remove('checked'));
};

window.toggleMsgSelect = (id, el, event) => {
    if(event) event.stopPropagation();
    if(selectedMsgs.has(id)) {
        selectedMsgs.delete(id);
        el.classList.remove('checked');
    } else {
        selectedMsgs.add(id);
        el.classList.add('checked');
    }
    document.getElementById('multi-select-count').innerText = `已选 ${selectedMsgs.size} 条`;
};

// 拦截点击事件：在多选模式下，点击整个气泡也能选中
document.addEventListener("DOMContentLoaded", () => {
    const chatBody = document.getElementById('at-body');
    if(chatBody) {
        chatBody.addEventListener('click', (e) => {
            if(isMultiSelectMode) {
                e.preventDefault();
                e.stopPropagation();
                const msgDiv = e.target.closest('.at-msg') || e.target.closest('.at-msg-recalled');
                if(msgDiv) {
                    const id = msgDiv.getAttribute('data-id');
                    const circle = msgDiv.querySelector('.multi-select-circle');
                    if(circle) toggleMsgSelect(id, circle, null);
                }
            }
        }, true);
    }
});

// 批量删除
window.deleteSelectedMsgs = () => {
    if(selectedMsgs.size === 0) return;
    if(confirm(`确定删除这 ${selectedMsgs.size} 条消息吗？`)) {
        appData.chatData.messages = appData.chatData.messages.filter(m => !selectedMsgs.has(m.id));
        saveData();
        
        // 物理移除选中的气泡
        selectedMsgs.forEach(id => {
            const div = document.querySelector(`[data-id="${id}"]`);
            if(div) div.remove();
        });
        
        cancelMultiSelect();
        showToast('已批量删除');
    }
};

// ==========================================
// 独立功能 1：全局高级 CSS 美化系统
// ==========================================

// ========== 贴纸拖拽引擎 ==========

// ==========================================
// 🚀 QQ 贴表情核心引擎 (Drag & Drop)
// ==========================================
// ==========================================
// 🚀 QQ 贴表情核心引擎 (Drag & Drop) 优化版
// ==========================================
let dragTimer = null;
let dragItem = null;
let ghostEl = null;

function initStickerDragSystem() {
    ghostEl = document.createElement('div');
    ghostEl.id = 'drag-ghost';
    document.body.appendChild(ghostEl);

    document.addEventListener('touchmove', (e) => {
        if (dragItem) {
            e.preventDefault(); 
            const touch = e.touches[0];
            ghostEl.style.left = touch.clientX + 'px';
            ghostEl.style.top = touch.clientY + 'px';
        }
    }, { passive: false });

    document.addEventListener('touchend', async (e) => {
        if (dragItem) {
            const touch = e.changedTouches[0];
            ghostEl.style.display = 'none';
            
            let targetEl = document.elementFromPoint(touch.clientX, touch.clientY);

            const msgBubble = targetEl ? targetEl.closest('.at-msg') : null;

            if (msgBubble) {
                const msgId = msgBubble.getAttribute('data-id');
                const rect = msgBubble.getBoundingClientRect();
                const relX = touch.clientX - rect.left;
                const relY = touch.clientY - rect.top;
                
                await saveStickerToMsg(msgId, dragItem.content, dragItem.type, relX, relY);
            }
            dragItem = null;
        }
    });
}

// 优化：直接修改 DOM，不刷新页面，解决乱跳问题！
async function saveStickerToMsg(msgId, content, type, x, y) {
    const msg = appData.chatData.messages.find(m => m.id === msgId);
    if (msg) {
        if (!msg.peeledStickers) msg.peeledStickers = [];
        const rotation = Math.floor(Math.random() * 40) - 20;
        
        msg.peeledStickers.push({ content, type, x, y, r: rotation });
        await saveData();
        
        // 直接在当前气泡上画出贴纸，丝滑无感！
        const msgBubble = document.querySelector(`.at-msg[data-id="${msgId}"]`);
        if (msgBubble) {
            let sContent = type === 'emoji' ? `<div style="font-size:32px;">${content}</div>` : `<img src="${getRealImgSrc(content)}" style="width:50px;">`;
            let stickerDiv = document.createElement('div');
            stickerDiv.className = 'peeled-sticker';
            stickerDiv.style.left = x + 'px';
            stickerDiv.style.top = y + 'px';
            stickerDiv.style.setProperty('--rot', rotation + 'deg');
            stickerDiv.innerHTML = sContent;
            
            // 修复：立即绑定交互事件，无需刷新即可旋转/翻转
            const newIdx = msg.peeledStickers.length - 1;
            stickerDiv.setAttribute('onclick', `rotateSticker('${msgId}', ${newIdx}, event)`);
            stickerDiv.setAttribute('ondblclick', `flipSticker('${msgId}', ${newIdx}, event)`);
            stickerDiv.style.pointerEvents = 'auto';
            stickerDiv.style.cursor = 'pointer';

            msgBubble.appendChild(stickerDiv);
        }
        
        try { if(navigator.vibrate) navigator.vibrate(50); } catch(e){}
    }
}

function bindLongPress(element, content, type) {
    element.addEventListener('touchstart', (e) => {
        dragTimer = setTimeout(() => {
            dragItem = { content, type };
            
            // 优化：拿起来的瞬间，自动收起表情面板，让你能贴到底部！
            document.getElementById('emoji-picker').classList.remove('show');
            
            const touch = e.touches[0];
            ghostEl.style.display = 'block';
            ghostEl.style.left = touch.clientX + 'px';
            ghostEl.style.top = touch.clientY + 'px';
            
            if (type === 'emoji') {
                ghostEl.innerHTML = `<div style="font-size:40px;">${content}</div>`;
            } else {
                ghostEl.innerHTML = `<img src="${getRealImgSrc(content)}" style="width:60px;">`;
            }
            try { if(navigator.vibrate) navigator.vibrate(20); } catch(e){}
        }, 300); 
    });

    element.addEventListener('touchend', () => clearTimeout(dragTimer));
    element.addEventListener('touchmove', () => { if (!dragItem) clearTimeout(dragTimer); });
}


