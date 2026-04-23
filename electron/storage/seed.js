const crypto = require('crypto');
const workspaces = require('./workspaces');
const templates = require('./templates');
const settings = require('./settings');

// First-boot seed: creates the default workspace and populates it with example
// templates so the user lands on a non-empty dashboard. Each variant gets its
// own starter doc so the 8 seeded templates feel distinct. Idempotent — runs
// only when no workspaces exist.

function style(over = {}) {
  return {
    bg: '#ffffff', text: '#1a1a17', padding: 32,
    font: 'inter', align: 'left',
    ...over,
  };
}

function sec(id, name, layout, over, blocks) {
  return { id, name, layout, style: style(over), columns: blocks };
}

// ─── Per-variant starter docs ────────────────────────────────────

function docNewsletter() {
  return { sections: [
    sec('s1', 'Cabecera', '1col', { bg:'#ffffff', padding:18 }, [
      { w:100, blocks:[{ id:'b1', type:'header' }] }
    ]),
    sec('s2', 'Hero', '1col', { bg:'#e8e7fe', text:'#1b1547', padding:48, font:'inter-tight', align:'center' }, [
      { w:100, blocks:[
        { id:'b2', type:'hero', data:{ heading:'Novedades de noviembre', body:'Todo lo que hicimos este mes, en 5 minutos de lectura.' } }
      ]}
    ]),
    sec('s3', 'Artículo 1', '2col', { padding:28 }, [
      { w:50, blocks:[{ id:'b3', type:'image' }] },
      { w:50, blocks:[
        { id:'b4', type:'heading', data:{ text:'Lo más leído este mes' } },
        { id:'b5', type:'text', data:{ body:'Un resumen de lo que nuestros lectores compartieron más veces. Spoiler: tiene que ver con productividad.' } },
        { id:'b6', type:'button', data:{ label:'Leer el artículo', url:'#' } }
      ]}
    ]),
    sec('s4', 'Footer', '1col', { bg:'#f3f1fa', text:'#6a6a8a', padding:24, align:'center' }, [
      { w:100, blocks:[{ id:'b7', type:'footer' }] }
    ]),
  ]};
}

function docReceipt() {
  return { sections: [
    sec('s1', 'Cabecera', '1col', { padding:18 }, [
      { w:100, blocks:[{ id:'b1', type:'header' }] }
    ]),
    sec('s2', 'Gracias', '1col', { bg:'#dce9f7', text:'#0e2a4a', padding:40, align:'center', font:'inter-tight' }, [
      { w:100, blocks:[
        { id:'b2', type:'heading', data:{ text:'¡Gracias por tu compra, {{nombre}}!' } },
        { id:'b3', type:'text', data:{ body:'Tu pedido {{pedido}} está confirmado. Te avisamos en cuanto salga a camino.' } }
      ]}
    ]),
    sec('s3', 'Resumen', '1col', { padding:28 }, [
      { w:100, blocks:[
        { id:'b4', type:'heading', data:{ text:'Resumen de tu pedido' } },
        { id:'b5', type:'product', data:{ name:'Taza cerámica "Luna"', price:'$380 MXN' } },
        { id:'b6', type:'product', data:{ name:'Cuaderno A5', price:'$220 MXN' } },
        { id:'b7', type:'divider' },
        { id:'b8', type:'text', data:{ body:'Total: $600 MXN · Envío incluido' } }
      ]}
    ]),
    sec('s4', 'Footer', '1col', { bg:'#f5f6fb', text:'#6a6a8a', padding:24, align:'center' }, [
      { w:100, blocks:[{ id:'b9', type:'footer' }] }
    ]),
  ]};
}

function docWelcome() {
  return { sections: [
    sec('s1', 'Hero', '1col', { bg:'#ece3fc', text:'#2b1a52', padding:56, align:'center', font:'inter-tight' }, [
      { w:100, blocks:[
        { id:'b1', type:'hero', data:{ heading:'¡Bienvenida a bordo, {{nombre}}!', body:'Estamos felices de tenerte. Aquí están los 3 primeros pasos para que saques provecho desde el día uno.' } }
      ]}
    ]),
    sec('s2', 'Pasos', '1col', { padding:28 }, [
      { w:100, blocks:[
        { id:'b2', type:'heading', data:{ text:'Empezá por aquí' } },
        { id:'b3', type:'text', data:{ body:'1. Completa tu perfil · 2. Conoce al equipo · 3. Crea tu primer proyecto.' } },
        { id:'b4', type:'button', data:{ label:'Completar mi perfil', url:'#' } }
      ]}
    ]),
    sec('s3', 'Footer', '1col', { bg:'#f5f6fb', text:'#6a6a8a', padding:24, align:'center' }, [
      { w:100, blocks:[{ id:'b5', type:'footer' }] }
    ]),
  ]};
}

