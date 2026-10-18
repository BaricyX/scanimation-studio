/**
 * createComponentWithVariants
 *
 * Creates a component set by generating all combinations of `variantAxes`,
 * building one Figma component per combination, then calling
 * `figma.combineAsVariants` to produce the component set. After combining,
 * the variants are repositioned into a grid so they don't all stack at (0, 0).
 *
 * @param {{
 *   name: string,
 *   description?: string,
 *   variantAxes: Record<string, string[]>,
 *   baseProps: {
 *     width: number,
 *     height: number,
 *     fills?: Paint[],
 *     padding?: {top?: number, bottom?: number, left?: number, right?: number},
 *     radius?: number,
 *     layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE',
 *     itemSpacing?: number
 *   },
 *   page: PageNode
 * }} config
 *   - `name`: Component set name (e.g. "Button").
 *   - `description`: Optional human-readable purpose and usage guidance.
 *   - `variantAxes`: Each key is a variant property name; each value is an array of
 *     allowed values. All combinations are generated (Cartesian product).
 *     Example: { Size: ['Small', 'Medium', 'Large'], Style: ['Primary', 'Ghost'] }
 *     produces 6 variants.
 *   - `baseProps`: Visual properties applied to every variant.
 *   - `page`: The PageNode to create components on (must be set as current page by caller).
 * @returns {Promise<{
 *   componentSet: ComponentSetNode,
 *   variants: ComponentNode[]
 * }>}
 */
async function createComponentWithVariants(config) {
  const { name, variantAxes, baseProps, page } = config

  // Ensure we are on the correct page
  // Caller has already selected this page once.

  // Compute Cartesian product of variant axes
  const axisNames = Object.keys(variantAxes)
  const axisValues = axisNames.map((k) => variantAxes[k])
  const combinations = cartesianProduct(axisValues)

  // Build one component per combination
  const components = []
  for (const combo of combinations) {
    const comp = figma.createComponent()

    // Name: "Property=Value, Property=Value, ..."
    comp.name = axisNames.map((ax, i) => `${ax}=${combo[i]}`).join(', ')

    // Base geometry
    comp.resize(baseProps.width, baseProps.height)

    // Fills
    if (baseProps.fills !== undefined) {
      comp.fills = baseProps.fills
    } else {
      comp.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }]
    }

    // Corner radius
    if (baseProps.radius !== undefined) {
      comp.cornerRadius = baseProps.radius
    }

    // Auto-layout
    if (baseProps.layoutMode && baseProps.layoutMode !== 'NONE') {
      comp.layoutMode = baseProps.layoutMode
      comp.primaryAxisAlignItems = 'CENTER'
      comp.counterAxisAlignItems = 'CENTER'
      if (baseProps.itemSpacing !== undefined) {
        comp.itemSpacing = baseProps.itemSpacing
      }
    }

    // Padding
    if (baseProps.padding) {
      comp.paddingTop = baseProps.padding.top ?? 0
      comp.paddingBottom = baseProps.padding.bottom ?? 0
      comp.paddingLeft = baseProps.padding.left ?? 0
      comp.paddingRight = baseProps.padding.right ?? 0
    }

    page.appendChild(comp)
    components.push(comp)
  }

  // Combine into a component set
  const componentSet = figma.combineAsVariants(components, page)
  componentSet.name = name
  if (config.description) {
    componentSet.description = config.description
  }

  // Grid layout — variants stack at (0, 0) after combineAsVariants; reposition them.
  const GRID_GAP = 16
  const cols = Math.max(1, axisValues[axisValues.length - 1]?.length ?? 1)
  const variantWidth = baseProps.width
  const variantHeight = baseProps.height

  componentSet.children.forEach((variant, idx) => {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    variant.x = col * (variantWidth + GRID_GAP)
    variant.y = row * (variantHeight + GRID_GAP)
  })

  // Resize component set to wrap its children with padding
  const totalCols = Math.min(cols, combinations.length)
  const totalRows = Math.ceil(combinations.length / cols)
  const PADDING = 40
  componentSet.resize(
    totalCols * variantWidth + (totalCols - 1) * GRID_GAP + PADDING * 2,
    totalRows * variantHeight + (totalRows - 1) * GRID_GAP + PADDING * 2,
  )

  // Position component set at a safe canvas location
  componentSet.x = 480
  componentSet.y = 80

  return { componentSet, variants: componentSet.children }
}

