// Run against `npm run dev`. Set PLAYGROUND_URL to test another static server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.PLAYGROUND_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const page = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2});
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(15000);
  const results = path.join(__dirname, '..', 'test-results'); await fs.mkdir(results, {recursive:true});
  await page.goto(base); await page.locator('.gallery-art canvas').first().waitFor();
  await page.waitForFunction(() => document.querySelector('#intro img').complete);
  assert.equal(await page.locator('.gallery-item').count(), 11);
  await page.locator('#cards').focus();await page.locator('#cards').press('ArrowRight');
  await page.waitForFunction(() => document.getElementById('slideCount').textContent.startsWith('02'));
  await page.locator('#cards').press('ArrowLeft');
  await page.waitForFunction(() => document.getElementById('slideCount').textContent.startsWith('01'));
  await page.screenshot({path:path.join(results,'home-mobile.png'),fullPage:true});
  await page.locator('.gallery-item').first().click(); await page.waitForTimeout(800);
  assert.equal(await page.locator('#intro').isVisible(), true);
  await page.screenshot({path:path.join(results,'intro-mobile.png'),fullPage:true});
  await page.getByRole('link',{name:'开始创作'}).click();
  await page.locator('summary').filter({hasText:'高级参数'}).click();
  await page.getByRole('button',{name:'播放动画',exact:true}).click();
  await page.waitForFunction(() => +document.getElementById('phase').value > 20);
  await page.getByRole('button',{name:'暂停动画',exact:true}).click();
  const canvas = page.locator('#stage'); await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
  const before = await page.locator('#phase').inputValue();
  await page.mouse.move(box.x+50,box.y+100); await page.mouse.down(); await page.mouse.move(box.x+63,box.y+100,{steps:5}); await page.mouse.up();
  assert.notEqual(await page.locator('#phase').inputValue(),before);
  await page.getByRole('button',{name:'向下',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'向下',exact:true}).getAttribute('aria-pressed'),'true');
  assert.doesNotMatch(await page.locator('.drag-card').evaluate(e=>e.style.backgroundImage),/90deg/);
  await page.getByRole('button',{name:'向右',exact:true}).click();
  const contrastBefore=await page.locator('#canvas').evaluate(c=>c.toDataURL());await page.getByRole('slider',{name:'对比度',exact:true}).fill('90');assert.notEqual(await page.locator('#canvas').evaluate(c=>c.toDataURL()),contrastBefore);await page.getByRole('slider',{name:'对比度',exact:true}).fill('70');
  await page.getByRole('slider',{name:'条纹宽度',exact:true}).fill('6');
  const photo=path.join(__dirname,'../assets/cat.jpg');
  // One frame is rejected, then valid uploads preserve a two-frame minimum.
  await page.locator('#controls input[type=file]').setInputFiles([photo]);
  await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('2–8'),null,{timeout:15000});
  await page.locator('#controls input[type=file]').setInputFiles([photo,photo,photo]);
  await page.waitForFunction(()=>document.querySelectorAll('.frame-tools').length===3,null,{timeout:15000});
  await page.getByRole('button',{name:'后移照片 1',exact:true}).click();
  await page.getByRole('button',{name:'删除照片 1',exact:true}).click();
  assert.equal(await page.locator('.frame-item').count(),2);
  assert.equal(await page.getByRole('button',{name:'删除照片 1',exact:true}).isDisabled(),true);
  await page.locator('#editorBack').click();
  await page.getByRole('link',{name:'开始创作'}).click();
  assert.equal(await page.locator('.frame-item').count(),2);
  await page.screenshot({path:path.join(results,'editor-mobile.png'),fullPage:true});
  await page.locator('#actions button').first().click();
  async function download(name,file){const event=page.waitForEvent('download');await page.getByRole('button',{name}).click();const d=await event;await d.saveAs(path.join(results,file));}
  await download(/光栅底图/,'base.png'); await download(/透明光栅卡/,'mask.png');
  await page.getByRole('button',{name:'关闭导出'}).click();
  // Default demo GIF exercises all palette entries and code-size transitions.
  await page.goto(base+'/#editor/scanimation'); await page.reload(); await page.waitForTimeout(300);
  await page.locator('#actions button').first().click();
  await download(/动态预览/,'animation.gif');
  await page.screenshot({path:path.join(results,'export-mobile.png'),fullPage:true});
  await page.getByRole('button',{name:'关闭导出'}).click();
  await page.getByRole('button',{name:'向下',exact:true}).click();
  await page.locator('#actions button').first().click();
  await download(/透明光栅卡/,'mask-horizontal.png');
  await page.getByRole('button',{name:'关闭导出'}).click();
  // Known red/blue frames verify interleaving independently of the renderer.
  await page.goto(base+'/#editor/scanimation'); await page.reload();
  const fixtures=await page.evaluate(()=>['#ff0000','#0000ff'].map(color=>{const c=document.createElement('canvas');c.width=32;c.height=40;const g=c.getContext('2d');g.fillStyle=color;g.fillRect(0,0,32,40);return c.toDataURL('image/png').split(',')[1]}));
  await page.locator('#controls input[type=file]').setInputFiles(fixtures.map((data,i)=>({name:`frame-${i}.png`,mimeType:'image/png',buffer:Buffer.from(data,'base64')})));
  await page.waitForFunction(()=>document.getElementById('photoCount').textContent==='2 / 8');
  const pixels=()=>page.locator('#canvas').evaluate(c=>{const g=c.getContext('2d');return [[1,1],[5,1],[1,5]].map(([x,y])=>[...g.getImageData(x,y,1,1).data])});
  assert.deepEqual(await pixels(),[[255,0,0,255],[0,0,255,255],[255,0,0,255]]);
  await page.getByRole('button',{name:'向下',exact:true}).click();
  assert.deepEqual(await pixels(),[[255,0,0,255],[255,0,0,255],[0,0,255,255]]);
  const slugs=['scratch','tilt','typography','liquid','story','perspective','stereogram','folding','infinite','color'];
  for(const slug of slugs){await page.goto(base+'/#editor/'+slug);await page.waitForTimeout(150);assert.equal(await page.locator('#work').isVisible(),true);assert.ok(await page.locator('#actions button').count());await page.mouse.move(100,300);await page.mouse.down();await page.mouse.move(180,350,{steps:3});await page.mouse.up();}
  await page.goto(base);await page.getByRole('button',{name:'打开实验目录'}).click();assert.equal(await page.locator('.directory-entry').count(),11);await page.getByRole('button',{name:'搜索实验'}).click();await page.getByRole('searchbox').fill('光栅');assert.equal(await page.locator('.directory-entry:visible').count(),1);await page.getByRole('searchbox').fill('unmatched-xyz');assert.equal(await page.locator('.no-results').isVisible(),true);await page.waitForFunction(()=>document.getElementById('directoryCable').style.height==='0px');
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const route of ['#home','#experiment/scanimation','#experiments','#editor/scanimation']){await page.goto(base+'/'+route);await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width} ${route}`)} }
  await page.setViewportSize({width:1440,height:1000});await page.goto(base);await page.waitForTimeout(500);await page.screenshot({path:path.join(results,'home-desktop.png'),fullPage:true});
  const reduced = await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto(base+'/#experiment/scanimation');assert.equal(await reduced.locator('.intro-copy h1').evaluate(e=>getComputedStyle(e).animationName),'none');await reduced.close();
  assert.deepEqual(errors,[]);console.log('PASS: eleven routes, upload validation/reorder/remove, retained photos, drag/play, both directions, PNG/GIF downloads, dialogs, keyboard, reduced motion, and 320/390/768/1440 layouts.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
