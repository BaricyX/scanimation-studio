/**
 * createVariableCollection
 *
 * Creates a new Figma variable collection with the specified name and modes.
 * If `modeNames` has more than one entry, the first mode is renamed from
 * Figma's default "Mode 1" to the first name, and additional modes are added.
 *
 * @param {string} name - The display name of the collection (e.g. "Color", "Spacing").
 * @param {string[]} modeNames - Ordered list of mode names (e.g. ["Light", "Dark"] or ["Value"]).
 * @returns {Promise<{
 *   collection: VariableCollection,
 *   modeIds: Record<string, string>
 * }>}
 *   `modeIds` maps each mode name to its modeId string.
 */
async function createVariableCollection(name, modeNames) {
  if (!modeNames || modeNames.length === 0) {
    throw new Error('createVariableCollection: modeNames must have at least one entry.')
  }

  // Create the collection — Figma always creates it with one mode named "Mode 1".
  const collection = figma.variables.createVariableCollection(name)

  // modeIds accumulator
  const modeIds = {}

  // Rename the default first mode
  const defaultMode = collection.modes[0]
  collection.renameMode(defaultMode.modeId, modeNames[0])
  modeIds[modeNames[0]] = defaultMode.modeId

  // Add additional modes
  for (let i = 1; i < modeNames.length; i++) {
    const newModeId = collection.addMode(modeNames[i])
    modeIds[modeNames[i]] = newModeId
  }

  return { collection, modeIds }
}

/**
 * createSemanticTokens
 *
 * Creates a batch of Figma variables in the given collection, one per entry in
 * `tokenMap`. Supports raw values, variable alias references, code syntax, and
 * scopes. Returns a map of token name → Variable for use in subsequent steps.
 *
 * @param {VariableCollection} collection - The target variable collection.
 * @param {Record<string, string>} modeIds - Map of {modeName: modeId} from createVariableCollection.
 * @param {Array<{
 *   name: string,
 *   type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN' | 'TIMING' | 'EASING',
 *   values: Record<string, string | number | boolean | MotionEasing | {type: 'VARIABLE_ALIAS', id: string}>,
 *   scopes?: VariableScope[],
 *   codeSyntax?: {WEB?: string, ANDROID?: string, iOS?: string}
 * }>} tokenMap - Ordered list of token definitions.
 *   - `name`: Variable name using slash hierarchy (e.g. "color/bg/primary").
 *   - `type`: Figma variable type.
 *   - `values`: Map of {modeName: value}. Values can be raw (hex string for COLOR,
 *     number for FLOAT) or alias objects {type: 'VARIABLE_ALIAS', id: variableId}.
 *     For COLOR, raw values are accepted as hex strings ("#rrggbb" or "#rrggbbaa")
 *     and converted to {r, g, b, a} automatically.
 *   - `scopes`: Array of VariableScope strings. Omit to use [] (hidden/primitive).
 *   - `codeSyntax`: Platform code syntax strings. Omit to skip.
 * @returns {Promise<{variables: Record<string, Variable>}>}
 *   `variables` maps each token name to its created Variable object.
 */
async function createSemanticTokens(collection, modeIds, tokenMap) {
  const variables = {}

  for (const token of tokenMap) {
    // Create the variable
    const variable = figma.variables.createVariable(token.name, collection, token.type)

    // Set values for each mode
    for (const [modeName, rawValue] of Object.entries(token.values)) {
      const modeId = modeIds[modeName]
      if (!modeId) {
        throw new Error(
          `createSemanticTokens: mode "${modeName}" not found in modeIds for token "${token.name}". ` +
            `Available modes: ${Object.keys(modeIds).join(', ')}`,
        )
      }

      let value = rawValue

      // Convert hex strings to Figma RGBA for COLOR type
      if (token.type === 'COLOR' && typeof rawValue === 'string' && rawValue.startsWith('#')) {
        value = hexToFigmaColor(rawValue)
      }

      variable.setValueForMode(modeId, value)
    }

    // Set scopes (default: empty array = hidden from property pickers / primitives)
    variable.scopes = token.scopes || []

    // Set code syntax per platform
    if (token.codeSyntax) {
      if (token.codeSyntax.WEB) {
        variable.setVariableCodeSyntax('WEB', token.codeSyntax.WEB)
      }
      if (token.codeSyntax.ANDROID) {
        variable.setVariableCodeSyntax('ANDROID', token.codeSyntax.ANDROID)
      }
      if (token.codeSyntax.iOS) {
        variable.setVariableCodeSyntax('iOS', token.codeSyntax.iOS)
      }
    }

    variables[token.name] = variable
  }

  return { variables }
}

