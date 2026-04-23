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
  { id:'all', name:'Todas mis plantillas', icon:'mail', count:24 },
  { id:'starred', name:'Mis favoritas', icon:'star', count:3 },
  { id:'recent', name:'Usadas recientemente', icon:'clock', count:8 },
  { id:'shared', name:'Compartidas conmigo', icon:'folder', count:5 },
  { id:'trash', name:'Papelera', icon:'trash', count:0 },
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

const BLOCKS_BASIC = [
  { id:'text', name:'Texto', icon:'type' },
  { id:'heading', name:'Título', icon:'type' },
  { id:'image', name:'Imagen', icon:'image' },
  { id:'icon', name:'Icono', icon:'sparkle' },
  { id:'button', name:'Botón', icon:'button' },
  { id:'divider', name:'Divisor', icon:'divider' },
  { id:'spacer', name:'Espaciador', icon:'spacer' },
];
const BLOCKS_LAYOUT = [
  { id:'section', name:'Sección', icon:'hero' },
  { id:'columns2', name:'2 Columnas', icon:'columns' },
  { id:'columns3', name:'3 Columnas', icon:'grid' },
  { id:'hero', name:'Hero', icon:'hero' },
];
const BLOCKS_CONTENT = [
  { id:'header', name:'Cabecera', icon:'layers' },
  { id:'footer', name:'Footer', icon:'footer' },
  { id:'cta', name:'CTA', icon:'send' },
  { id:'testimonial', name:'Testimonio', icon:'heart' },
];
const BLOCKS_SOCIAL = [
  { id:'social', name:'Redes', icon:'heart' },
  { id:'share', name:'Compartir', icon:'send' },
];
const BLOCKS_ECOM = [
  { id:'product', name:'Producto', icon:'product' },
  { id:'cart', name:'Carrito', icon:'product' },
  { id:'receipt', name:'Recibo', icon:'product' },
];
const BLOCKS_MEDIA = [
  { id:'video',     name:'Video / YouTube',  icon:'image' },
  { id:'gif',       name:'GIF animado',      icon:'image' },
  { id:'countdown', name:'Cuenta regresiva', icon:'clock' },
  { id:'map',       name:'Mapa',             icon:'folder' },
  { id:'qr',        name:'Código QR',        icon:'grid' },
  { id:'signature', name:'Firma personal',   icon:'user' },
];
const BLOCKS_ADV = [
  { id:'html',      name:'HTML a la medida', icon:'code' },
  { id:'table',     name:'Tabla de datos',   icon:'grid' },
  { id:'accordion', name:'Desplegable',      icon:'layers' },
  { id:'attachment',name:'Adjuntar archivo', icon:'upload' },
];

const SAVED_BLOCKS = [
  { id:'sb1', name:'Mi firma con foto',        kind:'signature', usedIn:12 },
  { id:'sb2', name:'Footer legal con dirección', kind:'footer',  usedIn:24 },
  { id:'sb3', name:'Mi header con logo',       kind:'header',    usedIn:18 },
  { id:'sb4', name:'Botón grande — reservar',  kind:'cta',       usedIn:9  },
  { id:'sb5', name:'Mis redes sociales',       kind:'social',    usedIn:21 },
  { id:'sb6', name:'Reseña de cliente',        kind:'testimonial', usedIn:3 },
  { id:'sb7', name:'Dos productos destacados', kind:'product',   usedIn:7  },
  { id:'sb8', name:'Banner de oferta 40%',     kind:'cta',       usedIn:4  },
  { id:'sb9', name:'Link a agendar (Calendly)',kind:'cta',       usedIn:6  },
  { id:'sb10',name:'Aviso legal corto',        kind:'footer',    usedIn:14 },
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

const defaultSectionStyle = (over = {}) => ({
  bg: '#ffffff',
  text: '#1a1a17',
  padding: 32,
  font: 'inter',
  align: 'left',
  ...over,
});

const DEFAULT_DOC = [
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

const BLANK_DOC = [
  {
    id:'s1', name:'Sección vacía',
    layout:'1col',
    style: defaultSectionStyle({ padding:40 }),
    columns:[
      { w:100, blocks:[] }
    ]
  }
];

// Preset section templates (for "Añadir sección") — descriptive names
const SECTION_PRESETS = [
  { id:'p-blank',      name:'Empezar en blanco',      layout:'1col', preview:'blank' },
  { id:'p-hero',       name:'Portada con saludo',     layout:'1col', preview:'hero' },
  { id:'p-2col',       name:'Dos bloques lado a lado',layout:'2col', preview:'2col' },
  { id:'p-3col',       name:'Tres beneficios',        layout:'3col', preview:'3col' },
  { id:'p-cta',        name:'Botón grande centrado',  layout:'1col', preview:'cta' },
  { id:'p-image-text', name:'Texto junto a imagen',   layout:'2col', preview:'imgtext' },
  { id:'p-product',    name:'Dos productos',          layout:'2col', preview:'products' },
  { id:'p-footer',     name:'Pie de página',          layout:'1col', preview:'footer' },
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
  SAVED_BLOCKS, VARIABLES, HISTORY, DEFAULT_DOC, BLANK_DOC,
  SECTION_PRESETS, SECTION_STYLE_PRESETS, FONT_OPTIONS, defaultSectionStyle,
});
