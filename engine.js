
(()=>{'use strict';const $=id=>document.getElementById(id),canvas=$('canvas'),ctx=canvas.getContext('2d'),stage=$('stage'),overlay=$('overlay'),hint=$('hint');let mode=0,imgs=[],pos=0,run=false,raf=0,settings={stripe:4,phase:0,direction:'vertical',speed:.5,contrast:70,motion:1},textValue='不止眼前',story=0;const demoPhoto=new Image();demoPhoto.src='assets/cat-source.jpg';const portraitPhoto=new Image();portraitPhoto.src='assets/cat.jpg';const modes=[['光栅动画','把隐藏动画发到朋友圈','SCAN / REVEAL','▥','上传 2–8 张照片，生成光栅底图与透明卡。实体卡可直接扫描，iPhone 跨 App 拖动仍需真机校准。'],['刮刮乐','刮开另一面的惊喜','SCRATCH / DISCOVER','✦','上传照片或使用示例，手指擦掉表面涂层，揭开隐藏的画面。'],['倾斜幻象','手机一倾斜，世界就变了','TILT / SWITCH','◒','倾斜手机或左右拖动，切换两种画面。iPhone 可能需要授权运动传感器。'],['动态文字','让一句话活过来','TYPE / PLAY','Aa','输入文字，拖动手指制造波浪和动态字形。'],['液态照片','触摸照片产生玻璃折射','TOUCH / LIQUID','≈','拖动照片产生流动折射和回弹效果。'],['照片故事','把瞬间变成互动故事','SWIPE / STORY','▤','上传多张照片，左右滑动翻阅；也可保存当前故事卡片。'],['视角密码','拖动还原隐藏文字','PERSPECTIVE','◇','调整视角还原文字'],['裸眼 3D','隐藏的立体形状','STEREOGRAM','◎','平行视线观看隐藏图案'],['折叠密码','拼合隐藏信息','FOLD','⌁','滑动拼合文字'],['无限照片','探索层层画面','INFINITE','▣','点击深入画面'],['颜色解密','用颜色寻找秘密','COLOR','◉','切换颜色滤镜']];function button(label,fn,kind=''){let b=document.createElement('button');b.className='btn '+kind;b.textContent=label;b.onclick=fn;$('actions').appendChild(b)}
function field(label,value,min,max,fn){let d=document.createElement('div');d.className='field';d.innerHTML='<label>'+label+' <span>'+value+'</span></label><input type="range" min="'+min+'" max="'+max+'" value="'+value+'">';let i=d.querySelector('input'),v=d.querySelector('span');i.setAttribute('aria-label',label);i.oninput=()=>{v.textContent=i.value;fn(+i.value)};$('controls').appendChild(d)}
function fileInput(multiple=false){
 const l=document.createElement('label');l.className='file';l.append(document.createTextNode(multiple?'＋ 添加照片':'＋ 上传照片'));
 const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=multiple;input.setAttribute('aria-label',multiple?'上传照片，最多八张':'上传照片');l.appendChild(input);$('controls').appendChild(l);
 input.onchange=async()=>{
 const files=[...input.files];if(!files.length)return;
 const existing=mode===0?imgs.length:0;const limit=multiple?8:1;
 if(mode===0&&existing===0&&files.length<2){toast('请选择 2–8 张照片');input.value='';return}
 if(files.length+existing>limit)toast('最多保留 8 张照片');
 const batch=files.slice(0,limit-existing);if(!batch.length)return;
 l.classList.add('loading');
 try{const arr=await Promise.all(batch.map(async f=>{const url=URL.createObjectURL(f);try{const im=new Image();im.src=url;await im.decode();const reduced=canvasFor(1200,1500);drawPhoto(reduced.getContext('2d'),im,1200,1500);return reduced}finally{URL.revokeObjectURL(url)}}));
 imgs=mode===0?[...imgs,...arr]:arr;story=0;compositeCache=null;render();if(mode===0)refreshFrames();toast('照片已载入');
 }catch(e){toast('图片读取失败，请使用 JPG、PNG 或 WebP')}finally{l.classList.remove('loading');input.value=''}
 };
}
function base(c=ctx,w=600,h=750,variant=0){
 c.clearRect(0,0,w,h);c.fillStyle='#14151b';c.fillRect(0,0,w,h);
 if(!demoPhoto.complete||!demoPhoto.naturalWidth)return;
 c.save();c.translate(w/2,h/2);const t=variant%4;c.rotate((t-1.5)*.012);c.scale(1.07,1.07);c.translate(-w/2+(t-1.5)*w*.018,-h/2);drawPhoto(c,demoPhoto,w,h);c.restore();
}
function drawPhoto(c,im,w,h){c.fillStyle='#f0f0ed';c.fillRect(0,0,w,h);let iw=im.naturalWidth||im.width,ih=im.naturalHeight||im.height,s=Math.max(w/iw,h/ih);c.drawImage(im,(w-iw*s)/2,(h-ih*s)/2,iw*s,ih*s)}
function scene(c,w,h,i){if(imgs.length)drawPhoto(c,imgs[i%imgs.length],w,h);else base(c,w,h,i)}
function canvasFor(w=600,h=750){let c=document.createElement('canvas');c.width=w;c.height=h;return c}
let compositeCache=null;
function composite(w=600,h=750){
 const key=[w,h,settings.stripe,settings.direction,settings.contrast];
 if(compositeCache&&compositeCache.images===imgs&&key.join()===compositeCache.key)return compositeCache.canvas;
 const c=canvasFor(w,h),out=c.getContext('2d'),n=imgs.length||4,p=Math.max(1,settings.stripe*(w/600)),vertical=settings.direction==='vertical';
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
 const vertical=settings.direction==='vertical',slit=settings.stripe/600*stage.clientWidth,pitch=slit*(imgs.length||4);
 card.style.backgroundImage=`repeating-linear-gradient(${vertical?90:180}deg,transparent 0px,transparent ${slit}px,#050506 ${slit}px,#050506 ${pitch}px)`;
 overlay.appendChild(card);applyPhase();let down=null;
 card.onpointerdown=e=>{stopPlayback();document.body.classList.add('is-scanning');down={point:vertical?e.clientX:e.clientY,phase:settings.phase};card.setPointerCapture(e.pointerId);e.preventDefault()};
 card.onpointermove=e=>{if(!down)return;const delta=(vertical?e.clientX:e.clientY)-down.point;settings.phase=((down.phase+delta/pitch)%1+1)%1;applyPhase()};
 card.onpointerup=card.onpointercancel=()=>{down=null;document.body.classList.remove('is-scanning')};hint.textContent=vertical?'左右拖动光栅':'上下拖动光栅';
}
function applyPhase(){
 const card=overlay.querySelector('.drag-card');if(!card)return;
 const pitch=settings.stripe*(imgs.length||4)/600*stage.clientWidth;
 card.style.setProperty('--stripe-angle',settings.direction==='vertical'?'90deg':'180deg');card.style.setProperty('--stripe-pitch',pitch+'px');const offset=settings.phase*pitch;
 card.style.backgroundPosition=settings.direction==='vertical'?`${offset}px 0`:`0 ${offset}px`;
 $('phase').value=Math.round(settings.phase*1000);$('frameCount').textContent=String(Math.floor(settings.phase*(imgs.length||4))+1).padStart(2,'0')+' / '+String(imgs.length||4).padStart(2,'0');
}
function download(c,name){c.toBlob(b=>{if(!b)return;let a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000)},'image/png')}
let iosCardScale=100;function maskCanvas(){
 const w=600,h=750,n=imgs.length||4,scale=iosCardScale/100,slit=settings.stripe/scale,pitch=slit*n,c=canvasFor(w,h),g=c.getContext('2d');g.fillStyle='#050506';
 const vertical=settings.direction==='vertical';for(let a=slit;a<(vertical?w:h);a+=pitch){if(vertical)g.fillRect(a,0,pitch-slit,h);else g.fillRect(0,a,w,pitch-slit)}return c;
}
function downloadCard(){download(maskCanvas(),'PLAYGROUND-mask-'+iosCardScale+'pct.png')}
function saveCurrent(){let c=canvasFor();c.getContext('2d').drawImage(canvas,0,0);download(c,'PLAY-'+modes[mode][0]+'.png')}
function resetScratch(){let top=canvasFor(),c=top.getContext('2d');c.fillStyle='#15151b';c.fillRect(0,0,600,750);c.fillStyle='#b4a6c9';c.textAlign='center';c.font='bold 56px sans-serif';c.fillText('SCRATCH ME',300,370);c.font='24px sans-serif';c.fillText('刮开看看下面有什么 ↗',300,420);let o=canvasFor(),oc=o.getContext('2d');scene(oc,600,750,imgs.length?0:1);ctx.drawImage(o,0,0);let mask=document.createElement('canvas');mask.width=600;mask.height=750;mask.style.cssText='position:absolute;inset:0;width:100%;height:100%;touch-action:none';overlay.replaceChildren(mask);let mc=mask.getContext('2d');mc.drawImage(top,0,0);let active=false;function erase(e){let r=mask.getBoundingClientRect(),x=(e.clientX-r.left)*600/r.width,y=(e.clientY-r.top)*750/r.height;mc.globalCompositeOperation='destination-out';mc.beginPath();mc.arc(x,y,43,0,7);mc.fill()}mask.onpointerdown=e=>{active=true;mask.setPointerCapture(e.pointerId);erase(e)};mask.onpointermove=e=>{if(active)erase(e)};mask.onpointerup=()=>active=false;mask.onpointercancel=()=>active=false;hint.textContent='刮开'}
function drawTilt(t){let a=canvasFor(),b=canvasFor();scene(a.getContext('2d'),600,750,0);scene(b.getContext('2d'),600,750,imgs.length>1?1:2);ctx.drawImage(a,0,0);ctx.globalAlpha=t;ctx.drawImage(b,0,0);ctx.globalAlpha=1}
let tiltValue=0;function tiltMove(e){let r=stage.getBoundingClientRect();tiltValue=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));drawTilt(tiltValue)}
let sensor=null;async function sensorEnable(){if(typeof DeviceOrientationEvent==='undefined'){alert('此设备不支持方向感应');return}try{if(typeof DeviceOrientationEvent.requestPermission==='function'){let r=await DeviceOrientationEvent.requestPermission();if(r!=='granted')return}if(sensor)window.removeEventListener('deviceorientation',sensor);sensor=e=>{if(mode!==2)return;let g=e.gamma||0;tiltValue=Math.max(0,Math.min(1,(g+35)/70));drawTilt(tiltValue)};window.addEventListener('deviceorientation',sensor)}catch(e){alert('无法启用方向感应，请使用手指拖动')}}
function drawType(t=0){ctx.fillStyle='#101014';ctx.fillRect(0,0,600,750);let chars=[...textValue].slice(0,16),sz=Math.min(72,Math.floor(520/Math.max(1,chars.length)*1.5));ctx.font='900 '+sz+'px sans-serif';ctx.textAlign='center';let widths=chars.map(ch=>ctx.measureText(ch).width+3),total=widths.reduce((a,b)=>a+b,0),x=300-total/2;chars.forEach((ch,i)=>{let off=Math.sin(i*.9+t)*42;ctx.fillStyle=i%2?'#b4a6c9':'#fff';ctx.fillText(ch,x+widths[i]/2,385+off);x+=widths[i]});ctx.font='15px sans-serif';ctx.fillStyle='#b9d2cb';ctx.fillText('MOVE YOUR FINGER ↔',300,660)}
let liquidSource=null,liquidPulses=[],liquidRunning=false,liquidTime=0,liquidStrength=22;function prepareLiquid(){let s=canvasFor();scene(s.getContext('2d'),600,750,0);liquidSource=s;liquidPulses=[];liquidTime=0}
function liquidTouch(x,y,dx=0,dy=0){liquidPulses.push({x,y,dx,dy,age:0});if(liquidPulses.length>9)liquidPulses.shift()}
function drawLiquid(){if(!liquidSource)prepareLiquid();ctx.clearRect(0,0,600,750);ctx.drawImage(liquidSource,0,0);const slice=5;for(let p of liquidPulses){let decay=Math.pow(1-p.age/56,2),radius=42+p.age*3.5;if(decay<=0)continue;let x0=Math.max(0,Math.floor((p.x-radius-30)/slice)*slice),x1=Math.min(600,p.x+radius+30);for(let x=x0;x<x1;x+=slice){let distance=Math.abs(x-p.x);if(distance>radius+25)continue;let wave=Math.sin(distance*.057-p.age*.26)*Math.exp(-Math.pow(distance/(radius*.85),2))*liquidStrength*decay;let drift=p.dx*decay*.65;let sourceX=Math.max(0,Math.min(600-slice,x+wave+drift));let y0=Math.max(0,Math.floor(p.y-radius)),y1=Math.min(750,Math.ceil(p.y+radius));if(y1<=y0)continue;let yy=p.y+(y0-p.y)*.84,hh=(y1-y0)*.84;ctx.drawImage(liquidSource,sourceX,Math.max(0,yy),slice,Math.min(hh,750-Math.max(0,yy)),x,y0,slice,y1-y0)}}}
function animateLiquid(){if(mode!==4){liquidRunning=false;return}liquidPulses=liquidPulses.filter(p=>p.age<56);for(let p of liquidPulses)p.age+=1;drawLiquid();if(liquidPulses.length){raf=requestAnimationFrame(animateLiquid)}else liquidRunning=false}
function wakeLiquid(){if(!liquidRunning){liquidRunning=true;raf=requestAnimationFrame(animateLiquid)}}
function drawStory(){scene(ctx,600,750,story);ctx.fillStyle='#1d2929b8';ctx.fillRect(0,0,600,70);ctx.fillStyle='white';ctx.font='bold 22px sans-serif';ctx.fillText('MY LITTLE STORY',25,44);ctx.fillStyle='#1d2929b8';ctx.fillRect(0,670,600,80);ctx.fillStyle='white';ctx.font='17px sans-serif';ctx.fillText('← SWIPE TO EXPLORE →',30,718);ctx.textAlign='right';ctx.fillText((story+1)+' / '+(imgs.length||4),570,718);ctx.textAlign='left'}
function clear(){cancelAnimationFrame(raf);liquidRunning=false;run=false;overlay.innerHTML='';overlay.onpointerdown=null;overlay.onpointermove=null;overlay.onpointerup=null;overlay.onpointercancel=null;stage.onpointerdown=null;stage.onpointermove=null;stage.onpointerup=null;stage.onpointercancel=null;hint.textContent='';if(sensor){window.removeEventListener('deviceorientation',sensor);sensor=null}}
let secretText='SECRET',secretPos=0,zoomDepth=0,filterMode=0;
function secretInput(){let d=document.createElement('div');d.className='field';d.innerHTML='<label>隐藏文字</label><input type="text" maxlength="12">';let i=d.querySelector('input');i.setAttribute('aria-label','隐藏文字');i.value=secretText;i.oninput=()=>{secretText=i.value||'SECRET';render()};$('controls').appendChild(d)}
function artText(s,x,y,size=70,color='#fff'){ctx.fillStyle=color;ctx.font='bold '+size+'px "Songti SC",Georgia,serif';ctx.textAlign='center';ctx.fillText(s,x,y,520);ctx.textAlign='left'}
function drawSecret(){ctx.fillStyle='#101013';ctx.fillRect(0,0,600,750);ctx.save();ctx.translate(300,365);ctx.transform(1,.08,(1-secretPos)*1.7,.12+secretPos*.88,0,0);artText(secretText,0,0,75,'#f4f4f0');ctx.restore();artText('PERSPECTIVE',300,675,18,'#b4a6c9')}
function drawStereo(){let w=600,h=750,p=80,c=ctx.createImageData(w,h),seed=8;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}for(let y=0;y<h;y++){let row=[];for(let x=0;x<w;x++){let cx=x-300,cy=y-370,inside=cx*cx/21000+cy*cy/17000<1,offset=inside?12:0;let v=x<p?(rand()>.5?230:35):row[Math.max(0,x-p+offset)];row.push(v);let k=(y*w+x)*4;c.data[k]=c.data[k+1]=c.data[k+2]=v;c.data[k+3]=255}}ctx.putImageData(c,0,0);ctx.fillStyle='#b4a6c9';ctx.beginPath();ctx.arc(260,65,5,0,7);ctx.arc(340,65,5,0,7);ctx.fill()}
function drawFold(){ctx.fillStyle='#101010';ctx.fillRect(0,0,600,750);let chars=[...secretText],m=Math.ceil(chars.length/2),dx=(1-secretPos)*160;artText(chars.slice(0,m).join(''),225-dx,370,65,'#fff');artText(chars.slice(m).join(''),370+dx,370,65,'#b4a6c9');ctx.setLineDash([8,8]);ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(300,90);ctx.lineTo(300,640);ctx.stroke();ctx.setLineDash([])}
function drawInfinite(){ctx.fillStyle='#050505';ctx.fillRect(0,0,600,750);for(let j=0;j<6;j++){let scale=Math.pow(.66,j),w=510*scale,hh=620*scale,x=300-w/2,y=370-hh/2,c=canvasFor();scene(c.getContext('2d'),600,750,(zoomDepth+j)%(imgs.length||4));ctx.fillStyle='#fff';ctx.fillRect(x-3,y-3,w+6,hh+6);ctx.drawImage(c,x,y,w,hh)}}
function drawColors(){ctx.fillStyle='#101018';ctx.fillRect(0,0,600,750);ctx.save();ctx.globalCompositeOperation='screen';artText(secretText,285,380,72,'#ff3131');artText(secretText,317,380,72,'#1de8f1');ctx.restore();if(filterMode){ctx.fillStyle=filterMode===1?'#ff0000b8':'#00eaffb8';ctx.fillRect(0,0,600,750)}}
function render(){clear();if(mode===0){drawScanimation();return}if(mode===1){resetScratch();return}if(mode===2){drawTilt(tiltValue);let active=false;overlay.onpointerdown=e=>{active=true;overlay.setPointerCapture(e.pointerId);tiltMove(e)};overlay.onpointermove=e=>{if(active)tiltMove(e)};overlay.onpointerup=()=>active=false;hint.textContent='左右滑动';return}if(mode===3){let t=0;drawType(t);overlay.onpointermove=e=>{let r=stage.getBoundingClientRect();t=(e.clientX-r.left)/r.width*9;drawType(t)};hint.textContent='滑动';return}if(mode===4){prepareLiquid();drawLiquid();let active=false,last=null;const touch=e=>{let r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*600,y=(e.clientY-r.top)/r.height*750;liquidTouch(x,y,last?x-last.x:0,last?y-last.y:0);last={x,y};wakeLiquid()};overlay.onpointerdown=e=>{active=true;last=null;overlay.setPointerCapture(e.pointerId);touch(e)};overlay.onpointermove=e=>{if(active)touch(e)};overlay.onpointerup=()=>{active=false;last=null};overlay.onpointercancel=()=>{active=false;last=null};hint.textContent='触摸拖动';return}if(mode===5){drawStory();let x=null;overlay.onpointerdown=e=>{x=e.clientX;overlay.setPointerCapture(e.pointerId)};overlay.onpointerup=e=>{if(x===null)return;let d=e.clientX-x;if(Math.abs(d)>25){story=(story+(d<0?1:-1)+(imgs.length||4))%(imgs.length||4);drawStory()}x=null};hint.textContent='滑动翻页';return}if(mode===6||mode===8){let draw=mode===6?drawSecret:drawFold;draw();let move=e=>{let rect=stage.getBoundingClientRect();secretPos=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));draw()};overlay.onpointerdown=e=>{overlay.setPointerCapture(e.pointerId);move(e)};overlay.onpointermove=e=>{if(e.pressure||e.buttons)move(e)};hint.textContent='左右滑动';return}if(mode===7){drawStereo();hint.textContent='平行视线观察';return}if(mode===9){drawInfinite();overlay.onpointerdown=()=>{zoomDepth++;drawInfinite()};hint.textContent='点击深入';return}if(mode===10){drawColors();overlay.onpointerdown=()=>{filterMode=(filterMode+1)%3;drawColors()};hint.textContent='点击切换滤镜';return}}
/* Local animated exports */
let exportBusy=false;
function setExportBusy(value){document.querySelectorAll('#exportDialog .export-options button, #animatedExports button').forEach(b=>b.disabled=value)}
function exportStatus(s){let e=document.getElementById('exportStatus');if(e)e.textContent=s}
function exportFrames(count=24){const snapshot={secretPos,filterMode,zoomDepth,story};let frames=[],w=360,hh=450,c=document.createElement('canvas');c.width=w;c.height=hh;let g=c.getContext('2d',{willReadFrequently:true});for(let i=0;i<count;i++){let t=(settings.motion<0?(count-i)%count:i)/count;let source=canvasFor();let sc=source.getContext('2d');if(mode===0){let b=composite();sc.drawImage(b,0,0);let n=imgs.length||4,p=settings.stripe*n;sc.fillStyle='#050506';const vertical=settings.direction==='vertical';for(let x=-p;x<(vertical?600:750)+p;x+=p){const a=x+settings.stripe+t*p;if(vertical)sc.fillRect(a,0,p-settings.stripe,750);else sc.fillRect(0,a,600,p-settings.stripe)}}else if(mode===3){drawType(t*Math.PI*2);sc.drawImage(canvas,0,0)}else if(mode===4){prepareLiquid();liquidTouch(300+150*Math.cos(t*Math.PI*2),375+150*Math.sin(t*Math.PI*2));liquidPulses[0].age=Math.floor(t*50);drawLiquid();sc.drawImage(canvas,0,0)}else if(mode===2){drawTilt((1-Math.cos(t*Math.PI*2))/2);sc.drawImage(canvas,0,0)}else if(mode===5){scene(sc,600,750,Math.floor(t*(imgs.length||4)))}else if(mode===6){secretPos=(1-Math.cos(t*Math.PI*2))/2;drawSecret();sc.drawImage(canvas,0,0)}else if(mode===8){secretPos=(1-Math.cos(t*Math.PI*2))/2;drawFold();sc.drawImage(canvas,0,0)}else if(mode===9){let prev=zoomDepth;zoomDepth=prev+Math.floor(t*5);drawInfinite();sc.drawImage(canvas,0,0);zoomDepth=prev}else if(mode===10){filterMode=Math.floor(t*3);drawColors();sc.drawImage(canvas,0,0)}else if(mode===1){scene(sc,600,750,0);sc.fillStyle='#161616';sc.fillRect(0,0,600*(1-t),750)}else{sc.drawImage(canvas,0,0)}g.drawImage(source,0,0,w,hh);frames.push(g.getImageData(0,0,w,hh).data.slice())}secretPos=snapshot.secretPos;filterMode=snapshot.filterMode;zoomDepth=snapshot.zoomDepth;story=snapshot.story;render();return{frames,w,h:hh}}
function gifPalette(){let a=[];for(let i=0;i<256;i++)a.push(((i>>5)&7)*255/7|0,((i>>2)&7)*255/7|0,(i&3)*85);return a}
function gifIndex(rgba){let a=new Uint8Array(rgba.length/4);for(let i=0,j=0;i<rgba.length;i+=4,j++)a[j]=(rgba[i]&224)|((rgba[i+1]&224)>>3)|(rgba[i+2]>>6);return a}
function gifLZW(pixels){const clear=256,end=257;let dict=new Map(),next=258,bits=9,bitBuf=0,bitCount=0,out=[];const emit=v=>{bitBuf|=v<<bitCount;bitCount+=bits;while(bitCount>=8){out.push(bitBuf&255);bitBuf>>=8;bitCount-=8}};emit(clear);let prev=String(pixels[0]);for(let i=1;i<pixels.length;i++){let k=pixels[i],key=prev+','+k;if(dict.has(key)){prev=key;continue}emit(prev.includes(',')?dict.get(prev):Number(prev));if(next<4096){dict.set(key,next++);if(next>(1<<bits)&&bits<12)bits++}else{emit(clear);dict.clear();next=258;bits=9}prev=String(k)}emit(prev.includes(',')?dict.get(prev):Number(prev));emit(end);if(bitCount)out.push(bitBuf&255);return out}
function gifEncode(frames,w,h){let bytes=[],put=(...v)=>bytes.push(...v),word=v=>put(v&255,(v>>8)&255),ascii=s=>{for(let c of s)put(c.charCodeAt(0))};ascii('GIF89a');word(w);word(h);put(0xf7,0,0);put(...gifPalette());put(0x21,0xff,11);ascii('NETSCAPE2.0');put(3,1,0,0,0);for(let f of frames){put(0x21,0xf9,4,0,Math.max(2,Math.round(100/(frames.length*settings.speed))),0,0,0);put(0x2c);word(0);word(0);word(w);word(h);put(0,8);let compressed=gifLZW(gifIndex(f));for(let i=0;i<compressed.length;i+=255){let b=compressed.slice(i,i+255);put(b.length,...b)}put(0)}put(0x3b);return new Blob([new Uint8Array(bytes)],{type:'image/gif'})}
function saveBlob(b,name){let a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)}
async function exportGif(){if(exportBusy)return;exportBusy=true;setExportBusy(true);exportStatus('正在生成 GIF');try{await new Promise(r=>setTimeout(r,30));let f=exportFrames(20);let b=gifEncode(f.frames,f.w,f.h);saveBlob(b,'PLAY-'+modes[mode][0]+'.gif');exportStatus('GIF 已生成')}catch(e){exportStatus('生成失败 请重试');console.error(e)}finally{exportBusy=false;setExportBusy(false)}}
async function exportVideo(){if(exportBusy)return;exportBusy=true;setExportBusy(true);exportStatus('正在生成视频');try{if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)throw Error('当前浏览器不支持直接录制');let type=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));if(!type)throw Error('当前浏览器不支持视频编码');let f=exportFrames(30),c=document.createElement('canvas');c.width=f.w;c.height=f.h;let g=c.getContext('2d'),stream=c.captureStream(30),track=stream.getVideoTracks()[0],chunks=[],rec=new MediaRecorder(stream,{mimeType:type});rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};let done=new Promise((resolve,reject)=>{rec.onstop=resolve;rec.onerror=reject});rec.start();for(let i=0;i<f.frames.length;i++){g.putImageData(new ImageData(new Uint8ClampedArray(f.frames[i]),f.w,f.h),0,0);if(track.requestFrame)track.requestFrame();await new Promise(r=>setTimeout(r,1000/(f.frames.length*settings.speed)))}rec.stop();await done;stream.getTracks().forEach(t=>t.stop());saveBlob(new Blob(chunks,{type}), 'PLAY-'+modes[mode][0]+(type.includes('mp4')?'.mp4':'.webm'));exportStatus('视频已生成')}catch(e){exportStatus(e.message||'视频导出失败')}finally{exportBusy=false;setExportBusy(false)}}

