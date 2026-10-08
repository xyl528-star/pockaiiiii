// ========= 15_forum.js 论坛 APP v12 =========
(function(){
'use strict';

function fd(){
    if(!appData.forumData){
        try{var bak=localStorage.getItem('_fdbak');if(bak)appData.forumData=JSON.parse(bak);}catch(e){}
    }
    if(!appData.forumData) appData.forumData={profile:{username:'迷途旅人',bio:'在迷雾中寻找光的方向……',avatar:''},activeWorldId:null,worlds:[],favorites:[]};
    var d=appData.forumData;
    if(!d.worlds||!d.worlds.length){var w0=_nw('灵域论坛');d.worlds=[w0];d.activeWorldId=w0.id;}
    if(!d.activeWorldId)d.activeWorldId=d.worlds[0].id;
    return d;
}
function _nw(name){
    return{id:'fw_'+Date.now(),name:name||'新论坛',desc:'一个神秘的角落……',heroBg:'',avatar:'',memberCount:'',archiveCount:'',charIds:[],maskIds:[],worldBook:'',postRules:'',postsPerGen:8,commentsPerPost:15,posts:[],pinnedPosts:[]};
}
function fw(){var d=fd();return d.worlds.find(function(w){return w.id===d.activeWorldId;})||d.worlds[0];}
function _save(){try{localStorage.setItem('_fdbak',JSON.stringify(appData.forumData));}catch(e){}saveData();}

// ── 健壮 JSON 解析 ────────────────────────────────────────────────
function _json(raw){
    if(!raw||!raw.trim())throw new Error('AI未返回内容，请重试');
    var s=raw.trim();
    try{var r=JSON.parse(s);if(Array.isArray(r)&&r.length)return r;}catch(e){}
    var m=s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if(m){try{var r2=JSON.parse(m[1].trim());if(Array.isArray(r2)&&r2.length)return r2;}catch(e){}}
    var a=s.indexOf('['),b=s.lastIndexOf(']');
    if(a!==-1&&b>a){
        var cand=s.slice(a,b+1).replace(/,\s*([}\]])/g,'$1').replace(/([{,]\s*)(\w+)\s*:/g,'$1"$2":').replace(/:\s*'([^']*)'/g,':"$1"');
        try{var r3=JSON.parse(cand);if(Array.isArray(r3)&&r3.length)return r3;}catch(e){}
    }
    var objs=[],rx=/\{[^{}]+\}/g,match;
    while((match=rx.exec(s))!==null){try{var o=JSON.parse(match[0]);if(o&&o.username)objs.push(o);}catch(e){}}
    if(objs.length>0)return objs;
    throw new Error('AI返回格式有误，请重试');
}

// ── API ───────────────────────────────────────────────────────────
async function _api(prompt,maxTok){
    var api=appData.lastApi||{};
    if(!api.url||!api.key)throw new Error('请先在主界面【设置】配置 API 地址和 Key');
    var base=api.url.replace(/\/+$/,'');
    var clean=String(prompt).replace(/[\u0000-\u001F\u007F-\u009F]/g,' ');
    var body={model:String(api.model||'gpt-3.5-turbo'),max_tokens:parseInt(maxTok)||2000,messages:[{role:'user',content:clean}]};
    var tmp=parseFloat(api.temp);if(!isNaN(tmp)&&tmp>0&&tmp<=2)body.temperature=tmp;
    var resp;
    try{resp=await fetch(base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+api.key},body:JSON.stringify(body)});}
    catch(e){throw new Error('网络错误：'+e.message);}
    if(!resp.ok){var t=await resp.text().catch(function(){return '';});throw new Error('API '+resp.status+'：'+t.slice(0,120));}
    var data=await resp.json();
    if(data.error)throw new Error(data.error.message||'接口报错');
    return((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'').trim();
}

function _bg(){var w=fw(),hh=document.querySelector('#fv-home .f-hero-header');if(!hh)return;
    if(w.heroBg){hh.style.backgroundImage='url("'+w.heroBg+'")';hh.style.backgroundSize='cover';hh.style.backgroundPosition='center';}
    else hh.style.backgroundImage='';
}

var _vw='home',_tab='latest',_pin=false,_did=null;

