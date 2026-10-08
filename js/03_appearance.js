// ========== 外观系统：图标/标签/字体 + CSS预设 + 主题预设 ==========
// 职责：renderApprList / 字体管理 / applyGlobalCSS / CSS预设 / 主题预设

    
    window.renderApprList = () => {
        const listApps = document.getElementById('appr-list-apps');
        const listDock = document.getElementById('appr-list-dock');
        listApps.innerHTML = ''; listDock.innerHTML = '';
        
        const APPS =[
            {id:'icon-chat', txt:'label-chat', key: 'app-chat'},
            {id:'icon-world', txt:'label-world', key: 'app-world'},
            {id:'icon-api', txt:'label-api', key: 'app-api'},
            {id:'icon-forum', txt:'label-forum', key: 'app-forum'}
        ];
        const DOCKS =[
            {id:'dock-1', txt:'dock-1', key: 'dock-1'},
            {id:'dock-2', txt:'dock-2', key: 'dock-2'},
            {id:'dock-3', txt:'dock-3', key: 'dock-3'},
            {id:'dock-4', txt:'dock-4', key: 'dock-4'},
        ];

        const createItem = (item) => {
            let src = appData.images[item.id] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23eee'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='20' fill='%23999' text-anchor='middle' dy='.3em'%3EIcon%3C/text%3E%3C/svg%3E";
            const div = document.createElement('div');
            div.className = 'list-item';
            
            let currentName = appData.customTexts[item.txt];
            let placeholder = LANG_MAP[item.key][appData.lang];
            
            let labelHtml = `<input class="list-label-ipt" style="border:none;border-bottom:1px solid #eee;outline:none;width:100%" value="${currentName || ''}" placeholder="${placeholder}" oninput="updateLabel('${item.txt}', this.value)" onchange="updateLabel('${item.txt}', this.value)" onblur="updateLabel('${item.txt}', this.value)">`;
            
            div.innerHTML = `
                <div style="display:flex;align-items:center;flex:1">
                    <img id="preview-${item.id}" src="${src}" class="list-img-preview">
                    <div style="flex:1;padding-right:10px">${labelHtml}</div>
                </div>
                <button class="btn-sec" style="padding:6px 12px;border:none;border-radius:10px;font-size:12px" onclick="openUpload('${item.id}')">${LANG_MAP['btn-change'][appData.lang]}</button>
            `;
            return div;
        };
        APPS.forEach(i => listApps.appendChild(createItem(i)));
        DOCKS.forEach(i => listDock.appendChild(createItem(i)));
    };

    // updateLabel 已移至 02_app_shell.js（带防抖）避免每次按键都触发 IndexedDB 写入

    window.toggleFontForm = () => {
        const form = document.getElementById('font-add-form');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    };
    
    window.renderFontList = () => {
        const container = document.getElementById('font-list-container');
        container.innerHTML = '';
        Object.keys(appData.fontPresets).forEach(name => {
            const div = document.createElement('div');
            const isActive = appData.activeFont === name;
            div.className = 'list-item';
            div.style.border = isActive ? '1px solid #000' : 'none';
            
            let btns = '';
            if(name !== '系统默认') {
                // 原汁原味的布局，只在右边多加一个蓝色的编辑笔图标
                btns = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <i class="ri-edit-line" style="color:#007AFF; font-size:18px; cursor:pointer;" onclick="editFontPreset('${name}', event)"></i>
                    <i class="ri-close-line" style="color:#FF3B30; font-size:18px; cursor:pointer; font-weight:bold;" onclick="deleteFont('${name}', event)"></i>
                </div>`;
            }
            
            div.innerHTML = `<div style="font-weight:600; flex:1;">${name}</div> ${btns}`;
            div.onclick = (e) => { 
                if(e.target.tagName === 'I') return; // 点图标时不触发字体应用
                applyFont(name, true); 
            };
            container.appendChild(div);
        });
    };

    // 新增：点击编辑笔，自动展开添加框，并填入当前的名称和 URL 供你查看和修改
    window.editFontPreset = (name, e) => {
        e.stopPropagation();
        document.getElementById('font-name-new').value = name;
        document.getElementById('font-url-new').value = appData.fontPresets[name] || '';
        document.getElementById('font-add-form').style.display = 'block';
        document.getElementById('font-add-form').scrollIntoView({behavior: 'smooth'});
    };
    
    window.saveFontPreset = () => {
        const name = document.getElementById('font-name-new').value.trim();
        const url = document.getElementById('font-url-new').value.trim();
        if(name && url) {
            appData.fontPresets[name] = url;
            appData.activeFont = name; 
            saveData(); renderFontList(); applyFont(name);
            document.getElementById('font-add-form').style.display = 'none';
        }
    };
    
    window.deleteFont = (name, e) => {
        e.stopPropagation();
        if(confirm('确定删除该字体吗？')) {
            delete appData.fontPresets[name];
            if(appData.activeFont === name) applyFont('系统默认');
            saveData(); renderFontList();
        }
    };
    
        window.applyFont = (name, save = true) => {
        if(save) { 
            appData.activeFont = name; 
            saveData(); 
            renderFontList(); 
        }
        const styleTag = document.getElementById('global-font-style');
        const url = appData.fontPresets[name];
        
        if(!url || name === '系统默认') { styleTag.innerHTML = ''; return; }

        // 覆盖所有页面，含查手机全部子 APP
        const selector = [
            'body','input','textarea','button','select',
            '#page-chat-room','.ins-main-view',
            '.cp-clock-container','.cp-ph-container','.cp-msg-container',
            '.cp-wx-container','.cp-tb-container','.cp-notes-container',
            '.cp-mail-container','.cp-photo-container','.cp-browser-container',
            '.cp-set-container','#page-char-phone-desktop','#page-forum'
        ].join(', ');

        if(url.startsWith('data:') || /\.(ttf|woff2?|otf)/.test(url)) {
            // 本地文件 / 直链字体
            styleTag.innerHTML = `@font-face { font-family: 'CustomFont'; src: url('${url}'); }
                ${selector} { font-family: 'CustomFont', sans-serif !important; }`;
        } else if(url.includes('googleapis') || url.endsWith('.css')) {
            // Google Fonts —— 从 URL 动态提取字体族名
            const m = url.match(/family=([^&:]+)/);
            const fam = m ? decodeURIComponent(m[1].split(':')[0].replace(/\+/g,' ')) : 'CustomFont';
            styleTag.innerHTML = `@import url('${url}'); ${selector} { font-family: '${fam}', sans-serif !important; }`;
        } else {
            styleTag.innerHTML = `@font-face { font-family: 'CustomFont'; src: url('${url}'); }
                ${selector} { font-family: 'CustomFont', sans-serif !important; }`;
        }
    };

    
    window.applyFontSize = (size) => {
        document.documentElement.style.setProperty('--base-font-size', size + 'px');
        appData.fontSize = size;
        saveData();
        const slider = document.getElementById('font-size-slider');
        if(slider) slider.value = size;
    };

    window.loadAPIPreset = (name) => {
    const p = appData.apiPresets[name];
    if (p) {
        document.getElementById('api-url').value = p.url;
        document.getElementById('api-key').value = p.key;
        appData.lastApi.url = p.url;
        appData.lastApi.key = p.key;

        const modelSel = document.getElementById('api-model');
        modelSel.innerHTML = '';

        let listToRender = [];
        if (p.cachedModels && p.cachedModels.length > 0) {
            listToRender = p.cachedModels;
            appData.cachedModels = p.cachedModels;
        } else {
            listToRender = appData.cachedModels || [];
        }

        if (listToRender.length === 0) {
            modelSel.innerHTML = '<option value="">无缓存模型</option>';
        } else {
            listToRender.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m;
                opt.text = m;
                modelSel.add(opt);   // ← 补上这一行
            });
            // 如果有保存的模型，尝试选中
            if (p.model) {
                appData.lastApi.model = p.model;
                modelSel.value = p.model;
            } else if (modelSel.options.length > 0) {
                modelSel.selectedIndex = 0;
                appData.lastApi.model = modelSel.value;
            }
        }
        saveData();
    }
};

// ========== CSS预设 / 主题预设 ==========


window.applyGlobalCSS = () => {
    let styleTag = document.getElementById('global-custom-css-tag');
    if(!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'global-custom-css-tag';
        document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = appData.globalCSS || '';
};

window.renderCSSPresets = () => {
    const sel = document.getElementById('css-preset-sel');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- 选择或新建 CSS 预设 --</option>';
    if(appData.cssPresets) {
        Object.keys(appData.cssPresets).forEach(name => sel.add(new Option(name, name)));
    }
    if(currentVal && appData.cssPresets && appData.cssPresets[currentVal]) sel.value = currentVal;
};

window.loadCSSPresetToEditor = () => {
    const sel = document.getElementById('css-preset-sel');
    const name = sel.value;
    if(name && appData.cssPresets[name]) {
        document.getElementById('appr-global-css').value = appData.cssPresets[name];
        applyAndSaveCurrentCSS(); // 切换下拉框时自动应用
    } else {
        document.getElementById('appr-global-css').value = appData.globalCSS || '';
    }
};

window.applyAndSaveCurrentCSS = () => {
    const cssText = document.getElementById('appr-global-css').value;
    appData.globalCSS = cssText;
    
    // 如果当前选了某个预设，顺便把这个预设的内容更新掉
    const selName = document.getElementById('css-preset-sel').value;
    if(selName && appData.cssPresets) {
        appData.cssPresets[selName] = cssText;
    }
    
    saveData();
    applyGlobalCSS();
    showToast("CSS 渲染已应用");
};

window.saveCSSPresetAs = () => {
    const name = prompt("请输入新的 CSS 预设名称：");
    if(!name || !name.trim()) return;
    const cssText = document.getElementById('appr-global-css').value;
    
    if(!appData.cssPresets) appData.cssPresets = {};
    appData.cssPresets[name.trim()] = cssText;
    appData.globalCSS = cssText;
    
    saveData();
    renderCSSPresets();
    document.getElementById('css-preset-sel').value = name.trim();
    applyGlobalCSS();
    showToast("CSS 预设已保存！");
};

window.deleteCSSPreset = async () => {
    const sel = document.getElementById('css-preset-sel');
    const name = sel.value;
    if(!name || !appData.cssPresets[name]) { alert("请先选择要删除的 CSS 预设！"); return; }
    
    if(confirm(`确定要永久删除 CSS 预设 "${name}" 吗？`)) {
        delete appData.cssPresets[name];
        sel.value = "";
        await saveData();
        renderCSSPresets();
        showToast("CSS 预设已删除");
    }
};

// ==========================================
// 独立功能 2：纯净本地主题系统 (仅包含壁纸/图标/字体等，绝不碰CSS)
// ==========================================
window.renderThemePresets = () => {
    const sel = document.getElementById('theme-preset-sel');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- 选择主题预设 --</option>';
    if(appData.themePresets) {
        Object.keys(appData.themePresets).forEach(name => sel.add(new Option(name, name)));
    }
    if(currentVal && appData.themePresets && appData.themePresets[currentVal]) sel.value = currentVal;
};

window.saveThemePreset = async () => {
    const name = prompt("请输入新主题名称：\n(仅保存壁纸、组件、图标和字体，不含CSS)");
    if(!name || !name.trim()) return;

    if(!appData.themePresets) appData.themePresets = {};

    const presetData = {
        customTexts: JSON.parse(JSON.stringify(appData.customTexts || {})),
        activeFont: appData.activeFont,
        fontSize: appData.fontSize,
        images: {}
    };

    const THEME_KEYS =[
        'wallpaper-layer', 'hero-img', 'user-avatar',
        'icon-chat', 'icon-world', 'icon-api', 'icon-forum',
        'dock-1', 'dock-2', 'dock-3', 'dock-4'
    ];
    
    THEME_KEYS.forEach(key => {
        if (appData.images[key]) presetData.images[key] = appData.images[key];
    });

    appData.themePresets[name.trim()] = presetData;
    await saveData();
    renderThemePresets();
    showToast("主题已保存！");
};

window.loadThemePreset = async () => {
    const sel = document.getElementById('theme-preset-sel');
    const name = sel.value;
    if(!name || !appData.themePresets[name]) { alert("请先在左侧选择一个主题！"); return; }
    if(!confirm(`加载主题 "${name}"？\n当前桌面的壁纸和图标将被替换。`)) return;

    const preset = appData.themePresets[name];
    appData.customTexts = preset.customTexts || {};
    appData.activeFont = preset.activeFont || '系统默认';
    appData.fontSize = preset.fontSize || 16;

    const THEME_KEYS =[
        'wallpaper-layer', 'hero-img', 'user-avatar',
        'icon-chat', 'icon-world', 'icon-api', 'icon-forum',
        'dock-1', 'dock-2', 'dock-3', 'dock-4'
    ];

    if(!idbHelper.db) await idbHelper.init();
    const tx = idbHelper.db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');

    for (let key of THEME_KEYS) {
        if (preset.images && preset.images[key]) {
            store.put(preset.images[key], key);
            appData.images[key] = preset.images[key];
        } else {
            try { store.delete(key); } catch(err){}
            delete appData.images[key];
        }
    }

    await new Promise(resolve => tx.oncomplete = resolve);
    await saveData();
    
    alert("主题加载成功！正在刷新...");
    location.reload();
};

window.deleteThemePreset = async () => {
    const sel = document.getElementById('theme-preset-sel');
    const name = sel.value;
    if(!name || !appData.themePresets[name]) { alert("请先选择要删除的主题！"); return; }
    
    if(confirm(`永久删除主题 "${name}" 吗？`)) {
        delete appData.themePresets[name];
        await saveData();
        renderThemePresets();
        showToast("主题已删除");
    }
};
