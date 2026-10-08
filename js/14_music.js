// ========== 网易云音乐APP ==========
// 仿网易云红色风格 / AI生成角色歌单 / 真实播放 / 歌词同步
// 依赖: 01_data_core.js (appData/saveData) | 02_app_shell.js (openPage)
// 对外接口: window.openCpMusic() | window.refreshMusicProfile()

// ==========================================
// 配置
// ==========================================
const NCM_API = 'https://api-enhanced-qcx4-ivjv6h155-lovecho.vercel.app';

// ==========================================
// 状态
// ==========================================
const ncm = {
    contactId:   null,
    playlist:    null,   // 当前打开的歌单 { name, songs[] }
    song:        null,   // 当前播放的歌曲对象
    songIndex:   0,      // 在当前歌单里的位置
    audio:       null,   // HTMLAudioElement
    lyrics:      [],     // [{time, text}]
    lyricTimer:  null,
    isPlaying:   false,
    mode:        'list', // list | random | single
    progressTimer: null,
};

// ==========================================
// 样式注入（只注入一次）
// ==========================================
function injectNcmStyles() {
    if (document.getElementById('ncm-style')) return;
    const s = document.createElement('style');
    s.id = 'ncm-style';
    s.textContent = `
/* ===== 容器 ===== */
#page-cp-music {
    position: fixed; inset: 0; z-index: 2500;
    display: none; flex-direction: column;
    background: #f5f5f5;
    font-family: -apple-system, "PingFang SC", "Helvetica Neue", sans-serif;
    --ncm-red: #e60026;
    --ncm-red-dark: #c0001f;
    --ncm-text: #1a1a1a;
    --ncm-sub: #666;
    --ncm-line: #e8e8e8;
    --ncm-card: #fff;
    --ncm-player-bg: #1a0a0a;
}
#page-cp-music.visible { display: flex; }

/* ===== 子视图（与mail同款滑动逻辑）===== */
.ncm-view {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    background: #f5f5f5;
    transition: transform 0.32s cubic-bezier(0.25,0.8,0.25,1);
    overflow: hidden;
}
#ncm-home-view    { transform: translateX(0);    z-index: 1; }
#ncm-list-view    { transform: translateX(100%); z-index: 2; background: #fff; }
#ncm-player-view  { transform: translateX(0);    z-index: 3; display: none; }
#ncm-comment-view { transform: translateX(100%); z-index: 4; background: #fff; }

#page-cp-music.list-open    #ncm-home-view    { transform: translateX(-30%); opacity: .5; }
#page-cp-music.list-open    #ncm-list-view    { transform: translateX(0); }
#page-cp-music.comment-open #ncm-list-view    { transform: translateX(-30%); opacity: .5; }
#page-cp-music.comment-open #ncm-comment-view { transform: translateX(0); }
#page-cp-music.player-open  #ncm-player-view  { display: flex; }

/* ===== 顶栏 ===== */
.ncm-nav {
    display: flex; align-items: center;
    padding: calc(env(safe-area-inset-top,0px) + 10px) 16px 10px;
    background: var(--ncm-red); color: #fff; flex-shrink: 0;
}
.ncm-nav-back { font-size: 22px; margin-right: 10px; cursor: pointer; line-height: 1; }
.ncm-nav-title { font-size: 17px; font-weight: 600; flex: 1; }
.ncm-nav-action { font-size: 20px; cursor: pointer; }

/* ===== 主页：个人区域 ===== */
.ncm-profile-header {
    background: linear-gradient(160deg, #e60026 0%, #9b0019 100%);
    padding: calc(env(safe-area-inset-top,0px) + 14px) 20px 24px;
    color: #fff; flex-shrink: 0;
}
.ncm-profile-top { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.ncm-profile-avatar {
    width: 62px; height: 62px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.5); object-fit: cover; flex-shrink: 0;
}
.ncm-profile-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
.ncm-profile-sig  { font-size: 12px; opacity: .8; line-height: 1.4; }
.ncm-profile-stats { display: flex; gap: 0; border-top: 1px solid rgba(255,255,255,.2); padding-top: 12px; }
.ncm-stat { flex: 1; text-align: center; }
.ncm-stat-num  { font-size: 17px; font-weight: 700; }
.ncm-stat-label{ font-size: 11px; opacity: .75; margin-top: 2px; }

/* ===== 主页：歌单列表 ===== */
.ncm-section-title {
    font-size: 15px; font-weight: 600; color: var(--ncm-text);
    padding: 14px 16px 8px; border-bottom: .5px solid var(--ncm-line);
}
.ncm-playlist-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 12px; padding: 12px 16px 80px; overflow-y: auto;
}
.ncm-playlist-card {
    cursor: pointer; border-radius: 8px; overflow: hidden;
    background: var(--ncm-card); box-shadow: 0 1px 6px rgba(0,0,0,.08);
    transition: transform .15s;
}
.ncm-playlist-card:active { transform: scale(0.97); }
.ncm-playlist-cover {
    width: 100%; aspect-ratio: 1;
    object-fit: cover; display: block; background: #ddd;
}
.ncm-playlist-cover-placeholder {
    width: 100%; aspect-ratio: 1;
    background: linear-gradient(135deg, #e60026 0%, #ff6b6b 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
}
.ncm-playlist-meta { padding: 8px 10px 10px; }
.ncm-playlist-name { font-size: 13px; font-weight: 500; color: var(--ncm-text); line-height: 1.3; margin-bottom: 3px; }
.ncm-playlist-count{ font-size: 11px; color: var(--ncm-sub); }
.ncm-play-count-badge {
    position: absolute; top: 6px; right: 8px;
    color: #fff; font-size: 11px; display: flex; align-items: center; gap: 2px;
}

/* ===== 歌曲列表 ===== */
.ncm-list-header {
    padding: 14px 16px 10px; border-bottom: .5px solid var(--ncm-line);
    display: flex; align-items: center; justify-content: space-between;
}
.ncm-play-all {
    display: flex; align-items: center; gap: 6px;
    color: var(--ncm-red); font-size: 14px; font-weight: 500; cursor: pointer;
}
.ncm-songs-scroll { flex: 1; overflow-y: auto; }
.ncm-song-row {
    display: flex; align-items: center;
    padding: 10px 16px; cursor: pointer; gap: 12px;
    border-bottom: .5px solid var(--ncm-line); transition: background .1s;
}
.ncm-song-row:active { background: #f0f0f0; }
.ncm-song-row.playing .ncm-song-name { color: var(--ncm-red); }
.ncm-song-num {
    width: 20px; text-align: center; font-size: 14px;
    color: var(--ncm-sub); flex-shrink: 0;
}
.ncm-song-num.playing-icon { color: var(--ncm-red); font-size: 16px; }
.ncm-song-cover {
    width: 44px; height: 44px; border-radius: 4px;
    object-fit: cover; flex-shrink: 0; background: #eee;
}
.ncm-song-info { flex: 1; min-width: 0; }
.ncm-song-name { font-size: 14px; color: var(--ncm-text); font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ncm-song-artist { font-size: 12px; color: var(--ncm-sub); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ncm-song-more { color: #ccc; font-size: 18px; cursor: pointer; flex-shrink: 0; }

/* ===== 播放器 ===== */
#ncm-player-view {
    flex-direction: column;
    background: var(--ncm-player-bg);
    color: #fff;
}
.ncm-player-blur-bg {
    position: absolute; inset: 0; z-index: 0;
    background-size: cover; background-position: center;
    filter: blur(40px) brightness(.35) saturate(1.4);
    transform: scale(1.1);
}
.ncm-player-body { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }
.ncm-player-nav {
    display: flex; align-items: center;
    padding: calc(env(safe-area-inset-top,0px) + 12px) 16px 8px;
    gap: 10px;
}
.ncm-player-nav-back { font-size: 24px; cursor: pointer; }
.ncm-player-song-title { flex: 1; text-align: center; font-size: 16px; font-weight: 600; }
.ncm-player-like { font-size: 22px; cursor: pointer; color: rgba(255,255,255,.6); transition: color .2s; }
.ncm-player-like.liked { color: var(--ncm-red); }

.ncm-disk-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 10px 0; }
.ncm-disk {
    width: 220px; height: 220px; border-radius: 50%;
    border: 12px solid #2a1a1a;
    box-shadow: 0 0 0 4px #3a2020, 0 8px 40px rgba(0,0,0,.6);
    overflow: hidden; position: relative;
    animation: ncm-spin 10s linear infinite;
    animation-play-state: paused;
}
.ncm-disk.playing { animation-play-state: running; }
.ncm-disk img { width: 100%; height: 100%; object-fit: cover; }
.ncm-disk-needle {
    position: absolute; top: -18px; right: calc(50% - 80px);
    width: 6px; height: 80px;
    background: linear-gradient(#d4af37, #b8960a);
    border-radius: 0 0 3px 3px; transform-origin: top center;
    transform: rotate(-25deg); transition: transform .4s ease;
    z-index: 10;
}
.ncm-disk-needle.playing { transform: rotate(0deg); }
@keyframes ncm-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

/* ===== 歌词区 ===== */
.ncm-lyric-area {
    height: 90px; overflow: hidden; position: relative;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 0 30px;
}
.ncm-lyric-line { font-size: 14px; color: rgba(255,255,255,.4); text-align: center; line-height: 1.6; transition: all .3s; }
.ncm-lyric-line.active { font-size: 16px; color: #fff; font-weight: 500; }
.ncm-lyric-line.prev, .ncm-lyric-line.next { font-size: 13px; color: rgba(255,255,255,.3); }

/* ===== 进度条 ===== */
.ncm-progress-wrap { padding: 6px 20px 0; }
.ncm-progress-bar-bg {
    height: 3px; background: rgba(255,255,255,.2); border-radius: 2px;
    position: relative; cursor: pointer;
}
.ncm-progress-bar-fill {
    height: 100%; background: var(--ncm-red); border-radius: 2px;
    width: 0%; transition: width .5s linear; position: relative;
}
.ncm-progress-bar-fill::after {
    content: ''; position: absolute; right: -5px; top: -4px;
    width: 11px; height: 11px; border-radius: 50%; background: #fff;
    box-shadow: 0 0 4px rgba(0,0,0,.3);
}
.ncm-time-row { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,.5); margin-top: 5px; }

/* ===== 播放控制 ===== */
.ncm-controls {
    display: flex; align-items: center; justify-content: space-around;
    padding: 14px 20px 6px;
}
.ncm-ctrl-btn { font-size: 26px; cursor: pointer; color: rgba(255,255,255,.8); transition: transform .1s; }
.ncm-ctrl-btn:active { transform: scale(.9); }
.ncm-ctrl-play {
    width: 58px; height: 58px; border-radius: 50%;
    background: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 28px; cursor: pointer; color: var(--ncm-text);
    box-shadow: 0 4px 16px rgba(0,0,0,.3); transition: transform .1s;
}
.ncm-ctrl-play:active { transform: scale(.93); }
.ncm-bottom-tabs {
    display: flex; justify-content: space-around;
    padding: 10px 0 calc(env(safe-area-inset-bottom,0px) + 14px);
    border-top: .5px solid rgba(255,255,255,.1);
}
.ncm-tab { text-align: center; cursor: pointer; }
.ncm-tab-icon { font-size: 20px; color: rgba(255,255,255,.5); }
.ncm-tab-icon.active { color: var(--ncm-red); }
.ncm-tab-label { font-size: 11px; color: rgba(255,255,255,.4); margin-top: 2px; }

/* ===== 评论区 ===== */
.ncm-comment-row { padding: 12px 16px; border-bottom: .5px solid var(--ncm-line); display: flex; gap: 10px; }
.ncm-comment-avatar {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: var(--ncm-red); color: #fff; display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 600;
}
.ncm-comment-body { flex: 1; }
.ncm-comment-name  { font-size: 13px; font-weight: 600; color: #444; margin-bottom: 3px; }
.ncm-comment-text  { font-size: 14px; color: var(--ncm-text); line-height: 1.5; }
.ncm-comment-meta  { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
.ncm-comment-time  { font-size: 11px; color: var(--ncm-sub); }
.ncm-comment-like  { font-size: 12px; color: var(--ncm-sub); display: flex; align-items: center; gap: 4px; }
.ncm-liked-tag     { color: var(--ncm-red); font-size: 11px; background: #fff0f2; padding: 1px 5px; border-radius: 3px; }

/* ===== Mini播放条 ===== */
#ncm-mini-player {
    position: absolute; bottom: 68px; left: 10px; right: 10px;
    background: rgba(30,10,10,.92); backdrop-filter: blur(12px);
    border-radius: 12px; display: none;
    align-items: center; padding: 10px 14px; gap: 10px;
    z-index: 2100; box-shadow: 0 4px 20px rgba(0,0,0,.3);
    cursor: pointer;
}
#ncm-mini-player.show { display: flex; }
.ncm-mini-cover  { width: 38px; height: 38px; border-radius: 6px; object-fit: cover; background: #333; }
.ncm-mini-info   { flex: 1; min-width: 0; }
.ncm-mini-name   { font-size: 13px; color: #fff; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ncm-mini-artist { font-size: 11px; color: rgba(255,255,255,.5); margin-top: 2px; }
.ncm-mini-ctrl   { font-size: 24px; color: #fff; cursor: pointer; }
.ncm-mini-progress { position: absolute; bottom: 0; left: 0; height: 2px; background: var(--ncm-red); border-radius: 0 0 12px 12px; transition: width .5s linear; }

/* ===== 刷新按钮 ===== */
.ncm-refresh-btn {
    position: absolute; bottom: 80px; right: 16px;
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--ncm-red); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: pointer; z-index: 10;
    box-shadow: 0 3px 12px rgba(230,0,38,.4);
    transition: transform .3s;
}
.ncm-refresh-btn.spinning { transform: rotate(360deg); transition: transform .6s ease; }

/* ===== 加载态 ===== */
.ncm-loading { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--ncm-sub); }
.ncm-loading-icon { font-size: 36px; animation: ncm-pulse 1.2s ease infinite; }
@keyframes ncm-pulse { 0%,100%{opacity:.3} 50%{opacity:1} }
    `;
    document.head.appendChild(s);
}