window.openForumApp=function(){fd();openPage('page-forum');_bg();_hdr();fV('home',false);_pins();fT('latest',false);};

window.fV=function(v,r){_vw=v;r=r===undefined?true:r;
    document.querySelectorAll('.fv').forEach(function(e){e.classList.remove('fv-on');});
    var el=document.getElementById('fv-'+v);if(el)el.classList.add('fv-on');
    document.querySelectorAll('.f-nav-elm').forEach(function(n){n.classList.toggle('active',n.dataset.v===v);});
    if(r){if(v==='home'){_pins();_posts();}if(v==='profile')_prof();if(v==='discover')_disc();}
};
window.fSwitchView=window.fV;
window.fT=function(t,r){_tab=t;r=r===undefined?true:r;
    document.querySelectorAll('.f-c-tab').forEach(function(x){x.classList.toggle('active',x.dataset.tab===t);});
    if(r)_posts();
};
window.fSwitchTab=window.fT;

function _hdr(){var w=fw(),q=function(i){return document.getElementById(i);};
    if(q('f-hero-name'))q('f-hero-name').textContent=w.name||'灵域论坛';
    if(q('f-hero-desc'))q('f-hero-desc').textContent=w.desc||'';
    if(q('f-hero-stats'))q('f-hero-stats').textContent='成员 '+(w.memberCount||'0')+' | 档案 '+(w.archiveCount||'0');
    var av=q('f-hero-av'),fb=q('f-hero-av-fb');
    if(w.avatar){if(av){av.src=w.avatar;av.style.display='block';}if(fb)fb.style.display='none';}
    else{if(av)av.style.display='none';if(fb)fb.style.display='flex';}
}
function _pins(){var p=fw().pinnedPosts||[],l=document.getElementById('f-pin-list'),c=document.getElementById('f-pin-count');
    if(c)c.textContent='共'+p.length+'条 ∨';
    if(!l)return;
    l.innerHTML=p.length===0?'<div class="f-pin-item" style="color:#bbb;">生成后自动置顶</div>':
        p.map(function(x){return '<div class="f-pin-item" onclick="fOpenPost(\''+x.id+'\')">'+x.title+'</div>';}).join('');
}
window.fTogglePin=function(){_pin=!_pin;var b=document.getElementById('f-pin-box'),c=document.getElementById('f-pin-count');
    if(b)b.classList.toggle('open',_pin);var n=(fw().pinnedPosts||[]).length;
    if(c)c.textContent=_pin?'共'+n+'条 ∧':'共'+n+'条 ∨';
};

// ── 帖子卡片（爱心 | 评论数 | + 追加评论）────────────────────────
function _posts(){var pp=(fw().posts||[]).filter(function(p){return p.tab===_tab;}),el=document.getElementById('f-feed-list');
    if(!el)return;
    el.innerHTML=pp.length===0?'<div class="f-empty"><p>点右上角 ✦ 生成帖子</p></div>':pp.map(_card).join('');
}
function _card(p){
    var fv=(fd().favorites||[]).includes(p.id);
    var cmtCount=(p.commentData&&p.commentData.length)||p.comments||0;
    var defAv='<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>';
    return '<article class="f-post-item" onclick="fOpenPost(\''+p.id+'\')">'+
        '<div class="f-post-author">'+
            '<span class="f-post-avatar" style="color:#888;">'+defAv+'</span>'+
            '<span class="f-author-id">'+(p.username||'')+'</span>'+
            '<span class="f-author-time">'+(p.time||'')+'</span>'+
        '</div>'+
        '<div class="f-post-title">'+(p.title||'')+'</div>'+
        '<div class="f-post-preview">'+((p.body||'').slice(0,90))+'…</div>'+
        '<div class="f-post-actions" onclick="event.stopPropagation()">'+
            '<div class="f-act-btn '+(fv?'fav-on':'')+'" onclick="fFav(\''+p.id+'\')">'+
                '<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 00-7.8 7.8l8.9 8.9 8.9-8.9a5.5 5.5 0 000-7.8z"/></svg>'+
                (p.likes||0)+
            '</div>'+
            '<div class="f-act-btn" onclick="fOpenPost(\''+p.id+'\')">'+
                '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'+
                cmtCount+
            '</div>'+
        '</div>'+
    '</article>';
}