/**
 * Converts a hex color string to a Figma RGBA object.
 * Supports "#rgb", "#rrggbb", and "#rrggbbaa".
 *
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
function hexToFigmaColor(hex) {
  let h = hex.replace('#', '')

  // Expand shorthand #rgb → #rrggbb
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }

  const r = parseInt(h.substring(0, 2), 16) / 255
  const g = parseInt(h.substring(2, 4), 16) / 255
  const b = parseInt(h.substring(4, 6), 16) / 255
  const a = h.length === 8 ? parseInt(h.substring(6, 8), 16) / 255 : 1

  return { r, g, b, a }
}
const page=await figma.getNodeByIdAsync('0:1');await figma.setCurrentPageAsync(page);page.name='PLAYGROUND / Phase 01';
const existing=await figma.variables.getLocalVariableCollectionsAsync();if(existing.some(c=>c.name==='PLAYGROUND / Primitives'))throw new Error('Foundations already exist. Reuse IDs from the state ledger.');
const prim=await createVariableCollection('PLAYGROUND / Primitives',['Default']);
const sem=await createVariableCollection('PLAYGROUND / Theme',['Dark']);
const palette={bg:'#050506',surface:'#111114',ink:'#efedf0',muted:'#96949f',line:'#2d2d33',silver:'#cfced6'};
const primitives=await createSemanticTokens(prim.collection,prim.modeIds,Object.entries(palette).map(([name,value])=>({name:'color/'+name,type:'COLOR',values:{Default:value},scopes:[],codeSyntax:{WEB:`var(--${name})`}})));
const colors=await createSemanticTokens(sem.collection,sem.modeIds,Object.keys(palette).map(name=>({name:'color/'+name,type:'COLOR',values:{Dark:{type:'VARIABLE_ALIAS',id:primitives.variables['color/'+name].id}},scopes:name==='line'?['STROKE_COLOR']:name==='ink'||name==='muted'?['TEXT_FILL','SHAPE_FILL']:['FRAME_FILL','SHAPE_FILL','STROKE_COLOR'],codeSyntax:{WEB:`var(--${name})`}})));
const spacing=await createSemanticTokens(sem.collection,sem.modeIds,[8,12,16,24,26,32,48].map(value=>({name:'space/'+value,type:'FLOAT',values:{Dark:value},scopes:['GAP'],codeSyntax:{WEB:`var(--space-${value})`}})).concat([{name:'radius/artwork',type:'FLOAT',values:{Dark:3},scopes:['CORNER_RADIUS'],codeSyntax:{WEB:'var(--radius-artwork)'}},{name:'radius/action',type:'FLOAT',values:{Dark:50},scopes:['CORNER_RADIUS'],codeSyntax:{WEB:'var(--radius-action)'}}]));
const fontNames=[{family:'Noto Serif SC',style:'Light'},{family:'Noto Sans SC',style:'Regular'},{family:'Noto Serif',style:'Regular'}];for(const font of fontNames)await figma.loadFontAsync(font);
const styles={};for(const [name,font,size,lineHeight] of [['Display',fontNames[0],40,60],['Title',fontNames[0],26,38],['Body',fontNames[1],12,20],['Caption',fontNames[1],9,15],['Latin',fontNames[2],18,28]]){const st=figma.createTextStyle();st.name='PLAYGROUND / '+name;st.fontName=font;st.fontSize=size;st.lineHeight={unit:'PIXELS',value:lineHeight};styles[name]=st.id}
const bytes=Uint8Array.from(__CAT_BYTES__);const image=figma.createImage(bytes);
return {createdNodeIds:[],mutatedNodeIds:[page.id],collections:{primitives:prim.collection.id,theme:sem.collection.id},variables:Object.fromEntries([...Object.entries(primitives.variables),...Object.entries(colors.variables).map(([k,v])=>['theme/'+k,v]),...Object.entries(spacing.variables)].map(([k,v])=>[k,v.id])),styles,imageHash:image.hash,pageId:page.id};