// ==========================================
// HTML注入
// ==========================================
function injectNcmHTML() {
    if (document.getElementById('page-cp-music')) return;
    document.body.insertAdjacentHTML('beforeend', `
<div id="page-cp-music" class="page-layer">

  <!-- ① 主页：角色的网易云个人页 -->
  <div id="ncm-home-view" class="ncm-view">
    <div class="ncm-profile-header" id="ncm-profile-header">
      <div class="ncm-profile-top">
        <img class="ncm-profile-avatar" id="ncm-profile-avatar" src="">
        <div>
          <div class="ncm-profile-name" id="ncm-profile-name">加载中...</div>
          <div class="ncm-profile-sig"  id="ncm-profile-sig"></div>
        </div>
      </div>
      <div class="ncm-profile-stats">
        <div class="ncm-stat"><div class="ncm-stat-num" id="ncm-stat-listen">-</div><div class="ncm-stat-label">听歌</div></div>
        <div class="ncm-stat"><div class="ncm-stat-num" id="ncm-stat-follow">-</div><div class="ncm-stat-label">关注</div></div>
        <div class="ncm-stat"><div class="ncm-stat-num" id="ncm-stat-fans">-</div><div class="ncm-stat-label">粉丝</div></div>
      </div>
    </div>
    <div style="flex:1;overflow-y:auto;">
      <div class="ncm-section-title">创建的歌单</div>
      <div class="ncm-playlist-grid" id="ncm-playlist-grid">
        <div class="ncm-loading"><div class="ncm-loading-icon">♫</div><div>正在生成 TA 的音乐世界...</div></div>
      </div>
    </div>
    <button class="ncm-refresh-btn" id="ncm-refresh-btn" onclick="refreshMusicProfile()" title="重新生成歌单">↻</button>
  </div>

  <!-- ② 歌单详情 -->
  <div id="ncm-list-view" class="ncm-view">
    <div class="ncm-nav" style="background:var(--ncm-red);">
      <span class="ncm-nav-back" onclick="ncmCloseList()">‹</span>
      <span class="ncm-nav-title" id="ncm-list-title">歌单</span>
    </div>
    <div class="ncm-list-header">
      <div class="ncm-play-all" onclick="ncmPlayAll()">
        <span>▶</span><span id="ncm-list-count">全部播放</span>
      </div>
      <span style="font-size:12px;color:#999;" id="ncm-list-sub"></span>
    </div>
    <div class="ncm-songs-scroll" id="ncm-songs-scroll"></div>
  </div>

  <!-- ③ 播放器 -->
  <div id="ncm-player-view" class="ncm-view">
    <div class="ncm-player-blur-bg" id="ncm-player-blur-bg"></div>
    <div class="ncm-player-body">
      <div class="ncm-player-nav">
        <span class="ncm-player-nav-back" onclick="ncmClosePlayer()">∨</span>
        <span class="ncm-player-song-title" id="ncm-player-title">-</span>
        <span class="ncm-player-like ri-heart-line" id="ncm-player-like" onclick="ncmToggleLike()">♡</span>
      </div>
      <div class="ncm-disk-wrap">
        <div style="position:relative;">
          <div class="ncm-disk" id="ncm-disk">
            <img id="ncm-disk-img" src="" alt="">
          </div>
          <div class="ncm-disk-needle" id="ncm-disk-needle"></div>
        </div>
      </div>
      <div class="ncm-lyric-area" id="ncm-lyric-area">
        <div class="ncm-lyric-line prev"   id="ncm-lyric-prev"></div>
        <div class="ncm-lyric-line active" id="ncm-lyric-cur">点击播放，歌词同步显示</div>
        <div class="ncm-lyric-line next"   id="ncm-lyric-next"></div>
      </div>
      <div class="ncm-progress-wrap">
        <div class="ncm-progress-bar-bg" id="ncm-progress-bg" onclick="ncmSeek(event)">
          <div class="ncm-progress-bar-fill" id="ncm-progress-fill"></div>
        </div>
        <div class="ncm-time-row">
          <span id="ncm-time-cur">0:00</span>
          <span id="ncm-time-total">0:00</span>
        </div>
      </div>
      <div class="ncm-controls">
        <span class="ncm-ctrl-btn" id="ncm-mode-btn" onclick="ncmToggleMode()" title="切换播放模式">⇄</span>
        <span class="ncm-ctrl-btn" onclick="ncmPrev()">⏮</span>
        <div class="ncm-ctrl-play" id="ncm-play-btn" onclick="ncmTogglePlay()">▶</div>
        <span class="ncm-ctrl-btn" onclick="ncmNext()">⏭</span>
        <span class="ncm-ctrl-btn" onclick="ncmOpenComments()">💬</span>
      </div>
      <div class="ncm-bottom-tabs">
        <div class="ncm-tab" onclick="ncmClosePlayer()"><div class="ncm-tab-icon">≡</div><div class="ncm-tab-label">列表</div></div>
        <div class="ncm-tab" onclick="ncmOpenComments()"><div class="ncm-tab-icon active" id="ncm-comment-tab-icon">💬</div><div class="ncm-tab-label">评论</div></div>
      </div>
    </div>
  </div>

  <!-- ④ 评论页 -->
  <div id="ncm-comment-view" class="ncm-view">
    <div class="ncm-nav" style="background:var(--ncm-red);">
      <span class="ncm-nav-back" onclick="ncmCloseComments()">‹</span>
      <span class="ncm-nav-title" id="ncm-comment-title">评论</span>
    </div>
    <div style="flex:1;overflow-y:auto;" id="ncm-comment-scroll"></div>
  </div>

</div>

<!-- Mini播放条（显示在手机桌面上方） -->
<div id="ncm-mini-player" onclick="ncmOpenPlayer()">
  <img class="ncm-mini-cover" id="ncm-mini-cover" src="">
  <div class="ncm-mini-info">
    <div class="ncm-mini-name"   id="ncm-mini-name">-</div>
    <div class="ncm-mini-artist" id="ncm-mini-artist">-</div>
  </div>
  <span class="ncm-mini-ctrl" id="ncm-mini-ctrl" onclick="event.stopPropagation();ncmTogglePlay()">⏸</span>
  <div class="ncm-mini-progress" id="ncm-mini-progress" style="width:0%"></div>
</div>
    `);
}