// ── 生成帖子（严格用 postsPerGen，用角色真实 name 非 note）────────
window.fGenerate=async function(){
    var w=fw(),btn=document.getElementById('f-gen-btn'),el=document.getElementById('f-feed-list');
    if(btn)btn.style.opacity='0.3';if(el)el.innerHTML='<div class="f-loading">生成中……</div>';
    var cs=(appData.chatData&&appData.chatData.contacts)||[],ms=appData.userMasks||[];
    var sc=cs.filter(function(c){return(w.charIds||[]).includes(c.id);}),sm=ms.filter(function(m){return(w.maskIds||[]).includes(m.id);});
    var tn={latest:'最新',hot:'热门',featured:'精华',help:'友友互助'};
    // 严格使用设置的帖子数和评论数
    var n=Math.max(2,parseInt(w.postsPerGen)||8);
    var mc=Math.max(2,parseInt(w.commentsPerPost)||15);
    var ts=Date.now();

    var charInfo=sc.map(function(c){
        var nm=c.name||c.id;
        return '【角色：'+nm+'】人设：'+((c.systemPrompt||'').slice(0,200));
    }).join('\n');
    var myCtx=sm.length?'（玩家：'+sm.map(function(m){return m.name;}).join('、')+'，仅作背景参考，禁止代玩家发帖）':'';

    var lines=[
        '你是中文论坛内容生成器。当前论坛：'+w.name+' 版块：'+(tn[_tab]||_tab),
        charInfo||'',
        myCtx,
        w.worldBook?'【世界观】：'+w.worldBook.slice(0,300):'',
        '生成要求：',
        '1. 必须一次性生成 '+n+' 个帖子。每个帖子内部必须包含 '+mc+' 条跟帖评论。',
        '2. 发帖人和评论人可以是PC或指定角色（使用符合他们性格的网名/ID），因为是匿名论坛，互相不知道真实身份，只能猜测。也可以有其他路人网友。',
        '3. 绝对禁止代替玩家（用户/我）发帖或发言，不要夺舍玩家视角。',
        '4. 只返回JSON数组，禁止任何多余文字或markdown代码块以外的内容。',
        '',
        '返回JSON格式示例：',
        '[{"id":"fp'+ts+'_0","tab":"'+_tab+'","username":"发帖网名","time":"X分钟前","title":"帖子标题","body":"帖子正文","likes":50,"commentData":[{"username":"评论网名","time":"X分钟前","body":"评论内容"}]}]'
    ].filter(Boolean).join('\n');

    try{
        var raw=await _api(lines, 3500), nps=_json(raw);
        nps=nps.map(function(p,i){
            p.id=p.id||('fp'+ts+'_'+i);p.tab=_tab;
            p.likes=parseInt(p.likes)||Math.floor(Math.random()*100+10);
            p.commentData=Array.isArray(p.commentData)?p.commentData:[];
            p.comments=p.commentData.length;
            return p;
        });
        w.posts=(w.posts||[]).filter(function(p){return p.tab!==_tab;}).concat(nps);
        if(_tab==='latest')w.pinnedPosts=nps.slice(0,3).map(function(p){return{id:p.id,title:p.title};});
        _save();_hdr();_pins();_posts();
    }catch(e){
        if(el)el.innerHTML='<div class="f-empty" style="color:#c00;padding:20px;">'+e.message+'</div>';
    }
    if(btn)btn.style.opacity='1';
};

