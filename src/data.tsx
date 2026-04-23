// Mock data — templates, folders, blocks, variables, history, sections

const TEMPLATES = [
  { id:'t1', name:'Newsletter — Novedades de noviembre', folder:'Newsletter', updated:'hace 2 h', status:'Borrador', starred:true, variant:'newsletter', color:'#e8e7fe' },
  { id:'t2', name:'Gracias por tu compra', folder:'Agradecimientos', updated:'hace 1 d', status:'Publicado', starred:false, variant:'receipt', color:'#dce9f7' },
  { id:'t3', name:'Bienvenida — primer día', folder:'Bienvenida', updated:'hace 3 d', status:'Publicado', starred:true, variant:'welcome', color:'#ece3fc' },
  { id:'t4', name:'Promo de temporada — 40% off', folder:'Ventas y promos', updated:'hace 5 d', status:'Borrador', starred:false, variant:'promo', color:'#dde2fb' },
  { id:'t5', name:'Recordatorio de tu cita', folder:'Avisos', updated:'hace 1 sem', status:'Publicado', starred:false, variant:'receipt', color:'#e4eaf6' },
  { id:'t6', name:'¿Olvidaste algo en tu carrito?', folder:'Ventas y promos', updated:'hace 1 sem', status:'Borrador', starred:false, variant:'cart', color:'#e9e0f7' },
  { id:'t7', name:'¿Cómo estuvo nuestro servicio?', folder:'Encuestas', updated:'hace 2 sem', status:'Publicado', starred:false, variant:'survey', color:'#e3e3f5' },
  { id:'t8', name:'Aviso interno al equipo', folder:'Avisos', updated:'hace 2 sem', status:'Borrador', starred:false, variant:'internal', color:'#e8e5f3' },
];

const FOLDERS = [
  { id:'all', labelKey:'sidebar.folder.all', name:'Todas mis plantillas', icon:'mail', count:24 },
  { id:'starred', labelKey:'sidebar.folder.starred', name:'Mis favoritas', icon:'star', count:3 },
  { id:'recent', labelKey:'sidebar.folder.recent', name:'Usadas recientemente', icon:'clock', count:8 },
  { id:'shared', labelKey:'sidebar.folder.shared', name:'Compartidas conmigo', icon:'folder', count:5 },
  { id:'trash', labelKey:'sidebar.folder.trash', name:'Papelera', icon:'trash', count:0 },
];

const CATS = [
  { id:'welcome',     name:'Bienvenida',       count:3 },
  { id:'newsletter',  name:'Newsletters',      count:6 },
  { id:'promo',       name:'Ventas y promos',  count:8 },
  { id:'thanks',      name:'Agradecimientos',  count:4 },
  { id:'events',      name:'Eventos',          count:2 },
  { id:'announce',    name:'Avisos',           count:3 },
  { id:'surveys',     name:'Encuestas',        count:2 },
];

