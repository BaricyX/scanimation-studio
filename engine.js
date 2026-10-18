
(()=>{'use strict';const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),stage=$('stage'),overlay=$('overlay'),hint=$('hint');let mode=0,imgs=[],pos=0,run=false,raf=0,settings={stripe:4,phase:0,direction:'vertical',speed:.5,contrast:70,motion:1},textValue='不止眼前',story=0;const demoPhoto=new Image();demoPhoto.src='assets/cat-source.jpg';const portraitPhoto=new Image();portraitPhoto.src='assets/cat.jpg';const modes=[['光栅动画','把隐藏动画发到朋友圈','SCAN / REVEAL','▥','上传 2–8 张照片，生成光栅底图与透明卡。实体卡可直接扫描，iPhone 跨 App 拖动仍需真机校准。'],['刮刮乐','刮开另一面的惊喜','SCRATCH / DISCOVER','✦','自选封面（银、金、粉或自己的照片）和封面文字，再放进隐藏照片和一句隐藏的话。刮开大半后自动揭晓，适合做礼物、告白或惊喜卡。'],['光变卡','倾斜手机，画面一条条翻过去','TILT / LENTICULAR','◒','上传 2–4 张照片，倾斜手机或左右拖动，画面像光变卡一样按条翻转。可导出配合 60 LPI 实体光栅片打印的交错图。iPhone 可能需要授权运动传感器。'],['动态文字','让一句话活过来','TYPE / PLAY','Aa','输入文字，拖动手指制造波浪和动态字形。'],['液态照片','触摸照片产生玻璃折射','TOUCH / LIQUID','≈','点一下激起涟漪，拖得越快画面被推得越远，松手后慢慢复原。可调涟漪强度和复原速度。'],['照片故事','把瞬间变成互动故事','SWIPE / STORY','▤','上传多张照片，左右滑动翻阅；也可保存当前故事卡片。'],['密码卡','只有知道方法的人才看得到','FOLD / ANGLE / FILTER','◇','三种藏法：折页（按虚线对折，两端拼出真话）、斜视（把卡片放平从底边斜看才读得出）、红膜（用红色解码镜或红色玻璃纸才浮现）。都可保存打印版做实体卡。'],['裸眼 3D','隐藏的立体形状','STEREOGRAM','◎','平行视线观看隐藏图案'],['折叠密码','拼合隐藏信息','FOLD','⌁','滑动拼合文字'],['无限照片','探索层层画面','INFINITE','▣','按住画面持续推进，往上拖加速，往下拖后退，松手后惯性滑行。上传多张照片组成你自己的无限隧道。'],['颜色解密','用颜色寻找秘密','COLOR','◉','切换颜色滤镜']];function button(label,fn,kind=''){let b=document.createElement('button');b.className='btn '+kind;b.textContent=label;b.onclick=fn;$('actions').appendChild(b)}
function field(label,value,min,max,fn){let d=document.createElement('div');d.className='field';d.innerHTML='<label>'+label+' <span>'+value+'</span></label><input type="range" min="'+min+'" max="'+max+'" value="'+value+'">';let i=d.querySelector('input'),v=d.querySelector('span');i.setAttribute('aria-label',label);i.oninput=()=>{v.textContent=i.value;fn(+i.value)};$('controls').appendChild(d)}
function fileInput(multiple=false,max=8){
 const l=document.createElement('label');l.className='file';l.append(document.createTextNode(multiple?'＋ 添加照片':'＋ 上传照片'));
 const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=multiple;input.setAttribute('aria-label',multiple?'上传照片，最多八张':'上传照片');l.appendChild(input);$('controls').appendChild(l);
 input.onchange=async()=>{
 const files=[...input.files];if(!files.length)return;
 const existing=mode===0?imgs.length:0;const limit=multiple?max:1;
 if(mode===0&&existing===0&&files.length<2){toast('请选择 2–8 张照片');input.value='';return}
 if(files.length+existing>limit)toast('最多保留 '+limit+' 张照片');
 const batch=files.slice(0,limit-existing);if(!batch.length)return;
 l.classList.add('loading');
 try{const arr=await Promise.all(batch.map(loadPhoto));
 imgs=mode===0?[...imgs,...arr]:arr;story=0;compositeCache=null;render();if(mode===0)refreshFrames();toast('照片已载入');
 }catch(e){toast('图片读取失败，请使用 JPG、PNG 或 WebP')}finally{l.classList.remove('loading');input.value=''}
 };
}
function base(c=ctx,w=600,h=750,variant=0){
 c.clearRect(0,0,w,h);c.fillStyle='#14151b';c.fillRect(0,0,w,h);
 if(!demoPhoto.complete||!demoPhoto.naturalWidth)return;
 c.save();c.translate(w/2,h/2);const t=variant%4;c.rotate((t-1.5)*.012);c.scale(1.07,1.07);c.translate(-w/2+(t-1.5)*w*.018,-h/2);drawPhoto(c,demoPhoto,w,h);c.restore();
}
/* Demo sequence for the scanimation editor: an illustrated cat that blinks, turns and yawns */
const CAT_FRAMES=[{eye:1,turn:0,mouth:0},{eye:.08,turn:0,mouth:0},{eye:1,turn:-1,mouth:0},{eye:.55,turn:-.25,mouth:.45},{eye:.05,turn:0,mouth:1},{eye:.7,turn:.2,mouth:.15}];
function frameTotal(){return imgs.length||(mode===0?CAT_FRAMES.length:4)}
function drawCat(c,w,h,i){
 const f=CAT_FRAMES[((i%CAT_FRAMES.length)+CAT_FRAMES.length)%CAT_FRAMES.length],u=w/600,t=f.turn,m=f.mouth;
 c.save();c.fillStyle='#15161b';c.fillRect(0,0,w,h);const glow=c.createRadialGradient(300*u,360*u,40*u,300*u,400*u,420*u);glow.addColorStop(0,'#3a2c25');glow.addColorStop(1,'#15161b');c.fillStyle=glow;c.fillRect(0,0,w,h);
 c.scale(u,u);c.translate(0,(h/u-750)/2);
 const orange='#e8913f',dark='#b8601f',cream='#fbf1e2',ink='#2a1a12',pink='#f2a3a0';
 // Body and chest
 c.fillStyle=orange;c.beginPath();c.ellipse(300,700,215,190,0,Math.PI,0);c.fill();c.fillStyle=cream;c.beginPath();c.ellipse(300+t*12,690,95,150,0,Math.PI,0);c.fill();
 c.save();c.translate(300+t*14,385-m*14);c.rotate(-m*.06+t*.05);
 // Ears: the far ear shrinks as the head turns
 const ear=(side)=>{const s=1-Math.max(0,side*t)*.35,x=side*112+t*22;c.fillStyle=orange;c.beginPath();c.moveTo(x-side*68*s,-70);c.lineTo(x+side*18*s,-205*(.9+.1*s)-m*8);c.lineTo(x+side*78*s,-40);c.closePath();c.fill();c.fillStyle=pink;c.beginPath();c.moveTo(x-side*38*s,-78);c.lineTo(x+side*16*s,-172*(.9+.1*s)-m*8);c.lineTo(x+side*52*s,-58);c.closePath();c.fill()};ear(-1);ear(1);
 // Head
 c.fillStyle=orange;c.beginPath();c.ellipse(0,0,178,150,0,0,Math.PI*2);c.fill();
 c.fillStyle=dark;[-34,0,34].forEach((x,k)=>{c.beginPath();c.ellipse(x+t*50,-118+(k===1?-6:0),11,38,x*.004,0,Math.PI*2);c.fill()});[-1,1].forEach(side=>{for(let k=0;k<3;k++){c.beginPath();c.ellipse(side*(150-k*4)+t*10,-10+k*30,26,8,side*.25,0,Math.PI*2);c.fill()}});
 // Muzzle follows the turn
 const fx=t*62;c.fillStyle=cream;c.beginPath();c.ellipse(fx-38,58+m*10,56,44,0,0,Math.PI*2);c.ellipse(fx+38,58+m*10,56,44,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(fx,40,40,70,0,0,Math.PI*2);c.fill();
 // Eyes: lids close from above and below
 [-1,1].forEach(side=>{const ex=fx+side*70,ey=-18,squash=1-Math.max(0,side*t)*.4,rw=36*squash,rh=30,open=f.eye;
  c.save();c.beginPath();c.ellipse(ex,ey,rw,rh*Math.max(.04,open),0,0,Math.PI*2);c.clip();c.fillStyle='#c8d84a';c.fillRect(ex-rw,ey-rh,rw*2,rh*2);c.fillStyle='#8fae2e';c.beginPath();c.ellipse(ex,ey+8,rw,rh*.7,0,0,Math.PI*2);c.fill();c.fillStyle=ink;c.beginPath();c.ellipse(ex+t*14,ey,7*squash,24,0,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(ex+t*14-8,ey-11,5,0,7);c.fill();c.restore();
  c.strokeStyle=ink;c.lineWidth=5;c.lineCap='round';c.beginPath();if(open<.15){c.moveTo(ex-rw,ey);c.quadraticCurveTo(ex,ey+(m>.5?-10:12),ex+rw,ey)}else c.ellipse(ex,ey,rw,rh*open,0,0,Math.PI*2);c.stroke()});
 // Nose and mouth: a yawn opens downward with fangs and tongue
 const ny=36+m*4;c.fillStyle='#e0787a';c.beginPath();c.moveTo(fx-17,ny);c.lineTo(fx+17,ny);c.lineTo(fx,ny+16);c.closePath();c.fill();
 c.strokeStyle=ink;c.lineWidth=4;c.beginPath();c.moveTo(fx,ny+16);c.lineTo(fx,ny+28);c.stroke();
 if(m>.05){const mw=28+m*30,mh=8+m*62,my=ny+28;c.fillStyle='#5b1a1f';c.beginPath();c.ellipse(fx,my+mh*.55,mw,mh*.6,0,0,Math.PI*2);c.fill();c.fillStyle='#e9707a';c.beginPath();c.ellipse(fx,my+mh*.95,mw*.6,mh*.3,0,Math.PI,0);c.fill();c.fillStyle='#fff';[-1,1].forEach(s=>{c.beginPath();c.moveTo(fx+s*mw*.62,my+mh*.05);c.lineTo(fx+s*mw*.48,my+mh*.05+10+m*8);c.lineTo(fx+s*mw*.36,my+mh*.05);c.fill()})}
 else{c.beginPath();c.moveTo(fx-26,ny+34);c.quadraticCurveTo(fx-12,ny+44,fx,ny+28);c.quadraticCurveTo(fx+12,ny+44,fx+26,ny+34);c.stroke()}
 c.strokeStyle='#fff8';c.lineWidth=2.4;[-1,1].forEach(s=>[-10,4,18].forEach((dy,k)=>{c.beginPath();c.moveTo(fx+s*62,ny+30+dy*.6);c.quadraticCurveTo(fx+s*130,ny+20+dy,fx+s*205,ny+8+dy*1.6+k*4);c.stroke()}));
 c.restore();c.restore();
}
function drawPhoto(c,im,w,h){c.fillStyle='#f0f0ed';c.fillRect(0,0,w,h);let iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.max(w/iw,h/ih);c.drawImage(im,(w-iw*s)/2,(h-ih*s)/2,iw*s,ih*s)}
function scene(c,w,h,i){if(imgs.length)drawPhoto(c,imgs[i%imgs.length],w,h);else if(mode===0)drawCat(c,w,h,i);else base(c,w,h,i)}
function canvasFor(w=600,h=750){let c=document.createElement('canvas');c.width=w;c.height=h;return c}
let compositeCache=null;
function composite(w=600,h=750){
 const key=[w,h,settings.stripe,settings.direction,settings.contrast];
 if(compositeCache&&compositeCache.images===imgs&&key.join()===compositeCache.key)return compositeCache.canvas;
 const c=canvasFor(w,h),out=c.getContext('2d'),n=frameTotal(),p=Math.max(1,settings.stripe*(w/600)),vertical=settings.direction==='vertical';
 out.imageSmoothingEnabled=false;
 for(let i=0;i<n;i++){
  const source=canvasFor(w,h),sg=source.getContext('2d');sg.filter=`contrast(${(settings.contrast??70)/70})`;scene(sg,w,h,i);
  const extent=vertical?w:h;
  for(let a=i*p;a<extent;a+=p*n){const span=Math.min(p,extent-a);if(vertical)out.drawImage(source,a,0,span,h,a,0,span,h);else out.drawImage(source,0,a,w,span,0,a,w,span)}
 }
 compositeCache={canvas:c,images:imgs,key:key.join()};return c;
}
function drawScanimation(){
 ctx.drawImage(composite(),0,0);overlay.innerHTML='';const still=canvasFor(),st=still.getContext('2d');st.filter=`contrast(${(settings.contrast??70)/70})`;scene(st,600,750,0);const rest=document.createElement('img');rest.className='rest-photo';rest.alt='';rest.src=still.toDataURL('image/jpeg',.9);overlay.appendChild(rest);
 const card=document.createElement('div');card.className='drag-card';card.setAttribute('aria-label','拖动光栅遮罩');
 const vertical=settings.direction==='vertical',slit=settings.stripe/600*stage.clientWidth,pitch=slit*frameTotal();
 card.style.backgroundImage=`repeating-linear-gradient(${vertical?90:180}deg,transparent 0px,transparent ${slit}px,#050506 ${slit}px,#050506 ${pitch}px)`;
 overlay.appendChild(card);applyPhase();let down=null;
 card.onpointerdown=e=>{stopPlayback();document.body.classList.add('is-scanning');down={point:vertical?e.clientX:e.clientY,phase:settings.phase};card.setPointerCapture(e.pointerId);e.preventDefault()};
 card.onpointermove=e=>{if(!down)return;const delta=(vertical?e.clientX:e.clientY)-down.point;settings.phase=((down.phase+delta/pitch)%1+1)%1;applyPhase()};
 card.onpointerup=card.onpointercancel=()=>{down=null;document.body.classList.remove('is-scanning')};hint.textContent=vertical?'左右拖动光栅':'上下拖动光栅';
}
function applyPhase(){
 const card=overlay.querySelector('.drag-card');if(!card)return;
 const pitch=settings.stripe*frameTotal()/600*stage.clientWidth;
 card.style.setProperty('--stripe-angle',settings.direction==='vertical'?'90deg':'180deg');card.style.setProperty('--stripe-pitch',pitch+'px');const offset=settings.phase*pitch;
 card.style.backgroundPosition=settings.direction==='vertical'?`${offset}px 0`:`0 ${offset}px`;
 $('phase').value=Math.round(settings.phase*1000);$('frameCount').textContent=String(Math.floor(settings.phase*frameTotal())+1).padStart(2,'0')+' / '+String(frameTotal()).padStart(2,'0');
}
function download(c,name){c.toBlob(b=>{if(!b)return;let a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000)},'image/png')}
let iosCardScale=100;function maskCanvas(){
 const w=600,h=750,n=frameTotal(),scale=iosCardScale/100,slit=settings.stripe/scale,pitch=slit*n,c=canvasFor(w,h),g=c.getContext('2d');g.fillStyle='#050506';
 const vertical=settings.direction==='vertical';for(let a=slit;a<(vertical?w:h);a+=pitch){if(vertical)g.fillRect(a,0,pitch-slit,h);else g.fillRect(0,a,w,pitch-slit)}return c;
}
function downloadCard(){download(maskCanvas(),'PLAYGROUND-mask-'+iosCardScale+'pct.png')}
function saveCurrent(){let c=canvasFor();c.getContext('2d').drawImage(canvas,0,0);download(c,'PLAY-'+modes[mode][0]+'.png')}
let tiltValue=0;function tiltMove(e){let r=stage.getBoundingClientRect();tiltValue=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));drawTilt(tiltValue)}
let sensor=null;async function sensorEnable(){if(typeof DeviceOrientationEvent==='undefined'){alert('此设备不支持方向感应');return}try{if(typeof DeviceOrientationEvent.requestPermission==='function'){let r=await DeviceOrientationEvent.requestPermission();if(r!=='granted')return}if(sensor)window.removeEventListener('deviceorientation',sensor);sensor=e=>{if(mode!==2)return;let g=e.gamma||0;tiltValue=Math.max(0,Math.min(1,(g+35)/70));drawTilt(tiltValue)};window.addEventListener('deviceorientation',sensor)}catch(e){alert('无法启用方向感应，请使用手指拖动')}}
function drawType(t=0){ctx.fillStyle='#101014';ctx.fillRect(0,0,600,750);let chars=[...textValue].slice(0,16),sz=Math.min(72,Math.floor(520/Math.max(1,chars.length)*1.5));ctx.font='900 '+sz+'px sans-serif';ctx.textAlign='center';let widths=chars.map(ch=>ctx.measureText(ch).width+3),total=widths.reduce((a,b)=>a+b,0),x=300-total/2;chars.forEach((ch,i)=>{let off=Math.sin(i*.9+t)*42;ctx.fillStyle=i%2?'#b4a6c9':'#fff';ctx.fillText(ch,x+widths[i]/2,385+off);x+=widths[i]});ctx.font='15px sans-serif';ctx.fillStyle='#b9d2cb';ctx.fillText('MOVE YOUR FINGER ↔',300,660)}
function drawStory(){scene(ctx,600,750,story);ctx.fillStyle='#1d2929b8';ctx.fillRect(0,0,600,70);ctx.fillStyle='white';ctx.font='bold 22px sans-serif';ctx.fillText('MY LITTLE STORY',25,44);ctx.fillStyle='#1d2929b8';ctx.fillRect(0,670,600,80);ctx.fillStyle='white';ctx.font='17px sans-serif';ctx.fillText('← SWIPE TO EXPLORE →',30,718);ctx.textAlign='right';ctx.fillText((story+1)+' / '+frameTotal(),570,718);ctx.textAlign='left'}
function clear(){cancelAnimationFrame(raf);cancelAnimationFrame(secretDemo);liquidRunning=false;zoomRunning=false;zoomHold=0;zoomVel=0;run=false;canvas.style.transform='';overlay.innerHTML='';overlay.onpointerdown=null;overlay.onpointermove=null;overlay.onpointerup=null;overlay.onpointercancel=null;overlay.onwheel=null;stage.onpointerdown=null;stage.onpointermove=null;stage.onpointerup=null;stage.onpointercancel=null;hint.textContent='';if(sensor){window.removeEventListener('deviceorientation',sensor);sensor=null}}
let secretText='周末见面',secretPos=0,zoomDepth=0,filterMode=0;
function secretInput(){let d=document.createElement('div');d.className='field';d.innerHTML='<label>秘密</label><input type="text" maxlength="8">';let i=d.querySelector('input');i.setAttribute('aria-label','隐藏文字');i.value=secretText;i.oninput=()=>{secretText=i.value||'周末见面';if(mode===6)drawSecret();else render()};$('controls').appendChild(d)}
function artText(s,x,y,size=70,color='#fff'){ctx.fillStyle=color;ctx.font='bold '+size+'px "Songti SC",Georgia,serif';ctx.textAlign='center';ctx.fillText(s,x,y,520);ctx.textAlign='left'}
function drawStereo(){let w=600,h=750,p=80,c=ctx.createImageData(w,h),seed=8;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}for(let y=0;y<h;y++){let row=[];for(let x=0;x<w;x++){let cx=x-300,cy=y-370,inside=cx*cx/21000+cy*cy/17000<1,offset=inside?12:0;let v=x<p?(rand()>.5?230:35):row[Math.max(0,x-p+offset)];row.push(v);let k=(y*w+x)*4;c.data[k]=c.data[k+1]=c.data[k+2]=v;c.data[k+3]=255}}ctx.putImageData(c,0,0);ctx.fillStyle='#b4a6c9';ctx.beginPath();ctx.arc(260,65,5,0,7);ctx.arc(340,65,5,0,7);ctx.fill()}
function drawFold(){ctx.fillStyle='#101010';ctx.fillRect(0,0,600,750);let chars=[...secretText],m=Math.ceil(chars.length/2),dx=(1-secretPos)*160;artText(chars.slice(0,m).join(''),225-dx,370,65,'#fff');artText(chars.slice(m).join(''),370+dx,370,65,'#b4a6c9');ctx.setLineDash([8,8]);ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(300,90);ctx.lineTo(300,640);ctx.stroke();ctx.setLineDash([])}
function drawColors(){ctx.fillStyle='#101018';ctx.fillRect(0,0,600,750);ctx.save();ctx.globalCompositeOperation='screen';artText(secretText,285,380,72,'#ff3131');artText(secretText,317,380,72,'#1de8f1');ctx.restore();if(filterMode){ctx.fillStyle=filterMode===1?'#ff0000b8':'#00eaffb8';ctx.fillRect(0,0,600,750)}}
function render(){clear();if(mode===0){drawScanimation();return}if(mode===1){resetScratch();return}if(mode===2){drawTilt(tiltValue);let active=false;overlay.onpointerdown=e=>{active=true;overlay.setPointerCapture(e.pointerId);tiltMove(e)};overlay.onpointermove=e=>{if(active)tiltMove(e)};overlay.onpointerup=overlay.onpointercancel=()=>active=false;hint.textContent='倾斜手机或左右拖动';return}if(mode===3){let t=0;drawType(t);overlay.onpointermove=e=>{let r=stage.getBoundingClientRect();t=(e.clientX-r.left)/r.width*9;drawType(t)};hint.textContent='滑动';return}if(mode===4){prepareLiquid();drawLiquid();let last=null;const at=e=>{let r=stage.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*750}};overlay.onpointerdown=e=>{overlay.setPointerCapture(e.pointerId);last=at(e);liquidRipple(last.x,last.y);wakeLiquid()};overlay.onpointermove=e=>{if(!last)return;const p=at(e);liquidTouch(p.x,p.y,p.x-last.x,p.y-last.y);last=p;wakeLiquid()};overlay.onpointerup=overlay.onpointercancel=()=>{last=null};hint.textContent='点一下起涟漪，拖动推开画面';return}if(mode===5){drawStory();let x=null;overlay.onpointerdown=e=>{x=e.clientX;overlay.setPointerCapture(e.pointerId)};overlay.onpointerup=e=>{if(x===null)return;let d=e.clientX-x;if(Math.abs(d)>25){story=(story+(d<0?1:-1)+frameTotal())%frameTotal();drawStory()}x=null};hint.textContent='滑动翻页';return}if(mode===6){drawSecret();secretHint();let down=false;const move=e=>{let r=stage.getBoundingClientRect();if(secretStyle==='red')lensPoint={x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*750};else secretPos=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));drawSecret()};overlay.onpointerdown=e=>{cancelAnimationFrame(secretDemo);down=true;overlay.setPointerCapture(e.pointerId);move(e)};overlay.onpointermove=e=>{if(down)move(e)};overlay.onpointerup=overlay.onpointercancel=()=>down=false;return}if(mode===8){let draw=drawFold;draw();let move=e=>{let rect=stage.getBoundingClientRect();secretPos=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));draw()};overlay.onpointerdown=e=>{overlay.setPointerCapture(e.pointerId);move(e)};overlay.onpointermove=e=>{if(e.pressure||e.buttons)move(e)};hint.textContent='左右滑动';return}if(mode===7){drawStereo();hint.textContent='平行视线观察';return}if(mode===9){drawInfinite();let y0=null;overlay.onpointerdown=e=>{overlay.setPointerCapture(e.pointerId);y0=e.clientY;zoomHold=1;wakeInfinite()};overlay.onpointermove=e=>{if(y0===null)return;zoomHold=Math.max(-2,Math.min(3,1+(y0-e.clientY)/70))};overlay.onpointerup=overlay.onpointercancel=()=>{y0=null;zoomHold=0};overlay.onwheel=e=>{e.preventDefault();zoomVel+=e.deltaY*-.0004;wakeInfinite()};return}if(mode===10){drawColors();overlay.onpointerdown=()=>{filterMode=(filterMode+1)%3;drawColors()};hint.textContent='点击切换滤镜';return}}
/* Shared demo photos for the multi-image experiments */
let layerCache=null,lensFrames=null;
const demoGallery=['assets/cat-source.jpg','assets/sunset.jpg','assets/cat.jpg','assets/optical-atmosphere.jpg'].map(src=>{const im=new Image();im.onload=()=>{layerCache=null;lensFrames=null;if(routeName==='editor'&&!imgs.length&&[2,6,9].includes(mode))render()};im.src=src;return im});
function demoReady(n=demoGallery.length){return demoGallery.slice(0,n).every(im=>im.complete&&im.naturalWidth)}
function galleryScene(c,w,h,i){if(imgs.length){drawPhoto(c,imgs[i%imgs.length],w,h);return}const im=demoGallery[i%demoGallery.length];if(im.complete&&im.naturalWidth)drawPhoto(c,im,w,h);else base(c,w,h,i)}
async function loadPhoto(file){const url=URL.createObjectURL(file);try{const im=new Image();im.src=url;await im.decode();const reduced=canvasFor(1200,1500);drawPhoto(reduced.getContext('2d'),im,1200,1500);return reduced}finally{URL.revokeObjectURL(url)}}
function photoInput(label,fn){const l=document.createElement('label');l.className='file';l.append(document.createTextNode(label));const input=document.createElement('input');input.type='file';input.accept='image/*';input.setAttribute('aria-label',label.replace('＋','').trim());l.appendChild(input);$('controls').appendChild(l);input.onchange=async()=>{const f=input.files[0];if(!f)return;l.classList.add('loading');try{fn(await loadPhoto(f));toast('照片已载入')}catch(e){toast('图片读取失败，请使用 JPG、PNG 或 WebP')}finally{l.classList.remove('loading');input.value=''}};return l}
function textField(label,value,max,fn){const d=document.createElement('div');d.className='field';d.innerHTML='<label>'+label+'</label><input type="text" maxlength="'+max+'">';const i=d.querySelector('input');i.setAttribute('aria-label',label);i.value=value;i.oninput=()=>fn(i.value);$('controls').appendChild(d);return d}
function segmented(label,options,current,fn){const d=document.createElement('div');d.className='direction-control';d.innerHTML='<span>'+label+'</span><div class="segmented" role="group" aria-label="'+label+'"></div>';const group=d.querySelector('.segmented');options.forEach(([value,text])=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.value=value;b.setAttribute('aria-pressed',String(value===current));b.onclick=()=>{group.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));fn(value)};group.appendChild(b)});$('controls').appendChild(d);return d}
function fitFont(g,texts,maxWidth,start,family){let size=start;for(const t of texts){if(!t)continue;g.font='bold '+size+'px '+family;const w=g.measureText(t).width;if(w>maxWidth)size=Math.floor(size*maxWidth/w)}return size}
const cardFont='"PingFang SC","Songti SC",Georgia,serif';
function smoothStep(f){return f*f*(3-2*f)}