// ==========================================
// 入口
// ==========================================
window.openCpMusic = async () => {
    const contact = appData.chatData.contacts.find(c => c.id === currentPhoneContactId);
    if (!contact) { alert('请先选择联系人'); return; }
    ncm.contactId = currentPhoneContactId;
    openPage('page-cp-music');
    renderNcmProfileShell(contact);

    if (!contact.musicProfile) {
        await generateMusicProfile(contact);
    }
    renderNcmHome(contact);
};

// ==========================================
// AI生成音乐档案
// ==========================================
async function generateMusicProfile(contact) {
    if (!appData.lastApi || !appData.lastApi.url || !appData.lastApi.key) {
        showToast('请先配置API才能生成歌单');
        return;
    }
    const chatHistory = (appData.chatData.messages || [])
        .filter(m => m.chatId === contact.id)
        .slice(-30)
        .map(m => `${m.sender === 'me' ? '我' : contact.name}: ${m.content.replace(/<[^>]+>/g,'').slice(0,60)}`)
        .join('\n');

    const prompt = `你在帮我生成一个角色的网易云音乐档案。
角色名：${contact.name}
最近聊天摘要：
${chatHistory || '（暂无聊天记录）'}

请根据角色性格推断 TA 的音乐品味，生成一个 JSON 档案。
格式如下（只输出JSON，不要任何其他文字）：
{
  "signature": "TA 的网易云个性签名（20字以内，符合性格）",
  "listenCount": 数字（听歌总数，800到30000之间）,
  "followCount": 数字（关注数，10到300）,
  "fansCount": 数字（粉丝数，5到500）,
  "playlists": [
    {
      "name": "我喜欢的音乐",
      "emoji": "❤️",
      "searchQueries": ["具体歌手名或歌曲名1", "歌手名2", "歌曲名3", "歌手名4", "歌曲名5"]
    },
    {
      "name": "第二个歌单名（体现性格）",
      "emoji": "🎵",
      "searchQueries": ["歌手或歌曲1", "歌手或歌曲2", "歌手或歌曲3"]
    },
    {
      "name": "第三个歌单名",
      "emoji": "🌙",
      "searchQueries": ["歌手或歌曲1", "歌手或歌曲2", "歌手或歌曲3"]
    }
  ]
}`;

    try {
        const res = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({
                model: appData.lastApi.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.85
            })
        });
        const data = await res.json();
        let raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) raw = match[0];
        const profile = JSON.parse(raw);

        // 用网易云API搜索真实歌曲填充每个歌单
        const playlists = [];
        for (const pl of profile.playlists) {
            const songs = await fetchSongsForPlaylist(pl.searchQueries, 12);
            playlists.push({ name: pl.name, emoji: pl.emoji || '🎵', songs });
        }

        contact.musicProfile = {
            signature: profile.signature || '音乐是我的语言',
            listenCount: profile.listenCount || 5000,
            followCount: profile.followCount || 50,
            fansCount: profile.fansCount || 30,
            playlists,
            generated: Date.now()
        };
        await saveData();
    } catch (e) {
        console.error('生成音乐档案失败', e);
        // 降级：用内置兜底数据
        contact.musicProfile = {
            signature: '音乐，是另一种告白',
            listenCount: 8888,
            followCount: 66,
            fansCount: 88,
            playlists: [],
            generated: Date.now()
        };
    }
}

