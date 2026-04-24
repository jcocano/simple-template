const { z } = require('zod');

const BLOCK_TYPES = [
  'text', 'heading', 'image', 'icon', 'button', 'divider', 'spacer',
  'header', 'hero', 'footer', 'cta', 'testimonial', 'social', 'share',
  'product', 'cart', 'receipt', 'video', 'gif', 'countdown', 'map', 'qr',
  'signature', 'html', 'table', 'accordion', 'attachment',
];

const SECTION_LAYOUTS = ['1col', '2col', '3col'];

const SECTION_PRESETS = [
  'blank', 'hero', '2col', '3col', 'cta', 'image-text', 'products', 'footer',
];

function isBlockType(t) {
  return BLOCK_TYPES.includes(t);
}

const AlignSchema = z.enum(['left', 'center', 'right']);

const BorderSidesSchema = z.object({
  top: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
}).partial();

const BorderSchema = z.object({
  w: z.number(),
  style: z.string(),
  color: z.string(),
  sides: BorderSidesSchema.optional(),
});

const RadiusCornersSchema = z.object({
  tl: z.number().optional(),
  tr: z.number().optional(),
  br: z.number().optional(),
  bl: z.number().optional(),
}).partial();

const StyleSchema = z.object({
  bg: z.string().optional(),
  text: z.string().optional(),
  padding: z.number().optional(),
  font: z.string().optional(),
  align: AlignSchema.optional(),
  outerBg: z.string().optional(),
  outerPadY: z.number().optional(),
  width: z.number().optional(),
  border: BorderSchema.optional(),
  radius: z.number().optional(),
  radiusCorners: RadiusCornersSchema.optional(),
  vAlign: z.enum(['top', 'middle', 'bottom']).optional(),
  bgImage: z.string().optional(),
  bgImagePosition: z.string().optional(),
  bgImageRepeat: z.string().optional(),
  bgImageSize: z.string().optional(),
  stackOnMobile: z.boolean().optional(),
});

const ColumnStyleSchema = z.object({
  bg: z.string().optional(),
  padding: z.number().optional(),
  border: BorderSchema.optional(),
  align: AlignSchema.optional(),
});

// Block-scoped style/spacing records stay permissive — renderers read dozens of
// optional fields (size, weight, color, radius, ratio, playSize, avatarSize…)
// and the inspector writes more. A strict shape would reject legitimate data.
const BlockStyleRecord = z.record(z.string(), z.any()).optional();

function blockVariant(type, dataSchema) {
  return z.object({
    id: z.string(),
    type: z.literal(type),
    data: dataSchema.optional(),
    style: BlockStyleRecord,
  });
}

// Permissive base — every block data shape allows unknown keys (mobile
// overrides, hidden flags, spacing, style, content wrappers) so partially
// filled blocks round-trip cleanly.
const passthroughData = () => z.object({}).passthrough();

const TextData = passthroughData().extend({
  content: z.object({ body: z.string().optional() }).passthrough().optional(),
  body: z.string().optional(),
});

const HeadingData = passthroughData().extend({
  content: z.object({ text: z.string().optional() }).passthrough().optional(),
  text: z.string().optional(),
});

const ImageData = passthroughData().extend({
  content: z.object({
    src: z.string().optional(),
    alt: z.string().optional(),
    url: z.string().optional(),
  }).passthrough().optional(),
  src: z.string().optional(),
  alt: z.string().optional(),
});

const IconData = passthroughData().extend({
  content: z.object({
    emoji: z.string().optional(),
    text: z.string().optional(),
  }).passthrough().optional(),
  emoji: z.string().optional(),
  text: z.string().optional(),
});

const ButtonData = passthroughData().extend({
  content: z.object({
    label: z.string().optional(),
    url: z.string().optional(),
  }).passthrough().optional(),
  label: z.string().optional(),
  url: z.string().optional(),
});

const DividerData = passthroughData();

const SpacerData = passthroughData().extend({
  h: z.number().optional(),
});