// ── 帖子详情 ─────────────────────────────────────────────────────
window.fOpenPost=function(id){
    var w=fw(),p=(w.posts||[]).find(function(x){return x.id===id;});if(!p)return;_did=id;
    var fv=(fd().favorites||[]).includes(id);
    var cmtCount=(p.commentData&&p.commentData.length)||0;
    var defAv='<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>';
    var cm=(p.commentData||[]).map(function(c){
        return '<div class="f-comment">'+
            '<span class="f-cmt-avatar" style="color:#888;">'+defAv+'</span>'+
            '<div class="f-cmt-body-wrap">'+
                '<span class="f-cmt-name">'+(c.username||'用户')+'</span>'+
                '<span class="f-cmt-time">'+(c.time||'')+'</span>'+
                '<p class="f-cmt-body">'+(c.body||'')+'</p>'+
            '</div></div>';
    }).join('');
    var vw=document.getElementById('fv-detail');
    vw.innerHTML=
        '<div class="f-detail-header">'+
            '<div class="f-back-btn" onclick="fV(\'home\')"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></div>'+
            '<span>帖子详情</span>'+
            '<div class="f-fav-btn" onclick="fFav(\''+id+'\',true)"><svg viewBox="0 0 24 24" width="22" height="22" fill="'+(fv?'#e05':'none')+'" stroke="'+(fv?'#e05':'currentColor')+'" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.7 0l-1.1 1-1.1-1a5.5 5.5 0 00-7.8 7.8l8.9 8.9 8.9-8.9a5.5 5.5 0 000-7.8z"/></svg></div>'+
        '</div>'+
        '<div class="f-detail-scroll">'+
            '<div class="f-detail-author">'+
                '<div style="width:36px;height:36px;color:#888;display:flex;align-items:center;justify-content:center;">'+defAv+'</div>'+
                '<div><div class="f-author-id">'+(p.username||'')+'</div><div class="f-author-time">'+(p.time||'')+'</div></div>'+
            '</div>'+
            '<h2 class="f-detail-title">'+(p.title||'')+'</h2>'+
            '<div class="f-detail-body" id="f-detail-body">'+((p.body||'').replace(/\n/g,'<br>'))+'</div>'+
            '<div class="f-cmts-section">'+
                '<div class="f-cmts-header" style="display:flex;justify-content:space-between;align-items:center;">'+
                    '<span>评论 · '+cmtCount+' 条</span>'+
                    '<div onclick="fAddCmts(\''+id+'\')" title="追加生成评论" style="cursor:pointer;color:#888;padding:4px;">'+
                        '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'+
                    '</div>'+
                '</div>'+
                '<div id="f-cmts-list">'+
                    (cm||'<div class="f-empty" style="padding:16px 0;color:#bbb;">暂无评论，点击右上角 + 生成</div>')+
                '</div>'+
            '</div>'+
        '</div>';
    fV('detail',false);
};

// ── 追加评论（不清空原有）────────────────────────────────────────
window.fAddCmts=async function(id,e){
    if(e)e.stopPropagation();
    var w=fw(),p=(w.posts||[]).find(function(x){return x.id===id;});if(!p)return;
    var n=Math.max(2,parseInt(w.commentsPerPost)||15);
    var existing=(p.commentData||[]).length;
    var prompt=[
        '在"'+w.name+'"论坛，帖子：'+p.title,
        '正文：'+(p.body||'').slice(0,150),
        '目前已有'+existing+'条评论，追加'+n+'条新跟帖（内容不重复，态度多元）。',
        '网名可以是PC、角色或路人网友。禁止代替玩家真实身份发言。',
        '只返回JSON数组：[{"username":"网名","time":"X分钟前","body":"内容"}]'
    ].join('\n');
    try{
        var raw=await _api(prompt,Math.max(1500,n*120)),cmts=_json(raw);
        cmts=cmts.map(function(c,i){return{username:c.username||('用户'+i),time:c.time||(i+'分钟前'),body:c.body||''};});
        p.commentData=(p.commentData||[]).concat(cmts);
        p.comments=p.commentData.length;
        _save();if(_did===id)fOpenPost(id);else _posts();
    }catch(er){alert(er.message);}
};



// ── 收藏 ─────────────────────────────────────────────────────────
window.fFav=function(id,det){
    var d=fd();if(!d.favorites)d.favorites=[];
    var i=d.favorites.indexOf(id);
    if(i>=0){d.favorites.splice(i,1);}
    else{d.favorites.push(id);var p=fw().posts&&fw().posts.find(function(x){return x.id===id;});if(p)p.likes=(p.likes||0)+1;}
    _save();_hdr();if(det)fOpenPost(id);else _posts();
};
window.fToggleFav=window.fFav;