// 根据搜索词列表，依次搜索并拼成歌单
async function fetchSongsForPlaylist(queries, total) {
    const songs = [];
    const perQuery = Math.ceil(total / queries.length);
    for (const q of queries) {
        if (songs.length >= total) break;
        try {
            const res  = await fetch(`${NCM_API}/search?keywords=${encodeURIComponent(q)}&limit=${perQuery}&type=1`);
            const data = await res.json();
            const list = (data.result && data.result.songs) || [];
            for (const s of list) {
                if (songs.length >= total) break;
                songs.push({
                    id:     s.id,
                    name:   s.name,
                    artist: (s.artists || []).map(a => a.name).join(' / '),
                    album:  s.album ? s.album.name : '',
                    cover:  s.album && s.album.picUrl ? s.album.picUrl + '?param=200y200' : '',
                    duration: s.duration || 0,
                    liked: Math.random() > 0.5,
                    comments: null  // 懒加载
                });
            }
        } catch (e) { /* 单条搜索失败跳过 */ }
    }
    return songs;
}

// ==========================================
// 刷新（重新生成）
// ==========================================
window.refreshMusicProfile = async () => {
    const contact = appData.chatData.contacts.find(c => c.id === ncm.contactId);
    if (!contact) return;
    const btn = document.getElementById('ncm-refresh-btn');
    if (btn) { btn.classList.add('spinning'); setTimeout(() => btn.classList.remove('spinning'), 700); }

    delete contact.musicProfile;
    document.getElementById('ncm-playlist-grid').innerHTML = '<div class="ncm-loading"><div class="ncm-loading-icon">♫</div><div>重新生成中...</div></div>';
    await generateMusicProfile(contact);
    renderNcmHome(contact);
    showToast('歌单已刷新！');
};