const HeaderData = passthroughData().extend({
  content: z.object({
    brand: z.string().optional(),
    sub: z.string().optional(),
  }).passthrough().optional(),
  brand: z.string().optional(),
  sub: z.string().optional(),
});

const HeroData = passthroughData().extend({
  content: z.object({
    heading: z.string().optional(),
    body: z.string().optional(),
  }).passthrough().optional(),
  heading: z.string().optional(),
  body: z.string().optional(),
});

const FooterData = passthroughData().extend({
  content: z.object({
    company: z.string().optional(),
    notice: z.string().optional(),
  }).passthrough().optional(),
  company: z.string().optional(),
  notice: z.string().optional(),
});

// cta/share/table are palette entries with no dedicated renderer or inspector
// yet — accept any content shape.
const CtaData = passthroughData();
const ShareData = passthroughData();
const TableData = passthroughData();

const TestimonialData = passthroughData().extend({
  content: z.object({
    quote: z.string().optional(),
    name: z.string().optional(),
    role: z.string().optional(),
    company: z.string().optional(),
    avatar: z.string().optional(),
    rating: z.union([z.number(), z.string()]).optional(),
  }).passthrough().optional(),
});

const SocialData = passthroughData().extend({
  content: z.object({
    active: z.array(z.string()).optional(),
  }).passthrough().optional(),
});

const ProductData = passthroughData().extend({
  content: z.object({
    name: z.string().optional(),
    price: z.string().optional(),
    image: z.string().optional(),
    url: z.string().optional(),
  }).passthrough().optional(),
});

const CartItemSchema = z.object({
  name: z.string().optional(),
  qty: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
  image: z.string().optional(),
}).passthrough();

const CartData = passthroughData().extend({
  content: z.object({
    items: z.array(CartItemSchema).optional(),
    currency: z.string().optional(),
    subtotal: z.union([z.number(), z.string()]).optional(),
    shipping: z.union([z.number(), z.string()]).optional(),
    tax: z.union([z.number(), z.string()]).optional(),
    total: z.union([z.number(), z.string()]).optional(),
    ctaLabel: z.string().optional(),
    ctaUrl: z.string().optional(),
  }).passthrough().optional(),
});

const ReceiptItemSchema = z.object({
  name: z.string().optional(),
  qty: z.union([z.number(), z.string()]).optional(),
  price: z.union([z.number(), z.string()]).optional(),
}).passthrough();

const ReceiptData = passthroughData().extend({
  content: z.object({
    items: z.array(ReceiptItemSchema).optional(),
    currency: z.string().optional(),
    orderNumber: z.string().optional(),
    orderDate: z.string().optional(),
    customerName: z.string().optional(),
    address: z.string().optional(),
    subtotal: z.union([z.number(), z.string()]).optional(),
    tax: z.union([z.number(), z.string()]).optional(),
    total: z.union([z.number(), z.string()]).optional(),
    ctaLabel: z.string().optional(),
    ctaUrl: z.string().optional(),
  }).passthrough().optional(),
});

const VideoData = passthroughData().extend({
  content: z.object({
    videoUrl: z.string().optional(),
    url: z.string().optional(),
    thumbnail: z.string().optional(),
    caption: z.string().optional(),
    alt: z.string().optional(),
  }).passthrough().optional(),
});

const GifData = passthroughData().extend({
  content: z.object({
    src: z.string().optional(),
    alt: z.string().optional(),
    url: z.string().optional(),
  }).passthrough().optional(),
});

// Countdown supports two modes — static (template/singular/zero/expired +
// targetDate) and live (imageUrl + dimensions + link). Both fields are optional
// to allow either mode plus partial setup.
const CountdownData = passthroughData().extend({
  content: z.object({
    mode: z.enum(['static', 'live']).optional(),
    targetDate: z.string().optional(),
    template: z.string().optional(),
    singular: z.string().optional(),
    zero: z.string().optional(),
    expired: z.string().optional(),
    imageUrl: z.string().optional(),
    linkUrl: z.string().optional(),
    fallbackText: z.string().optional(),
    alt: z.string().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  }).passthrough().optional(),
});

