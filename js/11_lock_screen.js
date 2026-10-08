// ========== 锁屏系统：物理滑动解锁 / 时间刷新 / 手电筒 / 相机快捷 ==========
// 坦白说 APP 已独立到 13_tanbai.js

// ========== 锁屏系统逻辑 (全真物理跟手滑动) ==========

// ==========================================
// 🚀 锁屏系统逻辑 (全真物理跟手滑动)
// ==========================================
window.toggleLockScreen = () => {
    const tgl = document.getElementById('appr-lock-tgl');
    tgl.classList.toggle('on');
    appData.enableLockScreen = tgl.classList.contains('on');
    saveData();
};

window.unlockScreen = () => {
    const ls = document.getElementById('lock-screen');
    if(!ls) return;
    ls.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.5s ease';
    ls.style.transform = 'translateY(-100%)'; 
    ls.style.opacity = '0';
    setTimeout(() => { ls.style.display = 'none'; }, 500);
};

// 手电筒特效
window.toggleLockFlashlight = (btn) => {
    try { if(navigator.vibrate) navigator.vibrate(50); } catch(e){} // 模拟震动
    btn.classList.toggle('flash-on');
};

// 相机特效
window.openLockCamera = () => {
    try { if(navigator.vibrate) navigator.vibrate(50); } catch(e){} 
    // 直接复用你之前写的唤起本地相册上传的功能！
    unlockScreen(); 
    setTimeout(() => document.getElementById('chat-image-upload').click(), 400); 
};

// 实时更新时间
function updateLockScreenTime() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2,'0');
    const m = String(d.getMinutes()).padStart(2,'0');
    const lsTime = document.getElementById('ls-time-display');
    if(lsTime) lsTime.innerText = `${h}:${m}`;
    const days = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];
    const lsDate = document.getElementById('ls-date-display');
    if(lsDate) lsDate.innerText = `${d.getMonth()+1}月${d.getDate()}日 ${days[d.getDay()]}`;
}

// 📱 核心：监听物理滑动事件 (V1.1 修复版)
document.addEventListener("DOMContentLoaded", () => {
    const ls = document.getElementById('lock-screen');
    if(!ls) return;
    
    let startY = 0, currentY = 0, isSwiping = false;

    ls.addEventListener('touchstart', (e) => {
        if(e.target.closest('.ls-action-btn')) return;
        
        startY = e.touches[0].clientY;
        currentY = startY; // 重置 currentY
        isSwiping = true;
        ls.style.transition = 'none';
    }, { passive: true }); // 改为 passive: true 优化性能

    ls.addEventListener('touchmove', (e) => {
        if(!isSwiping) return;
        currentY = e.touches[0].clientY;
        let deltaY = currentY - startY;
        
        if(deltaY < 0) {
            // 在 iOS 上，滑动时阻止默认行为是必须的
            e.preventDefault(); 
            ls.style.transform = `translateY(${deltaY}px)`;
            ls.style.opacity = 1 + (deltaY / 600);
        }
    }, { passive: false }); // 需要 preventDefault，所以不能是 passive

    ls.addEventListener('touchend', (e) => {
        // ✅ 致命BUG修复： `!isisSwiping` -> `!isSwiping`
        if(!isSwiping) return; 
        
        isSwiping = false;
        let deltaY = currentY - startY;
        
        ls.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease';
        
        if(deltaY < -150) {
            unlockScreen();
        } else {
            // 没滑够，弹回去
            ls.style.transform = 'translateY(0)';
            ls.style.opacity = '1';
        }
    });
});

// ==========================================