/* Lenticular card: interleaved frames behind a ridged lens sheet */
let lensPitch=6,ridgePattern=null;
function lensSources(){const n=Math.min(4,imgs.length||2);if(lensFrames&&lensFrames.key===imgs&&lensFrames.n===n)return lensFrames.list;const list=[];for(let i=0;i<n;i++){const c=canvasFor();galleryScene(c.getContext('2d'),600,750,i);list.push(c)}if(imgs.length||demoReady(n))lensFrames={key:imgs,n,list};return list}
function lensRidge(){if(ridgePattern&&ridgePattern.p===lensPitch)return ridgePattern.fill;const c=canvasFor(lensPitch,1),g=c.getContext('2d'),gr=g.createLinearGradient(0,0,lensPitch,0);gr.addColorStop(0,'#000');gr.addColorStop(.35,'#fff');gr.addColorStop(.5,'#fff');gr.addColorStop(1,'#000');g.fillStyle=gr;g.fillRect(0,0,lensPitch,1);ridgePattern={p:lensPitch,fill:ctx.createPattern(c,'repeat')};return ridgePattern.fill}
function drawTilt(t){
 const src=lensSources(),n=src.length,p=lensPitch,k=1;ctx.fillStyle='#0a0a0c';ctx.fillRect(0,0,600,750);
 for(let x=0;x<600;x+=p){
  // The flip sweeps across the card because each lens sees the eye from a slightly different angle.
  const local=Math.max(0,Math.min(n-1,t*(n-1+k)-k/2+(x/600-.5)*k));let a=Math.min(n-1,Math.floor(local)),f=a>=n-1?0:Math.max(0,Math.min(1,(local-a-.5)*3+.5));
  const wb=Math.round(p*smoothStep(f)),wa=p-wb,end=Math.min(p,600-x);
  if(wa>0)ctx.drawImage(src[a],x,0,Math.min(wa,end),750,x,0,Math.min(wa,end),750);if(wb>0&&wa<end)ctx.drawImage(src[a+1],x+wa,0,end-wa,750,x+wa,0,end-wa,750);
 }
 ctx.save();ctx.globalCompositeOperation='overlay';ctx.globalAlpha=.42;ctx.fillStyle=lensRidge();ctx.fillRect(0,0,600,750);ctx.restore();
 const sx=600*(1.2-t*1.4),g=ctx.createLinearGradient(sx-170,0,sx+170,120);g.addColorStop(0,'#fff0');g.addColorStop(.5,'#ffffff40');g.addColorStop(1,'#fff0');ctx.fillStyle=g;ctx.fillRect(0,0,600,750);
 canvas.style.transform=routeName==='editor'?`perspective(900px) rotateY(${(t-.5)*18}deg)`:'';
}
function exportLenticular(){
 // 4 x 5 inch print at 600 dpi behind a 60 LPI lens sheet: 10 px per lens, frames reversed under each lens.
 const n=Math.min(4,imgs.length||2),w=2400,h=3000,pitch=10,out=canvasFor(w,h),g=out.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);
 const sources=[...Array(n)].map((_,i)=>imgs.length?imgs[i]:demoGallery[i]);
 for(let x=0;x<w;x++){const im=sources[n-1-Math.floor((x%pitch)/pitch*n)],iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.max(w/iw,h/ih),ox=(w-iw*s)/2,oy=(h-ih*s)/2;g.drawImage(im,(x-ox)/s,-oy/s,1/s,h/s,x,0,1,h)}
 download(out,'PLAYGROUND-lenticular-60lpi.png');toast('打印设为 600 dpi、宽 4 英寸，再贴 60 LPI 光栅片');
}

