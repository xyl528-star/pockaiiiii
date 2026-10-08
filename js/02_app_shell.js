// ========== 应用外壳：页面切换 / 时钟 / 图片上传 / 个人资料 / 初始化入口 ==========
// 职责：openPage / closePage / renderDOM / updateImgDOM / startClock / window.onload

// ==========================================
// 页面层切换
// ==========================================

window.openPage = async (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('visible');
    if (id === 'page-appr') renderApprList();
    else if (id === 'page-api') renderAPIPresets();
    else if (id === 'page-world') renderWbList();
};

window.closePage = (id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
};

// ==========================================
// 图片上传
// ==========================================

window.openUpload = (id) => {
    currentUploadId = id;
    document.getElementById('url-core').value = '';
    document.getElementById('modal-upload').classList.add('show');
};

window.confirmUrlInput = () => {
    const url = document.getElementById('url-core').value;
    if (url && currentUploadId) window.handleImage(url);
};

window.handleImage = async (src) => {
    if (currentUploadId) {
        try { await idbHelper.saveImage(currentUploadId, src); } catch(e) {}
        appData.images[currentUploadId] = src;
        updateImgDOM(currentUploadId, src);
        saveData();
        document.getElementById('modal-upload').classList.remove('show');
    }
};

// ==========================================
// 个人资料编辑
// ==========================================

window.openProfileEdit = () => {
    const getName   = () => appData.customTexts['display-name']   || LANG_MAP['edit-name'][appData.lang];
    const getStatus = () => appData.customTexts['display-status'] || LANG_MAP['edit-status'][appData.lang];
    document.getElementById('ipt-profile-name').value   = getName();
    document.getElementById('ipt-profile-status').value = getStatus();
    document.getElementById('modal-profile').classList.add('show');
};

window.saveProfile = () => {
    appData.customTexts['display-name']   = document.getElementById('ipt-profile-name').value;
    appData.customTexts['display-status'] = document.getElementById('ipt-profile-status').value;
    saveData();
    renderDOM();
    document.getElementById('modal-profile').classList.remove('show');
};

// ==========================================
// DOM 渲染（与原版完全一致，含 [data-txt] 选择器）
// ==========================================

function renderDOM() {
    // 多语言文本节点 —— 使用正确的 data-txt 属性
    document.querySelectorAll('[data-txt]').forEach(el => {
        const key = el.getAttribute('data-txt');
        if (LANG_MAP[key]) el.innerText = LANG_MAP[key][appData.lang];
    });

    const setText = (domId, mapKey) => {
        const el = document.getElementById(domId);
        if (!el) return;
        const custom = appData.customTexts[domId];
        const def    = LANG_MAP[mapKey] ? LANG_MAP[mapKey][appData.lang] : '';
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = custom || def;
        } else {
            el.innerText = custom || def;
        }
    };

    setText('display-name',   'edit-name');
    setText('display-status', 'edit-status');
    setText('edit-mood',      'edit-mood');

    const capEl = document.getElementById('edit-capsule');
    if (capEl && appData.customTexts['edit-capsule']) capEl.value = appData.customTexts['edit-capsule'];

    [
        { domId: 'label-chat',  mapKey: 'app-chat'  },
        { domId: 'label-world', mapKey: 'app-world' },
        { domId: 'label-api',   mapKey: 'app-api'   },
        { domId: 'label-forum', mapKey: 'app-forum' }
    ].forEach(item => setText(item.domId, item.mapKey));

    // 所有已存图片（含角色头像等动态 key）
    for (const k in appData.images) updateImgDOM(k, appData.images[k]);

    // 字体 & 字号
    applyFont(appData.activeFont, false);
    if (appData.fontSize) applyFontSize(appData.fontSize);

    // API 配置回填
    const urlEl = document.getElementById('api-url');
    const keyEl = document.getElementById('api-key');
    if (urlEl) urlEl.value = appData.lastApi.url || '';
    if (keyEl) keyEl.value = appData.lastApi.key || '';
    if (appData.lastApi.temp) {
        const tempEl  = document.getElementById('api-temp');
        const tempVal = document.getElementById('temp-val');
        if (tempEl)  tempEl.value     = appData.lastApi.temp;
        if (tempVal) tempVal.innerText = appData.lastApi.temp;
    }

    // 锁屏开关同步
    const lsTgl = document.getElementById('appr-lock-tgl');
    if (lsTgl) {
        appData.enableLockScreen ? lsTgl.classList.add('on') : lsTgl.classList.remove('on');
    }
}

// ==========================================
// 单张图片 DOM 更新（处理壁纸/锁屏/图标/Dock）
// ==========================================

function updateImgDOM(id, src) {
    if (!src) return;

    // 外观页预览图
    const previewEl = document.getElementById('preview-' + id);
    if (previewEl) previewEl.src = src;

    if (id === 'wallpaper-layer') {
        const el = document.getElementById(id);
        if (el && el.style.backgroundImage !== `url("${src}")`)
            el.style.backgroundImage = `url('${src}')`;
    } else if (id === 'lockscreen-bg') {
        const ls = document.getElementById('lock-screen');
        if (ls) ls.style.backgroundImage = `url('${src}')`;
    } else {
        const el = document.getElementById(id);
        if (el) {
            if (el.tagName === 'IMG') {
                el.src = src;
            } else {
                // Dock / App 图标：找子 img，无则创建
                let img = el.querySelector('img.app-img-cover, img.dock-img-cover');
                if (!img) {
                    img = document.createElement('img');
                    img.className = id.startsWith('dock') ? 'dock-img-cover' : 'app-img-cover';
                    el.appendChild(img);
                }
                img.src = src;
                el.classList.add('has-img');
            }
        }
    }
}

