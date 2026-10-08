// ========== 高定版聊天室核心逻辑 & AI 调取 ==========

let currentChatContact = null;

// --- 分页加载配置 ---
let chatLoadedFrom = 0;
const CHAT_PAGE_SIZE = 30;

// --- 消息索引缓存（避免每次渲染都全表扫描 O(n²) → O(1)）---
let _currentRoomMsgsFull = [];  // 当前聊天室全量消息（已过滤好）
let _msgIdxCache = new Map();    // msgId → index in _currentRoomMsgsFull
let _loadingOlderMsgs = false;   // 防止滚动触发重复加载

function _refreshMsgCache(contactId) {
    _currentRoomMsgsFull = appData.chatData.messages.filter(m => m.chatId === contactId);
    _msgIdxCache = new Map();
    _currentRoomMsgsFull.forEach((m, i) => _msgIdxCache.set(m.id, i));
}

// ===== 1. 打开聊天室 =====
window.openChatRoom = (contactId) => {
    // 消除桌面未读红点
    const chatIcon = document.getElementById('icon-chat');
    if (chatIcon) {
        const badge = chatIcon.querySelector('.desktop-unread-badge');
        if (badge) badge.remove();
    }

    currentChatContact = appData.chatData.contacts.find(c => c.id === contactId);
    if (!currentChatContact) return;

    document.getElementById('at-room-name').innerText = currentChatContact.note || currentChatContact.name;
    document.getElementById('at-room-status').innerText = currentChatContact.currentStatus || '在线';
    document.getElementById('at-room-dot').classList.remove('typing');

    const bdy = document.getElementById('at-body');

    // 用 visibility 代替 opacity，避免布局抖动
    bdy.style.visibility = 'hidden';
    bdy.innerHTML = '';

    // 重建消息缓存，确定分页起点
    _refreshMsgCache(contactId);
    const total = _currentRoomMsgsFull.length;
    chatLoadedFrom = Math.max(0, total - CHAT_PAGE_SIZE);

    // 顶部固定分割线
    const initDivider = document.createElement('div');
    initDivider.className = 'time-divider';
    initDivider.innerText = 'Encryption Secured';
    bdy.appendChild(initDivider);

    // 如果还有更早的消息，显示上滑提示
    if (chatLoadedFrom > 0) {
        const tip = document.createElement('div');
        tip.className = 'time-divider chat-load-more-tip';
        tip.innerText = '↑ 上滑加载更早消息';
        bdy.appendChild(tip);
    }

    // 用 DocumentFragment 批量渲染，避免多次触发重排
    const frag = document.createDocumentFragment();
    const toRender = _currentRoomMsgsFull.slice(chatLoadedFrom);
    toRender.forEach((msg, i) => {
        const globalIdx = chatLoadedFrom + i;
        const prevMsg = globalIdx > 0 ? _currentRoomMsgsFull[globalIdx - 1] : null;
        _buildMsgNodeSet(msg, prevMsg).forEach(n => frag.appendChild(n));
    });
    bdy.appendChild(frag);

    // 批量执行 sandbox 脚本（DocumentFragment 插入后脚本不自动运行）
    bdy.querySelectorAll('.msg-module-box').forEach(box => {
        box.querySelectorAll('script').forEach(old => {
            const s = document.createElement('script');
            Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
            s.textContent = old.textContent;
            old.parentNode.replaceChild(s, old);
        });
    });

    // 绑定滚动加载（先移除旧监听防止重复绑定）
    bdy.removeEventListener('scroll', _onAtBodyScroll);
    bdy.addEventListener('scroll', _onAtBodyScroll, { passive: true });

    openPage('page-chat-room');
    renderChatStickerPanel();
    document.getElementById('emoji-picker').classList.remove('show');

    // 直接跳到底部，再显示，避免看到滚动过程
    requestAnimationFrame(() => {
        bdy.scrollTop = bdy.scrollHeight;
        bdy.style.visibility = 'visible';
    });

    applyChatRoomVisuals();
};

// ===== 滚动监听：上滑加载更多 =====
function _onAtBodyScroll() {
    if (chatLoadedFrom === 0 || _loadingOlderMsgs) return;
    const bdy = document.getElementById('at-body');
    if (bdy && bdy.scrollTop < 80) {
        _loadingOlderMsgs = true;
        _doLoadOlderMsgs(bdy);
        // 等下一帧 DOM 更新后再允许触发，防止补偿 scrollTop 后再次触发
        requestAnimationFrame(() => { _loadingOlderMsgs = false; });
    }
}