/**
 * Computes the Cartesian product of multiple arrays.
 * cartesianProduct([[A, B], [1, 2]]) → [[A,1], [A,2], [B,1], [B,2]]
 *
 * @param {Array<string[]>} arrays
 * @returns {string[][]}
 */
function cartesianProduct(arrays) {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((combo) => curr.map((val) => [...combo, val])),
    [[]],
  )
}
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);
if(page.children.some(n=>n.name==='01 / 沉浸式首页'))throw Error('Screens already exist; use saved IDs.');
const created=[];const state=__STATE__;
const serif={family:'Noto Serif SC',style:'Light'},sans={family:'Noto Sans SC',style:'Regular'},latin={family:'Noto Serif',style:'Regular'};
for(const f of [serif,sans,latin])await figma.loadFontAsync(f);
const vars={};for(const [name,id] of Object.entries(state.variables))vars[name]=await figma.variables.getVariableByIdAsync(id);
const paint=(name,opacity=1)=>{let p={type:'SOLID',color:{r:.5,g:.5,b:.5},opacity};return figma.variables.setBoundVariableForPaint(p,'color',vars['theme/color/'+name])};
const remember=n=>{created.push(n.id);return n};
function rect(parent,name,x,y,w,h,color='surface',opacity=1){const n=remember(figma.createRectangle());parent.appendChild(n);n.name=name;n.x=x;n.y=y;n.resize(w,h);n.fills=[paint(color,opacity)];return n}
function frame(parent,name,x,y,w,h,color='bg'){const f=remember(figma.createFrame());parent.appendChild(f);f.name=name;f.x=x;f.y=y;f.resize(w,h);f.fills=color?[paint(color)]:[];return f}
function row(parent,name,x,y,w,h){const f=remember(figma.createAutoLayout('HORIZONTAL'));parent.appendChild(f);f.name=name;f.x=x;f.y=y;f.resize(w,h);f.fills=[];f.primaryAxisAlignItems='SPACE_BETWEEN';f.counterAxisAlignItems='CENTER';return f}
async function txt(parent,name,content,x,y,size=12,color='ink',font=sans,width=330,styleName='Body'){const t=remember(figma.createText());parent.appendChild(t);t.name=name;await t.setTextStyleIdAsync(state.styles[styleName]);t.fontName=font;t.fontSize=size;t.textAutoResize='HEIGHT';t.resize(width,Math.max(20,size*1.7));t.characters=content;t.lineHeight={unit:'PERCENT',value:155};t.fills=[paint(color)];t.x=x;t.y=y;return t}
function image(parent,name,x,y,w,h,hash=state.imageHash){const n=rect(parent,name,x,y,w,h);n.fills=[{type:'IMAGE',scaleMode:'FILL',imageHash:hash}];return n}
function svg(parent,name,source,x,y){const n=remember(figma.createNodeFromSvg(source));parent.appendChild(n);n.name=name;n.x=x;n.y=y;return n}
async function labelRow(parent,name,left,right,x,y,w=338){const r=row(parent,name,x,y,w,24);await txt(r,'Label',left,0,0,11,'ink',sans,w-100);await txt(r,'Value',right,0,0,9,'muted',sans,90,'Caption');return r}
function divider(parent,y,w=338,x=26){return rect(parent,'Divider',x,y,w,1,'line')}
async function header(parent){const h=row(parent,'Navigation / Header',26,15,338,40);await txt(h,'Wordmark','PLAYGROUND',0,0,19,'ink',latin,240,'Latin');svg(h,'Menu icon','<svg width="24" height="24" viewBox="0 0 24 24"><path d="M2 8h20M9 15h13" stroke="#cfced6" stroke-width="1"/></svg>',0,0);return h}
const buttonSet=await createComponentWithVariants({name:'PLAYGROUND / Primary action',description:'Capsule action. Text label is editable. States match primary-button in styles.css.',variantAxes:{State:['Default','Hover','Pressed','Disabled']},baseProps:{width:338,height:54,radius:50,layoutMode:'HORIZONTAL',padding:{left:24,right:24}},page});
created.push(buttonSet.componentSet.id,...buttonSet.variants.map(n=>n.id));buttonSet.componentSet.x=100;buttonSet.componentSet.y=1500;
const buttonLabelProperty=buttonSet.componentSet.addComponentProperty('Label','TEXT','开始创作');
for(const comp of buttonSet.variants){comp.fills=[paint('ink')];comp.setBoundVariable('cornerRadius',vars['radius/action']);comp.setBoundVariable('paddingLeft',vars['space/24']);comp.setBoundVariable('paddingRight',vars['space/24']);comp.opacity=comp.name.includes('Disabled')?.35:comp.name.includes('Pressed')?.8:1;const text=await txt(comp,'Label','开始创作',0,0,13,'bg',sans,245);text.componentPropertyReferences={characters:buttonLabelProperty};await txt(comp,'Arrow','↗',0,0,23,'bg',sans,22);comp.primaryAxisAlignItems='SPACE_BETWEEN'}
const mainButton=buttonSet.variants[0];
function button(parent,label,x,y){const b=remember(mainButton.createInstance());parent.appendChild(b);b.x=x;b.y=y;const labelNode=b.findOne(n=>n.type==='TEXT'&&n.name==='Label');labelNode.characters=label;return b}
const segmentSet=await createComponentWithVariants({name:'PLAYGROUND / Direction',description:'Scanimation stripe direction. Selected and unselected states.',variantAxes:{State:['Selected','Default']},baseProps:{width:164,height:35,layoutMode:'HORIZONTAL',radius:0},page});created.push(segmentSet.componentSet.id,...segmentSet.variants.map(n=>n.id));segmentSet.componentSet.x=100;segmentSet.componentSet.y=1690;
for(const comp of segmentSet.variants){comp.fills=[paint('surface')];if(comp.name.includes('Selected'))comp.fills=[{type:'SOLID',color:{r:.18,g:.16,b:.22}}];await txt(comp,'Label','竖向条纹',0,0,11,comp.name.includes('Selected')?'ink':'muted',sans,100)}
const card=remember(figma.createComponent());card.name='PLAYGROUND / Suspended artwork';page.appendChild(card);card.x=100;card.y=1850;card.resize(232,288);card.fills=[paint('surface',.75)];card.strokes=[paint('silver',.4)];card.strokeWeight=1;card.cornerRadius=3;card.setBoundVariable('cornerRadius',vars['radius/artwork']);card.clipsContent=false;card.description='Editable gallery card, separate optical artwork, metal hanger, title and secondary label.';
svg(card,'Metal ring','<svg width="16" height="29" viewBox="0 0 16 29"><ellipse cx="8" cy="12" rx="5.5" ry="11" stroke="#b4b4bd" stroke-width="1.2" fill="none"/><circle cx="8" cy="25.5" r="2.5" fill="#111114" stroke="#b4b4bd"/></svg>',108,-24);
image(card,'Artwork / Scanimation',8,8,216,207,'7fca13888f9cb3896109f1fa1c0af22bf34861fb');await txt(card,'Title','光栅动画',13,224,18,'ink',serif,170,'Title');await txt(card,'English','SCANIMATION',13,258,7,'muted',sans,170,'Caption');await txt(card,'Enter','↗',196,220,23,'silver',sans,25);
const headerComp=remember(figma.createComponent());headerComp.name='PLAYGROUND / Header';headerComp.description='Shared brand and experiment menu navigation.';headerComp.resize(390,68);headerComp.fills=[paint('bg')];headerComp.x=100;headerComp.y=2180;await header(headerComp);
function headerInstance(parent){const n=remember(headerComp.createInstance());parent.appendChild(n);n.x=0;n.y=0;return n}
const home=frame(page,'01 / 沉浸式首页',1750,200,390,844);home.clipsContent=true;headerInstance(home);
await txt(home,'Kicker','光 · 影 · 交互',30,99,8,'muted',sans,330,'Caption');const headline=await txt(home,'Main headline','把普通的图片\n变成会动的魔法。',30,132,31,'ink',serif,335,'Display');headline.letterSpacing={unit:'PIXELS',value:2};headline.lineHeight={unit:'PIXELS',value:47};const en=await txt(home,'English tagline','TURN ORDINARY PHOTOS\nINTO MOVING MAGIC.',30,241,8,'muted',sans,330,'Caption');en.letterSpacing={unit:'PIXELS',value:1.6};
svg(home,'Suspension cable','<svg width="390" height="100" viewBox="0 0 390 100"><path d="M-20 15 C55 55 99 70 190 48 C255 68 330 87 410 69" fill="none" stroke="#93939e" stroke-width="1"/></svg>',0,264);
const heroCard=remember(card.createInstance());home.appendChild(heroCard);heroCard.x=68;heroCard.y=340;heroCard.rotation=4;
const nextCard=remember(card.createInstance());home.appendChild(nextCard);nextCard.x=336;nextCard.y=354;nextCard.rotation=-5;nextCard.opacity=.42;nextCard.findOne(n=>n.type==='TEXT'&&n.name==='Title').characters='刮刮乐';nextCard.findOne(n=>n.type==='TEXT'&&n.name==='English').characters='SCRATCH ART';nextCard.findOne(n=>n.type==='RECTANGLE'&&n.name.startsWith('Artwork')).fills=[{type:'IMAGE',scaleMode:'FILL',imageHash:'0a12182e2f2763339743fa5eed1fc37cf4fc784a'}];
await txt(home,'Counter','01  / 11',28,752,12,'ink',sans,80);rect(home,'Progress track',104,763,66,1,'line');rect(home,'Progress position',104,763,6,1,'silver');await txt(home,'Browse previous','←',253,741,23,'ink',sans,24);await txt(home,'Swipe','滑动探索',282,754,8,'muted',sans,58,'Caption');await txt(home,'Browse next','→',345,741,23,'ink',sans,24);divider(home,795,334,28);await txt(home,'Footer left','AN EXPERIMENT IN SEEING.',28,811,6.5,'muted',sans,205,'Caption');await txt(home,'Footer right','随心玩，让灵感发生。',253,810,8,'muted',sans,117,'Caption');
const intro=frame(page,'02 / 光栅动画介绍',2210,200,390,874);intro.clipsContent=true;headerInstance(intro);
await txt(intro,'Back','←  探索',26,89,11,'silver',sans,90);await txt(intro,'Experiment index','实验 01 / 11',280,94,8,'muted',sans,84,'Caption');await txt(intro,'Kicker','THE ART OF MOVEMENT',26,151,8,'muted',sans,330,'Caption');await txt(intro,'Title','光栅动画',26,181,42,'ink',serif,338,'Display');await txt(intro,'English title','Scanimation',26,245,17,'muted',latin,330,'Latin');await txt(intro,'Description','两张图片，一次错位，\n让静止画面在移动中动起来。',26,286,11,'muted',sans,338);
const glass=frame(intro,'Artwork / Floating optical plate',47,370,296,354,'surface');glass.rotation=4;glass.strokes=[paint('silver',.5)];glass.strokeWeight=1;image(glass,'Photograph',8,8,280,338);const stripes=frame(glass,'Editable optical stripes',8,8,280,338,null);for(let x=0;x<280;x+=6)rect(stripes,'Stripe',x+2,0,4,338,'bg',.72);
const border=rect(intro,'Rear glass edge',48,366,296,354,'surface',.03);border.strokes=[paint('silver',.25)];border.strokeWeight=1;border.rotation=-4;intro.insertChild(8,border);
await txt(intro,'Artwork caption','STILL IMAGE. MOVING POSSIBILITIES.',52,733,6.5,'muted',sans,300,'Caption');const medium=await txt(intro,'Medium','摄影 × 光学 × 你的手指',26,773,9,'muted',sans,338,'Caption');medium.textAlignHorizontal='CENTER';const start=button(intro,'开始创作',26,805);
const editor=frame(page,'03 / 光栅动画编辑器',2670,200,390,1140);editor.clipsContent=true;editor.overflowDirection='VERTICAL';headerInstance(editor);
await txt(editor,'Back','←  返回',26,87,11,'silver',sans,90);await txt(editor,'Experiment index','实验 01 / 11',280,92,8,'muted',sans,84,'Caption');await txt(editor,'Title','光栅动画',26,129,26,'ink',serif,146,'Title');await txt(editor,'English title','Scanimation',165,143,11,'muted',latin,130,'Latin');await txt(editor,'Status','创作中 ·',320,146,8,'muted',sans,60,'Caption');
const preview=frame(editor,'Studio / Preview',26,184,338,380,'surface');preview.strokes=[paint('line')];await txt(preview,'Preview label','实时预览',15,10,7,'muted',sans,150,'Caption');await txt(preview,'Resolution','600 × 750',263,10,7,'muted',sans,70,'Caption');image(preview,'Interlaced artwork',45,33,248,310);const mask=frame(preview,'Optical mask / Editable stripes',45,33,248,310,null);for(let x=0;x<248;x+=6.6)rect(mask,'Stripe',x+1.65,0,4.95,310,'bg');
await txt(preview,'Play','▷',17,349,20,'silver',sans,25);rect(preview,'Timeline',58,362,215,2,'line');const knob=remember(figma.createEllipse());preview.appendChild(knob);knob.x=56;knob.y=358;knob.resize(9,9);knob.fills=[paint('silver')];await txt(preview,'Frame index','01 / 04',285,353,7,'muted',sans,44,'Caption');
await labelRow(editor,'Photos label','照片序列','示例 · 4 帧',27,584);
const thumbs=row(editor,'Photo sequence',27,618,336,77);thumbs.itemSpacing=8;thumbs.setBoundVariable('itemSpacing',vars['space/8']);for(let j=0;j<4;j++){const thumb=frame(thumbs,'Photo '+(j+1),0,0,78,77,'surface');image(thumb,'Photo',0,0,78,77);await txt(thumb,'Index','0'+(j+1),5,58,8,'ink',sans,35,'Caption')}
const upload=frame(editor,'Upload photos',27,705,336,38,'surface');upload.strokes=[paint('line')];upload.dashPattern=[3,3];const uploadText=await txt(upload,'Label','＋ 添加照片',0,8,10,'silver',sans,336);uploadText.textAlignHorizontal='CENTER';
await txt(editor,'Direction label','条纹方向',27,766,11,'silver',sans,336);const dir=row(editor,'Direction control',27,792,336,41);dir.fills=[paint('surface')];dir.strokes=[paint('line')];for(let j=0;j<2;j++){const instance=remember(segmentSet.variants[j].createInstance());dir.appendChild(instance);if(j===1)instance.findOne(n=>n.type==='TEXT').characters='横向条纹'}
await labelRow(editor,'Speed label','动画速度','0.5×',27,853);rect(editor,'Speed track',27,893,336,2,'line');const speed=remember(figma.createEllipse());editor.appendChild(speed);speed.x=81;speed.y=889;speed.resize(10,10);speed.fills=[paint('silver')];
for(const [label,y] of [['高级参数',926],['iPhone 相册适配',980]]){divider(editor,y);await labelRow(editor,label,label,'＋',27,y+12)}
const exportButton=button(editor,'导出作品',26,1065);
const exported=remember(editor.clone());page.appendChild(exported);exported.name='04 / 导出作品状态';exported.x=3130;exported.y=200;exported.resize(390,844);const dim=rect(exported,'Modal backdrop',0,0,390,844,'bg',.8);const sheet=frame(exported,'Export / Sheet',0,350,390,494,'surface');sheet.topLeftRadius=20;sheet.topRightRadius=20;sheet.strokes=[paint('line')];await txt(sheet,'Kicker','TAKE IT WITH YOU',29,24,8,'muted',sans,300,'Caption');await txt(sheet,'Title','导出作品',29,46,25,'ink',serif,290,'Title');const close=await txt(sheet,'Close','×',335,33,26,'silver',sans,30);for(const [j,title,sub] of [[0,'光栅底图','PNG · 600 × 750'],[1,'透明光栅卡','PNG · 透明背景'],[2,'动态预览','GIF · 360 × 450'],[3,'视频','MP4 / WebM · 根据浏览器']]){rect(sheet,'Divider',29,104+j*78,332,1,'line');await txt(sheet,'Format',title,31,119+j*78,13,'ink',sans,285);await txt(sheet,'Specification',sub,31,145+j*78,9,'muted',sans,285,'Caption');await txt(sheet,'Download','↓',334,118+j*78,23,'silver',sans,25)}await txt(sheet,'Size note','底图与光栅卡需以相同尺寸显示。',29,440,10,'muted',sans,330);
const foundation=frame(page,'00 / 颜色与文字规范',1750,1420,850,470,'surface');await txt(foundation,'Title','PLAYGROUND / Foundations',28,25,24,'ink',latin,790,'Latin');let col=0;for(const name of ['bg','surface','ink','muted','line','silver']){const swatch=rect(foundation,'Color / '+name,28+col*133,90,110,70,name);swatch.strokes=[paint('silver',.2)];await txt(foundation,'Token name','--'+name,28+col*133,170,10,'muted',sans,125);col++}await txt(foundation,'Display specimen','把普通的图片，变成会动的魔法。',28,228,30,'ink',serif,790,'Display');await txt(foundation,'Latin specimen','Turn ordinary photos into moving magic.',28,302,22,'muted',latin,790,'Latin');await txt(foundation,'UI specimen','移动端优先 · 26 px 边距 · 3 px 作品圆角 · 胶囊主操作',28,373,12,'muted',sans,790);
const states=frame(page,'05 / 交互状态',1750,1960,850,340,'surface');await txt(states,'Title','Interaction states',28,22,22,'ink',latin,790,'Latin');for(let j=0;j<4;j++){const b=remember(buttonSet.variants[j].createInstance());states.appendChild(b);b.x=28+(j%2)*390;b.y=80+Math.floor(j/2)*110;await txt(states,'State name',['Default','Hover','Pressed','Disabled'][j],b.x,b.y+60,9,'muted',sans,338,'Caption')}
await heroCard.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:intro.id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.35}}]}]);
await start.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:editor.id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.35}}]}]);
await exportButton.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:exported.id,navigation:'NAVIGATE',transition:{type:'DISSOLVE',easing:{type:'EASE_OUT'},duration:.25}}]}]);
await close.setReactionsAsync([{trigger:{type:'ON_CLICK'},actions:[{type:'NODE',destinationId:editor.id,navigation:'NAVIGATE',transition:null}]}]);
const capture=await figma.getNodeByIdAsync('3:2');if(capture)capture.remove();
return {createdNodeIds:page.findAll(()=>true).map(n=>n.id),mutatedNodeIds:[page.id],removedNodeIds:['3:2'],screens:[home,intro,editor,exported].map(n=>({id:n.id,name:n.name,width:n.width,height:n.height,textLayers:n.findAllWithCriteria({types:['TEXT']}).length,instances:n.findAllWithCriteria({types:['INSTANCE']}).length})),components:{button:buttonSet.componentSet.id,direction:segmentSet.componentSet.id,card:card.id,header:headerComp.id},reviewFrames:{foundations:foundation.id,states:states.id},errors:[]};