const MapData = passthroughData().extend({
  content: z.object({
    imageUrl: z.string().optional(),
    destinationUrl: z.string().optional(),
    address: z.string().optional(),
    label: z.string().optional(),
  }).passthrough().optional(),
});

const QrData = passthroughData().extend({
  content: z.object({
    qrContent: z.string().optional(),
    dataUrl: z.string().optional(),
    caption: z.string().optional(),
  }).passthrough().optional(),
});

const SignatureSocialSchema = z.object({
  type: z.string(),
  url: z.string().optional(),
}).passthrough();

const SignatureData = passthroughData().extend({
  content: z.object({
    name: z.string().optional(),
    title: z.string().optional(),
    company: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    socials: z.array(SignatureSocialSchema).optional(),
  }).passthrough().optional(),
});

const HtmlData = passthroughData().extend({
  content: z.object({ code: z.string().optional() }).passthrough().optional(),
  code: z.string().optional(),
});

const AccordionItemSchema = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
}).passthrough();

const AccordionData = passthroughData().extend({
  content: z.object({
    items: z.array(AccordionItemSchema).optional(),
  }).passthrough().optional(),
});

const AttachmentData = passthroughData().extend({
  content: z.object({
    filename: z.string().optional(),
    fileUrl: z.string().optional(),
    size: z.string().optional(),
    ext: z.string().optional(),
    ctaLabel: z.string().optional(),
  }).passthrough().optional(),
});

const BlockSchema = z.discriminatedUnion('type', [
  blockVariant('text', TextData),
  blockVariant('heading', HeadingData),
  blockVariant('image', ImageData),
  blockVariant('icon', IconData),
  blockVariant('button', ButtonData),
  blockVariant('divider', DividerData),
  blockVariant('spacer', SpacerData),
  blockVariant('header', HeaderData),
  blockVariant('hero', HeroData),
  blockVariant('footer', FooterData),
  blockVariant('cta', CtaData),
  blockVariant('testimonial', TestimonialData),
  blockVariant('social', SocialData),
  blockVariant('share', ShareData),
  blockVariant('product', ProductData),
  blockVariant('cart', CartData),
  blockVariant('receipt', ReceiptData),
  blockVariant('video', VideoData),
  blockVariant('gif', GifData),
  blockVariant('countdown', CountdownData),
  blockVariant('map', MapData),
  blockVariant('qr', QrData),
  blockVariant('signature', SignatureData),
  blockVariant('html', HtmlData),
  blockVariant('table', TableData),
  blockVariant('accordion', AccordionData),
  blockVariant('attachment', AttachmentData),
]);

const ColumnSchema = z.object({
  w: z.number().min(1).max(100),
  blocks: z.array(BlockSchema),
  style: ColumnStyleSchema.optional(),
});

const SectionSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  layout: z.enum(['1col', '2col', '3col']),
  style: StyleSchema.optional(),
  columns: z.array(ColumnSchema).min(1),
});

const DocSchema = z.object({
  sections: z.array(SectionSchema),
});

const VarSchema = z.object({
  key: z.string(),
  label: z.string(),
  sample: z.string().optional(),
  type: z.string().optional(),
});

const MetaSchema = z.object({
  subject: z.string().optional(),
  preview: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().optional(),
});

const TemplateSchema = z.object({
  id: z.string(),
  schemaVersion: z.number().optional(),
  name: z.string(),
  folder: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  starred: z.boolean().optional(),
  variant: z.string().optional(),
  color: z.string().optional(),
  doc: DocSchema,
  vars: z.array(VarSchema).optional(),
  meta: MetaSchema.optional(),
});

module.exports = {
  StyleSchema,
  ColumnStyleSchema,
  BlockSchema,
  ColumnSchema,
  SectionSchema,
  DocSchema,
  VarSchema,
  MetaSchema,
  TemplateSchema,
  isBlockType,
  BLOCK_TYPES,
  SECTION_LAYOUTS,
  SECTION_PRESETS,
};