function _doLoadOlderMsgs(bdy) {
    if (chatLoadedFrom === 0) return;

    const prevHeight = bdy.scrollHeight;
    const oldFrom = chatLoadedFrom;
    chatLoadedFrom = Math.max(0, oldFrom - CHAT_PAGE_SIZE);
    if (chatLoadedFrom === oldFrom) return;

    const toLoad = _currentRoomMsgsFull.slice(chatLoadedFrom, oldFrom);
    if (toLoad.length === 0) return;

    // 移除旧的加载提示
    const oldTip = bdy.querySelector('.chat-load-more-tip');
    if (oldTip) oldTip.remove();

    // 锚点：插入位置在当前第一条消息之前
    const firstMsg = bdy.querySelector('[data-id]');

    // 批量构建更早的消息节点
    const frag = document.createDocumentFragment();
    toLoad.forEach((msg, i) => {
        const globalIdx = chatLoadedFrom + i;
        const prevMsg = globalIdx > 0 ? _currentRoomMsgsFull[globalIdx - 1] : null;
        _buildMsgNodeSet(msg, prevMsg).forEach(n => frag.appendChild(n));
    });

    // 还有更多历史时，插入新提示
    if (chatLoadedFrom > 0) {
        const tip = document.createElement('div');
        tip.className = 'time-divider chat-load-more-tip';
        tip.innerText = '↑ 上滑加载更早消息';
        bdy.insertBefore(tip, firstMsg);
    }

    bdy.insertBefore(frag, firstMsg);

    // 补偿 scrollTop，防止视觉跳动
    bdy.scrollTop += bdy.scrollHeight - prevHeight;

    // 执行新插入消息里可能存在的 sandbox 脚本
    toLoad.forEach(msg => {
        const el = bdy.querySelector(`[data-id="${msg.id}"]`);
        if (el) {
            el.querySelectorAll('.msg-module-box script').forEach(old => {
                const s = document.createElement('script');
                Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
                s.textContent = old.textContent;
                old.parentNode.replaceChild(s, old);
            });
        }
    });
}

// ===== 智能时间戳格式化 =====
function formatChatCenterTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.getDate() === now.getDate() && d.getMonth() === now.getMonth()) return timePart;
    if (now.getDate() - d.getDate() === 1 && d.getMonth() === now.getMonth()) return '昨天 ' + timePart;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + timePart;
}