// ==========================================
// 渲染：个人页骨架（先显示头像和名字，歌单异步填充）
// ==========================================
function renderNcmProfileShell(contact) {
    const avatar = (appData.images && appData.images[contact.avatar]) || contact.avatar || makeDefaultAvatar(contact.name);
    document.getElementById('ncm-profile-avatar').src = avatar;
    document.getElementById('ncm-profile-name').textContent = contact.name;
    document.getElementById('ncm-profile-sig').textContent = '加载中...';
}

// ==========================================
// 渲染：完整主页
// ==========================================
function renderNcmHome(contact) {
    const p = contact.musicProfile;
    if (!p) return;

    const avatar = (appData.images && appData.images[contact.avatar]) || contact.avatar || makeDefaultAvatar(contact.name);
    document.getElementById('ncm-profile-avatar').src = avatar;
    document.getElementById('ncm-profile-name').textContent = contact.name;
    document.getElementById('ncm-profile-sig').textContent = p.signature;
    document.getElementById('ncm-stat-listen').textContent = p.listenCount >= 10000
        ? (p.listenCount / 10000).toFixed(1) + '万' : p.listenCount;
    document.getElementById('ncm-stat-follow').textContent = p.followCount;
    document.getElementById('ncm-stat-fans').textContent = p.fansCount;

    const grid = document.getElementById('ncm-playlist-grid');
    grid.innerHTML = '';

    if (!p.playlists || p.playlists.length === 0) {
        grid.innerHTML = '<div class="ncm-loading"><div>暂无歌单</div></div>';
        return;
    }

    p.playlists.forEach((pl, idx) => {
        const cover = pl.songs && pl.songs[0] && pl.songs[0].cover;
        const card = document.createElement('div');
        card.className = 'ncm-playlist-card';
        card.style.position = 'relative';
        card.onclick = () => openNcmPlaylist(idx);
        card.innerHTML = `
            ${cover
                ? `<img class="ncm-playlist-cover" src="${cover}" loading="lazy">`
                : `<div class="ncm-playlist-cover-placeholder">${pl.emoji || '🎵'}</div>`}
            <div class="ncm-play-count-badge">▶ ${ncmFmtCount(pl.songs ? pl.songs.length * Math.floor(Math.random()*800+200) : 0)}</div>
            <div class="ncm-playlist-meta">
                <div class="ncm-playlist-name">${pl.name}</div>
                <div class="ncm-playlist-count">${pl.songs ? pl.songs.length : 0}首</div>
            </div>`;
        grid.appendChild(card);
    });
}