/* Gallery and studio controller. All eleven original experiment renderers remain above. */
const englishNames=['Scanimation','Scratch Art','Tilt Illusion','Kinetic Typography','Liquid Photo','Photo Story','Perspective','Stereogram','Folding Code','Infinite Photo','Color Reveal'];
const slugs=['scanimation','scratch','tilt','typography','liquid','story','perspective','stereogram','folding','infinite','color'];
const exhibitionOrder=[0,6,7,8,9,10,1,2,3,4,5];
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
 const count=imgs.length||4;$('photoCount').textContent=imgs.length?count+' / 8':'示例 · 4 帧';
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
 const photos=document.createElement('div');photos.id='photoFields';photos.innerHTML='<div class="control-heading"><span>照片序列</span><small id="photoCount">示例 · 4 帧</small></div>';$('controls').appendChild(photos);
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
 clear();stopPlayback();mode=i;imgs=[];settings={stripe:4,phase:0,direction:'vertical',speed:.5,contrast:70,motion:1};iosCardScale=100;tiltValue=0;story=0;compositeCache=null;
 $('controls').replaceChildren();$('actions').replaceChildren();$('modeNote').textContent='';
 if(i===0)scanControls();
 else if(i===1){fileInput();button('重新覆盖',resetScratch,'alt');button('保存隐藏照片',saveCurrent)}
 else if(i===2){fileInput(true);button('启用手机倾斜',sensorEnable);button('保存当前画面',saveCurrent,'alt')}
 else if(i===3){const d=document.createElement('div');d.className='field';d.innerHTML='<label for="typeInput">你的文字</label><input id="typeInput" type="text" maxlength="16" placeholder="输入一句话">';$('controls').appendChild(d);$('typeInput').value=textValue;$('typeInput').oninput=e=>{textValue=e.target.value||'PLAY';drawType()};button('保存文字海报',saveCurrent)}
 else if(i===4){fileInput();field('折射强度',22,8,48,v=>{liquidStrength=v});button('保存当前画面',saveCurrent)}
 else if(i===5){fileInput(true);button('上一张',()=>{story=(story-1+(imgs.length||4))%(imgs.length||4);drawStory()},'alt');button('下一张',()=>{story=(story+1)%(imgs.length||4);drawStory()},'alt');button('保存故事卡',saveCurrent)}
 else if(i===6||i===8){secretInput();button('保存图片',saveCurrent)}
 else if(i===7)button('保存立体图',saveCurrent);
 else if(i===9){fileInput(true);button('深入一层',()=>{zoomDepth++;drawInfinite()},'alt');button('保存图片',saveCurrent)}
 else if(i===10){secretInput();button('切换滤镜',()=>{filterMode=(filterMode+1)%3;drawColors()},'alt');button('保存图片',saveCurrent)}
 if(i!==0){addExports();$('modeNote').textContent=modes[i][4]}
 initializedMode=i;render();
}
function navigate(){
 const hash=(location.hash.includes('figmacapture=')?'home':location.hash.slice(1))||'home',parts=hash.split('/'),i=slugs.indexOf(parts[1]);let page=parts[0];
 if(!['home','experiments','experiment','editor'].includes(page)||(!['home','experiments'].includes(page)&&i<0)){location.replace('#home');return}
 if(page==='experiment'&&i>0){location.replace('#editor/'+slugs[i]);return}
 stopPlayback();clear();routeName=page;document.body.dataset.page=page;document.body.dataset.experiment=i===0?'scanimation':'other';
 $('home').hidden=page!=='home';$('intro').hidden=page!=='experiment';$('work').hidden=page!=='editor';$('experiments').hidden=page!=='experiments';
 $('headerContext').textContent=page==='home'?'创意图像实验室':page==='experiment'?'光学实验 / 01':'PLAYGROUND STUDIO';
 if(page==='experiments'){requestAnimationFrame(drawDirectoryCable)}
 if(page==='editor'){
  $('modeTitle').textContent=modes[i][0];$('modeEnglish').textContent=englishNames[i];$('modeNum').textContent='实验 '+String(i+1).padStart(2,'0')+' / 11';$('editorBack').href=i===0?'#experiment/scanimation':'#home';$('previewTransport').hidden=i!==0;$('studioTabs').hidden=i!==0;$('sequenceStrip').hidden=i!==0;$('topExport').hidden=i!==0;
  if(initializedMode!==i)initializeEditor(i);else render();
 }else if(page==='home'){requestAnimationFrame(()=>{drawClothesline();updateGallery()})}
 document.querySelectorAll('dialog[open]').forEach(d=>d.close());window.scrollTo({top:0,behavior:'instant'});
 document.title='PLAYGROUND — '+(page==='home'?'创意游乐场':page==='experiments'?'全部实验':modes[i][0]);
}
window.addEventListener('hashchange',navigate);
const gallery=$('cards');
function galleryItems(){return [...gallery.querySelectorAll('.gallery-item')]}
function focusGallery(index){activeGallery=Math.max(0,Math.min(10,index));const item=galleryItems()[activeGallery];gallery.scrollTo({left:item.offsetLeft+item.offsetWidth/2-gallery.clientWidth*(innerWidth<=700?.38:.5),behavior:reducedMotion.matches?'instant':'smooth'})}
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
 activeGallery=closest;$('slideCount').innerHTML=String(closest+1).padStart(2,'0')+' <i>/ 11</i>';$('galleryProgress').style.width=(closest+1)/11*100+'%';galleryRaf=0;
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
 if(index===0){g.fillStyle='#0a0b0e';g.fillRect(0,0,w,h);g.fillStyle='#f2f1ed';g.beginPath();g.ellipse(w*.34,h*.31,w*.065,h*.085,.2,0,Math.PI*2);g.ellipse(w*.66,h*.31,w*.065,h*.085,.2,0,Math.PI*2);g.fill();g.strokeStyle='#f2f1ed';g.lineWidth=w*.047;g.lineCap='round';g.beginPath();g.ellipse(w*.5,h*.48,w*.245,h*.2,0,.08,Math.PI-.08);g.stroke();g.fillStyle='#060709';for(let x=0;x<w;x+=5)g.fillRect(x,0,2.8,h)}
 else if(index===1){base(g,w,h,1);const cover=canvasFor(w,h),cg=cover.getContext('2d');cg.fillStyle='#aca8b0';cg.fillRect(0,0,w,h);cg.globalCompositeOperation='destination-out';cg.lineWidth=45;cg.lineCap='round';cg.beginPath();cg.moveTo(45,h*.7);cg.bezierCurveTo(w*.8,h*.05,w*.1,h*.8,w*.8,h*.3);cg.stroke();g.drawImage(cover,0,0)}
 else if(index===2){g.save();g.beginPath();g.rect(0,0,w*.5,h);g.clip();base(g,w,h,0);g.restore();g.save();g.beginPath();g.rect(w*.5,0,w*.5,h);g.clip();g.filter='grayscale(1) contrast(1.3)';base(g,w,h,3);g.restore();g.strokeStyle='#bcb2cc';g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.stroke()}
 else if(index===3){g.fillStyle='#121116';g.fillRect(0,0,w,h);g.textAlign='center';g.font='italic 66px Georgia';for(let y=-30;y<h+50;y+=48){g.save();g.translate(w/2,y);g.rotate(-.2);g.fillStyle=y===162?'#c9bfd9':'#736a82';g.fillText('play',0,0);g.restore()}g.textAlign='left'}
 else if(index===4){base(g,w,h,0);const source=canvasFor(w,h);source.getContext('2d').drawImage(target,0,0);for(let y=0;y<h;y+=3){const dx=Math.sin(y*.05)*16*Math.sin(y/h*Math.PI);g.drawImage(source,0,y,w,3,dx,y,w,3)}g.strokeStyle='#d9cbea66';for(let i=0;i<3;i++){g.beginPath();g.ellipse(w*.5,h*.5,45+i*15,65+i*18,.4,0,Math.PI*2);g.stroke()}}
 else if(index===5){for(let j=0;j<3;j++){g.save();g.translate(w/2,h/2);g.rotate((j-1)*.16);g.translate(-w/2,-h/2);g.fillStyle='#b6b0bd';g.fillRect(27+j*4,23+j*10,w-54,h-60);const c=canvasFor(w-64,h-90);base(c.getContext('2d'),c.width,c.height,j);g.drawImage(c,32+j*4,28+j*10);g.restore()}}
 else if(index===6){g.save();g.translate(w/2,h*.55);g.transform(1,-.3,.7,.5,0,0);g.fillStyle='#d1c4df';g.font='43px Georgia';g.textAlign='center';g.fillText('SECRET',0,0);g.restore();g.textAlign='left';g.strokeStyle='#6b5e7b';for(let y=30;y<h;y+=18){g.beginPath();g.moveTo(0,y);g.lineTo(w,y-35);g.stroke()}}
 else if(index===7){let seed=8;g.fillStyle='#b8b0c5';for(let y=0;y<h;y+=3)for(let x=0;x<w;x+=3){seed=(seed*1664525+1013904223)>>>0;g.fillStyle=seed%3===0?'#b8b0c5':'#282331';g.fillRect(x,y,2,2)}}
 else if(index===8){g.fillStyle='#d4ccd9';g.font='bold 80px Georgia';g.save();g.translate(w*.13,h*.48);g.rotate(-.13);g.fillText('SE',0,0);g.restore();g.save();g.translate(w*.49,h*.65);g.rotate(.13);g.fillStyle='#8d7c9d';g.fillText('CR',0,0);g.restore();g.strokeStyle='#7e7289';g.setLineDash([3,4]);g.beginPath();g.moveTo(w*.5,15);g.lineTo(w*.5,h-15);g.stroke();g.setLineDash([])}
 else if(index===9){for(let j=0;j<7;j++){const ratio=Math.pow(.7,j),ww=w*ratio,hh=h*ratio;const c=canvasFor(ww,hh);base(c.getContext('2d'),ww,hh,j);g.strokeStyle='#a49aad';g.lineWidth=2;g.drawImage(c,(w-ww)/2,(h-hh)/2);g.strokeRect((w-ww)/2,(h-hh)/2,ww,hh)}}
 else if(index===10){g.textAlign='center';g.font='68px Georgia';g.globalCompositeOperation='screen';g.fillStyle='#92576b';g.fillText('SEE',w/2-10,h*.56);g.fillStyle='#477787';g.fillText('SEE',w/2+10,h*.56);g.globalCompositeOperation='source-over';g.fillStyle='#49768b55';g.fillRect(w*.5,0,w*.5,h);g.textAlign='left'}
}
exhibitionOrder.forEach((i,position)=>{const m=modes[i];const link=document.createElement('a');link.href=i===0?'#experiment/scanimation':'#editor/'+slugs[i];link.className='gallery-item';link.dataset.mode=i;link.setAttribute('aria-label',m[0]+'，实验 '+(i+1));link.innerHTML='<span class="gallery-hanger"></span><span class="glass-reflection"></span><span class="gallery-art"><canvas width="300" height="310" aria-hidden="true"></canvas></span><span class="gallery-number">'+String(position+1).padStart(2,'0')+'</span><span class="gallery-card-footer"><span class="gallery-name">'+m[0]+'</span><span class="gallery-enter">↗</span></span><span class="gallery-card-english">'+englishNames[i].toUpperCase()+'</span>';gallery.appendChild(link);const menu=document.createElement('a');menu.href=link.href;menu.innerHTML='<span>'+String(i+1).padStart(2,'0')+' / '+englishNames[i]+'</span><strong>'+m[0]+'</strong>';$('experimentMenu').appendChild(menu)});
$('dockPrev').onclick=()=>focusGallery(activeGallery-1);$('dockNext').onclick=()=>focusGallery(activeGallery+1);
$('menuToggle').onclick=()=>{location.hash='experiments'};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}));
$('downloadBase').onclick=()=>{download(composite(),'PLAYGROUND-base.png');exportStatus('底图已生成')};$('downloadMask').onclick=()=>{downloadCard();exportStatus('透明光栅卡已生成')};$('exportGif').onclick=exportGif;$('exportVideo').onclick=exportVideo;
// Status stays in whichever export surface is visible.
exportStatus=s=>{const element=$('legacyExportStatus')&&mode!==0?$('legacyExportStatus'):$('exportStatus');if(element)element.textContent=s};
function repaintDemo(){compositeCache=null;galleryItems().forEach((node,index)=>paintDirectoryArt(+node.dataset.mode,node.querySelector('canvas')));drawDirectoryArt();if(routeName==='editor'&&!imgs.length){render();if(mode===0)refreshFrames()}}
demoPhoto.onload=repaintDemo;portraitPhoto.onload=()=>{drawDirectoryArt();galleryItems().forEach(n=>paintDirectoryArt(+n.dataset.mode,n.querySelector('canvas')))};demoPhoto.onerror=()=>toast('示例图片加载失败，请刷新页面');
window.addEventListener('resize',()=>{if(routeName==='experiments')drawDirectoryCable();if(routeName==='home'){drawClothesline();updateGallery()}else if(routeName==='editor'&&mode===0){stopPlayback();drawScanimation()}});
const directoryOrder=[0,6,7,8,9,10,1,2,3,4,5];
function paintDirectoryArt(index,target){
 const g=target.getContext('2d'),w=target.width,h=target.height;g.clearRect(0,0,w,h);
 if(index===0){paintArtwork(0,target);return}
 if(index===6){if(portraitPhoto.complete&&portraitPhoto.naturalWidth){g.filter='grayscale(1)';drawPhoto(g,portraitPhoto,w,h);g.filter='none';g.fillStyle='#070707a0';for(let x=0;x<w;x+=5)g.fillRect(x,0,2,h)}return}
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