// ===== 核心：构建单条消息的 DOM 节点集合（纯函数，不操作 DOM）=====
// msg: 消息对象（来自 appData.chatData.messages）
// prevMsg: 前一条消息对象，null 表示这是聊天室最早的消息，undefined 表示未知（不插时间线）
// 返回 Node[]
function _buildMsgNodeSet(msg, prevMsg) {
    const { id, sender, content: text, timestamp, quote: quoteText, isRecalled, sticker: stickerObj, chatImage: chatImageKey } = msg;
    const nodes = [];
    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // --- 时间分割线 ---
    if (prevMsg === null) {
        // 聊天室最早的一条消息
        const td = document.createElement('div');
        td.className = 'time-divider';
        td.innerText = formatChatCenterTime(timestamp);
        nodes.push(td);
    } else if (prevMsg && timestamp - prevMsg.timestamp > 5 * 60 * 1000) {
        const td = document.createElement('div');
        td.className = 'time-divider';
        td.innerText = formatChatCenterTime(timestamp);
        nodes.push(td);
    }

    // --- 消息节点 ---
    const newDiv = document.createElement('div');
    newDiv.setAttribute('data-id', id);
    newDiv.style.position = 'relative';

    // 系统提示类（红包/撤回等包裹在 time-divider 里）：剥去气泡和头像，只渲染中间灰字
    if (text && text.trim().startsWith('<div class="time-divider">') && text.trim().endsWith('</div>')) {
        newDiv.style.cssText = 'width:100%; display:flex; justify-content:center;';
        newDiv.innerHTML = text;
        nodes.push(newDiv);
        return nodes;
    }

    const checkbox = `<div class="multi-select-circle" onclick="toggleMsgSelect('${id}', this, event)"></div>`;

    // 贴纸（peeled stickers）— 直接从 msg 对象取，无需再查 find()
    let stickersHtml = '';
    if (msg.peeledStickers) {
        msg.peeledStickers.forEach((s, idx) => {
            const content = s.type === 'emoji'
                ? `<div style="font-size:32px;">${s.content}</div>`
                : `<img src="${getRealImgSrc(s.content)}" style="width:50px;">`;
            const scaleX = s.flip ? -1 : 1;
            stickersHtml += `<div class="peeled-sticker" style="left:${s.x}px; top:${s.y}px; transform: scale(${scaleX}) rotate(${s.r}deg); pointer-events: auto; cursor: pointer;" onclick="rotateSticker('${id}', ${idx}, event)" ondblclick="flipSticker('${id}', ${idx}, event)">${content}</div>`;
        });
    }

    if (isRecalled) {
        newDiv.className = 'at-msg-recalled';
        if (sender === 'me') {
            newDiv.innerHTML = `${checkbox}${stickersHtml}<div class="time-divider">你撤回了一条消息</div>`;
        } else {
            const safeText = (text || '').replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
            newDiv.innerHTML = `${checkbox}${stickersHtml}<div class="time-divider">对方撤回了一条消息 <span class="msg-recalled-link" onclick="alert('【AI 原消息】\\n${safeText}')">查看</span></div>`;
        }
    } else {
        newDiv.className = sender === 'me' ? 'at-msg m-me' : 'at-msg m-bot';

        let sandboxes = [];
        let pureText = (text || '').replace(/<sandbox>([\s\S]*?)<\/sandbox>/gi, (match, htmlContent) => {
            sandboxes.push(htmlContent);
            return '';
        }).trim();

        // 直接用 msg 对象，无需再 find() 查库（消除 O(n) 全表扫描）
        const dbMsgData = msg;

        // 【1】虚拟照片
        const VPHOTO_PLACEHOLDER = 'https://i.postimg.cc/t4G6Jtw1/IMG-20260403-222355.jpg';
        pureText = pureText.replace(/<vphoto>([\s\S]*?)<\/vphoto>/gi, (match, pDesc) => {
            const safeDesc = pDesc.replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/\n/g, ' ');
            return `<div class="special-msg-wrap" style="margin-top:4px; margin-bottom:2px;"><img src="${VPHOTO_PLACEHOLDER}" style="max-width:180px; border-radius:16px; display:block; cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.06);" onclick="viewVirtualPhoto('${safeDesc}', event)"></div>`;
        });

        // 【2】虚拟语音（保留原始正则，不改动）
        pureText = pureText.replace(/<voice(?:.+?time=[\"']?(\d+)[\"']?)?>([\\s\\S]*?)<\/voice>/gi, (match, time, vText) => {
            const textContent = vText.trim();
            const duration = time ? time : Math.max(1, Math.ceil(textContent.length / 4));
            const isMe = sender === 'me';
            const extraWidth = Math.min(120, duration * 3);
            const showDot = !isMe && !dbMsgData.voiceRead;
            return `<div class="voice-container"><div class="voice-inline-btn" style="min-width:calc(60px + ${extraWidth}px);" onclick="toggleVoiceText(this, event)"><div class="sound-wave"><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div><div class="wave-bar"></div></div><div class="voice-duration"><span>${duration}"</span>${showDot ? '<div class="unread-dot"></div>' : ''}</div></div><div class="voice-text-reveal">${textContent}</div></div>`;
        });

        // 【3】定位卡片
        pureText = pureText.replace(/<location title=["']?([^"']+)["']? desc=["']?([^"']+)["']? dist=["']?([^"']+)["']?><\/location>/gi, (match, title, desc, dist) => {
            return `<div class="special-msg-wrap loc-card-wrap" onclick="alert('系统提示：已开启导航前往【${title}】')"><div class="loc-map-bg"></div><div class="loc-info-box"><div class="loc-title-txt">${title}</div><div class="loc-desc-txt">${desc}</div><div class="loc-dist-badge">${dist}</div></div></div>`;
        });

        // 【4】文件卡片
        pureText = pureText.replace(/<file name=["']?([^"']+)["']? ext=["']?([^"']+)["']? size=["']?([^"']+)["']?>([\s\S]*?)<\/file>/gi, (match, name, ext, size, content) => {
            const safeContent = content.replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/\n/g, '\\n');
            const extClean = ext.toLowerCase();
            const iconColor = extClean === 'pdf' ? '#FF3B30' : (['doc','docx'].includes(extClean) ? '#007AFF' : (['xls','xlsx','csv'].includes(extClean) ? '#34C759' : '#FF9500'));
            const iconBg   = extClean === 'pdf' ? 'rgba(255,59,48,0.1)' : (['doc','docx'].includes(extClean) ? 'rgba(0,122,255,0.1)' : (['xls','xlsx','csv'].includes(extClean) ? 'rgba(52,199,89,0.1)' : 'rgba(255,149,0,0.1)'));
            const iconClass = extClean === 'pdf' ? 'ri-file-pdf-fill' : (['doc','docx'].includes(extClean) ? 'ri-file-word-fill' : (['xls','xlsx','csv'].includes(extClean) ? 'ri-file-excel-fill' : 'ri-file-text-fill'));
            return `<div class="special-msg-wrap file-card-wrap" onclick="openFileViewer('${name}.${ext}', '${size}', '${safeContent}', '${id}')"><div class="file-icon-box" style="background: ${iconBg};"><i class="${iconClass}" style="color: ${iconColor};"></i><span class="file-ext-tag" style="color: ${iconColor};">${extClean}</span></div><div class="file-info-col"><div class="file-name-txt">${name}.${ext}</div><div class="file-size-txt"><span class="file-size-num">${size}</span><span class="file-status-txt">在线预览</span></div></div></div>`;
        });

        // 【5】红包
        pureText = pureText.replace(/<redpacket amount=["']?([^"'\s]+)["']? note=["']?([^"']+)["']?(?: status=["']?([^"'\s>]+)["']?)?><\/redpacket>/gi, (match, amt, note, status) => {
            const stat = status || 'new';
            const classStatus = stat === 'accepted' ? 'accepted' : (stat === 'returned' ? 'returned' : 'new');
            const footText   = stat === 'accepted' ? '已被领取' : (stat === 'returned' ? '已被退回' : '微信红包');
            return `<div class="special-msg-wrap pay-card ${classStatus}" data-amount="${amt}" data-note="${note}" data-sender="${sender}" data-status="${stat}" onclick="openRedPacketCenter(this, '${id}')"><div class="pay-card-body redpacket-body"><i class="ri-red-packet-fill pay-icon" style="color: #FFDE7A;"></i><div><div class="pay-info-title">${note}</div><div class="pay-info-sub packetInlineWord">微信红包 🧧</div></div></div><div class="pay-card-footer packFooterText">${footText}</div></div>`;
        });

        // 【6】转账
        pureText = pureText.replace(/<transfer amount=["']?([^"'\s]+)["']? note=["']?([^"']+)["']?(?: status=["']?([^"'\s>]+)["']?)?><\/transfer>/gi, (match, amt, note, status) => {
            const stat = status || 'new';
            const classStatus = stat === 'accepted' ? 'accepted' : (stat === 'returned' ? 'returned' : 'new');
            const footText   = stat === 'accepted' ? '已被收款' : (stat === 'returned' ? '已被退还' : '微信转账');
            return `<div class="special-msg-wrap pay-card ${classStatus}" data-amount="${amt}" data-note="${note}" data-sender="${sender}" data-status="${stat}" onclick="openTransferCenter(this, '${id}')"><div class="pay-card-body transfer-body"><i class="ri-exchange-cny-fill pay-icon" style="color: #FFF;"></i><div><div class="pay-info-title">¥ ${parseFloat(amt).toFixed(2)}</div><div class="pay-info-sub">${note}</div></div></div><div class="pay-card-footer">${footText}</div></div>`;
        });

        const quoteHtml = quoteText ? `<div class="msg-quote-block">${quoteText}</div>` : '';
        let finalDisplayHtml = pureText.replace(/\n/g, '<br>');
        const isSpecial = pureText.includes('special-msg-wrap');

        if (!isSpecial && currentChatContact.autoTranslate) {
            finalDisplayHtml = finalDisplayHtml.replace(/(?:<br>)*\s*<t>(.*?)\|(.*?)<\/t>\s*(?:<br>)*/gi, (match, orig, trans) => {
                return `<div class="kr-text-group" onclick="toggleTranslation(this, event)"><div class="trans-original">${orig.trim()}</div><div class="translate-btn"><i class="ri-translate-2"></i> 按以翻译</div><div class="translation-box">${trans.trim()}</div></div>`;
            });
        }

        const textHtml  = quoteHtml + finalDisplayHtml;
        const showCore  = (pureText.length > 0 || quoteText);
        const coreStyle = showCore ? (isSpecial ? 'background: transparent; padding: 0; box-shadow: none;' : '') : 'display: none;';
        const coreBlock = `<div class="msg-core" style="${coreStyle}">${textHtml}</div>`;
        let translateHtml = '';

        const stickerBlock = stickerObj ? `<img src="${getRealImgSrc(stickerObj.src)}" style="max-width:100px; border-radius:12px; display:block; margin-top:4px; margin-bottom:2px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">` : '';

        let chatImageBlock = '';
        if (chatImageKey) {
            const realSrc = getRealImgSrc(chatImageKey);
            chatImageBlock = `<img src="${realSrc}" style="max-width:200px; border-radius:16px; display:block; cursor:pointer; margin-top:4px; box-shadow:0 2px 10px rgba(0,0,0,0.1);" onclick="viewChatImage('${realSrc}', event)">`;
        }

        let moduleBlocks = '';
        sandboxes.forEach((htmlContent, index) => {
            moduleBlocks += `<div id="mod_${id}_${index}" class="msg-module-box" style="margin-top:6px;">${htmlContent}</div>`;
        });

        const contentCol = `<div class="msg-col">${coreBlock}${translateHtml}${chatImageBlock}${stickerBlock}${moduleBlocks}</div>`;
        const timeHtml   = `<span class="time">${timeStr}</span>`;

        if (sender === 'me') {
            let myAvatarSrc = appData.images['user-avatar'];
            if (currentChatContact.userAvatarOverride) {
                myAvatarSrc = currentChatContact.userAvatarOverride;
            } else if (currentChatContact.userMaskId) {
                const mask = appData.userMasks.find(m => m.id === currentChatContact.userMaskId);
                if (mask && mask.avatar) myAvatarSrc = mask.avatar;
            }
            newDiv.innerHTML = `${checkbox}${timeHtml}${contentCol}${stickersHtml}<img src="${getRealImgSrc(myAvatarSrc)}" class="avatar">`;
        } else {
            newDiv.innerHTML = `${checkbox}<img src="${getRealImgSrc(currentChatContact.avatar, currentChatContact.name)}" class="avatar" style="cursor:pointer;" onclick="triggerMindProbe()">${contentCol}${stickersHtml}${timeHtml}`;
        }
    }

    nodes.push(newDiv);
    return nodes;
}

