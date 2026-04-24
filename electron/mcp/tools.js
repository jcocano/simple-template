'use strict';

const crypto = require('crypto');
const { z } = require('zod');

const templates = require('../storage/templates');
const savedBlocks = require('../storage/saved-blocks');
const workspaces = require('../storage/workspaces');
const images = require('../storage/images');
const settings = require('../storage/settings');
const activity = require('./activity');

const {
  BlockSchema,
  SectionSchema,
  DocSchema,
  StyleSchema,
  ColumnStyleSchema,
  VarSchema,
  MetaSchema,
  BLOCK_TYPES,
  SECTION_LAYOUTS,
  SECTION_PRESETS,
} = require('./schemas');

let notifier = null;
let openTemplate = null;
let activeWorkspaceOverride = null;

function setNotifier(fn) { notifier = fn; }
function setOpenTemplate(fn) { openTemplate = fn; }

function notify(payload) {
  if (typeof notifier === 'function') {
    try { notifier(payload); } catch (_) { /* broadcast errors shouldn't break the tool */ }
  }
}

function getActiveWorkspaceId() {
  if (activeWorkspaceOverride) return activeWorkspaceOverride;
  return settings.get('current_workspace_id');
}

function requireWorkspaceId() {
  const wsId = getActiveWorkspaceId();
  if (!wsId) {
    const err = new Error('No active workspace. Call set_active_workspace first.');
    err.code = 'NO_WORKSPACE';
    throw err;
  }
  return wsId;
}

function guardMutation(wsId, templateId) {
  const ok = activity.touch(wsId, templateId);
  if (!ok) {
    const err = new Error('USER_LOCKED: The user has taken control of the editor. Retry later.');
    err.code = 'USER_LOCKED';
    throw err;
  }
}

function newSectionId() { return 's_' + crypto.randomBytes(4).toString('hex'); }
function newBlockId() { return 'b_' + crypto.randomBytes(4).toString('hex'); }

function readTemplateOrThrow(wsId, templateId) {
  const doc = templates.read(wsId, templateId);
  if (!doc) throw new Error(`Template not found: ${templateId}`);
  return doc;
}

function findSection(doc, sectionId) {
  const sections = (doc.doc && doc.doc.sections) || [];
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx < 0) throw new Error(`Section not found: ${sectionId}`);
  return { section: sections[idx], index: idx, sections };
}