// Block catalogs. `name` is kept for backwards-compat (mostly logs + legacy
// filters); `nameKey` is the translation key that the UI should prefer.
const BLOCKS_BASIC = [
  { id:'text',    nameKey:'block.name.text',     name:'Texto',      icon:'type' },
  { id:'heading', nameKey:'block.name.heading',  name:'Título',     icon:'type' },
  { id:'image',   nameKey:'block.name.image',    name:'Imagen',     icon:'image' },
  { id:'icon',    nameKey:'block.name.icon',     name:'Icono',      icon:'sparkle' },
  { id:'button',  nameKey:'block.name.button',   name:'Botón',      icon:'button' },
  { id:'divider', nameKey:'block.name.divider',  name:'Divisor',    icon:'divider' },
  { id:'spacer',  nameKey:'block.name.spacer',   name:'Espaciador', icon:'spacer' },
];
const BLOCKS_LAYOUT = [
  { id:'section',  nameKey:'block.name.section',  name:'Sección',    icon:'hero' },
  { id:'columns2', nameKey:'block.name.columns2', name:'2 Columnas', icon:'columns' },
  { id:'columns3', nameKey:'block.name.columns3', name:'3 Columnas', icon:'grid' },
  { id:'hero',     nameKey:'block.name.hero',     name:'Hero',       icon:'hero' },
];
const BLOCKS_CONTENT = [
  { id:'header',      nameKey:'block.name.header',      name:'Cabecera',   icon:'layers' },
  { id:'footer',      nameKey:'block.name.footer',      name:'Footer',     icon:'footer' },
  { id:'cta',         nameKey:'block.name.cta',         name:'CTA',        icon:'send' },
  { id:'testimonial', nameKey:'block.name.testimonial', name:'Testimonio', icon:'heart' },
];
const BLOCKS_SOCIAL = [
  { id:'social', nameKey:'block.name.social', name:'Redes',     icon:'heart' },
  { id:'share',  nameKey:'block.name.share',  name:'Compartir', icon:'send' },
];
const BLOCKS_ECOM = [
  { id:'product', nameKey:'block.name.product', name:'Producto', icon:'product' },
  { id:'cart',    nameKey:'block.name.cart',    name:'Carrito',  icon:'product' },
  { id:'receipt', nameKey:'block.name.receipt', name:'Recibo',   icon:'product' },
];
const BLOCKS_MEDIA = [
  { id:'video',     nameKey:'block.name.video',     name:'Video / YouTube',  icon:'image' },
  { id:'gif',       nameKey:'block.name.gif',       name:'GIF animado',      icon:'image' },
  { id:'countdown', nameKey:'block.name.countdown', name:'Cuenta regresiva', icon:'clock' },
  { id:'map',       nameKey:'block.name.map',       name:'Mapa',             icon:'folder' },
  { id:'qr',        nameKey:'block.name.qr',        name:'Código QR',        icon:'grid' },
  { id:'signature', nameKey:'block.name.signature', name:'Firma personal',   icon:'user' },
];
const BLOCKS_ADV = [
  { id:'html',       nameKey:'block.name.html',       name:'HTML a la medida', icon:'code' },
  { id:'table',      nameKey:'block.name.table',      name:'Tabla de datos',   icon:'grid' },
  { id:'accordion',  nameKey:'block.name.accordion',  name:'Desplegable',      icon:'layers' },
  { id:'attachment', nameKey:'block.name.attachment', name:'Adjuntar archivo', icon:'upload' },
];

// Variables: etiquetas tipo {{nombre}} — human-friendly keys
const VARIABLES = [
  { key:'nombre',          label:'Nombre de la persona',      sample:'Carmen',              type:'texto' },
  { key:'correo',          label:'Su correo electrónico',     sample:'carmen@acme.com',     type:'correo' },
  { key:'empresa',          label:'Nombre de tu empresa',      sample:'Acme',                type:'texto' },
  { key:'pedido',          label:'Número de pedido',          sample:'#A-4821',             type:'texto' },
  { key:'total',           label:'Total de la compra',        sample:'$1,240 MXN',          type:'moneda' },
  { key:'articulos',       label:'Cantidad de artículos',     sample:'3 productos',         type:'número' },
  { key:'fecha_hoy',       label:'Fecha de hoy',              sample:'14 de noviembre',     type:'fecha' },
  { key:'dia_semana',      label:'Día de la semana',          sample:'martes',              type:'texto' },
  { key:'mes_actual',      label:'Nombre del mes',            sample:'noviembre',           type:'texto' },
  { key:'link_navegador',  label:'Ver este correo en navegador', sample:'https://…',       type:'enlace' },
  { key:'link_preferencias', label:'Cambiar preferencias',    sample:'https://…',           type:'enlace' },
  { key:'link_baja',       label:'Darse de baja',             sample:'https://…',           type:'enlace' },
];