// ── 发现：综合热度排序（非"我的"）───────────────────────────────
function _disc(){
    var el=document.getElementById('f-discover-list');if(!el)return;
    var all=(fw().posts||[]).slice().sort(function(a,b){
        return((b.likes||0)+((b.commentData&&b.commentData.length)||b.comments||0)*2)-
               ((a.likes||0)+((a.commentData&&a.commentData.length)||a.comments||0)*2);
    });
    el.innerHTML=all.length===0?'<div class="f-empty">先在首页生成帖子</div>':
        '<div style="padding:10px 0 4px;font-size:12px;color:#bbb;text-align:center;">全板块综合热度</div>'+
        all.map(_card).join('');
}

window.fOpenSearch=function(){
    var kw=prompt('搜索帖子标题或内容：');if(!kw)return;
    var r=(fw().posts||[]).filter(function(p){return p.title.includes(kw)||(p.body||'').includes(kw);});
    var el=document.getElementById('f-feed-list');
    if(el)el.innerHTML=r.length===0?'<div class="f-empty">未找到"'+kw+'"</div>':r.map(_card).join('');
};
window.fShareToChar=function(){
    var w=fw(),cid=(w.charIds||[])[0],c=cid&&((appData.chatData&&appData.chatData.contacts)||[]).find(function(x){return x.id===cid;});
    if(!c){alert('请先在生成设置里绑定角色');return;}
    var tt=(w.posts||[]).slice(-3).map(function(p){return p.title;}).join('、');
    if(!tt){alert('暂无帖子');return;}
    if(typeof openChatRoom==='function')openChatRoom(c.id);
    setTimeout(function(){var inp=document.getElementById('inp-txt');if(inp)inp.value='[论坛]"'+w.name+'"最新：'+tt;},400);
};

// ── Profile ───────────────────────────────────────────────────────
function _prof(){
    var d=fd(),w=fw(),p=d.profile||{};
    var all=w.posts||[],fvs=all.filter(function(x){return(d.favorites||[]).includes(x.id);});
    var lk=all.reduce(function(s,x){return s+(x.likes||0);},0);
    var av=document.getElementById('f-prof-av-img'),fb=document.getElementById('f-prof-av-fb');
    if(p.avatar){if(av){av.src=p.avatar;av.style.display='block';}if(fb)fb.style.display='none';}
    else{if(av)av.style.display='none';if(fb)fb.style.display='flex';}
    var q=function(i){return document.getElementById(i);};
    if(q('f-prof-username'))q('f-prof-username').textContent=p.username||'迷途旅人';
    if(q('f-prof-bio'))     q('f-prof-bio').textContent    =p.bio||'这里什么都没有……';
    if(q('f-stat-likes'))   q('f-stat-likes').textContent  =lk;
    if(q('f-stat-posts'))   q('f-stat-posts').textContent  =all.length;
    if(q('f-stat-favs'))    q('f-stat-favs').textContent   =fvs.length;
    if(q('f-myposts-list'))q('f-myposts-list').innerHTML=all.length===0?'<div class="f-empty" style="padding:14px;">暂无帖子</div>':
        all.map(function(x){return '<div class="f-prof-post-item" onclick="fOpenPost(\''+x.id+'\')"><div class="f-prof-post-title">'+x.title+'</div><div class="f-prof-post-meta">'+x.time+' · ♥'+(x.likes||0)+'</div></div>';}).join('');
    if(q('f-favs-list'))q('f-favs-list').innerHTML=fvs.length===0?'<div class="f-empty" style="padding:14px;">暂无收藏</div>':
        fvs.map(function(x){return '<div class="f-prof-post-item" onclick="fOpenPost(\''+x.id+'\')"><div class="f-prof-post-title">'+x.title+'</div><div class="f-prof-post-meta">'+x.username+' · '+x.time+'</div></div>';}).join('');
}
window.fEditProfile=function(){
    var p=(fd().profile||{});
    document.getElementById('fp-username').value=p.username||'';
    document.getElementById('fp-bio').value=p.bio||'';
    var pv=document.getElementById('fp-av-preview');
    if(pv){pv.src=p.avatar||'';pv.style.display=p.avatar?'block':'none';}
    document.getElementById('f-profile-modal').classList.add('show');
};
window.fSaveProfile=function(){
    var d=fd();d.profile=d.profile||{};
    var n=document.getElementById('fp-username').value.trim(),b=document.getElementById('fp-bio').value.trim(),u=document.getElementById('fp-url').value.trim();
    if(n)d.profile.username=n;d.profile.bio=b;if(u)d.profile.avatar=u;
    _save();document.getElementById('f-profile-modal').classList.remove('show');_prof();
};
window.fProfileAvatarFile=function(i){
    var f=i.files[0];if(!f)return;
    var r=new FileReader();r.onload=function(e){var pv=document.getElementById('fp-av-preview');if(pv){pv.src=e.target.result;pv.style.display='block';}document.getElementById('fp-url').value=e.target.result;};r.readAsDataURL(f);
};
window.fCloseProfileModal=function(){document.getElementById('f-profile-modal').classList.remove('show');};