// ===== 2. 往 UI 追加气泡（实时发送/接收消息时调用）=====
function appendMsgToUI(id, sender, text, timestamp, quoteText = null, isRecalled = false, stickerObj = null, chatImageKey = null) {
    const bdy = document.getElementById('at-body');

    // 新消息刚被 push 进 appData，缓存未包含它，刷新缓存（O(n) 仅在新消息时触发，不是每条都扫）
    if (!_msgIdxCache.has(id)) {
        _refreshMsgCache(currentChatContact.id);
    }

    const currIdx = _msgIdxCache.get(id) ?? -1;
    const prevMsg = currIdx > 0  ? _currentRoomMsgsFull[currIdx - 1]
                  : currIdx === 0 ? null
                  : undefined;

    // 优先用缓存里的完整对象（含 peeledStickers、voiceRead 等字段），回退到参数构造
    const msgObj = currIdx >= 0
        ? _currentRoomMsgsFull[currIdx]
        : { id, sender, content: text, timestamp, quote: quoteText, isRecalled, sticker: stickerObj, chatImage: chatImageKey };

    _buildMsgNodeSet(msgObj, prevMsg).forEach(n => bdy.appendChild(n));

    // 执行新气泡里的 sandbox 脚本（如有）
    const msgEl = bdy.querySelector(`[data-id="${id}"]`);
    if (msgEl) {
        msgEl.querySelectorAll('.msg-module-box script').forEach(old => {
            const s = document.createElement('script');
            Array.from(old.attributes).forEach(a => s.setAttribute(a.name, a.value));
            s.textContent = old.textContent;
            old.parentNode.replaceChild(s, old);
        });
    }

    bdy.scrollTop = bdy.scrollHeight;
}

// ===== 3. 插入 Emoji =====
window.insertEmoji = (emoji) => {
    const inp = document.getElementById('inp-txt');
    inp.value += emoji;
    inp.focus();
    document.getElementById('emoji-picker').classList.remove('show');
};

// ===== 新建角色时的头像预览 =====
window.previewInsUpload = (input, imgId) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById(imgId);
            img.src = e.target.result;
            img.setAttribute('data-base64', e.target.result);
            const urlInput = document.getElementById('ins-char-url');
            if (urlInput) urlInput.value = '';
        };
        reader.readAsDataURL(input.files[0]);
    }
};