const HISTORY = [
  { id:'v12', label:'Lo que estás viendo ahora',     ts:'Hoy, 14:32',      author:'Tú',         current:true },
  { id:'v11', label:'Cambié el título de la portada',ts:'Hoy, 12:05',      author:'Tú' },
  { id:'v10', label:'Cambié el texto del botón',     ts:'Ayer, 17:22',     author:'Daniela V.' },
  { id:'v9',  label:'Arreglé el nombre del cliente', ts:'Ayer, 16:48',     author:'Tú' },
  { id:'v8',  label:'Reemplacé la foto de portada',  ts:'hace 2 d, 09:14', author:'Miguel R.' },
  { id:'v7',  label:'Primera versión guardada',      ts:'hace 3 d, 11:00', author:'Tú' },
];

// ===== SECTION-BASED DOCUMENT =====
// A section has: id, name, layout, style (bg/text/padding/font), columns[]
// Each column has: width% + blocks[]
// Blocks are atomic: type + data + override-style

// Section style is Beefree-shaped:
//   outerBg / outerPadY → the full-width "wall" around the section (what fills
//                          the inbox viewport behind it). `transparent` = none.
//   bg / padding         → the inner content card (max `width` wide, centered
//                          inside the outer band).
//   width                → content width of THIS section (per-row, not global).
//
// Optional responsive/extra fields (all backward-compat — may be undefined):
//   border        → {w, style, color, sides?: {top,right,bottom,left}} for
//                   content-card border (if sides is set, per-side widths).
//   radius        → number (content-card border-radius all corners).
//   radiusCorners → {tl, tr, br, bl} when per-corner radius differs.
//   vAlign        → 'top' | 'middle' | 'bottom' (vertical align of columns).
//   bgImage       → url of content-card background image.
//   bgImagePosition, bgImageRepeat, bgImageSize → CSS passthrough.
//   stackOnMobile → boolean (default true) — stack columns on mobile.
const defaultSectionStyle = (over = {}) => ({
  bg: '#ffffff',
  text: '#1a1a17',
  padding: 32,
  font: 'inter',
  align: 'left',
  outerBg: 'transparent',
  outerPadY: 0,
  width: 600,
  ...over,
});

// Column style shape. All fields optional; column.style may be undefined on
// legacy docs (pre-R2) and renderers must degrade gracefully. Separate from
// block style so column-level bg/padding/border doesn't leak into blocks.
const defaultColumnStyle = (over = {}) => ({
  bg: 'transparent',
  padding: 0,
  // border: {w, style, color, sides?}
  // align: 'left' | 'center' | 'right'
  ...over,
});

const DEFAULT_SECTIONS = [
  {
    id:'s1', name:'Cabecera',
    layout:'1col',
    style: defaultSectionStyle({ bg:'#ffffff', padding:18 }),
    columns:[
      { w:100, blocks:[
        { id:'b1', type:'header' }
      ]}
    ]
  },
  {
    id:'s2', name:'Hero de bienvenida',
    layout:'1col',
    style: defaultSectionStyle({ bg:'#e8e7fe', text:'#1b1547', padding:48, align:'center', font:'inter-tight' }),
    columns:[
      { w:100, blocks:[
        { id:'b2', type:'hero', data:{
          heading:'Hola, {{nombre}} 👋',
          body:'Gracias por ser parte de {{empresa}}. Esto es lo nuevo de este mes.',
        }}
      ]}
    ]
  },
  {
    id:'s3', name:'Imagen + texto',
    layout:'2col',
    style: defaultSectionStyle({ bg:'#ffffff', padding:28 }),
    columns:[
      { w:50, blocks:[
        { id:'b3', type:'image' }
      ]},
      { w:50, blocks:[
        { id:'b4', type:'heading', data:{ text:'Novedades del mes' } },
        { id:'b5', type:'text', data:{ body:'Tenemos 3 cosas nuevas que creemos te van a encantar.' } },
        { id:'b6', type:'button', data:{ label:'Ver novedades', url:'#' } }
      ]}
    ]
  },
  {
    id:'s4', name:'Productos destacados',
    layout:'2col',
    style: defaultSectionStyle({ bg:'#f5f6fb', padding:28 }),
    columns:[
      { w:50, blocks:[
        { id:'b7', type:'product', data:{ name:'Taza cerámica', price:'$380 MXN' } }
      ]},
      { w:50, blocks:[
        { id:'b8', type:'product', data:{ name:'Cuaderno A5', price:'$220 MXN' } }
      ]}
    ]
  },
  {
    id:'s5', name:'Footer',
    layout:'1col',
    style: defaultSectionStyle({ bg:'#f3f1fa', text:'#6a6a8a', padding:24, align:'center' }),
    columns:[
      { w:100, blocks:[
        { id:'b9', type:'footer' }
      ]}
    ]
  },
];