function docPromo() {
  return { sections: [
    sec('s1', 'Banner', '1col', { bg:'#dde2fb', text:'#1b1547', padding:48, align:'center', font:'inter-tight' }, [
      { w:100, blocks:[
        { id:'b1', type:'heading', data:{ text:'40% OFF por tiempo limitado' } },
        { id:'b2', type:'text', data:{ body:'Solo esta semana — usa el código NOV40 al pagar.' } },
        { id:'b3', type:'button', data:{ label:'Comprar ahora', url:'#' } }
      ]}
    ]),
    sec('s2', 'Productos', '2col', { padding:28 }, [
      { w:50, blocks:[{ id:'b4', type:'product', data:{ name:'Taza cerámica', price:'$228 MXN' } }] },
      { w:50, blocks:[{ id:'b5', type:'product', data:{ name:'Cuaderno A5',  price:'$132 MXN' } }] }
    ]),
    sec('s3', 'Footer', '1col', { bg:'#f5f6fb', text:'#6a6a8a', padding:24, align:'center' }, [
      { w:100, blocks:[{ id:'b6', type:'footer' }] }
    ]),
  ]};
}

function docCart() {
  return { sections: [
    sec('s1', 'Cabecera', '1col', { padding:18 }, [
      { w:100, blocks:[{ id:'b1', type:'header' }] }
    ]),
    sec('s2', 'Recordatorio', '1col', { bg:'#e9e0f7', text:'#2b1a52', padding:40, align:'center' }, [
      { w:100, blocks:[
        { id:'b2', type:'heading', data:{ text:'Te dejaste algo en el carrito, {{nombre}}' } },
        { id:'b3', type:'text', data:{ body:'Te los guardamos por 24 horas. Si lo necesitás, completá la compra antes de que se agoten.' } }
      ]}
    ]),
    sec('s3', 'Artículos', '1col', { padding:28 }, [
      { w:100, blocks:[
        { id:'b4', type:'product', data:{ name:'Taza "Luna"',     price:'$380 MXN' } },
        { id:'b5', type:'product', data:{ name:'Cuaderno "Campos"', price:'$220 MXN' } },
        { id:'b6', type:'button', data:{ label:'Completar compra', url:'#' } }
      ]}
    ]),
    sec('s4', 'Footer', '1col', { bg:'#f5f6fb', text:'#6a6a8a', padding:24, align:'center' }, [
      { w:100, blocks:[{ id:'b7', type:'footer' }] }
    ]),
  ]};
}

function docSurvey() {
  return { sections: [
    sec('s1', 'Hero', '1col', { bg:'#e3e3f5', text:'#1b1547', padding:48, align:'center', font:'inter-tight' }, [
      { w:100, blocks:[
        { id:'b1', type:'heading', data:{ text:'¿Cómo estuvo nuestro servicio?' } },
        { id:'b2', type:'text', data:{ body:'Dos minutos de tu tiempo nos ayudan a mejorar todo lo que hacemos.' } }
      ]}
    ]),
    sec('s2', 'CTA', '1col', { padding:28, align:'center' }, [
      { w:100, blocks:[
        { id:'b3', type:'text', data:{ body:'Puntúa tu experiencia del 1 al 5, y si querés, déjanos un comentario.' } },
        { id:'b4', type:'button', data:{ label:'Responder la encuesta', url:'#' } }
      ]}
    ]),
    sec('s3', 'Footer', '1col', { bg:'#f5f6fb', text:'#6a6a8a', padding:24, align:'center' }, [
      { w:100, blocks:[{ id:'b5', type:'footer' }] }
    ]),
  ]};
}

function docInternal() {
  return { sections: [
    sec('s1', 'Aviso', '1col', { bg:'#e8e5f3', text:'#1b1547', padding:40 }, [
      { w:100, blocks:[
        { id:'b1', type:'heading', data:{ text:'Reunión trimestral — este jueves a las 10:00' } },
        { id:'b2', type:'text', data:{ body:'Nos vemos en la sala grande. Traigan sus laptops — habrá un ejercicio rápido y café para todos.' } }
      ]}
    ]),
    sec('s2', 'Detalles', '1col', { padding:24 }, [
      { w:100, blocks:[
        { id:'b3', type:'text', data:{ body:'· Jueves 14 · 10:00 a 12:00 · Sala Norte · Revisamos Q4 y alineamos Q1.' } },
        { id:'b4', type:'button', data:{ label:'Confirmar asistencia', url:'#' } }
      ]}
    ]),
  ]};
}

