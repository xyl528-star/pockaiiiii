// ========== 核心数据层：IndexedDB + appData + saveData/loadData ==========

// ==================== 全局工具函数 ====================

/**
 * 防抖函数：delay 毫秒内重复调用只执行最后一次
 */
window.debounce = (fn, delay = 300) => {
    let timer = null;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
};

/**
 * 生成简洁默认头像 SVG（灰色圆形 + 白色首字母）
 * 不依赖网络，本地即时生成，替代 dicebear
 * @param {string} name - 联系人名字
 * @returns {string} - data URI (SVG)
 */
window.makeDefaultAvatar = (name) => {
    const letter = (name || '?').charAt(0).toUpperCase();
    // 根据名字生成固定但有变化的灰色调，避免全部一个颜色太单调
    const hues = ['#8E8E93','#636366','#48484A','#6E6E73','#98989D','#AEAEB2'];
    const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length;
    const bg = hues[idx];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>
        <circle cx='40' cy='40' r='40' fill='${bg}'/>
        <text x='40' y='40' dy='0.35em' text-anchor='middle' font-family='-apple-system,BlinkMacSystemFont,sans-serif' font-size='32' font-weight='600' fill='#fff'>${letter}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

// === 独家定制：Intiface 硬件通感中枢 (作为底层引擎依然保留声明) ===
const IntifaceLogic = {
    client: null,
    toyDevice: null,
    async connectAndSetup() { /* 已被精简收起待后续UI重构时调用 */ },
    async triggerVibe(level, timeMS) { /* ... */ }
};

    const KEY = 'my_phone_data_v1'; 
    const DB_NAME = 'MyPhoneDB_V10_Pro'; 
    const STORE_IMAGES = 'images';
    const STORE_DATA = 'app_data';       
    const DATA_KEY = 'main_data';

    const idbHelper = {
        db: null,
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, 1);
                request.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains(STORE_IMAGES)) db.createObjectStore(STORE_IMAGES);
                    if (!db.objectStoreNames.contains(STORE_DATA)) db.createObjectStore(STORE_DATA);
                };
                request.onsuccess = (e) => { this.db = e.target.result; resolve(this.db); };
                request.onerror = (e) => reject(e);
            });
        },
        async saveImage(id, base64) {
            if(!this.db) await this.init();
            return this.tx(STORE_IMAGES, 'readwrite').put(base64, id);
        },
        async getImage(id) {
            if(!this.db) await this.init();
            return this.getReq(STORE_IMAGES, id);
        },
        async saveMainData(data) {
            if(!this.db) await this.init();
            // 性能优化：使用解构赋值排除 images，避免 JSON.stringify 巨大的图片数据导致卡顿
            const { images, ...rest } = data;
            const cleanData = { ...rest, images: {} };
            return this.tx(STORE_DATA, 'readwrite').put(cleanData, DATA_KEY);
        },
        async loadMainData() {
            if(!this.db) await this.init();
            return this.getReq(STORE_DATA, DATA_KEY);
        },
        async clear() {
            if(!this.db) await this.init();
            const tx = this.db.transaction([STORE_IMAGES, STORE_DATA], 'readwrite');
            tx.objectStore(STORE_IMAGES).clear();
            tx.objectStore(STORE_DATA).clear();
            return new Promise(resolve => tx.oncomplete = resolve);
        },
        tx(storeName, mode) { return this.db.transaction(storeName, mode).objectStore(storeName); },
        getReq(storeName, key) {
            return new Promise((resolve) => {
                const req = this.db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = () => resolve(null);
            });
        }
    };

    const DEFAULTS = {
        lang: 'cn', 
        enableLockScreen: false, // 👈 新增：锁屏默认关闭
        images: {
            // 👇 新增：锁屏的默认壁纸 (高冷夜空黑)
            'lockscreen-bg': "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop", 
            'wallpaper-layer': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='430' height='932'%3E%3Crect width='430' height='932' fill='%231a1a1a'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='40' fill='%23333' text-anchor='middle' dy='.3em'%3EWallpaper%3C/text%3E%3C/svg%3E",
            // ... 后面保持原样
            'user-avatar': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='160' height='160' fill='%23ddd'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%23fff' text-anchor='middle' dy='.3em'%3EAvatar%3C/text%3E%3C/svg%3E"
        },
        customTexts: {},
        fontPresets: { '系统默认': '', '站酷小薇': 'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap' },
        activeFont: '系统默认',
        fontSize: 16, 
        themePresets: {}, 
        globalCSS: '',    
        cssPresets: {},   /* <--- 新增：独立的 CSS 预设库 */
        apiPresets: {},
        lastApi: { url: '', key: '', model: '', temp: 0.7 },
        cachedModels: [],
        world: [],
        chatData: { chats:[], contacts: [], messages:[], posts:[] },
        // 👇 在这里新增 Library 的专属数据结构
        libraryData: {
            categories:[
                { id: 'cat_default_1', name: 'Modern', desc: '现代都市题材，日常轻松向。' },
                { id: 'cat_default_2', name: 'Ancient', desc: '古代背景，古风权谋或江湖武侠。文笔偏古风韵味。' }
            ],
            currentCatId: 'cat_default_1',
            books: [],
            posts: [],
            collections:[]
        },
        // 👆 新增结束
        stickerVault: [ /* ... */ ]
    };

    const LANG_MAP = {
        'search': { cn: '搜索' },
        'title-appr': { cn: '外观设置' },
        'grp-bg': { cn: '全局背景' },
        'grp-home': { cn: '桌面组件' },
        'grp-icons': { cn: '应用图标' },
        'grp-dock': { cn: '底部 Dock' },
        'item-wall': { cn: '壁纸' },
        'item-hero': { cn: '主页大图' },
        'item-avatar': { cn: '头像' },
        'btn-change': { cn: '更换' },
        'btn-reset': { cn: '重置外观' },
        'title-font': { cn: '字体管理' },
        'font-add': { cn: '添加新字体' },
        'font-list': { cn: '我的字体' },
        'title-world': { cn: '世界书' },
        'modal-title': { cn: '更换图片' },
        'btn-local': { cn: '本地上传' },
        'modal-url': { cn: '或输入图片链接:' },
        'btn-ok': { cn: '确定' },
        'btn-save': { cn: '保存' },
        'btn-del': { cn: '删' },
        'btn-cancel': { cn: '取消' },
        'api-preset': { cn: '预设配置' },
        'api-save': { cn: '保存当前配置' },
        'api-url': { cn: '服务器地址 (URL)' },
        'api-key': { cn: 'API 密钥 (Key)' },
        'api-conn': { cn: '连接并获取模型' },
        'api-model': { cn: '模型选择 (已缓存)' },
        'wb-edit': { cn: '编辑条目' },
        'profile-edit': { cn: '编辑个人资料' },
        'app-chat': { cn: '聊天' },
        'app-world': { cn: '世界书' },
        'app-api': { cn: '接口' },
        'app-forum': { cn: '阅读' },
        'dock-1': { cn: '外观' },
        'dock-2': { cn: '相册' },
        'dock-3': { cn: '字体' },
        'dock-4': { cn: '时钟' },
        'edit-mood': { cn: '保持简单。' },
        'edit-name': { cn: '用户' },
        'edit-status': { cn: '# 专注' },
        'api-backup': { cn: '数据备份与恢复' },
        'btn-export': { cn: '导出备份文件' },
        'btn-import': { cn: '从文件恢复' },
        'backup-tip': { cn: '* 备份包含所有聊天记录、设置和图片。' }
    };

    let appData = null;
    let currentUploadId = null; 

    async function loadData() {
        try {
            await idbHelper.init();
            const stored = await idbHelper.loadMainData();
            if (stored) {
                appData = {
                    ...DEFAULTS, ...stored,
                    chatData: { ...DEFAULTS.chatData, ...(stored.chatData || {}) },
                    lastApi: { ...DEFAULTS.lastApi, ...(stored.lastApi || {}) }
                };
                appData.images = { ...DEFAULTS.images }; 
            } else {
                appData = JSON.parse(JSON.stringify(DEFAULTS));
            }
            await loadAllImagesFromDB();
        } catch (e) {
            console.error("Load Error", e);
            appData = JSON.parse(JSON.stringify(DEFAULTS));
        }
    }

    function showToast() {
        const t = document.getElementById('toast');
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 1500);
    }

    // ✅ 修改：加入全局防抖定时器
let saveTimer = null;

function saveData() { 
    // 如果 500 毫秒内有新的保存请求，取消上一次，重新计时
    if (saveTimer) clearTimeout(saveTimer);
    
    saveTimer = setTimeout(async () => {
        try { 
            await idbHelper.saveMainData(appData);
            console.log("Data saved successfully.");
        } catch (e) { 
            console.error("Save Error: " + e.message);
            // 避免频繁弹窗打断用户，改为轻提示
            showToast('⚠️ 数据自动保存失败，请检查空间');
        }
    }, 500); // 500毫秒的缓冲期
}

// 可选：如果你在某些关键操作（如退出页面、删除角色）需要立即保存，可以加一个立刻保存的方法：
async function saveDateImmediate() {
    if (saveTimer) clearTimeout(saveTimer);
    try { await idbHelper.saveMainData(appData); } catch (e) { console.error(e); }
}