/* Secret card: fold-in, anamorphic angle and red-filter decoder */
let secretStyle='fold',coverText='不要',lensPoint=null,secretDemo=0,flatCache={};
function foldFlat(guides=false){
 const key=['fold',secretText,coverText,imgs[0]?1:0,demoReady(1),guides].join('|');if(flatCache.fold&&flatCache.fold.key===key)return flatCache.fold.c;
 const c=canvasFor(),g=c.getContext('2d');g.fillStyle='#efebe2';g.fillRect(0,0,600,750);
 const photo=canvasFor(552,456);galleryScene(photo.getContext('2d'),552,456,0);g.drawImage(photo,24,28);
 const chars=[...secretText],m=Math.ceil(chars.length/2),L=chars.slice(0,m).join(''),R=chars.slice(m).join('');
 const size=fitFont(g,[L,R],134,88,cardFont),decoySize=Math.min(size,fitFont(g,[coverText],270,88,cardFont));
 g.fillStyle='#1d1b18';g.textBaseline='alphabetic';g.font='bold '+size+'px '+cardFont;g.textAlign='right';g.fillText(L,148,630);g.textAlign='left';g.fillText(R,452,630);
 g.font='bold '+decoySize+'px '+cardFont;g.textAlign='center';g.fillText(coverText,300,630);
 g.font='14px sans-serif';g.fillStyle='#8a8478';g.fillText('把 A 和 B 对齐折起来',300,705);
 if(guides){g.setLineDash([7,7]);g.strokeStyle='#8a8478';g.lineWidth=1.5;[150,300,450].forEach(x=>{g.beginPath();g.moveTo(x,0);g.lineTo(x,750);g.stroke()});g.setLineDash([]);g.font='bold 22px sans-serif';g.fillStyle='#c0392b';g.textAlign='left';g.fillText('A',8,742);g.fillText('B',456,742);g.font='12px sans-serif';g.fillStyle='#8a8478';g.textAlign='center';g.fillText('谷折',150,742);g.fillText('山折',300,742);g.fillText('谷折',450,742)}
 g.textAlign='left';flatCache.fold={key,c};return c;
}
function drawFoldCard(p){
 const flat=foldFlat(),th=smoothStep(p)*Math.PI/2,cw=150*Math.cos(th),total=300+2*cw,x0=(600-total)/2,lift=Math.sin(th)*18;
 ctx.fillStyle='#16161a';ctx.fillRect(0,0,600,750);
 const panel=(sx,dx,dw,shade,dy=0)=>{if(dw<.5)return;ctx.drawImage(flat,sx,0,150,750,dx,dy,dw,750-dy*2);if(shade){ctx.fillStyle=shade;ctx.fillRect(dx,dy,dw,750-dy*2)}};
 panel(0,x0,150,null);panel(150,x0+150,cw,`rgba(0,0,0,${.5*Math.sin(th)})`,lift);panel(300,x0+150+cw,cw,`rgba(255,255,255,${.12*Math.sin(th)})`,lift);panel(450,x0+150+2*cw,150,null);
 if(p>.02){ctx.strokeStyle=`rgba(0,0,0,${.35*Math.sin(th)})`;ctx.lineWidth=2;[x0+150,x0+150+2*cw].forEach(x=>{ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,750);ctx.stroke()})}
}
const ANA={D:900,th:80*Math.PI/180};
function anamorphicFlat(){
 const key=secretText;if(flatCache.angle&&flatCache.angle.key===key)return flatCache.angle.c;
 const tc=canvasFor(600,150),tg=tc.getContext('2d'),size=fitFont(tg,[secretText],560,130,cardFont);tg.font='bold '+size+'px '+cardFont;tg.fillStyle='#f3efe6';tg.textAlign='center';tg.textBaseline='middle';tg.fillText(secretText,300,80);
 const c=canvasFor(),g=c.getContext('2d');g.fillStyle='#121316';g.fillRect(0,0,600,750);g.strokeStyle='#ffffff10';for(let y=10;y<750;y+=24){g.beginPath();g.moveTo(0,y);g.lineTo(600,y);g.stroke()}
 // Each row is pre-stretched so that, seen from the bottom edge at 80°, the text projects back to its normal shape.
 const {D,th}=ANA,s=Math.sin(th),co=Math.cos(th),H=750,sTop=D/(D+H*s),hTot=H*co*sTop;
 for(let r=0;r<H;r++){const sc=D/(D+r*s),v=Math.min(149,r*co*sc/hTot*150),w=600*sTop/sc;g.drawImage(tc,0,149-v,600,1,(600-w)/2,H-1-r,w,1.4)}
 flatCache.angle={key,c};return c;
}
function drawAnamorphic(p){
 const flat=anamorphicFlat();ctx.fillStyle='#050506';ctx.fillRect(0,0,600,750);if(p<.005){ctx.drawImage(flat,0,0);return}
 const {D}=ANA,th=smoothStep(p)*ANA.th,s=Math.sin(th),co=Math.cos(th),H=750,tmp=canvasFor(),tg=tmp.getContext('2d'),hp=H*co*D/(D+H*s),zoom=1+smoothStep(p)*.75;
 for(let r=0;r<H;r+=2){const sc=D/(D+r*s),y=H-r*co*sc,sc2=D/(D+(r+2)*s),y2=H-(r+2)*co*sc2;tg.drawImage(flat,0,H-r-2,600,2,(600-600*sc)/2,y2,600*sc,Math.max(1,y-y2+.6))}
 ctx.save();ctx.translate(300,375);ctx.scale(zoom,zoom);ctx.translate(-300,-(H-hp/2));ctx.drawImage(tmp,0,0);ctx.restore();
}
function redFlat(){
 const key=secretText;if(flatCache.red&&flatCache.red.key===key)return flatCache.red;
 const c=canvasFor(),g=c.getContext('2d');let seed=17;const rand=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
 const scribble=(colors,count,minW,maxW)=>{for(let i=0;i<count;i++){g.strokeStyle=colors[Math.floor(rand()*colors.length)];g.lineWidth=minW+rand()*(maxW-minW);g.lineCap='round';const x=rand()*640-20,y=rand()*790-20,a=rand()*Math.PI*2,l=14+rand()*46;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+1)*l*.6,y+Math.sin(a+1)*l*.6,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}};
 g.fillStyle='#f6efe8';g.fillRect(0,0,600,750);
 // Decoys keep a high red channel, so they vanish under a red film; the message keeps a low one.
 scribble(['#c9b6f2','#d8c4ff','#e2b9ea','#cfe8f2','#c6e2ee','#d2ecf4'],700,3,8);
 const tc=canvasFor(),tg=tc.getContext('2d'),size=fitFont(tg,[secretText],420,120,cardFont);tg.font='bold '+size+'px '+cardFont;tg.textAlign='center';tg.textBaseline='middle';tg.fillStyle='#78b2c4';tg.fillText(secretText,300,375);
 tg.globalCompositeOperation='destination-in';const dots=canvasFor(),dg=dots.getContext('2d');dg.fillStyle='#000';for(let i=0;i<12000;i++){dg.beginPath();dg.arc(rand()*600,rand()*750,1.5+rand()*3,0,7);dg.fill()}tg.drawImage(dots,0,0);g.drawImage(tc,0,0);
 scribble(['#ff3b30','#ff6b5e','#ff8a7a','#ff4f7b','#ff9f6b','#f05a5a','#ffb0a8','#ff7fa8'],2600,1.5,5);
 const f=canvasFor(),fg=f.getContext('2d'),data=g.getImageData(0,0,600,750),d=data.data;for(let i=0;i<d.length;i+=4){const v=Math.max(0,Math.min(255,(d[i]-128)*3.2));d[i]=v;d[i+1]=v*.1;d[i+2]=v*.12}fg.putImageData(data,0,0);
 flatCache.red={key,c,f};return flatCache.red;
}
function drawRed(p){
 const {c,f}=redFlat(),pt=lensPoint||{x:90+420*p,y:375+Math.sin(p*Math.PI*2)*150},r=150;ctx.drawImage(c,0,0);
 ctx.save();ctx.beginPath();ctx.arc(pt.x,pt.y,r,0,7);ctx.clip();ctx.drawImage(f,0,0);const gl=ctx.createRadialGradient(pt.x-40,pt.y-50,10,pt.x,pt.y,r);gl.addColorStop(0,'#ffffff30');gl.addColorStop(1,'#ffffff00');ctx.fillStyle=gl;ctx.fillRect(pt.x-r,pt.y-r,r*2,r*2);ctx.restore();
 ctx.lineWidth=12;ctx.strokeStyle='#2a0d0d';ctx.beginPath();ctx.arc(pt.x,pt.y,r+6,0,7);ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#ffffff55';ctx.beginPath();ctx.arc(pt.x,pt.y,r,0,7);ctx.stroke();
}
function drawSecret(){if(secretStyle==='fold')drawFoldCard(secretPos);else if(secretStyle==='angle')drawAnamorphic(secretPos);else drawRed(secretPos)}
function secretHint(){hint.textContent=secretStyle==='fold'?'左右拖动折起卡片':secretStyle==='angle'?'左右拖动，模拟把手机放平斜看':'拖动红色解码镜'}
function playSecretDemo(){cancelAnimationFrame(secretDemo);lensPoint=null;const start=performance.now();const step=now=>{if(mode!==6)return;const t=Math.min(1,(now-start)/3200);secretPos=Math.min(1,Math.sin(t*Math.PI)*1.5);drawSecret();if(t<1)secretDemo=requestAnimationFrame(step)};secretDemo=requestAnimationFrame(step)}
function saveSecretPrint(){const c=secretStyle==='fold'?foldFlat(true):secretStyle==='angle'?anamorphicFlat():redFlat().c;download(c,'PLAYGROUND-secret-'+secretStyle+'.png');toast(secretStyle==='fold'?'打印后按虚线折叠':secretStyle==='angle'?'打印后平放，从底边斜着看':'打印后用红色玻璃纸解码')}