// ── 论坛设置 ─────────────────────────────────────────────────────
window.fOpenSettings=function(){
    var w=fw(),q=function(i){return document.getElementById(i);};
    if(q('fs-name'))    q('fs-name').value    =w.name||'';
    if(q('fs-desc'))    q('fs-desc').value    =w.desc||'';
    if(q('fs-members')) q('fs-members').value =w.memberCount||'';
    if(q('fs-archives'))q('fs-archives').value=w.archiveCount||'';
    if(q('fs-wb'))      q('fs-wb').value      =w.worldBook||'';
    if(q('fs-rules'))   q('fs-rules').value   =w.postRules||'';
    if(q('fs-hero-url'))q('fs-hero-url').value='';
    var hp=q('fs-hero-preview');if(hp)hp.style.backgroundImage=w.heroBg?'url("'+w.heroBg+'")':'';
    var ap=q('fs-av-preview');if(ap){ap.src=w.avatar||'';ap.style.display=w.avatar?'block':'none';}
    if(q('fs-av-url'))q('fs-av-url').value='';
    q('f-settings-modal').classList.add('show');
};
window.fSaveSettings=function(){
    var w=fw(),q=function(i){return document.getElementById(i);};
    w.name        =(q('fs-name')&&q('fs-name').value.trim())||w.name;
    w.desc        =(q('fs-desc')&&q('fs-desc').value.trim())||'';
    w.memberCount =(q('fs-members')&&q('fs-members').value.trim())||'0';
    w.archiveCount=(q('fs-archives')&&q('fs-archives').value.trim())||'0';
    w.worldBook   =(q('fs-wb')&&q('fs-wb').value.trim())||'';
    w.postRules   =(q('fs-rules')&&q('fs-rules').value.trim())||'';
    var nh=q('fs-hero-url')&&q('fs-hero-url').value.trim();if(nh)w.heroBg=nh;
    var na=q('fs-av-url')&&q('fs-av-url').value.trim();if(na)w.avatar=na;
    _save();q('f-settings-modal').classList.remove('show');_bg();_hdr();
};
window.fCloseSettings=function(){document.getElementById('f-settings-modal').classList.remove('show');};
window.fSettingsAvatarFile=function(i){var f=i.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){var p=document.getElementById('fs-av-preview');if(p){p.src=e.target.result;p.style.display='block';}document.getElementById('fs-av-url').value=e.target.result;};r.readAsDataURL(f);};
window.fHeroBgFile=function(i){var f=i.files[0];if(!f)return;var r=new FileReader();r.onload=function(e){var p=document.getElementById('fs-hero-preview');if(p)p.style.backgroundImage='url("'+e.target.result+'")';var u=document.getElementById('fs-hero-url');if(u)u.value=e.target.result;};r.readAsDataURL(f);};
window.fHeroBgUrlPreview=function(u){var p=document.getElementById('fs-hero-preview');if(p&&u)p.style.backgroundImage='url("'+u+'")';};

