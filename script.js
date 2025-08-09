/* 簡單說明
 - hotspot 使用相對百分比（x%, y%）來儲存，這樣圖片尺寸改變時仍可正確判定
 - 支援兩種模式：play (遊玩) / edit (編輯 hotspot)
 - 可上傳本地圖片取代 example.jpg
 - 提供下載 hotpots JSON 功能
*/

// --- 參數與狀態 ---
const mainImage = document.getElementById('mainImage');
const overlay = document.getElementById('overlay');
const wrapper = document.getElementById('imageWrapper');
const message = document.getElementById('message');
const hotspotJSON = document.getElementById('hotspotJSON');

const modeSelect = document.getElementById('modeSelect');
const resetBtn = document.getElementById('resetBtn');
const revealBtn = document.getElementById('revealBtn');
const imageInput = document.getElementById('imageInput');

const editTools = document.getElementById('editTools');
const radiusRange = document.getElementById('radiusRange');
const addHotspotBtn = document.getElementById('addHotspotBtn');
const clearHotspotsBtn = document.getElementById('clearHotspotsBtn');
const downloadHotspots = document.getElementById('downloadHotspots');

let hotspots = [
  // 範例 hotspot（百分比座標）: user 請用編輯模式自己設定更精準的座標
  // {xPct: 55, yPct: 62, rPx: 60}
];

let lastClickPct = null; // 編輯模式：紀錄剛剛點的中心
let markers = []; // 暫時顯示的 marker DOM

// --- 初始化畫布大小 ---
function resizeCanvas(){
  overlay.width = mainImage.clientWidth;
  overlay.height = mainImage.clientHeight;
  overlay.style.width = mainImage.clientWidth + 'px';
  overlay.style.height = mainImage.clientHeight + 'px';
  overlay.style.left = mainImage.offsetLeft + 'px';
  overlay.style.top = mainImage.offsetTop + 'px';
  drawAllHotspots(); // 畫出 hotspot 輪廓（在編輯時會顯示）
}
window.addEventListener('resize', resizeCanvas);
mainImage.addEventListener('load', () => {
  resizeCanvas();
});

// --- 把畫布清空、畫圈圈等 ---
function clearCanvas(){
  const ctx = overlay.getContext('2d');
  ctx.clearRect(0,0,overlay.width,overlay.height);
}
function drawAllHotspots(showAll=false){
  clearCanvas();
  if(hotspots.length===0) { hotspotJSON.textContent = '[]'; return; }
  const ctx = overlay.getContext('2d');
  hotspots.forEach(h=>{
    const cx = (h.xPct/100)*overlay.width;
    const cy = (h.yPct/100)*overlay.height;
    const r = h.rPx * (overlay.width / mainImage.naturalWidth); // approximate scale
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    ctx.fillStyle = 'rgba(255,0,0,0.08)';
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
    ctx.stroke();
  });
  hotspotJSON.textContent = JSON.stringify(hotspots, null, 2);
}

// --- 計算 click 相對百分比座標 ---
function getClickPercent(e){
  const rect = mainImage.getBoundingClientRect();
  let clientX = e.clientX, clientY = e.clientY;
  // 支援觸控事件
  if(e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  }
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const xPct = (x / rect.width) * 100;
  const yPct = (y / rect.height) * 100;
  return {xPct, yPct, xPx: x, yPx: y};
}

// --- 檢查是否命中 hotspot ---
function checkHit(xPct, yPct){
  // 以 image 的當前尺寸來算距離
  const imgW = overlay.width, imgH = overlay.height;
  for(const h of hotspots){
    const hx = (h.xPct/100)*imgW;
    const hy = (h.yPct/100)*imgH;
    const rx = (xPct/100)*imgW;
    const ry = (yPct/100)*imgH;
    const dx = hx - rx, dy = hy - ry;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const rScaled = h.rPx * (imgW / mainImage.naturalWidth);
    if(dist <= rScaled) return h;
  }
  return null;
}

// --- 顯示 marker（答對/答錯） ---
function showMarker(xPx, yPx, ok=true){
  const el = document.createElement('div');
  el.className = 'marker';
  el.style.left = xPx + 'px';
  el.style.top = yPx + 'px';
  el.style.width = '40px';
  el.style.height = '40px';
  el.style.borderRadius = '50%';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.fontSize = '18px';
  el.style.color = '#fff';
  el.style.zIndex = 40;
  el.style.background = ok ? 'rgba(46,204,113,0.95)' : 'rgba(255,77,77,0.95)';
  el.textContent = ok ? '✓' : '✕';
  wrapper.appendChild(el);
  markers.push(el);
  setTimeout(()=> {
    el.style.transition = 'transform 600ms ease, opacity 600ms';
    el.style.transform = 'translate(-50%,-50%) scale(1.6)';
    el.style.opacity = '0';
  }, 700);
  setTimeout(()=> { el.remove(); markers = markers.filter(m=>m!==el); }, 1400);
}