// ==========================================
// 标签文字更新（防抖 500ms，不再每次按键写 IndexedDB）
// ==========================================

const _labelSaveTimer = { id: null };
window.updateLabel = (key, val) => {
    appData.customTexts[key] = val;
    clearTimeout(_labelSaveTimer.id);
    _labelSaveTimer.id = setTimeout(saveData, 500);
    const el = document.getElementById(key);
    if (el) {
        const fallback = LANG_MAP[key.replace('label-', 'app-')];
        el.innerText = val || (fallback ? fallback[appData.lang] : val);
    }
};

// ==========================================
// 从 IndexedDB 加载所有图片（cursor 遍历，加载角色头像）
// ==========================================

async function loadAllImagesFromDB() {
    if (!idbHelper.db) await idbHelper.init();
    return new Promise((resolve) => {
        const tx    = idbHelper.db.transaction(STORE_IMAGES, 'readonly');
        const store = tx.objectStore(STORE_IMAGES);
        const req   = store.openCursor();
        req.onsuccess = (e) => {
            const cursor = e.target.result;
            if (cursor) {
                appData.images[cursor.key] = cursor.value;
                cursor.continue();
            } else {
                resolve();
            }
        };
        req.onerror = () => resolve();
    });
}

// ==========================================
// 输入框绑定（防抖 500ms）
// ==========================================

function setupInputs() {
    let inputTimeout = null;

    const bindInput = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const saver = function() {
            appData.customTexts[id] = this.value;
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(saveData, 500);
        };
        el.oninput  = saver;
        el.onchange = function() { clearTimeout(inputTimeout); appData.customTexts[id] = this.value; saveData(); };
        el.onblur   = function() { clearTimeout(inputTimeout); appData.customTexts[id] = this.value; saveData(); };
    };

    bindInput('edit-mood');
    bindInput('edit-capsule');

    const urlEl = document.getElementById('api-url');
    const keyEl = document.getElementById('api-key');
    if (urlEl && keyEl) {
        const saveApiDebounced  = () => { appData.lastApi.url = urlEl.value; appData.lastApi.key = keyEl.value; clearTimeout(inputTimeout); inputTimeout = setTimeout(saveData, 500); };
        const saveApiImmediate  = () => { appData.lastApi.url = urlEl.value; appData.lastApi.key = keyEl.value; saveData(); };
        [urlEl, keyEl].forEach(el => { el.oninput = saveApiDebounced; el.onchange = saveApiImmediate; el.onblur = saveApiImmediate; });
    }
}

function setupFileUpload() {
    const fileInput = document.getElementById('file-core');
    if (!fileInput) return;
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && currentUploadId) {
            const reader = new FileReader();
            reader.onload = (ev) => window.handleImage(ev.target.result);
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    });
}

// ==========================================
// 时钟（10秒刷新；仅锁屏可见时才更新锁屏时间，避免无谓重绘）
// ==========================================

function startClock() {
    const t = document.getElementById('clock-display');
    if (!t) return;
    const tick = () => {
        const d       = new Date();
        const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        if (t.innerText !== timeStr) t.innerText = timeStr;
        // 只在锁屏显示时才更新，减少 DOM 操作
        const ls = document.getElementById('lock-screen');
        if (ls && ls.style.display !== 'none') updateLockScreenTime();
    };
    tick();
    setInterval(tick, 10000);
}

// ==========================================
// 重置外观
// ==========================================

window.resetDefaults = async () => {
    if (!confirm('确定重置外观设置吗？(聊天记录和数据将保留)')) return;
    appData.images      = { ...DEFAULTS.images };
    appData.customTexts = {};
    appData.activeFont  = '系统默认';
    appData.fontSize    = 16;
    if (!idbHelper.db) await idbHelper.init();
    const tx    = idbHelper.db.transaction(STORE_IMAGES, 'readwrite');
    const store = tx.objectStore(STORE_IMAGES);
    ['wallpaper-layer','hero-img','user-avatar','icon-chat','icon-world','icon-api','icon-forum','dock-1','dock-2','dock-3','dock-4']
        .forEach(key => { try { store.delete(key); } catch(e){} });
    await saveData();
    location.reload();
};

// ==========================================
// 总初始化入口（使用 window.onload 与原版保持一致）
// ==========================================

window.onload = async () => {
    try {
        await loadData();
        startClock();
        renderDOM();
        applyGlobalCSS();
        setupInputs();
        setupFileUpload();
        renderFontList();
        initStickerDragSystem();

        if (appData.enableLockScreen) {
            const ls = document.getElementById('lock-screen');
            if (ls) {
                ls.style.display = 'flex';
                ls.style.transform = 'translateY(0)';
                ls.style.opacity = '1';
                updateLockScreenTime();
            }
        }
    } catch (e) {
        console.error('初始化失败:', e);
    }

    // 无论成败，开屏都必须在 4.5 秒后消失
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 1000);
        }
    }, 4500);
};