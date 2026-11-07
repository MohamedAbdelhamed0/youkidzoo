import fs from 'node:fs';

const path = new URL('../src/shared/data/demo-data.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const category = {
  ...data.categories[0],
  id: '30000000-0000-4000-8000-000000000013',
  name_en: 'Kids Clothing', name_ar: 'ملابس الأطفال',
  icon_url: '👕', slug: 'kids-clothing', display_order: 12,
  description_en: 'Comfortable everyday clothing for little adventures.',
  description_ar: 'ملابس يومية مريحة لمغامرات الصغار.',
};
const items = [
  ['Everyday Cotton T-Shirt', 'تيشيرت قطني يومي', 199, 30, '👕', '#e0f4ff', '4-6y', 'unisex', 'Soft cotton T-shirt with a relaxed fit. Sample size: 4–6 years.', 'تيشيرت قطني ناعم بقصة مريحة. المقاس التجريبي: ٤–٦ سنوات.', 'Cotton', 'قطن'],
  ['Cozy Adventure Hoodie', 'هودي المغامرات الدافئ', 449, 18, '🧥', '#eee7ff', '7-9y', 'unisex', 'Cozy pullover hoodie for cooler days. Sample size: 7–9 years.', 'هودي مريح للأيام الباردة. المقاس التجريبي: ٧–٩ سنوات.', 'Cotton blend', 'خليط قطن'],
  ['Everyday Jogger Pants', 'بنطلون رياضي يومي', 299, 24, '👖', '#e7f5e8', '4-6y', 'unisex', 'Comfortable joggers with an elastic waist. Sample size: 4–6 years.', 'بنطلون رياضي مريح بخصر مطاطي. المقاس التجريبي: ٤–٦ سنوات.', 'Cotton blend', 'خليط قطن'],
  ['Sunny Day Dress', 'فستان اليوم المشمس', 399, 16, '👗', '#ffe8ee', '4-6y', 'girl', 'Lightweight dress for sunny outings and everyday play. Sample size: 4–6 years.', 'فستان خفيف للخروجات المشمسة واللعب اليومي. المقاس التجريبي: ٤–٦ سنوات.', 'Cotton', 'قطن'],
  ['Little Dreamer Pajama Set', 'طقم بيجامة الحالم الصغير', 349, 20, '🌙', '#fff2d8', '1-3y', 'unisex', 'Soft two-piece pajama set with a long-sleeve top and trousers. Sample size: 1–3 years.', 'طقم بيجامة ناعم من قطعتين: بلوزة بأكمام طويلة وبنطلون. المقاس التجريبي: ١–٣ سنوات.', 'Cotton', 'قطن'],
  ['Playtime Cotton Shorts', 'شورت قطني للعب', 179, 28, '🩳', '#dcf5ef', '7-9y', 'unisex', 'Easy pull-on shorts with an elastic waist for active days. Sample size: 7–9 years.', 'شورت سهل الارتداء بخصر مطاطي لأيام مليئة بالنشاط. المقاس التجريبي: ٧–٩ سنوات.', 'Cotton', 'قطن'],
];
const products = items.map((item, index) => ({
  ...data.products[0],
  id: `10000000-0000-4000-8000-${String(index + 14).padStart(12, '0')}`,
  sku: `YKZ-CLOTH-${String(index + 1).padStart(3, '0')}`,
  name_en: item[0], name_ar: item[1], price: item[2], stock_quantity: item[3],
  emoji: item[4], color: item[5], age_group: item[6], gender_target: item[7],
  description_en: item[8], description_ar: item[9], material_en: item[10], material_ar: item[11],
  category_id: category.id, discount_price: null, is_featured: true,
  is_special_deal: false, special_deal_ends_at: null,
  created_at: '2026-11-08T00:00:00Z',
}));
if (!data.categories.some(row => row.id === category.id)) data.categories.push(category);
for (const product of products) {
  if (!data.products.some(row => row.id === product.id)) data.products.push(product);
}
fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
const quote = value => value === null ? 'null' : Array.isArray(value)
  ? `array[${value.map(quote).join(',')}]::text[]`
  : typeof value === 'number' || typeof value === 'boolean' ? String(value)
  : `'${String(value).replaceAll("'", "''")}'`;
let sql = '-- Additive starter clothing collection. Existing records are never replaced.\nbegin;\n';
for (const [table, rows] of [['categories', [category]], ['products', products]]) {
  const keys = Object.keys(rows[0]);
  sql += `insert into public.${table} (${keys.join(',')}) values\n`;
  sql += rows.map(row => `(${keys.map(key => quote(row[key])).join(',')})`).join(',\n');
  sql += '\non conflict (id) do nothing;\n';
}
sql += `insert into public.shop_categories (shop_id,category_id) values ('${products[0].shop_id}','${category.id}') on conflict do nothing;\ncommit;\n`;
fs.mkdirSync(new URL('../supabase/seeds/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../supabase/seeds/kids-clothing.sql', import.meta.url), sql);
console.log('Prepared Kids Clothing and six sample products.');