// ── 快速生成设置 ─────────────────────────────────────────────────
window.fOpenQuick=function(){
    var w=fw(),cs=(appData.chatData&&appData.chatData.contacts)||[],ms=appData.userMasks||[];
    var cl=document.getElementById('fq-char-list'),ml=document.getElementById('fq-mask-list');
    if(cl)cl.innerHTML=cs.length===0?'<div style="color:#bbb;font-size:12px;padding:6px;">暂无角色</div>':
        cs.map(function(c){return '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer;"><input type="checkbox" value="'+c.id+'" style="accent-color:#DDCED0;width:16px;height:16px;"'+((w.charIds||[]).includes(c.id)?' checked':'')+'>'+
        '<span style="font-size:13px;">'+(c.name||'角色')+(c.note&&c.note!==c.name?' (备注：'+c.note+')':'')+'</span></label>';}).join('');
    if(ml)ml.innerHTML=ms.length===0?'<div style="color:#bbb;font-size:12px;padding:6px;">暂无人设面具</div>':
        ms.map(function(m){return '<label style="display:flex;align-items:center;gap:8px;padding:5px 0;cursor:pointer;"><input type="checkbox" value="'+m.id+'" style="accent-color:#DDCED0;width:16px;height:16px;"'+((w.maskIds||[]).includes(m.id)?' checked':'')+'>'+
        '<span style="font-size:13px;">'+m.name+'</span></label>';}).join('');
    var np=document.getElementById('fq-npost'),nc=document.getElementById('fq-ncmt');
    if(np)np.value=w.postsPerGen||8;if(nc)nc.value=w.commentsPerPost||15;
    document.getElementById('f-quick-modal').classList.add('show');
};
window.fSaveQuick=function(){
    var w=fw(),cb=document.querySelectorAll('#fq-char-list input[type=checkbox]:checked'),mb=document.querySelectorAll('#fq-mask-list input[type=checkbox]:checked');
    w.charIds=[];cb.forEach(function(b){w.charIds.push(b.value);});
    w.maskIds=[];mb.forEach(function(b){w.maskIds.push(b.value);});
    w.postsPerGen    =Math.max(4,parseInt(document.getElementById('fq-npost').value)||8);
    w.commentsPerPost=Math.max(10,parseInt(document.getElementById('fq-ncmt').value)||15);
    _save();document.getElementById('f-quick-modal').classList.remove('show');
};
window.fCloseQuick=function(){document.getElementById('f-quick-modal').classList.remove('show');};

// ── 世界切换 ─────────────────────────────────────────────────────
window.fWorldSwitch=function(){
    var d=fd(),l=document.getElementById('f-world-list');
    l.innerHTML=d.worlds.map(function(w){
        var a=w.id===d.activeWorldId;
        var ah=w.avatar?'<img src="'+w.avatar+'" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;">':
            '<div style="width:40px;height:40px;border-radius:50%;background:#DDCED0;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
            '<svg viewBox="0 0 80 90" width="26" height="26"><circle cx="40" cy="28" r="18" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="3"/><path d="M6 90 Q6 56 40 56 Q74 56 74 90" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="3" stroke-linecap="round"/></svg></div>';
        return '<div class="f-world-item '+(a?'f-world-active':'')+'" onclick="fSelWorld(\''+w.id+'\')">'+
            ah+'<div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;color:#333;">'+w.name+'</div>'+
            '<div style="font-size:12px;color:#999;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+w.desc+'</div></div>'+
            (a?'<span style="color:#DDCED0;font-size:18px;">✓</span>':'')+
        '</div>';
    }).join('')+
    '<div class="f-world-item" onclick="fNewWorld()">'+
        '<div style="width:40px;height:40px;border-radius:50%;border:2px dashed #DDCED0;display:flex;align-items:center;justify-content:center;font-size:22px;color:#DDCED0;flex-shrink:0;">+</div>'+
        '<div style="font-size:14px;font-weight:600;color:#DDCED0;">新建论坛世界</div>'+
    '</div>';
    document.getElementById('f-world-modal').classList.add('show');
};
window.fSelWorld=function(id){fd().activeWorldId=id;_save();document.getElementById('f-world-modal').classList.remove('show');_bg();_hdr();_pins();fT('latest',true);};
window.fSelectWorld=window.fSelWorld;
window.fNewWorld=function(){var n=prompt('新论坛名称：');if(!n)return;var d=fd(),w=_nw(n);d.worlds.push(w);d.activeWorldId=w.id;_save();document.getElementById('f-world-modal').classList.remove('show');_bg();_hdr();_pins();_posts();};
window.fCloseWorldModal=function(){document.getElementById('f-world-modal').classList.remove('show');};
window.fPickBg=function(){};

})();