// ==========================================
// 打开歌单
// ==========================================
window.openNcmPlaylist = (idx) => {
    const contact = appData.chatData.contacts.find(c => c.id === ncm.contactId);
    if (!contact || !contact.musicProfile) return;
    const pl = contact.musicProfile.playlists[idx];
    if (!pl) return;
    ncm.playlist = pl;

    document.getElementById('ncm-list-title').textContent = pl.name;
    document.getElementById('ncm-list-count').textContent = `全部播放 (${pl.songs.length}首)`;
    document.getElementById('ncm-list-sub').textContent = `${pl.emoji || '🎵'} ${pl.songs.length}首`;

    renderNcmSongList(pl.songs);
    document.getElementById('page-cp-music').classList.add('list-open');
};

window.ncmCloseList = () => {
    document.getElementById('page-cp-music').classList.remove('list-open');
};

function renderNcmSongList(songs) {
    const el = document.getElementById('ncm-songs-scroll');
    el.innerHTML = '';
    songs.forEach((song, i) => {
        const isPlaying = ncm.song && ncm.song.id === song.id;
        const row = document.createElement('div');
        row.className = 'ncm-song-row' + (isPlaying ? ' playing' : '');
        row.onclick = () => ncmPlaySong(song, i);
        row.innerHTML = `
            <div class="ncm-song-num ${isPlaying ? 'playing-icon' : ''}">${isPlaying ? '♫' : i + 1}</div>
            <img class="ncm-song-cover" src="${song.cover || ''}" loading="lazy">
            <div class="ncm-song-info">
                <div class="ncm-song-name">${song.name}</div>
                <div class="ncm-song-artist">${song.artist}${song.album ? ' - ' + song.album : ''}</div>
            </div>
            <span class="ncm-song-more">···</span>`;
        el.appendChild(row);
    });
}

window.ncmPlayAll = () => {
    if (ncm.playlist && ncm.playlist.songs.length > 0) {
        ncmPlaySong(ncm.playlist.songs[0], 0);
    }
};

// ==========================================
// 播放歌曲
// ==========================================
async function ncmPlaySong(song, index) {
    ncm.song      = song;
    ncm.songIndex = index;

    // 打开播放器视图
    ncmOpenPlayer();
    renderNcmPlayerUI(song);

    try {
        // 获取真实播放链接
        const urlRes  = await fetch(`${NCM_API}/song/url/v1?id=${song.id}&level=standard`);
        const urlData = await urlRes.json();
        const url = urlData.data && urlData.data[0] && urlData.data[0].url;

        if (!url) { showToast('该歌曲暂无版权，自动切换...'); setTimeout(ncmNext, 1200); return; }

        if (ncm.audio) { ncm.audio.pause(); clearInterval(ncm.progressTimer); }
        ncm.audio = new Audio(url);
        ncm.audio.crossOrigin = 'anonymous';
        ncm.audio.play().then(() => {
            ncm.isPlaying = true;
            document.getElementById('ncm-play-btn').textContent = '⏸';
            document.getElementById('ncm-mini-ctrl').textContent = '⏸';
            document.getElementById('ncm-disk').classList.add('playing');
            document.getElementById('ncm-disk-needle').classList.add('playing');
            startProgressTimer();
        }).catch(() => { showToast('播放失败，切换下一首'); setTimeout(ncmNext, 1000); });

        ncm.audio.onended = () => ncmNext();

        // 更新mini播放条
        updateMiniPlayer(song);

        // 异步加载歌词
        fetchAndShowLyrics(song.id);

        // 更新歌单列表高亮
        if (ncm.playlist) renderNcmSongList(ncm.playlist.songs);

    } catch (e) {
        showToast('网络错误，请检查API配置');
    }
}

function renderNcmPlayerUI(song) {
    document.getElementById('ncm-player-title').textContent = song.name;
    document.getElementById('ncm-disk-img').src = song.cover || '';
    document.getElementById('ncm-player-blur-bg').style.backgroundImage = song.cover ? `url('${song.cover}')` : '';
    document.getElementById('ncm-player-like').textContent = song.liked ? '♥' : '♡';
    document.getElementById('ncm-player-like').classList.toggle('liked', !!song.liked);
    document.getElementById('ncm-time-total').textContent = ncmFmtTime(song.duration / 1000);
    document.getElementById('ncm-comment-title').textContent = `${song.name} 的评论`;
    document.getElementById('ncm-lyric-cur').textContent = '加载歌词中...';
    document.getElementById('ncm-lyric-prev').textContent = '';
    document.getElementById('ncm-lyric-next').textContent = '';
    ncm.lyrics = [];
}