function findBlock(section, blockId) {
  const columns = section.columns || [];
  for (let ci = 0; ci < columns.length; ci++) {
    const blocks = columns[ci].blocks || [];
    const bi = blocks.findIndex((b) => b.id === blockId);
    if (bi >= 0) return { columnIndex: ci, blockIndex: bi, block: blocks[bi] };
  }
  throw new Error(`Block not found: ${blockId}`);
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function checkColumnWidths(section) {
  const cols = section.columns || [];
  const sum = cols.reduce((acc, c) => acc + (Number(c.w) || 0), 0);
  if (cols.length > 0 && Math.abs(sum - 100) > 2) {
    // eslint-disable-next-line no-console
    console.warn(`[mcp/tools] section ${section.id || '?'} column widths sum to ${sum}, expected ~100`);
  }
}

// Copied verbatim from src/data.tsx DEFAULT_SECTIONS / BLANK_SECTIONS. Keep IDs stable.
const DEFAULT_SECTION_STYLE = {
  bg: '#ffffff', text: '#1a1a17', padding: 32, font: 'inter', align: 'left',
  outerBg: 'transparent', outerPadY: 0, width: 600,
};

function sectionStyle(over) { return Object.assign({}, DEFAULT_SECTION_STYLE, over || {}); }

const DEFAULT_SECTIONS = [
  {
    id: 's1', name: 'Cabecera',
    layout: '1col',
    style: sectionStyle({ bg: '#ffffff', padding: 18 }),
    columns: [
      { w: 100, blocks: [
        { id: 'b1', type: 'header' },
      ] },
    ],
  },
  {
    id: 's2', name: 'Hero de bienvenida',
    layout: '1col',
    style: sectionStyle({ bg: '#e8e7fe', text: '#1b1547', padding: 48, align: 'center', font: 'inter-tight' }),
    columns: [
      { w: 100, blocks: [
        { id: 'b2', type: 'hero', data: {
          heading: 'Hola, {{nombre}} 👋',
          body: 'Gracias por ser parte de {{empresa}}. Esto es lo nuevo de este mes.',
        } },
      ] },
    ],
  },
  {
    id: 's3', name: 'Imagen + texto',
    layout: '2col',
    style: sectionStyle({ bg: '#ffffff', padding: 28 }),
    columns: [
      { w: 50, blocks: [
        { id: 'b3', type: 'image' },
      ] },
      { w: 50, blocks: [
        { id: 'b4', type: 'heading', data: { text: 'Novedades del mes' } },
        { id: 'b5', type: 'text', data: { body: 'Tenemos 3 cosas nuevas que creemos te van a encantar.' } },
        { id: 'b6', type: 'button', data: { label: 'Ver novedades', url: '#' } },
      ] },
    ],
  },
  {
    id: 's4', name: 'Productos destacados',
    layout: '2col',
    style: sectionStyle({ bg: '#f5f6fb', padding: 28 }),
    columns: [
      { w: 50, blocks: [
        { id: 'b7', type: 'product', data: { name: 'Taza cerámica', price: '$380 MXN' } },
      ] },
      { w: 50, blocks: [
        { id: 'b8', type: 'product', data: { name: 'Cuaderno A5', price: '$220 MXN' } },
      ] },
    ],
  },
  {
    id: 's5', name: 'Footer',
    layout: '1col',
    style: sectionStyle({ bg: '#f3f1fa', text: '#6a6a8a', padding: 24, align: 'center' }),
    columns: [
      { w: 100, blocks: [
        { id: 'b9', type: 'footer' },
      ] },
    ],
  },
];

const BLANK_SECTIONS = [
  {
    id: 's1', name: 'Sección vacía',
    layout: '1col',
    style: sectionStyle({ padding: 40 }),
    columns: [
      { w: 100, blocks: [] },
    ],
  },
];

function deepClone(v) { return JSON.parse(JSON.stringify(v)); }

function buildPresetSection(preset) {
  const id = newSectionId();
  switch (preset) {
    case 'hero':
      return {
        id, name: 'Hero', layout: '1col',
        style: sectionStyle({ bg: '#e8e7fe', text: '#1b1547', padding: 48, align: 'center' }),
        columns: [{ w: 100, blocks: [
          { id: newBlockId(), type: 'hero', data: { heading: 'Título principal', body: 'Subtítulo del hero.' } },
        ] }],
      };
    case '2col':
      return {
        id, name: 'Dos columnas', layout: '2col',
        style: sectionStyle({ padding: 28 }),
        columns: [
          { w: 50, blocks: [{ id: newBlockId(), type: 'text', data: { body: 'Columna izquierda.' } }] },
          { w: 50, blocks: [{ id: newBlockId(), type: 'text', data: { body: 'Columna derecha.' } }] },
        ],
      };
    case '3col':
      return {
        id, name: 'Tres columnas', layout: '3col',
        style: sectionStyle({ padding: 28 }),
        columns: [
          { w: 34, blocks: [{ id: newBlockId(), type: 'text', data: { body: 'Col 1' } }] },
          { w: 33, blocks: [{ id: newBlockId(), type: 'text', data: { body: 'Col 2' } }] },
          { w: 33, blocks: [{ id: newBlockId(), type: 'text', data: { body: 'Col 3' } }] },
        ],
      };
    case 'cta':
      return {
        id, name: 'Llamada a la acción', layout: '1col',
        style: sectionStyle({ bg: '#1b1547', text: '#ffffff', padding: 40, align: 'center' }),
        columns: [{ w: 100, blocks: [
          { id: newBlockId(), type: 'heading', data: { text: '¿Listo para empezar?' } },
          { id: newBlockId(), type: 'button', data: { label: 'Comenzar', url: '#' } },
        ] }],
      };
    case 'image-text':
      return {
        id, name: 'Imagen + texto', layout: '2col',
        style: sectionStyle({ padding: 28 }),
        columns: [
          { w: 50, blocks: [{ id: newBlockId(), type: 'image' }] },
          { w: 50, blocks: [
            { id: newBlockId(), type: 'heading', data: { text: 'Título' } },
            { id: newBlockId(), type: 'text', data: { body: 'Descripción del contenido.' } },
          ] },
        ],
      };
    case 'products':
      return {
        id, name: 'Productos', layout: '2col',
        style: sectionStyle({ bg: '#f5f6fb', padding: 28 }),
        columns: [
          { w: 50, blocks: [{ id: newBlockId(), type: 'product', data: { name: 'Producto 1', price: '$0' } }] },
          { w: 50, blocks: [{ id: newBlockId(), type: 'product', data: { name: 'Producto 2', price: '$0' } }] },
        ],
      };
    case 'footer':
      return {
        id, name: 'Footer', layout: '1col',
        style: sectionStyle({ bg: '#f3f1fa', text: '#6a6a8a', padding: 24, align: 'center' }),
        columns: [{ w: 100, blocks: [{ id: newBlockId(), type: 'footer' }] }],
      };
    case 'blank':
    default:
      return {
        id, name: 'Sección vacía', layout: '1col',
        style: sectionStyle({ padding: 32 }),
        columns: [{ w: 100, blocks: [] }],
      };
  }
}

const EmptyObj = z.object({});

const Schemas = {
  list_templates: EmptyObj,
  list_trashed_templates: EmptyObj,
  read_template: z.object({ templateId: z.string() }),
  create_template: z.object({
    name: z.string().optional(),
    seed: z.enum(['blank', 'default']).default('blank'),
    folder: z.string().optional(),
    color: z.string().optional(),
    variant: z.string().optional(),
  }),
  duplicate_template: z.object({ templateId: z.string() }),
  rename_template: z.object({ templateId: z.string(), name: z.string().min(1) }),
  update_template_attributes: z.object({
    templateId: z.string(),
    folder: z.string().optional(),
    color: z.string().optional(),
    variant: z.string().optional(),
    starred: z.boolean().optional(),
    status: z.enum(['draft', 'published']).optional(),
  }),
  trash_template: z.object({ templateId: z.string() }),
  restore_template: z.object({ templateId: z.string() }),
  purge_template: z.object({ templateId: z.string() }),
  open_template: z.object({ templateId: z.string() }),
  add_section: z.object({
    templateId: z.string(),
    preset: z.enum(['blank', 'hero', '2col', '3col', 'cta', 'image-text', 'products', 'footer']).default('blank'),
    atIndex: z.number().int().min(0).optional(),
  }),
  update_section: z.object({
    templateId: z.string(),
    sectionId: z.string(),
    patch: z.object({
      name: z.string().optional(),
      layout: z.enum(['1col', '2col', '3col']).optional(),
      style: StyleSchema.optional(),
    }),
  }),
  delete_section: z.object({ templateId: z.string(), sectionId: z.string() }),
  move_section: z.object({ templateId: z.string(), sectionId: z.string(), toIndex: z.number().int().min(0) }),
  add_block: z.object({
    templateId: z.string(),
    sectionId: z.string(),
    columnIndex: z.number().int().min(0),
    type: z.enum(BLOCK_TYPES),
    data: z.record(z.string(), z.any()).optional(),
    style: z.record(z.string(), z.any()).optional(),
    atIndex: z.number().int().min(0).optional(),
  }),
  update_block: z.object({
    templateId: z.string(),
    sectionId: z.string(),
    blockId: z.string(),
    patch: z.object({
      data: z.record(z.string(), z.any()).optional(),
      style: z.record(z.string(), z.any()).optional(),
    }),
  }),
  delete_block: z.object({ templateId: z.string(), sectionId: z.string(), blockId: z.string() }),
  move_block: z.object({
    templateId: z.string(),
    fromSectionId: z.string(),
    blockId: z.string(),
    toSectionId: z.string(),
    toColumnIndex: z.number().int().min(0),
    toBlockIndex: z.number().int().min(0),
  }),
  set_meta: z.object({
    templateId: z.string(),
    subject: z.string().optional(),
    preview: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.email().optional(),
  }),
  set_vars: z.object({
    templateId: z.string(),
    vars: z.array(VarSchema),
  }),
  list_saved_blocks: EmptyObj,
  insert_saved_block: z.object({
    templateId: z.string(),
    savedBlockId: z.string(),
    atIndex: z.number().int().min(0).optional(),
  }),
  save_section_as_saved_block: z.object({
    templateId: z.string(),
    sectionId: z.string(),
    name: z.string().min(1),
    kind: z.string().default(''),
  }),
  list_images: EmptyObj,
  list_workspaces: EmptyObj,
  get_active_workspace: EmptyObj,
  set_active_workspace: z.object({ workspaceId: z.string() }),
};

const Handlers = {
  async list_templates() {
    const wsId = requireWorkspaceId();
    return templates.list(wsId);
  },

  async list_trashed_templates() {
    const wsId = requireWorkspaceId();
    return templates.listTrashed(wsId);
  },

  async read_template({ templateId }) {
    const wsId = requireWorkspaceId();
    return readTemplateOrThrow(wsId, templateId);
  },

  async create_template(args) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, null);
    const id = templates.newId();
    const sections = args.seed === 'default' ? deepClone(DEFAULT_SECTIONS) : deepClone(BLANK_SECTIONS);
    const doc = {
      id,
      schemaVersion: 1,
      name: args.name || 'Plantilla sin título',
      folder: args.folder || 'Sin carpeta',
      status: 'draft',
      starred: false,
      variant: args.variant || 'newsletter',
      color: args.color || '#e8e7fe',
      doc: { sections },
      vars: [],
      meta: { subject: '', preview: '', fromName: '', fromEmail: '' },
    };
    templates.write(wsId, id, doc);
    notify({ workspaceId: wsId, templateId: id, event: 'create' });
    return { id };
  },

  async duplicate_template({ templateId }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const src = readTemplateOrThrow(wsId, templateId);
    const newId = templates.newId();
    const cloned = deepClone(src);
    cloned.id = newId;
    cloned.name = `${src.name || 'Plantilla'} (copia)`;
    cloned.starred = false;
    templates.write(wsId, newId, cloned);
    notify({ workspaceId: wsId, templateId: newId, event: 'create' });
    return { id: newId };
  },

  async rename_template({ templateId, name }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    doc.name = name;
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { id: templateId, name };
  },

  async update_template_attributes(args) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, args.templateId);
    const doc = readTemplateOrThrow(wsId, args.templateId);
    for (const k of ['folder', 'color', 'variant', 'starred', 'status']) {
      if (args[k] !== undefined) doc[k] = args[k];
    }
    templates.write(wsId, args.templateId, doc);
    notify({ workspaceId: wsId, templateId: args.templateId, event: 'update' });
    return { id: args.templateId };
  },

  async trash_template({ templateId }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    templates.remove(wsId, templateId);
    notify({ workspaceId: wsId, templateId, event: 'delete' });
    return { id: templateId, trashed: true };
  },

  async restore_template({ templateId }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    templates.restore(wsId, templateId);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { id: templateId, restored: true };
  },

  async purge_template({ templateId }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    templates.purge(wsId, templateId);
    notify({ workspaceId: wsId, templateId, event: 'delete' });
    return { id: templateId, purged: true };
  },

  async open_template({ templateId }) {
    const wsId = requireWorkspaceId();
    readTemplateOrThrow(wsId, templateId);
    if (typeof openTemplate === 'function') {
      try { openTemplate({ workspaceId: wsId, templateId }); } catch (_) { /* non-fatal */ }
    }
    notify({ workspaceId: wsId, templateId, event: 'open' });
    return { id: templateId, opened: true };
  },

  async add_section({ templateId, preset, atIndex }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    doc.doc = doc.doc || { sections: [] };
    doc.doc.sections = doc.doc.sections || [];
    const section = buildPresetSection(preset);
    checkColumnWidths(section);
    const at = atIndex == null ? doc.doc.sections.length : clamp(atIndex, 0, doc.doc.sections.length);
    doc.doc.sections.splice(at, 0, section);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { sectionId: section.id };
  },

  async update_section({ templateId, sectionId, patch }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const { section } = findSection(doc, sectionId);
    if (patch.name !== undefined) section.name = patch.name;
    if (patch.layout !== undefined) section.layout = patch.layout;
    if (patch.style !== undefined) section.style = Object.assign({}, section.style || {}, patch.style);
    checkColumnWidths(section);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { sectionId };
  },

  async delete_section({ templateId, sectionId }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const sections = (doc.doc && doc.doc.sections) || [];
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) throw new Error(`Section not found: ${sectionId}`);
    sections.splice(idx, 1);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { sectionId, deleted: true };
  },

  async move_section({ templateId, sectionId, toIndex }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const sections = (doc.doc && doc.doc.sections) || [];
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx < 0) throw new Error(`Section not found: ${sectionId}`);
    const [sec] = sections.splice(idx, 1);
    const dest = clamp(toIndex, 0, sections.length);
    sections.splice(dest, 0, sec);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { sectionId, toIndex: dest };
  },

  async add_block({ templateId, sectionId, columnIndex, type, data, style, atIndex }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const { section } = findSection(doc, sectionId);
    const columns = section.columns || [];
    if (columnIndex >= columns.length) throw new Error('Invalid columnIndex');
    const id = newBlockId();
    const block = BlockSchema.parse({ id, type, data: data || {}, style: style || {} });
    const blocks = columns[columnIndex].blocks || (columns[columnIndex].blocks = []);
    const at = atIndex == null ? blocks.length : clamp(atIndex, 0, blocks.length);
    blocks.splice(at, 0, block);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { blockId: id };
  },

  async update_block({ templateId, sectionId, blockId, patch }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const { section } = findSection(doc, sectionId);
    const { columnIndex, blockIndex, block } = findBlock(section, blockId);
    const merged = {
      id: block.id,
      type: block.type,
      data: Object.assign({}, block.data || {}, patch.data || {}),
      style: Object.assign({}, block.style || {}, patch.style || {}),
    };
    const validated = BlockSchema.parse(merged);
    section.columns[columnIndex].blocks[blockIndex] = validated;
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { blockId };
  },

  async delete_block({ templateId, sectionId, blockId }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const { section } = findSection(doc, sectionId);
    const { columnIndex, blockIndex } = findBlock(section, blockId);
    section.columns[columnIndex].blocks.splice(blockIndex, 1);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { blockId, deleted: true };
  },

  async move_block({ templateId, fromSectionId, blockId, toSectionId, toColumnIndex, toBlockIndex }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const { section: srcSection } = findSection(doc, fromSectionId);
    const { columnIndex: srcCol, blockIndex: srcIdx, block } = findBlock(srcSection, blockId);
    srcSection.columns[srcCol].blocks.splice(srcIdx, 1);
    const { section: dstSection } = findSection(doc, toSectionId);
    const dstColumns = dstSection.columns || [];
    if (toColumnIndex >= dstColumns.length) {
      // rollback
      srcSection.columns[srcCol].blocks.splice(srcIdx, 0, block);
      throw new Error('Invalid toColumnIndex');
    }
    const dstBlocks = dstColumns[toColumnIndex].blocks || (dstColumns[toColumnIndex].blocks = []);
    const at = clamp(toBlockIndex, 0, dstBlocks.length);
    dstBlocks.splice(at, 0, block);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { blockId, toSectionId, toColumnIndex, toBlockIndex: at };
  },

  async set_meta(args) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, args.templateId);
    const doc = readTemplateOrThrow(wsId, args.templateId);
    doc.meta = doc.meta || {};
    for (const k of ['subject', 'preview', 'fromName', 'fromEmail']) {
      if (args[k] !== undefined) doc.meta[k] = args[k];
    }
    templates.write(wsId, args.templateId, doc);
    notify({ workspaceId: wsId, templateId: args.templateId, event: 'update' });
    return { id: args.templateId, meta: doc.meta };
  },

  async set_vars({ templateId, vars }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    doc.vars = vars;
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { id: templateId, count: vars.length };
  },

  async list_saved_blocks() {
    const wsId = requireWorkspaceId();
    return savedBlocks.list(wsId);
  },

  async insert_saved_block({ templateId, savedBlockId, atIndex }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const saved = savedBlocks.read(wsId, savedBlockId);
    if (!saved || !saved.section) throw new Error(`Saved block not found: ${savedBlockId}`);
    const doc = readTemplateOrThrow(wsId, templateId);
    doc.doc = doc.doc || { sections: [] };
    doc.doc.sections = doc.doc.sections || [];
    const cloned = deepClone(saved.section);
    cloned.id = newSectionId();
    for (const col of cloned.columns || []) {
      for (const b of col.blocks || []) { b.id = newBlockId(); }
    }
    const at = atIndex == null ? doc.doc.sections.length : clamp(atIndex, 0, doc.doc.sections.length);
    doc.doc.sections.splice(at, 0, cloned);
    templates.write(wsId, templateId, doc);
    notify({ workspaceId: wsId, templateId, event: 'update' });
    return { sectionId: cloned.id };
  },

  async save_section_as_saved_block({ templateId, sectionId, name, kind }) {
    const wsId = requireWorkspaceId();
    guardMutation(wsId, templateId);
    const doc = readTemplateOrThrow(wsId, templateId);
    const { section } = findSection(doc, sectionId);
    const id = savedBlocks.newId();
    const saved = {
      id,
      name,
      kind: kind || '',
      starred: false,
      section: deepClone(section),
      schemaVersion: 1,
    };
    savedBlocks.write(wsId, id, saved);
    return { id };
  },

  async list_images() {
    const wsId = requireWorkspaceId();
    return images.list(wsId);
  },

  async list_workspaces() {
    return workspaces.list();
  },

  async get_active_workspace() {
    const wsId = getActiveWorkspaceId();
    if (!wsId) return null;
    return workspaces.get(wsId);
  },

  async set_active_workspace({ workspaceId }) {
    const ws = workspaces.get(workspaceId);
    if (!ws) throw new Error(`Workspace not found: ${workspaceId}`);
    activeWorkspaceOverride = workspaceId;
    return ws;
  },
};