const BLANK_SECTIONS = [
  {
    id:'s1', name:'Sección vacía',
    layout:'1col',
    style: defaultSectionStyle({ padding:40 }),
    columns:[
      { w:100, blocks:[] }
    ]
  }
];

const DEFAULT_DOC = { sections: DEFAULT_SECTIONS };
const BLANK_DOC   = { sections: BLANK_SECTIONS };

// Preset section templates (for "Añadir sección") — descriptive names
const SECTION_PRESETS = [
  { id:'p-blank',      nameKey:'section.preset.blank',    name:'Empezar en blanco',       layout:'1col', preview:'blank' },
  { id:'p-hero',       nameKey:'section.preset.hero',     name:'Portada con saludo',      layout:'1col', preview:'hero' },
  { id:'p-2col',       nameKey:'section.preset.2col',     name:'Dos bloques lado a lado', layout:'2col', preview:'2col' },
  { id:'p-3col',       nameKey:'section.preset.3col',     name:'Tres beneficios',         layout:'3col', preview:'3col' },
  { id:'p-cta',        nameKey:'section.preset.cta',      name:'Botón grande centrado',   layout:'1col', preview:'cta' },
  { id:'p-image-text', nameKey:'section.preset.imgtext',  name:'Texto junto a imagen',    layout:'2col', preview:'imgtext' },
  { id:'p-product',    nameKey:'section.preset.products', name:'Dos productos',           layout:'2col', preview:'products' },
  { id:'p-footer',     nameKey:'section.preset.footer',   name:'Pie de página',           layout:'1col', preview:'footer' },
];

const SECTION_STYLE_PRESETS = [
  { id:'clean',    name:'Claro',      bg:'#ffffff', text:'#1a1a17' },
  { id:'soft',     name:'Suave',      bg:'#f5f6fb', text:'#1a1a17' },
  { id:'accent',   name:'Acento',     bg:'#e8e7fe', text:'#1b1547' },
  { id:'violet',   name:'Violeta',    bg:'#ece3fc', text:'#2b1a52' },
  { id:'dark',     name:'Oscuro',     bg:'#15172a', text:'#ffffff' },
  { id:'gradient', name:'Degradado',  bg:'linear-gradient(135deg,#5b5bf0,#8257e6)', text:'#ffffff' },
];

const FONT_OPTIONS = [
  { id:'inter',        label:'Inter',         css:'Inter, system-ui, sans-serif' },
  { id:'inter-tight',  label:'Inter Tight',   css:'"Inter Tight", sans-serif' },
  { id:'instrument',   label:'Instrument Serif', css:'"Instrument Serif", Georgia, serif' },
  { id:'georgia',      label:'Georgia',       css:'Georgia, serif' },
  { id:'arial',        label:'Arial',         css:'Arial, sans-serif' },
  { id:'helvetica',    label:'Helvetica',     css:'Helvetica, Arial, sans-serif' },
  { id:'courier',      label:'Courier',       css:'"Courier New", monospace' },
];

Object.assign(window, {
  TEMPLATES, FOLDERS, CATS,
  BLOCKS_BASIC, BLOCKS_LAYOUT, BLOCKS_CONTENT, BLOCKS_SOCIAL, BLOCKS_ECOM, BLOCKS_MEDIA, BLOCKS_ADV,
  VARIABLES, HISTORY, DEFAULT_DOC, BLANK_DOC,
  SECTION_PRESETS, SECTION_STYLE_PRESETS, FONT_OPTIONS, defaultSectionStyle,
  defaultColumnStyle,
});