// ==========================================
// 歌词
// ==========================================
async function fetchAndShowLyrics(songId) {
    try {
        const res  = await fetch(`${NCM_API}/lyric?id=${songId}`);
        const data = await res.json();
        const lrc  = data.lrc && data.lrc.lyric;
        if (!lrc) { document.getElementById('ncm-lyric-cur').textContent = song.name; return; }
        ncm.lyrics = parseLrc(lrc).filter(l => l.text.trim());
        if (ncm.lyrics.length === 0) return;
        document.getElementById('ncm-lyric-cur').textContent = ncm.lyrics[0].text;
    } catch (e) { /* 歌词加载失败静默处理 */ }
}

function parseLrc(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    const reg = /\[(\d+):(\d+\.\d+)\](.*)/;
    for (const line of lines) {
        const m = line.match(reg);
        if (m) result.push({ time: parseInt(m[1]) * 60 + parseFloat(m[2]), text: m[3].trim() });
    }
    return result.sort((a, b) => a.time - b.time);
}

function syncLyrics(currentTime) {
    if (!ncm.lyrics.length) return;
    let idx = 0;
    for (let i = 0; i < ncm.lyrics.length; i++) {
        if (currentTime >= ncm.lyrics[i].time) idx = i;
        else break;
    }
    const prev = ncm.lyrics[idx - 1];
    const cur  = ncm.lyrics[idx];
    const next = ncm.lyrics[idx + 1];
    document.getElementById('ncm-lyric-prev').textContent = prev ? prev.text : '';
    document.getElementById('ncm-lyric-cur').textContent  = cur  ? cur.text  : '';
    document.getElementById('ncm-lyric-next').textContent = next ? next.text : '';
}

// ==========================================
// 播放控制
// ==========================================
window.ncmTogglePlay = () => {
    if (!ncm.audio) return;
    if (ncm.isPlaying) {
        ncm.audio.pause();
        ncm.isPlaying = false;
        document.getElementById('ncm-play-btn').textContent = '▶';
        document.getElementById('ncm-mini-ctrl').textContent = '▶';
        document.getElementById('ncm-disk').classList.remove('playing');
        document.getElementById('ncm-disk-needle').classList.remove('playing');
    } else {
        ncm.audio.play();
        ncm.isPlaying = true;
        document.getElementById('ncm-play-btn').textContent = '⏸';
        document.getElementById('ncm-mini-ctrl').textContent = '⏸';
        document.getElementById('ncm-disk').classList.add('playing');
        document.getElementById('ncm-disk-needle').classList.add('playing');
    }
};

window.ncmNext = () => {
    if (!ncm.playlist) return;
    let next;
    if (ncm.mode === 'random') {
        next = Math.floor(Math.random() * ncm.playlist.songs.length);
    } else if (ncm.mode === 'single') {
        next = ncm.songIndex;
    } else {
        next = (ncm.songIndex + 1) % ncm.playlist.songs.length;
    }
    ncmPlaySong(ncm.playlist.songs[next], next);
};

window.ncmPrev = () => {
    if (!ncm.playlist) return;
    const prev = (ncm.songIndex - 1 + ncm.playlist.songs.length) % ncm.playlist.songs.length;
    ncmPlaySong(ncm.playlist.songs[prev], prev);
};

window.ncmSeek = (e) => {
    if (!ncm.audio || !ncm.audio.duration) return;
    const rect = document.getElementById('ncm-progress-bg').getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    ncm.audio.currentTime = pct * ncm.audio.duration;
};

window.ncmToggleLike = () => {
    if (!ncm.song) return;
    ncm.song.liked = !ncm.song.liked;
    document.getElementById('ncm-player-like').textContent = ncm.song.liked ? '♥' : '♡';
    document.getElementById('ncm-player-like').classList.toggle('liked', ncm.song.liked);
    saveData();
    showToast(ncm.song.liked ? '已加入我喜欢的音乐 ❤️' : '已取消喜欢');
};

window.ncmToggleMode = () => {
    const modes = ['list', 'random', 'single'];
    const icons = { list: '⇄', random: '🔀', single: '🔂' };
    const labels = { list: '列表循环', random: '随机播放', single: '单曲循环' };
    ncm.mode = modes[(modes.indexOf(ncm.mode) + 1) % modes.length];
    document.getElementById('ncm-mode-btn').textContent = icons[ncm.mode];
    showToast(labels[ncm.mode]);
};

function startProgressTimer() {
    clearInterval(ncm.progressTimer);
    ncm.progressTimer = setInterval(() => {
        if (!ncm.audio || !ncm.audio.duration) return;
        const pct = ncm.audio.currentTime / ncm.audio.duration * 100;
        document.getElementById('ncm-progress-fill').style.width = pct + '%';
        document.getElementById('ncm-mini-progress').style.width = pct + '%';
        document.getElementById('ncm-time-cur').textContent = ncmFmtTime(ncm.audio.currentTime);
        syncLyrics(ncm.audio.currentTime);
    }, 500);
}