function docForVariant(variant) {
  switch (variant) {
    case 'receipt':    return docReceipt();
    case 'welcome':    return docWelcome();
    case 'promo':      return docPromo();
    case 'cart':       return docCart();
    case 'survey':     return docSurvey();
    case 'internal':   return docInternal();
    case 'newsletter': return docNewsletter();
    default:           return docNewsletter();
  }
}

const SEEDS = [
  { name: 'Newsletter — Novedades de noviembre', folder: 'Newsletter',       status: 'draft',     starred: true,  variant: 'newsletter', color: '#e8e7fe' },
  { name: 'Gracias por tu compra',                folder: 'Agradecimientos', status: 'published', starred: false, variant: 'receipt',    color: '#dce9f7' },
  { name: 'Bienvenida — primer día',              folder: 'Bienvenida',      status: 'published', starred: true,  variant: 'welcome',    color: '#ece3fc' },
  { name: 'Promo de temporada — 40% off',         folder: 'Ventas y promos', status: 'draft',     starred: false, variant: 'promo',      color: '#dde2fb' },
  { name: 'Recordatorio de tu cita',              folder: 'Avisos',          status: 'published', starred: false, variant: 'receipt',    color: '#e4eaf6' },
  { name: '¿Olvidaste algo en tu carrito?',       folder: 'Ventas y promos', status: 'draft',     starred: false, variant: 'cart',       color: '#e9e0f7' },
  { name: '¿Cómo estuvo nuestro servicio?',       folder: 'Encuestas',       status: 'published', starred: false, variant: 'survey',     color: '#e3e3f5' },
  { name: 'Aviso interno al equipo',              folder: 'Avisos',          status: 'draft',     starred: false, variant: 'internal',   color: '#e8e5f3' }
];

// Default starter variables for every new template. Mirrors VARIABLES in
// src/data.tsx — main process can't import .tsx so we duplicate.
const VARIABLE_SEEDS = [
  { key:'nombre',           label:'Nombre de la persona',         sample:'Carmen',          type:'texto' },
  { key:'correo',           label:'Su correo electrónico',        sample:'carmen@acme.com', type:'correo' },
  { key:'empresa',          label:'Nombre de tu empresa',         sample:'Acme',            type:'texto' },
  { key:'pedido',           label:'Número de pedido',             sample:'#A-4821',         type:'texto' },
  { key:'total',            label:'Total de la compra',           sample:'$1,240 MXN',      type:'moneda' },
  { key:'articulos',        label:'Cantidad de artículos',        sample:'3 productos',     type:'número' },
  { key:'fecha_hoy',        label:'Fecha de hoy',                 sample:'14 de noviembre', type:'fecha' },
  { key:'dia_semana',       label:'Día de la semana',             sample:'martes',          type:'texto' },
  { key:'mes_actual',       label:'Nombre del mes',               sample:'noviembre',       type:'texto' },
  { key:'link_navegador',   label:'Ver este correo en navegador', sample:'https://…',       type:'enlace' },
  { key:'link_preferencias', label:'Cambiar preferencias',        sample:'https://…',       type:'enlace' },
  { key:'link_baja',        label:'Darse de baja',                sample:'https://…',       type:'enlace' },
];

function templateJson(meta) {
  return {
    id: `tpl_${crypto.randomBytes(8).toString('hex')}`,
    schemaVersion: 1,
    name: meta.name,
    folder: meta.folder,
    status: meta.status,
    starred: meta.starred,
    variant: meta.variant,
    color: meta.color,
    doc: docForVariant(meta.variant),
    vars: VARIABLE_SEEDS.map(v => ({ ...v })),
    meta: {
      subject: meta.name,
      preview: '',
      fromName: '',
      fromEmail: ''
    }
  };
}

function ensureFirstWorkspace() {
  if (workspaces.list().length > 0) return;
  const ws = workspaces.create('Mi espacio');
  settings.set('current_workspace_id', ws.id);
  for (const meta of SEEDS) {
    const tpl = templateJson(meta);
    templates.write(ws.id, tpl.id, tpl);
  }
}

module.exports = { ensureFirstWorkspace };