// --- 互動事件：點擊圖片 ---
function onImageClick(e){
  const {xPct, yPct, xPx, yPx} = getClickPercent(e);
  if(modeSelect.value === 'edit'){
    // 編輯模式：設定中心
    lastClickPct = {xPct, yPct, xPx, yPx};
    message.textContent = `已選取中心：(${xPct.toFixed(1)}%, ${yPct.toFixed(1)}%)，調整半徑後按「加入 hotspot」。`;
    // 在畫布上暫時畫一個中心小圈
    drawAllHotspots();
    const ctx = overlay.getContext('2d');
    ctx.beginPath();
    const cx = (xPct/100)*overlay.width;
    const cy = (yPct/100)*overlay.height;
    ctx.fillStyle = 'rgba(0,0,255,0.9)';
    ctx.arc(cx, cy, 6, 0, Math.PI*2);
    ctx.fill();
    return;
  }

  // Play 模式：檢查命中
  const hit = checkHit(xPct, yPct);
  if(hit){
    message.textContent = '答對了！你找到錯誤處。';
    showMarker(xPx, yPx, true);
  } else {
    message.textContent = '不是喔，再找找看！';
    showMarker(xPx, yPx, false);
  }
}

// --- 編輯模式：加入 hotspot ---
addHotspotBtn.addEventListener('click', ()=>{
  if(!lastClickPct){
    alert('請先在圖片上點選 hotspot 的中心位置 (編輯模式)。');
    return;
  }
  const rPix = Number(radiusRange.value);
  hotspots.push({
    xPct: Number(lastClickPct.xPct.toFixed(3)),
    yPct: Number(lastClickPct.yPct.toFixed(3)),
    rPx: rPix
  });
  lastClickPct = null;
  drawAllHotspots();
  message.textContent = '已加入 hotspot。';
});

// --- 清除所有 hotspot ---
clearHotspotsBtn.addEventListener('click', ()=>{
  if(!confirm('確定要刪除所有 hotspot 嗎？')) return;
  hotspots = [];
  drawAllHotspots();
  message.textContent = '已清除所有 hotspot。';
});

// --- 顯示答案（在 Play 模式下也能使用） ---
revealBtn.addEventListener('click', ()=>{
  if(hotspots.length===0){ alert('目前沒有 hotspot，請先用編輯模式設定。'); return;}
  // 在原 overlay 畫上紅圈（永久一段時間）
  drawAllHotspots(true);
  message.textContent = '提示：紅圈為答案區域。';
});

// --- 重置標記（清掉暫時的 marker） ---
resetBtn.addEventListener('click', ()=>{
  markers.forEach(m=>m.remove());
  markers = [];
  message.textContent = '已重置標記。';
  drawAllHotspots();
});

// --- 模式切換 ---
modeSelect.addEventListener('change', ()=>{
  const mode = modeSelect.value;
  if(mode === 'edit'){ editTools.classList.remove('hidden'); message.textContent='編輯模式：點選圖片設定 hotspot 中心。'; }
  else { editTools.classList.add('hidden'); message.textContent='遊玩模式：在圖片中點選你找到的錯誤處。'; }
  drawAllHotspots();
});

// --- 圖片上傳支援 ---
imageInput.addEventListener('change', (ev)=>{
  const file = ev.target.files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  mainImage.src = url;
  mainImage.onload = ()=> {
    resizeCanvas();
    message.textContent = '新圖片已載入。編輯或遊玩。';
  };
});

// --- 下載 hotspots JSON ---
downloadHotspots.addEventListener('click', ()=>{
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(hotspots, null, 2));
  const a = document.createElement('a');
  a.href = dataStr;
  a.download = 'hotspots.json';
  a.click();
});

// --- 監聽點擊到圖片區域（支援觸控） ---
wrapper.addEventListener('click', (e)=>{
  // 確保點到圖片範圍
  // 轉給 handler
  onImageClick(e);
});
wrapper.addEventListener('touchstart', (e)=>{ onImageClick(e); });

// 初始化（若圖片已載入）
if(mainImage.complete){
  resizeCanvas();
}
drawAllHotspots();