// ==========================================
// 导航
// ==========================================
window.ncmOpenPlayer = () => {
    document.getElementById('page-cp-music').classList.add('player-open');
};
window.ncmClosePlayer = () => {
    document.getElementById('page-cp-music').classList.remove('player-open');
};

// ==========================================
// 评论
// ==========================================
window.ncmOpenComments = async () => {
    if (!ncm.song) return;
    const contact = appData.chatData.contacts.find(c => c.id === ncm.contactId);
    document.getElementById('page-cp-music').classList.add('comment-open');
    const scroll = document.getElementById('ncm-comment-scroll');
    scroll.innerHTML = '<div class="ncm-loading"><div class="ncm-loading-icon">💬</div><div>加载评论...</div></div>';

    if (!ncm.song.comments) {
        ncm.song.comments = await generateSongComments(ncm.song, contact);
        saveData();
    }
    renderNcmComments(ncm.song.comments);
};

window.ncmCloseComments = () => {
    document.getElementById('page-cp-music').classList.remove('comment-open');
};

async function generateSongComments(song, contact) {
    if (!appData.lastApi || !appData.lastApi.url) return getFallbackComments(song);
    const prompt = `为网易云音乐歌曲《${song.name}》(${song.artist})生成8条中文评论。
角色"${contact ? contact.name : '用户'}"会在其中1-2条里留言，其余是普通网友评论。
要求：贴近真实网易云评论风格，有时感性有时搞笑，偶尔一句话触动人心。
只输出JSON数组，格式：
[{"name":"用户名","text":"评论内容","time":"X小时前","likes":数字,"isCharacter":布尔值,"reply":null或"被回复的内容"}]`;
    try {
        const res  = await fetch(`${appData.lastApi.url}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${appData.lastApi.key}` },
            body: JSON.stringify({
                model: appData.lastApi.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.9
            })
        });
        const data = await res.json();
        let raw = data.choices[0].message.content.replace(/```json|```/g, '').trim();
        const match = raw.match(/\[[\s\S]*\]/);
        if (match) raw = match[0];
        return JSON.parse(raw);
    } catch (e) {
        return getFallbackComments(song);
    }
}

function getFallbackComments(song) {
    return [
        { name: '夜风_island',    text: `听了一遍又一遍，还是这首。`, time: '3小时前', likes: 4521, isCharacter: false, reply: null },
        { name: '像素格子',       text: `把这首歌发给最想发的那个人了，他没回。`, time: '昨天', likes: 8833, isCharacter: false, reply: null },
        { name: '路灯下的鱼',     text: `${song.artist}真的懂，每次都这么准。`, time: '2天前', likes: 312, isCharacter: false, reply: null },
        { name: '不知名路人甲',   text: `在公司厕所哭了五分钟，出去假装没事人。`, time: '上周', likes: 22341, isCharacter: false, reply: null },
        { name: '浮生梦半夏',     text: `单曲循环第十七遍了。`, time: '1个月前', likes: 198, isCharacter: false, reply: null },
    ];
}

function renderNcmComments(comments) {
    const scroll = document.getElementById('ncm-comment-scroll');
    scroll.innerHTML = '';
    const contact = appData.chatData.contacts.find(c => c.id === ncm.contactId);

    // 精选评论标题
    const title = document.createElement('div');
    title.className = 'ncm-section-title';
    title.textContent = `精彩评论 (${comments.length})`;
    scroll.appendChild(title);

    comments.forEach(c => {
        const initials = (c.isCharacter && contact) ? contact.name.slice(0, 1) : c.name.slice(0, 1);
        const avatarBg = c.isCharacter ? '#e60026' : `hsl(${c.name.charCodeAt(0) * 37 % 360},50%,50%)`;
        const row = document.createElement('div');
        row.className = 'ncm-comment-row';
        row.innerHTML = `
            <div class="ncm-comment-avatar" style="background:${avatarBg}">${initials}</div>
            <div class="ncm-comment-body">
                <div class="ncm-comment-name">${c.isCharacter && contact ? contact.name : c.name}${c.isCharacter ? ' <span class="ncm-liked-tag">TA</span>' : ''}</div>
                ${c.reply ? `<div style="background:#f5f5f5;padding:6px 8px;border-radius:4px;font-size:12px;color:#888;margin-bottom:4px;">↩ ${c.reply}</div>` : ''}
                <div class="ncm-comment-text">${c.text}</div>
                <div class="ncm-comment-meta">
                    <span class="ncm-comment-time">${c.time}</span>
                    <span class="ncm-comment-like">❤ ${ncmFmtCount(c.likes)}</span>
                </div>
            </div>`;
        scroll.appendChild(row);
    });
}

// ==========================================
// Mini播放条（显示在手机页面底部）
// ==========================================
function updateMiniPlayer(song) {
    const mini = document.getElementById('ncm-mini-player');
    if (!song) { mini.classList.remove('show'); return; }
    document.getElementById('ncm-mini-cover').src  = song.cover || '';
    document.getElementById('ncm-mini-name').textContent   = song.name;
    document.getElementById('ncm-mini-artist').textContent = song.artist;
    mini.classList.add('show');
}

// ==========================================
// 工具函数
// ==========================================
function ncmFmtTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function ncmFmtCount(n) {
    if (!n) return '0';
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return String(n);
}

// ==========================================
// 自动初始化（注入CSS和HTML）
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    injectNcmStyles();
    injectNcmHTML();
});