/* Liquid photo: persistent smear field plus a rippling height field */
const LQ={cols:50,rows:63,cell:12};
let liquidSource=null,liquidRunning=false,liquidStrength=22,liquidRecover=3,lq=null;
function prepareLiquid(){const s=canvasFor();scene(s.getContext('2d'),600,750,0);liquidSource=s;const n=LQ.cols*LQ.rows;lq={dx:new Float32Array(n),dy:new Float32Array(n),h0:new Float32Array(n),h1:new Float32Array(n),tx:new Float32Array(n),ty:new Float32Array(n)}}
function liquidDrop(x,y,amount){const cx=Math.round(x/LQ.cell),cy=Math.round(y/LQ.cell);for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++){const gx=cx+i,gy=cy+j;if(gx<1||gy<1||gx>=LQ.cols-1||gy>=LQ.rows-1)continue;const w=Math.max(0,1-(i*i+j*j)/6);lq.h1[gy*LQ.cols+gx]+=amount*w}}
function liquidTouch(x,y,dx=0,dy=0){
 if(!lq)prepareLiquid();const R=78,speed=Math.hypot(dx,dy),c0=Math.max(0,Math.floor((x-R)/LQ.cell)),c1=Math.min(LQ.cols-1,Math.ceil((x+R)/LQ.cell)),r0=Math.max(0,Math.floor((y-R)/LQ.cell)),r1=Math.min(LQ.rows-1,Math.ceil((y+R)/LQ.cell));
 // Faster drags push the glass further; the field relaxes back slowly afterwards.
 for(let gy=r0;gy<=r1;gy++)for(let gx=c0;gx<=c1;gx++){const d2=((gx*LQ.cell-x)**2+(gy*LQ.cell-y)**2)/(R*R);if(d2>=1)continue;const w=(1-d2)**2,k=gy*LQ.cols+gx;lq.dx[k]=Math.max(-90,Math.min(90,lq.dx[k]+dx*w*.85));lq.dy[k]=Math.max(-90,Math.min(90,lq.dy[k]+dy*w*.85))}
 if(speed>1)liquidDrop(x,y,Math.min(40,speed*.9)*liquidStrength/22);
}
function liquidRipple(x,y){if(!lq)prepareLiquid();liquidDrop(x,y,-120*liquidStrength/22)}
function stepLiquid(){
 const {cols,rows}=LQ,{dx,dy,h0,h1,tx,ty}=lq,keep=1-.0025*liquidRecover;let energy=0;
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const k=y*cols+x;h0[k]=((h1[k-1]+h1[k+1]+h1[k-cols]+h1[k+cols])/2-h0[k])*.975;tx[k]=(dx[k]*.8+(dx[k-1]+dx[k+1]+dx[k-cols]+dx[k+cols])*.05)*keep;ty[k]=(dy[k]*.8+(dy[k-1]+dy[k+1]+dy[k-cols]+dy[k+cols])*.05)*keep;energy=Math.max(energy,Math.abs(h0[k]),Math.abs(tx[k]),Math.abs(ty[k]))}
 dx.set(tx);dy.set(ty);lq.h0=h1;lq.h1=h0;return energy;
}
function drawLiquid(){
 if(!lq||!liquidSource)prepareLiquid();const {cols,rows,cell}=LQ,{dx,dy,h1}=lq,K=liquidStrength*.05,t=6,ox=new Float32Array(cols*rows),oy=new Float32Array(cols*rows),lit=new Float32Array(cols*rows);ctx.drawImage(liquidSource,0,0);
 for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){const k=y*cols+x,gx=h1[k+1]-h1[k-1],gy=h1[k+cols]-h1[k-cols];ox[k]=dx[k]+gx*K;oy[k]=dy[k]+gy*K;lit[k]=-(gx+gy)*.006}
 // Tiles are half a field cell; bilinear offsets keep neighbouring tiles from tearing apart.
 const at=(a,fx,fy)=>{const x=Math.min(cols-2,Math.floor(fx)),y=Math.min(rows-2,Math.floor(fy)),u=fx-x,v=fy-y,k=y*cols+x;return a[k]*(1-u)*(1-v)+a[k+1]*u*(1-v)+a[k+cols]*(1-u)*v+a[k+cols+1]*u*v};
 for(let py=0;py<750;py+=t)for(let px=0;px<600;px+=t){const fx=(px+t/2)/cell,fy=(py+t/2)/cell,mx=at(ox,fx,fy),my=at(oy,fx,fy);if(Math.abs(mx)+Math.abs(my)<.4)continue;
  ctx.drawImage(liquidSource,Math.max(0,Math.min(600-t,px-mx)),Math.max(0,Math.min(750-t,py-my)),t,t,px,py,t+.5,t+.5);
  const light=at(lit,fx,fy);if(Math.abs(light)>.02){ctx.fillStyle=light>0?`rgba(255,255,255,${Math.min(.35,light)})`:`rgba(0,0,0,${Math.min(.3,-light)})`;ctx.fillRect(px,py,t+.5,t+.5)}}
}
function animateLiquid(){if(mode!==4){liquidRunning=false;return}const energy=stepLiquid();drawLiquid();if(energy>.15)raf=requestAnimationFrame(animateLiquid);else{liquidRunning=false;prepareLiquid();drawLiquid()}}
function wakeLiquid(){if(!liquidRunning){liquidRunning=true;raf=requestAnimationFrame(animateLiquid)}}