const Descriptions = {
  list_templates: 'List all non-trashed email templates in the active workspace.',
  list_trashed_templates: 'List email templates currently in the trash for the active workspace.',
  read_template: 'Read the full document of one template by id.',
  create_template: 'Create a new email template (blank or with the default seeded sections) in the active workspace.',
  duplicate_template: 'Duplicate an existing template; the copy gets a new id and "(copia)" appended to its name.',
  rename_template: 'Rename a template.',
  update_template_attributes: 'Update template attributes: folder, color, variant, starred, status.',
  trash_template: 'Move a template to the trash.',
  restore_template: 'Restore a template from the trash.',
  purge_template: 'Permanently delete a template from the trash.',
  open_template: 'Request the UI to navigate into the editor for a specific template.',
  add_section: 'Insert a new section (from a preset) into a template at an optional index.',
  update_section: 'Update a section\'s name, layout, or style.',
  delete_section: 'Remove a section from a template.',
  move_section: 'Reorder a section to a new index within the template.',
  add_block: 'Add a new block of the given type into a specific column of a section.',
  update_block: 'Shallow-merge patch.data/patch.style into an existing block and re-validate it.',
  delete_block: 'Remove a block from its section/column.',
  move_block: 'Move a block from one section/column to another section/column at a given index.',
  set_meta: 'Update the template metadata (subject, preview, fromName, fromEmail).',
  set_vars: 'Replace the template variables list.',
  list_saved_blocks: 'List the workspace\'s saved blocks (reusable sections).',
  insert_saved_block: 'Insert a saved block as a new section into a template (new ids are generated).',
  save_section_as_saved_block: 'Save a section from a template as a reusable saved block.',
  list_images: 'List all images uploaded in the active workspace (includes url field for image blocks).',
  list_workspaces: 'List all workspaces.',
  get_active_workspace: 'Return the currently active workspace.',
  set_active_workspace: 'Set the active workspace for the MCP session (per-session override, not persisted).',
};

const Mutations = new Set([
  'create_template', 'duplicate_template', 'rename_template', 'update_template_attributes',
  'trash_template', 'restore_template', 'purge_template',
  'add_section', 'update_section', 'delete_section', 'move_section',
  'add_block', 'update_block', 'delete_block', 'move_block',
  'set_meta', 'set_vars',
  'insert_saved_block', 'save_section_as_saved_block',
]);

const HANDLERS = {};
for (const name of Object.keys(Schemas)) {
  HANDLERS[name] = {
    schema: Schemas[name],
    handler: Handlers[name],
    isMutation: Mutations.has(name),
    description: Descriptions[name],
  };
}

const toolDefs = Object.keys(Schemas).map((name) => ({
  name,
  description: Descriptions[name],
  inputSchema: z.toJSONSchema(Schemas[name], { target: 'draft-7' }),
}));

async function callTool(name, args) {
  const def = HANDLERS[name];
  if (!def) throw new Error(`Unknown tool: ${name}`);
  const parsed = def.schema.parse(args || {});
  const result = await def.handler(parsed);
  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
}

module.exports = {
  toolDefs,
  callTool,
  setNotifier,
  setOpenTemplate,
};