/* Infinite photo: continuous push through nested, slowly turning frames */
const ZR=.38,ZROT=.16;let zoomVel=0,zoomHold=0,zoomRunning=false,zoomAuto=false;
function infiniteLayers(){
 const n=imgs.length||demoGallery.length;if(layerCache&&layerCache.key===imgs&&layerCache.n===n)return layerCache.list;
 const list=[];for(let i=0;i<n;i++){const c=canvasFor(),g=c.getContext('2d'),inner=canvasFor(556,706);g.fillStyle='#f4f2ec';g.fillRect(0,0,600,750);galleryScene(inner.getContext('2d'),556,706,i);g.drawImage(inner,22,22);list.push(c)}
 if(imgs.length||demoReady())layerCache={key:imgs,n,list};return list;
}
function drawInfinite(){
 ctx.fillStyle='#050505';ctx.fillRect(0,0,600,750);const L=infiniteLayers(),n=L.length,z=zoomDepth,j0=Math.floor(z);
 for(let j=j0-1;j<j0+9;j++){const s=Math.pow(ZR,j-z);if(s*600<3)break;ctx.save();ctx.translate(300,375);ctx.rotate((j-z)*ZROT);ctx.scale(s,s);if(j>j0-1){ctx.shadowColor='#000a';ctx.shadowBlur=28}ctx.drawImage(L[((j%n)+n)%n],-300,-375);ctx.restore()}
 const v=ctx.createRadialGradient(300,375,120,300,375,480);v.addColorStop(0,'#0000');v.addColorStop(1,'#0007');ctx.fillStyle=v;ctx.fillRect(0,0,600,750);
 if(mode===9&&routeName==='editor')hint.textContent='第 '+(Math.floor(z)+1)+' 层 · 按住推进，下拉后退';
}
function animateInfinite(){if(mode!==9){zoomRunning=false;return}const target=zoomAuto?.02:zoomHold*.028;if(zoomHold||zoomAuto)zoomVel+=(target-zoomVel)*.08;else zoomVel*=.94;zoomDepth+=zoomVel;drawInfinite();if(zoomHold||zoomAuto||Math.abs(zoomVel)>.0005)raf=requestAnimationFrame(animateInfinite);else zoomRunning=false}
function wakeInfinite(){if(!zoomRunning){zoomRunning=true;raf=requestAnimationFrame(animateInfinite)}}

/* Scratch card with a custom cover and hidden message */
let scratchCover='silver',scratchCoverText='刮开有惊喜',scratchHiddenText='',scratchCoverPhoto=null;
const coverStyles={silver:['#d9d9dc','#9fa0a6','#f6f6f8','#3b3b40'],gold:['#f0cf7f','#b07f2a','#fff1c4','#4a3410'],pink:['#f6c1d1','#cc6f8b','#ffe6ee','#5a1f31']};
function scratchCoverCanvas(){
 const c=canvasFor(),g=c.getContext('2d'),photo=scratchCover==='photo'&&scratchCoverPhoto;
 if(photo){drawPhoto(g,scratchCoverPhoto,600,750);g.fillStyle='#0000004d';g.fillRect(0,0,600,750)}
 else{const [a,b,hl]=coverStyles[scratchCover]||coverStyles.silver,gr=g.createLinearGradient(0,0,600,750);gr.addColorStop(0,a);gr.addColorStop(.45,hl);gr.addColorStop(.55,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(0,0,600,750);let seed=3;for(let i=0;i<2600;i++){seed=(seed*1664525+1013904223)>>>0;g.fillStyle=seed%2?'#ffffff50':'#0000001a';g.fillRect(seed%600,(seed>>>10)%750,2,2)}}
 const ink=photo?'#fff':(coverStyles[scratchCover]||coverStyles.silver)[3];g.fillStyle=ink;g.textAlign='center';g.font='bold '+fitFont(g,[scratchCoverText],520,58,cardFont)+'px '+cardFont;g.fillText(scratchCoverText,300,375);g.font='20px sans-serif';g.globalAlpha=.7;g.fillText('用手指刮开 ↗',300,425);g.globalAlpha=1;g.textAlign='left';return c;
}
function scratchHidden(c){scene(c,600,750,imgs.length?0:1);if(!scratchHiddenText)return;const gr=c.createLinearGradient(0,470,0,750);gr.addColorStop(0,'#0000');gr.addColorStop(1,'#000c');c.fillStyle=gr;c.fillRect(0,470,600,280);c.fillStyle='#fff';c.textAlign='center';c.font='bold '+fitFont(c,[scratchHiddenText],540,60,cardFont)+'px '+cardFont;c.fillText(scratchHiddenText,300,660);c.textAlign='left'}
function resetScratch(){
 const o=canvasFor();scratchHidden(o.getContext('2d'));ctx.drawImage(o,0,0);
 const mask=document.createElement('canvas');mask.width=600;mask.height=750;mask.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none;transition:opacity .7s';overlay.replaceChildren(mask);
 const mc=mask.getContext('2d');mc.drawImage(scratchCoverCanvas(),0,0);mc.globalCompositeOperation='destination-out';mc.lineCap=mc.lineJoin='round';mc.lineWidth=86;
 let last=null,strokes=0,done=false;const probe=canvasFor(60,75),pg=probe.getContext('2d',{willReadFrequently:true});
 const point=e=>{const r=mask.getBoundingClientRect();return{x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*750/r.height}};
 const erase=e=>{const p=point(e);mc.beginPath();mc.moveTo(last?last.x:p.x,last?last.y:p.y);mc.lineTo(p.x+.01,p.y);mc.stroke();last=p;if(++strokes%10===0&&!done){pg.clearRect(0,0,60,75);pg.drawImage(mask,0,0,60,75);const d=pg.getImageData(0,0,60,75).data;let left=0;for(let i=3;i<d.length;i+=4)left+=d[i]>40;if(left/(60*75)<.5){done=true;mask.style.opacity='0';mask.style.pointerEvents='none';toast('揭晓！')}}};
 mask.onpointerdown=e=>{last=null;mask.setPointerCapture(e.pointerId);erase(e)};mask.onpointermove=e=>{if(last)erase(e)};mask.onpointerup=mask.onpointercancel=()=>last=null;hint.textContent='刮开';
}

/* Local animated exports */
let exportBusy=false;
function setExportBusy(value){document.querySelectorAll('#exportDialog .export-options button, #animatedExports button').forEach(b=>b.disabled=value)}
function exportStatus(s){let e=document.getElementById('exportStatus');if(e)e.textContent=s}
function exportFrames(count=24){const snapshot={secretPos,filterMode,zoomDepth,story,lensPoint};lensPoint=null;cancelAnimationFrame(raf);liquidRunning=false;zoomRunning=false;let frames=[],w=360,hh=450,c=document.createElement('canvas');c.width=w;c.height=hh;let g=c.getContext('2d',{willReadFrequently:true});for(let i=0;i<count;i++){let t=(settings.motion<0?(count-i)%count:i)/count;let source=canvasFor();let sc=source.getContext('2d');if(mode===0){let b=composite();sc.drawImage(b,0,0);let n=frameTotal(),p=settings.stripe*n;sc.fillStyle='#050506';const vertical=settings.direction==='vertical';for(let x=-p;x<(vertical?600:750)+p;x+=p){const a=x+settings.stripe+t*p;if(vertical)sc.fillRect(a,0,p-settings.stripe,750);else sc.fillRect(0,a,600,p-settings.stripe)}}else if(mode===3){drawType(t*Math.PI*2);sc.drawImage(canvas,0,0)}else if(mode===4){if(i===0)prepareLiquid();const a=t*Math.PI*2,b=a-Math.PI*2/count,x=300+150*Math.cos(a),y=375+150*Math.sin(a);liquidTouch(x,y,x-(300+150*Math.cos(b)),y-(375+150*Math.sin(b)));if(i%6===0)liquidRipple(300,375);stepLiquid();stepLiquid();drawLiquid();sc.drawImage(canvas,0,0)}else if(mode===2){drawTilt((1-Math.cos(t*Math.PI*2))/2);sc.drawImage(canvas,0,0)}else if(mode===5){scene(sc,600,750,Math.floor(t*frameTotal()))}else if(mode===6){secretPos=(1-Math.cos(t*Math.PI*2))/2;drawSecret();sc.drawImage(canvas,0,0)}else if(mode===8){secretPos=(1-Math.cos(t*Math.PI*2))/2;drawFold();sc.drawImage(canvas,0,0)}else if(mode===9){let prev=zoomDepth;zoomDepth=prev+t*infiniteLayers().length;drawInfinite();sc.drawImage(canvas,0,0);zoomDepth=prev}else if(mode===10){filterMode=Math.floor(t*3);drawColors();sc.drawImage(canvas,0,0)}else if(mode===1){scratchHidden(sc);const cover=scratchCoverCanvas(),cg=cover.getContext('2d');cg.globalCompositeOperation='destination-out';cg.lineWidth=110;cg.lineCap=cg.lineJoin='round';cg.beginPath();cg.moveTo(40,60);const steps=Math.floor(t*1.25*40);for(let s=1;s<=steps;s++){const row=Math.floor(s/5),x=row%2?560-(s%5)*130:40+(s%5)*130;cg.lineTo(x,60+row*90)}cg.stroke();sc.drawImage(cover,0,0)}else{sc.drawImage(canvas,0,0)}g.drawImage(source,0,0,w,hh);frames.push(g.getImageData(0,0,w,hh).data.slice())}secretPos=snapshot.secretPos;lensPoint=snapshot.lensPoint;filterMode=snapshot.filterMode;zoomDepth=snapshot.zoomDepth;story=snapshot.story;render();return{frames,w,h:hh}}
function gifPalette(){let a=[];for(let i=0;i<256;i++)a.push(((i>>5)&7)*255/7|0,((i>>2)&7)*255/7|0,(i&3)*85);return a}
function gifIndex(rgba){let a=new Uint8Array(rgba.length/4);for(let i=0,j=0;i<rgba.length;i+=4,j++)a[j]=(rgba[i]&224)|((rgba[i+1]&224)>>3)|(rgba[i+2]>>6);return a}
function gifLZW(pixels){const clear=256,end=257;let dict=new Map(),next=258,bits=9,bitBuf=0,bitCount=0,out=[];const emit=v=>{bitBuf|=v<<bitCount;bitCount+=bits;while(bitCount>=8){out.push(bitBuf&255);bitBuf>>=8;bitCount-=8}};emit(clear);let prev=String(pixels[0]);for(let i=1;i<pixels.length;i++){let k=pixels[i],key=prev+','+k;if(dict.has(key)){prev=key;continue}emit(prev.includes(',')?dict.get(prev):Number(prev));if(next<4096){dict.set(key,next++);if(next>(1<<bits)&&bits<12)bits++}else{emit(clear);dict.clear();next=258;bits=9}prev=String(k)}emit(prev.includes(',')?dict.get(prev):Number(prev));emit(end);if(bitCount)out.push(bitBuf&255);return out}
function gifEncode(frames,w,h){let bytes=[],put=(...v)=>bytes.push(...v),word=v=>put(v&255,(v>>8)&255),ascii=s=>{for(let c of s)put(c.charCodeAt(0))};ascii('GIF89a');word(w);word(h);put(0xf7,0,0);put(...gifPalette());put(0x21,0xff,11);ascii('NETSCAPE2.0');put(3,1,0,0,0);for(let f of frames){put(0x21,0xf9,4,0,Math.max(2,Math.round(100/(frames.length*settings.speed))),0,0,0);put(0x2c);word(0);word(0);word(w);word(h);put(0,8);let compressed=gifLZW(gifIndex(f));for(let i=0;i<compressed.length;i+=255){let b=compressed.slice(i,i+255);put(b.length,...b)}put(0)}put(0x3b);return new Blob([new Uint8Array(bytes)],{type:'image/gif'})}
function saveBlob(b,name){let a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)}
async function exportGif(){if(exportBusy)return;exportBusy=true;setExportBusy(true);exportStatus('正在生成 GIF');try{await new Promise(r=>setTimeout(r,30));let f=exportFrames(20);let b=gifEncode(f.frames,f.w,f.h);saveBlob(b,'PLAY-'+modes[mode][0]+'.gif');exportStatus('GIF 已生成')}catch(e){exportStatus('生成失败 请重试');console.error(e)}finally{exportBusy=false;setExportBusy(false)}}
async function exportVideo(){if(exportBusy)return;exportBusy=true;setExportBusy(true);exportStatus('正在生成视频');try{if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('当前浏览器不支持直接录制');let type=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('当前浏览器不支持视频编码');let f=exportFrames(30),c=document.createElement('canvas');c.width=f.w;c.height=f.h;let g=c.getContext('2d'),stream=c.captureStream(30),track=stream.getVideoTracks()[0],chunks=[],rec=new MediaRecorder(stream,{mimeType:type});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};let done=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=reject});rec.start();for(let i=0;i<f.frames.length;i++){g.putImageData(new ImageData(new Uint8ClampedArray(f.frames[i]),f.w,f.h),0,0);if(track.requestFrame)track.requestFrame();await new Promise(r=>setTimeout(r,1000/(f.frames.length*settings.speed)))}rec.stop();await done;stream.getTracks().forEach(t=>t.stop());saveBlob(new Blob(chunks,{type}), 'PLAY-'+modes[mode][0]+(type.includes('mp4')?'.mp4':'.webm'));exportStatus('视频已生成')}catch(e){exportStatus(e.message||'视频导出失败')}finally{exportBusy=false;setExportBusy(false)}}

/* Gallery and studio controller. Shelved renderers stay above but have no entry. */
const englishNames=['Scanimation','Scratch Card','Lenticular Card','Kinetic Typography','Liquid Photo','Photo Story','Secret Card','Stereogram','Folding Code','Infinite Photo','Color Reveal'];
const slugs=['scanimation','scratch','tilt','typography','liquid','story','secret','stereogram','folding','infinite','color'];
// Typography, story and stereogram are shelved; folding, perspective and color now live inside the secret card.
const visibleModes=[0,4,9,1,2,6],TOTAL=visibleModes.length,pad2=n=>String(n).padStart(2,'0'),legacySlugs={perspective:'secret',folding:'secret',color:'secret'};
const exhibitionOrder=visibleModes;
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let activeGallery=0,initializedMode=-1,playing=false,playRaf=0,lastTime=0,toastTimer,routeName='home';
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500)}
function stopPlayback(){document.body.classList.remove('is-scanning');playing=false;cancelAnimationFrame(playRaf);$('playButton').textContent='▷';$('playButton').setAttribute('aria-label','播放动画');$('playButton').setAttribute('aria-pressed','false')}
function animateScan(time){if(!playing||mode!==0||routeName!=='editor'||document.hidden){stopPlayback();return}if(lastTime)settings.phase=(settings.phase+Math.min(.05,(time-lastTime)/1000)*settings.speed*(settings.motion||1)+1)%1;lastTime=time;applyPhase();playRaf=requestAnimationFrame(animateScan)}
$('playButton').onclick=()=>{if(playing){stopPlayback();return}playing=true;document.body.classList.add('is-scanning');lastTime=0;$('playButton').textContent='Ⅱ';$('playButton').setAttribute('aria-label','暂停动画');$('playButton').setAttribute('aria-pressed','true');playRaf=requestAnimationFrame(animateScan)};
$('phase').oninput=e=>{stopPlayback();settings.phase=+e.target.value/1000;applyPhase()};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback()});

function refreshFrames(){
 const list=$('frameList');if(!list)return;list.replaceChildren();
 const count=frameTotal();$('photoCount').textContent=imgs.length?count+' / 8':'示例 · '+count+' 帧';
 for(let index=0;index<count;index++){
  const item=document.createElement('div');item.className='frame-item';const thumb=canvasFor(120,150);scene(thumb.getContext('2d'),120,150,index);
  const picture=document.createElement('img');picture.src=thumb.toDataURL('image/jpeg',.8);picture.alt=(imgs.length?'照片':'示例')+' '+(index+1);picture.tabIndex=0;picture.onclick=()=>selectStudioTab('photos',index===0?$('photoTabOne'):$('photoTabTwo'));picture.onkeydown=e=>{if(e.key==='Enter')picture.click()};
  const image=document.createElement('div');image.className='frame-thumb';image.appendChild(picture);const label=document.createElement('span');label.textContent=String(index+1).padStart(2,'0');image.appendChild(label);item.appendChild(image);
  if(imgs.length){const tools=document.createElement('div');tools.className='frame-tools';[['←','前移',-1],['×','删除',0],['→','后移',1]].forEach(([text,title,delta])=>{const b=document.createElement('button');b.textContent=text;b.setAttribute('aria-label',title+'照片 '+(index+1));b.disabled=delta===-1?index===0:delta===1?index===count-1:count<=2;b.onclick=()=>{stopPlayback();const copy=[...imgs];if(delta)[copy[index],copy[index+delta]]=[copy[index+delta],copy[index]];else copy.splice(index,1);imgs=copy;compositeCache=null;render();refreshFrames()};tools.appendChild(b)});item.appendChild(tools)}
  list.appendChild(item);
 }
 const file=$('photoFields')?.querySelector('.file');if(file&&file.classList.contains('file'))file.hidden=imgs.length>=8;
}
function appendAdvanced(title,id){const d=document.createElement('details');d.className='advanced';const summary=document.createElement('summary');summary.innerHTML=title+'<span>＋</span>';const body=document.createElement('div');body.id=id;d.append(summary,body);$('controls').appendChild(d);return body}
function selectStudioTab(tab,button){
 if(!$('photoFields'))return;
 $('photoFields').hidden=tab!=='photos';$('parameterFields').hidden=tab!=='parameters';
 $('studioTabs').querySelectorAll('[role=tab]').forEach(b=>{const selected=b===button||(tab==='parameters'&&b.id==='parameterTab');b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1});
}
function scanControls(){
 const photos=document.createElement('div');photos.id='photoFields';photos.innerHTML='<div class="control-heading"><span>照片序列</span><small id="photoCount">示例 · 6 帧</small></div>';$('controls').appendChild(photos);
 const list=document.createElement('div');list.id='frameList';list.className='frame-list';$('sequenceStrip').replaceChildren(list);
 fileInput(true);photos.appendChild($('controls').lastElementChild);
 const parameters=document.createElement('div');parameters.id='parameterFields';$('controls').appendChild(parameters);
 field('条纹宽度',4,2,12,value=>{stopPlayback();settings.stripe=value;compositeCache=null;render()});parameters.appendChild($('controls').lastElementChild);
 field('对比度',70,35,105,value=>{settings.contrast=value;compositeCache=null;render()});parameters.appendChild($('controls').lastElementChild);
 const movement=document.createElement('div');movement.className='movement-field';movement.innerHTML='<span>动画方向</span><div class="movement-buttons" role="group" aria-label="动画方向"><button data-axis="vertical" data-sign="-1" aria-label="向左" aria-pressed="false">←</button><button data-axis="vertical" data-sign="1" aria-label="向右" aria-pressed="true">→</button><button data-axis="horizontal" data-sign="1" aria-label="向下" aria-pressed="false">↓</button><button data-axis="horizontal" data-sign="-1" aria-label="向上" aria-pressed="false">↑</button></div>';parameters.appendChild(movement);
 movement.querySelectorAll('button').forEach(b=>b.onclick=()=>{stopPlayback();settings.direction=b.dataset.axis;settings.motion=+b.dataset.sign;movement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));document.querySelectorAll('[data-direction]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.direction===settings.direction)));compositeCache=null;render()});
 const mini=document.createElement('div');mini.className='mini-preview';mini.innerHTML='<span>预览效果</span><div class="mini-plates"><canvas id="miniArtwork" width="300" height="310" aria-label="光栅卡预览"></canvas><i></i></div>';parameters.appendChild(mini);paintArtwork(0,$('miniArtwork'));
 const advanced=appendAdvanced('高级参数','advancedFields');parameters.appendChild(advanced.parentElement);
 const direction=document.createElement('div');direction.className='direction-control';direction.innerHTML='<span>条纹方向</span><div class="segmented" role="group" aria-label="条纹方向"><button data-direction="vertical" aria-pressed="true">竖向条纹</button><button data-direction="horizontal" aria-pressed="false">横向条纹</button></div>';advanced.appendChild(direction);
 direction.querySelectorAll('button').forEach(b=>b.onclick=()=>{stopPlayback();settings.direction=b.dataset.direction;direction.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));movement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.axis===settings.direction&&+x.dataset.sign===settings.motion)));compositeCache=null;render()});
 field('动画速度',.5,.25,2,value=>{settings.speed=value;speedValue.textContent=value.toFixed(2).replace(/0$/,'')+'×'});const speedField=$('controls').lastElementChild,speedInput=speedField.querySelector('input'),speedValue=speedField.querySelector('span');speedInput.step='.05';speedInput.value='.5';speedValue.textContent='0.5×';advanced.appendChild(speedField);
 const timeline=document.createElement('div');timeline.className='advanced-transport';timeline.appendChild($('previewTransport'));advanced.appendChild(timeline);
 const calibration=appendAdvanced('iPhone 相册适配','iosCalibration');parameters.appendChild(calibration.parentElement);calibration.className='calibration-body';calibration.innerHTML='<label class="calibration-label" for="iosScale">光栅卡缩放 <span id="iosScaleLabel">100%</span></label><input id="iosScale" aria-label="光栅卡缩放" type="range" min="50" max="250" step="5" value="100"><div class="ios-presets"><button data-scale="75">75%</button><button data-scale="100" aria-pressed="true">100%</button><button data-scale="125">125%</button><button data-scale="150">150%</button></div><p>相册悬浮卡的条纹偏密时调低比例，偏疏时调高，再导出光栅卡。跨 App 拖动效果需在 iPhone 上校准。</p>';
 function updateScale(value){iosCardScale=value;$('iosScaleLabel').textContent=value+'%';$('iosScale').value=value;calibration.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.scale===value)))}
 $('iosScale').oninput=e=>updateScale(+e.target.value);calibration.querySelectorAll('button').forEach(b=>b.onclick=()=>updateScale(+b.dataset.scale));
 const more=document.createElement('div');more.className='advanced-settings';parameters.appendChild(more);more.append(advanced.parentElement,calibration.parentElement);
 button('↓  导出作品',()=>{stopPlayback();$('exportStatus').textContent='';$('exportDialog').showModal()});
 $('modeNote').textContent='上传 2–8 张同构图照片，拖动遮罩查看逐帧变化。底图与光栅卡需保持相同显示尺寸。';
 $('studioTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>selectStudioTab(b.dataset.tab,b));
 $('studioTabs').onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const tabs=[...$('studioTabs').querySelectorAll('button')],current=tabs.indexOf(document.activeElement),next=tabs[(current+(e.key==='ArrowRight'?1:2))%3];next.focus();next.click()};
 selectStudioTab('parameters',$('parameterTab'));refreshFrames();
}
function addExports(){const d=appendAdvanced('导出动态作品','animatedExports');d.innerHTML='<div class="export-grid"><button type="button">GIF</button><button type="button">视频</button></div><p class="mode-status" role="status" id="legacyExportStatus"></p>';const buttons=d.querySelectorAll('button');buttons[0].onclick=exportGif;buttons[1].onclick=exportVideo}
function initializeEditor(i){
 if($('controls').contains($('previewTransport')))$('previewSize').parentElement.parentElement.appendChild($('previewTransport'));
 clear();stopPlayback();mode=i;imgs=[];settings={stripe:4,phase:0,direction:'vertical',speed:.5,contrast:70,motion:1};iosCardScale=100;tiltValue=0;story=0;compositeCache=null;secretPos=0;lensPoint=null;zoomDepth=0;zoomAuto=false;layerCache=null;lensFrames=null;
 $('controls').replaceChildren();$('actions').replaceChildren();$('modeNote').textContent='';
 if(i===0)scanControls();
 else if(i===1){segmented('封面样式',[['silver','银色'],['gold','金色'],['pink','粉色'],['photo','照片']],scratchCover,v=>{scratchCover=v;if(v==='photo'&&!scratchCoverPhoto)toast('再上传一张封面照片');resetScratch()});textField('封面文字',scratchCoverText,14,v=>{scratchCoverText=v||'刮开有惊喜';resetScratch()});photoInput('＋ 封面照片',c=>{scratchCoverPhoto=c;scratchCover='photo';document.querySelectorAll('[aria-label=封面样式] button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value==='photo')));resetScratch()});textField('隐藏的话',scratchHiddenText,16,v=>{scratchHiddenText=v;resetScratch()});fileInput();$('controls').lastElementChild.firstChild.textContent='＋ 隐藏照片';button('重新覆盖',resetScratch,'alt');button('保存隐藏画面',()=>{const c=canvasFor();scratchHidden(c.getContext('2d'));download(c,'PLAY-刮刮乐.png')})}
 else if(i===2){fileInput(true,4);field('镜片密度',6,3,12,v=>{lensPitch=v;drawTilt(tiltValue)});button('启用手机倾斜',sensorEnable);button('打印交错图',exportLenticular,'alt');button('保存当前画面',saveCurrent,'alt')}
 else if(i===3){const d=document.createElement('div');d.className='field';d.innerHTML='<label for="typeInput">你的文字</label><input id="typeInput" type="text" maxlength="16" placeholder="输入一句话">';$('controls').appendChild(d);$('typeInput').value=textValue;$('typeInput').oninput=e=>{textValue=e.target.value||'PLAY';drawType()};button('保存文字海报',saveCurrent)}
 else if(i===4){fileInput();field('涟漪强度',22,8,48,v=>{liquidStrength=v});field('复原速度',3,1,10,v=>{liquidRecover=v});button('抚平',()=>{prepareLiquid();drawLiquid()},'alt');button('保存当前画面',saveCurrent)}
 else if(i===5){fileInput(true);button('上一张',()=>{story=(story-1+frameTotal())%frameTotal();drawStory()},'alt');button('下一张',()=>{story=(story+1)%frameTotal();drawStory()},'alt');button('保存故事卡',saveCurrent)}
 else if(i===6){segmented('藏法',[['fold','折页'],['angle','斜视'],['red','红膜']],secretStyle,v=>{secretStyle=v;secretPos=0;lensPoint=null;coverField.hidden=photoField.hidden=v!=='fold';render()});secretInput();const coverField=textField('封面上的话',coverText,6,v=>{coverText=v;drawSecret()});const photoField=photoInput('＋ 封面照片',c=>{imgs=[c];flatCache.fold=null;drawSecret()});coverField.hidden=photoField.hidden=secretStyle!=='fold';button('演示揭晓',playSecretDemo,'alt');button('保存打印版',saveSecretPrint)}
 else if(i===8){secretInput();button('保存图片',saveCurrent)}
 else if(i===7)button('保存立体图',saveCurrent);
 else if(i===9){fileInput(true);button('自动推进',e=>{zoomAuto=!zoomAuto;e.target.textContent=zoomAuto?'停止推进':'自动推进';wakeInfinite()},'alt');button('保存图片',saveCurrent)}
 else if(i===10){secretInput();button('切换滤镜',()=>{filterMode=(filterMode+1)%3;drawColors()},'alt');button('保存图片',saveCurrent)}
 if(i!==0){addExports();$('modeNote').textContent=modes[i][4]}
 initializedMode=i;render();
}
function navigate(){
 const hash=(location.hash.includes('figmacapture=')?'home':location.hash.slice(1))||'home',parts=hash.split('/'),i=slugs.indexOf(parts[1]);let page=parts[0];
 if(legacySlugs[parts[1]]){location.replace('#editor/'+legacySlugs[parts[1]]);return}
 if(i>=0&&!visibleModes.includes(i)){location.replace('#home');return}
 if(!['home','experiments','experiment','editor'].includes(page)||(!['home','experiments'].includes(page)&&i<0)){location.replace('#home');return}
 if(page==='experiment'&&i>0){location.replace('#editor/'+slugs[i]);return}
 stopPlayback();clear();routeName=page;document.body.dataset.page=page;document.body.dataset.experiment=i===0?'scanimation':'other';
 $('home').hidden=page!=='home';$('intro').hidden=page!=='experiment';$('work').hidden=page!=='editor';$('experiments').hidden=page!=='experiments';
 $('headerContext').textContent=page==='home'?'创意图像实验室':page==='experiment'?'光学实验 / 01':'PLAYGROUND STUDIO';
 if(page==='experiments'){requestAnimationFrame(drawDirectoryCable)}
 if(page==='editor'){
  $('modeTitle').textContent=modes[i][0];$('modeEnglish').textContent=englishNames[i];$('modeNum').textContent='实验 '+pad2(visibleModes.indexOf(i)+1)+' / '+pad2(TOTAL);$('editorBack').href=i===0?'#experiment/scanimation':'#home';$('previewTransport').hidden=i!==0;$('studioTabs').hidden=i!==0;$('sequenceStrip').hidden=i!==0;$('topExport').hidden=i!==0;
  if(initializedMode!==i)initializeEditor(i);else render();
 }else if(page==='home'){requestAnimationFrame(()=>{drawClothesline();updateGallery()})}
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.scrollTo({top:0,behavior:'instant'});
 document.title='PLAYGROUND — '+(page==='home'?'创意游乐场':page==='experiments'?'全部实验':modes[i][0]);
}
window.addEventListener('hashchange',navigate);
const gallery=$('cards');
function galleryItems(){return [...gallery.querySelectorAll('.gallery-item')]}
function focusGallery(index){activeGallery=Math.max(0,Math.min(TOTAL-1,index));const item=galleryItems()[activeGallery];gallery.scrollTo({left:item.offsetLeft+item.offsetWidth/2-gallery.clientWidth*(innerWidth<=700?.38:.5),behavior:reducedMotion.matches?'instant':'smooth'})}
function drawClothesline(){
 const nodes=galleryItems();if(!nodes.length)return;
 const width=nodes.at(-1).offsetLeft+nodes.at(-1).offsetWidth+gallery.clientWidth/2;const svg=$('clothesline');svg.setAttribute('width',width);svg.setAttribute('height',180);svg.setAttribute('viewBox',`0 0 ${width} 180`);
 const rect=gallery.getBoundingClientRect();const points=nodes.map(node=>{const ring=node.querySelector('.gallery-hanger').getBoundingClientRect();return {x:ring.left+ring.width/2-rect.left+gallery.scrollLeft,y:ring.top+ring.height*.22-rect.top}});
 let d=`M 0 ${points[0].y-50}`;let prev={x:0,y:points[0].y-50};for(const p of points){const distance=p.x-prev.x;d+=` C ${prev.x+distance*.35} ${prev.y+30}, ${p.x-distance*.35} ${p.y+30}, ${p.x} ${p.y}`;prev=p}d+=` Q ${width-50} ${prev.y+40} ${width} ${prev.y-20}`;$('clotheslinePath').setAttribute('d',d);
}
let galleryRaf=0,lastScroll=0,sway=0,swayVelocity=0,springRunning=false;
function updateGallery(){
 const center=gallery.scrollLeft+gallery.clientWidth*(innerWidth<=700?.38:.5);let closest=0,distance=Infinity;
 galleryItems().forEach((node,index)=>{const d=Math.abs(node.offsetLeft+node.offsetWidth/2-center);if(d<distance){distance=d;closest=index}const factor=Math.min(1,d/420);node.style.setProperty('--opacity',1-factor*.55);node.style.scale=String(1-factor*.12);node.style.zIndex=String(30-Math.round(d/100));node.style.filter=d>200?'blur(1px)':'none';node.classList.toggle('active',d<145);node.setAttribute('aria-current',d<145?'true':'false')});
 activeGallery=closest;$('slideCount').innerHTML=pad2(closest+1)+' <i>/ '+pad2(TOTAL)+'</i>';$('galleryProgress').style.width=(closest+1)/TOTAL*100+'%';galleryRaf=0;
}
function swing(){if(reducedMotion.matches||routeName!=='home'){springRunning=false;return}swayVelocity+=-sway*.045;swayVelocity*=.89;sway+=swayVelocity;galleryItems().forEach((node,i)=>{const base=i===0?7:i%2===1?5:-5;node.style.setProperty('--rotation',(base+sway*(i%2===0?1:.7))+'deg')});drawClothesline();if(Math.abs(sway)+Math.abs(swayVelocity)>.02)requestAnimationFrame(swing);else{springRunning=false;$('clothesline').style.transform=''}}
function kick(amount){swayVelocity=Math.max(-2,Math.min(2,swayVelocity+amount));if(!springRunning){springRunning=true;requestAnimationFrame(swing)}}
gallery.addEventListener('scroll',()=>{if(!galleryRaf)galleryRaf=requestAnimationFrame(updateGallery);const delta=gallery.scrollLeft-lastScroll;lastScroll=gallery.scrollLeft;if(!reducedMotion.matches)kick(delta*.003)},{passive:true});
gallery.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();focusGallery(activeGallery+(e.key==='ArrowRight'?1:-1))}});
let galleryDrag=null,suppressClick=false;
gallery.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;galleryDrag={x:e.clientX,scroll:gallery.scrollLeft,id:e.pointerId};suppressClick=false});
gallery.addEventListener('pointermove',e=>{if(!galleryDrag)return;const dx=e.clientX-galleryDrag.x;if(Math.abs(dx)>6){suppressClick=true;gallery.setPointerCapture(e.pointerId);gallery.style.scrollSnapType='none';gallery.scrollLeft=galleryDrag.scroll-dx}});
function endDrag(){if(!galleryDrag)return;galleryDrag=null;gallery.style.scrollSnapType='';if(suppressClick){focusGallery(activeGallery);setTimeout(()=>suppressClick=false,0)}}
gallery.addEventListener('pointerup',endDrag);gallery.addEventListener('pointercancel',endDrag);
gallery.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation()}},true);
function paintArtwork(index,target){
 const g=target.getContext('2d'),w=target.width,h=target.height;g.fillStyle='#101014';g.fillRect(0,0,w,h);
 if(index===0){drawCat(g,w,h,4);g.fillStyle='#060709';for(let x=0;x<w;x+=5)g.fillRect(x,0,2.8,h)}
 else if(index===1){base(g,w,h,1);const cover=canvasFor(w,h),cg=cover.getContext('2d');cg.fillStyle='#aca8b0';cg.fillRect(0,0,w,h);cg.globalCompositeOperation='destination-out';cg.lineWidth=45;cg.lineCap='round';cg.beginPath();cg.moveTo(45,h*.7);cg.bezierCurveTo(w*.8,h*.05,w*.1,h*.8,w*.8,h*.3);cg.stroke();g.drawImage(cover,0,0)}
 else if(index===2){for(let x=0;x<w;x+=8){const c=canvasFor(w,h),cg=c.getContext('2d');if(x/w<.5)base(cg,w,h,0);else{cg.filter='grayscale(1) contrast(1.3)';base(cg,w,h,3)}g.drawImage(c,x,0,4,h,x,0,4,h);cg.filter='none';base(cg,w,h,x/w<.6?3:0);g.drawImage(c,x+4,0,4,h,x+4,0,4,h)}const sheen=g.createLinearGradient(0,0,w,h);sheen.addColorStop(.3,'#fff0');sheen.addColorStop(.5,'#ffffff45');sheen.addColorStop(.7,'#fff0');g.fillStyle=sheen;g.fillRect(0,0,w,h);g.fillStyle='#0000002a';for(let x=0;x<w;x+=8)g.fillRect(x+7,0,1,h)}
 else if(index===3){g.fillStyle='#121116';g.fillRect(0,0,w,h);g.textAlign='center';g.font='italic 66px Georgia';for(let y=-30;y<h+50;y+=48){g.save();g.translate(w/2,y);g.rotate(-.2);g.fillStyle=y===162?'#c9bfd9':'#736a82';g.fillText('play',0,0);g.restore()}g.textAlign='left'}
 else if(index===4){base(g,w,h,0);const source=canvasFor(w,h);source.getContext('2d').drawImage(target,0,0);for(let y=0;y<h;y+=3){const dx=Math.sin(y*.05)*16*Math.sin(y/h*Math.PI);g.drawImage(source,0,y,w,3,dx,y,w,3)}g.strokeStyle='#d9cbea66';for(let i=0;i<3;i++){g.beginPath();g.ellipse(w*.5,h*.5,45+i*15,65+i*18,.4,0,Math.PI*2);g.stroke()}}
 else if(index===5){for(let j=0;j<3;j++){g.save();g.translate(w/2,h/2);g.rotate((j-1)*.16);g.translate(-w/2,-h/2);g.fillStyle='#b6b0bd';g.fillRect(27+j*4,23+j*10,w-54,h-60);const c=canvasFor(w-64,h-90);base(c.getContext('2d'),c.width,c.height,j);g.drawImage(c,32+j*4,28+j*10);g.restore()}}
 else if(index===6){g.fillStyle='#16161a';g.fillRect(0,0,w,h);const pw=w*.2,ph=h*.7,y=h*.15,x0=w*.12;[[0,'#e9e4d8',pw],[1,'#9d978b',pw*.55],[2,'#d4cfc3',pw*.55],[3,'#e9e4d8',pw]].reduce((x,[k,c,ww])=>{g.fillStyle=c;g.fillRect(x,y+(k===1||k===2?8:0),ww,ph-(k===1||k===2?16:0));return x+ww},x0);g.fillStyle='#1d1b18';g.font='bold '+Math.round(w*.08)+'px '+cardFont;g.textAlign='center';g.fillText('周末',x0+pw/2,y+ph*.82);g.fillText('见面',x0+pw*2.1+pw/2,y+ph*.82);g.textAlign='left';g.strokeStyle='#c0392b';g.lineWidth=5;g.beginPath();g.arc(w*.72,h*.32,w*.14,0,7);g.stroke()}
 else if(index===7){let seed=8;g.fillStyle='#b8b0c5';for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){seed=(seed*1664525+1013904223)>>>0;g.fillStyle=seed%3===0?'#b8b0c5':'#282331';g.fillRect(x,y,2,2)}}
 else if(index===8){g.fillStyle='#d4ccd9';g.font='bold 80px Georgia';g.save();g.translate(w*.13,h*.48);g.rotate(-.13);g.fillText('SE',0,0);g.restore();g.save();g.translate(w*.49,h*.65);g.rotate(.13);g.fillStyle='#8d7c9d';g.fillText('CR',0,0);g.restore();g.strokeStyle='#7e7289';g.setLineDash([3,4]);g.beginPath();g.moveTo(w*.5,15);g.lineTo(w*.5,h-15);g.stroke();g.setLineDash([])}
 else if(index===9){for(let j=0;j<7;j++){const ratio=Math.pow(.7,j),ww=w*ratio,hh=h*ratio;const c=canvasFor(ww,hh);base(c.getContext('2d'),ww,hh,j);g.strokeStyle='#a49aad';g.lineWidth=2;g.drawImage(c,(w-ww)/2,(h-hh)/2);g.strokeRect((w-ww)/2,(h-hh)/2,ww,hh)}}
 else if(index===10){g.textAlign='center';g.font='68px Georgia';g.globalCompositeOperation='screen';g.fillStyle='#92576b';g.fillText('SEE',w/2-10,h*.56);g.fillStyle='#477787';g.fillText('SEE',w/2+10,h*.56);g.globalCompositeOperation='source-over';g.fillStyle='#49768b55';g.fillRect(w*.5,0,w*.5,h);g.textAlign='left'}
}
exhibitionOrder.forEach((i,position)=>{const m=modes[i];const link=document.createElement('a');link.href=i===0?'#experiment/scanimation':'#editor/'+slugs[i];link.className='gallery-item';link.dataset.mode=i;link.setAttribute('aria-label',m[0]+'，实验 '+(position+1));link.innerHTML='<span class="gallery-hanger"></span><span class="glass-reflection"></span><span class="gallery-art"><canvas width="300" height="310" aria-hidden="true"></canvas></span><span class="gallery-number">'+String(position+1).padStart(2,'0')+'</span><span class="gallery-card-footer"><span class="gallery-name">'+m[0]+'</span><span class="gallery-enter">↗</span></span><span class="gallery-card-english">'+englishNames[i].toUpperCase()+'</span>';gallery.appendChild(link);const menu=document.createElement('a');menu.href=link.href;menu.innerHTML='<span>'+pad2(position+1)+' / '+englishNames[i]+'</span><strong>'+m[0]+'</strong>';$('experimentMenu').appendChild(menu)});
$('dockPrev').onclick=()=>focusGallery(activeGallery-1);$('dockNext').onclick=()=>focusGallery(activeGallery+1);
$('menuToggle').onclick=()=>{location.hash='experiments'};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}));
$('downloadBase').onclick=()=>{download(composite(),'PLAYGROUND-base.png');exportStatus('底图已生成')};$('downloadMask').onclick=()=>{downloadCard();exportStatus('透明光栅卡已生成')};$('exportGif').onclick=exportGif;$('exportVideo').onclick=exportVideo;
// Status stays in whichever export surface is visible.
exportStatus=s=>{const element=$('legacyExportStatus')&&mode!==0?$('legacyExportStatus'):$('exportStatus');if(element)element.textContent=s};
function repaintDemo(){compositeCache=null;galleryItems().forEach((node,index)=>paintDirectoryArt(+node.dataset.mode,node.querySelector('canvas')));drawDirectoryArt();if(routeName==='editor'&&!imgs.length){render();if(mode===0)refreshFrames()}}
demoPhoto.onload=repaintDemo;portraitPhoto.onload=()=>{drawDirectoryArt();galleryItems().forEach(n=>paintDirectoryArt(+n.dataset.mode,n.querySelector('canvas')))};demoPhoto.onerror=()=>toast('示例图片加载失败，请刷新页面');
window.addEventListener('resize',()=>{if(routeName==='experiments')drawDirectoryCable();if(routeName==='home'){drawClothesline();updateGallery()}else if(routeName==='editor'&&mode===0){stopPlayback();drawScanimation()}});
const directoryOrder=visibleModes;
function paintDirectoryArt(index,target){
 const g=target.getContext('2d'),w=target.width,h=target.height;g.clearRect(0,0,w,h);
 if(index===0){paintArtwork(0,target);return}
 if(index===7){const cx=w/2,cy=h*.53,a=w*.34,b=a*.55;const faces=[[[cx,cy-a],[cx+a,cy-b],[cx,cy],[cx-a,cy-b]],[[cx-a,cy-b],[cx,cy],[cx,cy+a],[cx-a,cy+b]],[[cx,cy],[cx+a,cy-b],[cx+a,cy+b],[cx,cy+a]]];faces.forEach((points,i)=>{const grad=g.createLinearGradient(20,0,w,h);grad.addColorStop(0,['#c2eaffa6','#85b4f563','#aec9ed99'][i]);grad.addColorStop(.55,['#507da569','#203f6b85','#44659680'][i]);grad.addColorStop(1,'#05132340');g.fillStyle=grad;g.strokeStyle='#b5daffad';g.lineWidth=1.5;g.beginPath();points.forEach(([x,y],j)=>j?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.stroke()});g.strokeStyle='#e4f3ff90';g.strokeRect(cx-18,cy-19,36,50);return}
 if(index===8){g.save();g.translate(w*.5,h*.5);g.rotate(-.2);g.fillStyle='#bdaeb7';g.fillRect(-w*.39,-h*.4,w*.78,h*.8);g.strokeStyle='#493c4a';g.lineWidth=1;for(let j=0;j<12;j++){g.save();g.rotate(j*Math.PI/6);g.beginPath();g.ellipse(0,-h*.13,w*.07,h*.16,.3,0,Math.PI*2);g.stroke();g.restore()}g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-20,40,5,h*.34);g.stroke();g.restore();return}
 if(index===10){g.translate(w/2,h/2);const colors=['#b7c4f4','#dcaec9','#dfc8aa','#e6e1da','#8d9aca','#b5b7e0'];for(let j=0;j<6;j++){g.save();g.rotate(j*Math.PI/3);const grad=g.createLinearGradient(0,-h*.38,0,0);grad.addColorStop(0,colors[j]);grad.addColorStop(1,'#353452');g.fillStyle=grad;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-w*.43,-h*.35,0,-h*.42);g.quadraticCurveTo(w*.4,-h*.1,0,0);g.fill();g.restore()}g.resetTransform();return}
 paintArtwork(index,target);
}
function drawDirectoryArt(){document.querySelectorAll('.directory-art canvas').forEach(c=>paintDirectoryArt(+c.dataset.mode,c))}
function drawDirectoryCable(){
 const list=$('directoryList'),svg=$('directoryCable'),nodes=[...list.querySelectorAll('.directory-entry:not([hidden])')];if(!nodes.length){svg.style.height='0px';svg.querySelector('path').setAttribute('d','');return}
 const box=list.getBoundingClientRect();const totalHeight=nodes.at(-1).offsetTop+nodes.at(-1).offsetHeight;svg.setAttribute('viewBox',`0 0 ${list.clientWidth} ${totalHeight}`);svg.style.height=totalHeight+'px';const pts=nodes.map(n=>{const ring=n.querySelector('.directory-ring').getBoundingClientRect();return{x:ring.left+ring.width/2-box.left,y:ring.top+ring.height*.2-box.top}});let d=`M 0 8`;pts.forEach((p,j)=>{if(!j)d+=` Q ${p.x+60} -4 ${p.x} ${p.y}`;else {const prev=pts[j-1],side=j%2?list.clientWidth*.94:-45,dy=p.y-prev.y;d+=` C ${side} ${prev.y+dy*.35},${side} ${p.y-dy*.35},${p.x} ${p.y}`}});d+=` Q ${list.clientWidth} ${pts.at(-1).y+180} 0 ${list.scrollHeight}`;svg.querySelector('path').setAttribute('d',d)
}
directoryOrder.forEach((index,position)=>{const row=document.createElement('a');row.className='directory-entry';row.href=index===0?'#experiment/scanimation':'#editor/'+slugs[index];row.dataset.name=modes[index][0]+' '+englishNames[index];row.innerHTML='<span class="directory-art"><span class="directory-ring"></span><canvas data-mode="'+index+'" width="240" height="300" aria-hidden="true"></canvas></span><span class="directory-info"><span class="directory-number">'+String(position+1).padStart(2,'0')+'</span><strong>'+modes[index][0]+'</strong><small>'+englishNames[index].toUpperCase()+'</small></span><span class="directory-enter">→</span>';$('directoryList').appendChild(row)});
$('directorySearch').onclick=()=>{const panel=document.querySelector('.directory-search');panel.hidden=!panel.hidden;if(!panel.hidden)$('experimentSearch').focus()};$('experimentSearch').oninput=e=>{const term=e.target.value.trim().toLowerCase();document.querySelectorAll('.directory-entry').forEach(n=>n.hidden=!n.dataset.name.toLowerCase().includes(term));document.querySelector('.no-results').hidden=!!document.querySelector('.directory-entry:not([hidden])');requestAnimationFrame(drawDirectoryCable)};
$('topExport').onclick=()=>{stopPlayback();$('exportStatus').textContent='';$('exportDialog').showModal()};
navigate();if(demoPhoto.complete&&demoPhoto.naturalWidth)repaintDemo();requestAnimationFrame(()=>{drawClothesline();updateGallery()});
})();
