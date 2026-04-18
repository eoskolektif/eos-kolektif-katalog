import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';

const COLOR_PRESETS = ['Altın', 'Gümüş', 'Rose Gold', 'Siyah', 'Beyaz', 'Bronz', 'Mor', 'Kırmızı', 'Mavi', 'Yeşil'];
const COLOR_CODES = { 'Altın': 'ALT', 'Gümüş': 'GMS', 'Rose Gold': 'RSG', 'Siyah': 'SYH', 'Beyaz': 'BYZ', 'Bronz': 'BRZ', 'Mor': 'MOR', 'Kırmızı': 'KRM', 'Mavi': 'MAV', 'Yeşil': 'YSL' };

async function uploadImage(file) {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(fileName, file);
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return data.publicUrl;
}

function ImageUpload({ src, onUpload, size = 56, dark }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) onUpload(url);
  };
  const inputId = `img-${Math.random().toString(36).slice(2)}`;
  return (
    <label htmlFor={inputId} style={{ cursor: 'pointer', display: 'block', width: size, height: size, minWidth: size, borderRadius: 8, overflow: 'hidden', background: dark ? '#2a2a28' : '#f5f3ee', border: `1px dashed ${dark ? '#444' : '#ddd'}`, position: 'relative' }}>
      {uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 9, color: dark ? '#888' : '#888' }}>yükleniyor</div>
      ) : src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', flexDirection: 'column' }}>
          <span style={{ fontSize: 18, color: dark ? '#666' : '#ccc', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 8, color: dark ? '#555' : '#bbb', marginTop: 2 }}>foto</span>
        </div>
      )}
      <input id={inputId} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </label>
  );
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('eos-dark') === '1');
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState({});
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductCode, setNewProductCode] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');
  const [newProductNote, setNewProductNote] = useState('');
  const [newProductImage, setNewProductImage] = useState(null);
  const [editingCode, setEditingCode] = useState(null);
  const [editCodeValue, setEditCodeValue] = useState('');
  const [editingMainStock, setEditingMainStock] = useState(null);
  const [editMainStockValue, setEditMainStockValue] = useState('');
  const [editingName, setEditingName] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [editingPrice, setEditingPrice] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState('');
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteValue, setEditNoteValue] = useState('');
  const [showAddColor, setShowAddColor] = useState(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorStock, setNewColorStock] = useState('');
  const [newColorImage, setNewColorImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatStartNum, setNewCatStartNum] = useState('');

  // Theme toggle
  useEffect(() => { localStorage.setItem('eos-dark', dark ? '1' : '0'); document.body.style.background = dark ? '#17171a' : '#fafaf8'; }, [dark]);

  const theme = {
    bg: dark ? '#17171a' : '#fafaf8',
    card: dark ? '#1f1f23' : '#fff',
    cardAlt: dark ? '#24242a' : '#fafaf8',
    border: dark ? '#2a2a30' : '#eee',
    text: dark ? '#e8e6e0' : '#2C2C2A',
    textMuted: dark ? '#8a8a85' : '#888',
    textDim: dark ? '#5a5a55' : '#ccc',
    statBg: dark ? '#1f1f23' : '#f8f7f4',
    code: dark ? '#c67a5c' : '#993C1D',
    accent: dark ? '#2a89a3' : '#1D9E75',
    variantBg: dark ? '#2a2436' : '#EEEDFE',
    variantText: dark ? '#a69af0' : '#534AB7',
    variantFull: dark ? '#8d81e0' : '#3C3489',
    stockBg: dark ? '#1f3229' : '#E1F5EE',
    stockText: dark ? '#4ec897' : '#0F6E56',
    formBg: dark ? '#1a1d1a' : '#fefcf6',
    formBorder: dark ? '#2a2d28' : '#e8e4d9',
    input: dark ? '#1a1a1d' : '#fff',
    inputBorder: dark ? '#333' : '#ddd',
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { if (activeCategory) loadProducts(); }, [activeCategory]);

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    if (data && data.length > 0) {
      setCategories(data);
      if (!activeCategory) setActiveCategory(data[0].code);
    }
  }

  async function loadProducts() {
    setLoading(true);
    const { data: prods } = await supabase.from('products').select('*').eq('category', activeCategory).order('created_at', { ascending: true });
    if (prods) {
      setProducts(prods);
      if (prods.length > 0) {
        const ids = prods.map(p => p.id);
        const { data: cols } = await supabase.from('product_colors').select('*').in('product_id', ids).order('created_at', { ascending: true });
        const grouped = {};
        (cols || []).forEach(c => { if (!grouped[c.product_id]) grouped[c.product_id] = []; grouped[c.product_id].push(c); });
        setColors(grouped);
      } else { setColors({}); }
    }
    setLoading(false);
  }

  function getNextCode() {
    const cat = categories.find(c => c.code === activeCategory);
    const startNum = cat?.start_num || 1001;
    if (products.length === 0) return `${activeCategory}-${startNum}`;
    const nums = products.map(p => parseInt(p.code.split('-')[1])).filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : (startNum - 1);
    return `${activeCategory}-${max + 1}`;
  }

  async function addProduct() {
    if (!newProductName.trim()) return;
    const code = newProductCode.trim() || getNextCode();
    const { error } = await supabase.from('products').insert({
      category: activeCategory, code, name: newProductName.trim(),
      price: newProductPrice ? parseFloat(newProductPrice) : 0,
      stock: newProductStock ? parseInt(newProductStock) : 0,
      note: newProductNote.trim() || null,
      image_url: newProductImage || null,
    });
    if (error) { alert('Hata: ' + error.message); return; }
    setNewProductCode(''); setNewProductName(''); setNewProductPrice(''); setNewProductStock(''); setNewProductNote(''); setNewProductImage(null); setShowAddProduct(false);
    loadProducts();
  }

  async function updateProductCode(id, newCode) {
    if (!newCode.trim()) return;
    const { error } = await supabase.from('products').update({ code: newCode.trim() }).eq('id', id);
    if (error) { alert('Hata: ' + error.message); return; }
    setEditingCode(null);
    loadProducts();
  }

  async function updateMainStock(id, value) {
    await supabase.from('products').update({ stock: parseInt(value) || 0 }).eq('id', id);
    setEditingMainStock(null);
    loadProducts();
  }

  async function updateProductName(id, value) {
    if (!value.trim()) return;
    await supabase.from('products').update({ name: value.trim() }).eq('id', id);
    setEditingName(null);
    loadProducts();
  }

  async function updateProductPrice(id, value) {
    await supabase.from('products').update({ price: parseFloat(value) || 0 }).eq('id', id);
    setEditingPrice(null);
    loadProducts();
  }

  async function updateProductNote(id, value) {
    await supabase.from('products').update({ note: value.trim() || null }).eq('id', id);
    setEditingNote(null);
    loadProducts();
  }

  async function updateProductImage(id, imgUrl) {
    await supabase.from('products').update({ image_url: imgUrl }).eq('id', id);
    loadProducts();
  }

  async function deleteProduct(id) {
    await supabase.from('products').delete().eq('id', id);
    setExpandedProduct(null);
    loadProducts();
  }

  async function addColor(productId, productCode) {
    if (!newColorName.trim()) return;
    const colorCode = COLOR_CODES[newColorName] || newColorName.substring(0, 3).toUpperCase();
    await supabase.from('product_colors').insert({
      product_id: productId,
      code: `${productCode}-${colorCode}`,
      name: newColorName.trim(),
      stock: newColorStock ? parseInt(newColorStock) : 0,
      image_url: newColorImage || null,
    });
    setNewColorName(''); setNewColorStock(''); setNewColorImage(null); setShowAddColor(null);
    loadProducts();
  }

  async function updateColorImage(colorId, imgUrl) {
    await supabase.from('product_colors').update({ image_url: imgUrl }).eq('id', colorId);
    loadProducts();
  }

  async function deleteColor(id) {
    await supabase.from('product_colors').delete().eq('id', id);
    loadProducts();
  }

  async function updateStock(id, value) {
    await supabase.from('product_colors').update({ stock: parseInt(value) || 0 }).eq('id', id);
    setEditingStock(null);
    loadProducts();
  }

  // CSV Export
  async function exportCSV() {
    const { data: allProds } = await supabase.from('products').select('*').order('category').order('code');
    const { data: allCols } = await supabase.from('product_colors').select('*');
    const colsByProd = {};
    (allCols || []).forEach(c => { if (!colsByProd[c.product_id]) colsByProd[c.product_id] = []; colsByProd[c.product_id].push(c); });

    const rows = [['Kategori', 'Kod', 'Ürün Adı', 'Renk', 'Alış Fiyatı', 'Stok', 'Not', 'Görsel URL']];
    (allProds || []).forEach(p => {
      const pcolors = colsByProd[p.id] || [];
      if (pcolors.length === 0) {
        rows.push([p.category, p.code, p.name, '', p.price || 0, p.stock || 0, p.note || '', p.image_url || '']);
      } else {
        pcolors.forEach(c => {
          rows.push([p.category, c.code, p.name, c.name, p.price || 0, c.stock || 0, p.note || '', c.image_url || p.image_url || '']);
        });
      }
    });

    const csv = rows.map(r => r.map(cell => {
      const s = String(cell ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(',')).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `eos-katalog-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Category management
  async function addCategory() {
    if (!newCatCode.trim() || !newCatName.trim()) return;
    const code = newCatCode.trim().toUpperCase();
    const maxSort = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) : 0;
    const { error } = await supabase.from('categories').insert({
      code, name: newCatName.trim(),
      start_num: newCatStartNum ? parseInt(newCatStartNum) : (categories.length + 1) * 1000 + 1,
      sort_order: maxSort + 1,
    });
    if (error) { alert('Hata: ' + error.message); return; }
    setNewCatCode(''); setNewCatName(''); setNewCatStartNum('');
    loadCategories();
  }

  async function deleteCategory(id, code) {
    if (!confirm(`"${code}" kategorisi silinecek. Bu kategorideki ürünler kalır ama kategori sekmesi kaybolur. Emin misiniz?`)) return;
    await supabase.from('categories').delete().eq('id', id);
    loadCategories();
  }

  async function updateCategoryName(id, newName) {
    await supabase.from('categories').update({ name: newName }).eq('id', id);
    loadCategories();
  }

  const totalStock = (p) => {
    const pColors = colors[p.id] || [];
    if (pColors.length > 0) return pColors.reduce((s, c) => s + (c.stock || 0), 0);
    return p.stock || 0;
  };
  const filteredProducts = searchQuery.trim() ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase())) : products;
  const allVariants = Object.values(colors).flat().length;
  const allStock = products.reduce((s, p) => s + totalStock(p), 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 900, margin: '0 auto', padding: '0.5rem 0', color: theme.text, minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }}></div>
          <span style={{ fontSize: 11, color: theme.textMuted, letterSpacing: 2, textTransform: 'uppercase' }}>Eos Kolektif Ürün Kataloğu</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={exportCSV} style={{ fontSize: 11, padding: '6px 12px', background: theme.cardAlt, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }} title="CSV olarak indir">⤓ CSV</button>
          <button onClick={() => setShowCategoryManager(!showCategoryManager)} style={{ fontSize: 11, padding: '6px 12px', background: theme.cardAlt, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }} title="Kategori Yönetimi">⚙ Kategori</button>
          <button onClick={() => setDark(!dark)} style={{ fontSize: 14, padding: '4px 12px', background: theme.cardAlt, color: theme.text, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer' }} title={dark ? 'Aydınlık' : 'Karanlık'}>{dark ? '☀' : '☾'}</button>
        </div>
      </div>

      {showCategoryManager && (
        <div style={{ background: theme.formBg, border: `1px solid ${theme.formBorder}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Kategori Yönetimi</div>
          <div style={{ marginBottom: 12 }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 3, background: theme.card, borderRadius: 5 }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: theme.code, fontWeight: 700, minWidth: 44 }}>{cat.code}</span>
                <input defaultValue={cat.name} onBlur={e => { if (e.target.value !== cat.name) updateCategoryName(cat.id, e.target.value); }}
                  style={{ flex: 1, padding: '4px 8px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 4, fontSize: 12, color: theme.text, fontFamily: 'inherit' }} />
                <span style={{ fontSize: 10, color: theme.textMuted }}>Başlangıç: {cat.start_num}</span>
                <button onClick={() => deleteCategory(cat.id, cat.code)} style={{ fontSize: 11, padding: '3px 8px', background: '#FDEDEC', color: '#C93B32', border: '1px solid #F5C4C0', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Sil</button>
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 6 }}>Yeni Kategori Ekle</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input value={newCatCode} onChange={e => setNewCatCode(e.target.value.toUpperCase())} placeholder="Kod (CNT)" maxLength={5}
                style={{ width: 90, padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, color: theme.text, fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }} />
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ad (Çantalar)"
                style={{ flex: 2, minWidth: 140, padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, color: theme.text, fontFamily: 'inherit' }} />
              <input value={newCatStartNum} onChange={e => setNewCatStartNum(e.target.value)} placeholder="10001" type="number"
                style={{ width: 100, padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, color: theme.text, fontFamily: 'inherit' }} />
              <button onClick={addCategory} style={{ padding: '7px 16px', fontSize: 12, fontWeight: 600, background: theme.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Ekle</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {categories.map(cat => (
          <button key={cat.code} onClick={() => { setActiveCategory(cat.code); setExpandedProduct(null); setShowAddProduct(false); setSearchQuery(''); }}
            style={{ padding: '7px 14px', fontSize: 12, fontWeight: activeCategory === cat.code ? 600 : 400, fontFamily: 'inherit', background: activeCategory === cat.code ? theme.text : 'transparent', color: activeCategory === cat.code ? theme.bg : theme.textMuted, border: activeCategory === cat.code ? 'none' : `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer' }}>
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: theme.statBg, borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 2 }}>Ürün</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{products.length}</div>
        </div>
        <div style={{ background: theme.statBg, borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 2 }}>Varyant</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{allVariants}</div>
        </div>
        <div style={{ background: theme.statBg, borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 2 }}>Stok</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: theme.stockText }}>{allStock}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddProduct(!showAddProduct)}
          style={{ padding: '9px 18px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: theme.text, color: theme.bg, border: 'none', borderRadius: 7, cursor: 'pointer' }}>
          + Yeni Ürün
        </button>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ürün ara..."
          style={{ flex: 1, minWidth: 150, padding: '8px 12px', background: theme.input, border: `1px solid ${theme.border}`, borderRadius: 7, fontSize: 12, fontFamily: 'inherit', color: theme.text }} />
      </div>

      {showAddProduct && (
        <div style={{ background: theme.formBg, border: `1px solid ${theme.formBorder}`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <ImageUpload src={newProductImage} onUpload={setNewProductImage} size={72} dark={dark} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 auto', minWidth: 110 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 3 }}>Ürün Kodu</div>
                  <input value={newProductCode} onChange={e => setNewProductCode(e.target.value)} placeholder={getNextCode()}
                    style={{ width: '100%', padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: theme.code }} />
                </div>
                <div style={{ flex: 2, minWidth: 150 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 3 }}>Ürün Adı</div>
                  <input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ürün adını girin"
                    style={{ width: '100%', padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: theme.text }} />
                </div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 3 }}>Alış Fiyatı (TL)</div>
                  <input value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="0" type="number"
                    style={{ width: '100%', padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: theme.text }} />
                </div>
                <div style={{ flex: 1, minWidth: 70 }}>
                  <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 3 }}>Stok</div>
                  <input value={newProductStock} onChange={e => setNewProductStock(e.target.value)} placeholder="0" type="number"
                    style={{ width: '100%', padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: theme.text }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 3 }}>Not</div>
                <input value={newProductNote} onChange={e => setNewProductNote(e.target.value)} placeholder="Opsiyonel"
                  style={{ width: '100%', padding: '7px 10px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: theme.text }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={addProduct} style={{ padding: '7px 18px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: theme.accent, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Kaydet</button>
            <button onClick={() => { setShowAddProduct(false); setNewProductCode(''); }} style={{ padding: '7px 14px', fontSize: 12, fontFamily: 'inherit', background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer' }}>İptal</button>
            <span style={{ fontSize: 10, color: theme.textDim, marginLeft: 8 }}>Kodu boş bırakırsan: {getNextCode()}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: theme.textMuted, fontSize: 13 }}>Yükleniyor...</div>
      ) : (
        <div>
          {filteredProducts.map(product => {
            const isExpanded = expandedProduct === product.id;
            const ts = totalStock(product);
            const prodColors = colors[product.id] || [];
            return (
              <div key={product.id} style={{ border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 6, overflow: 'hidden', background: theme.card }}>
                <div onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer', background: isExpanded ? theme.cardAlt : theme.card }}>
                  <div style={{ width: 60, height: 60, minWidth: 60, borderRadius: 8, overflow: 'hidden', background: theme.statBg }}>
                    {product.image_url ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme.textDim, fontSize: 20 }}>&#9633;</div>}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: theme.code, fontFamily: 'monospace', minWidth: 75 }}>{product.code}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                  {product.price > 0 && <span style={{ fontSize: 13, color: theme.text, fontWeight: 600 }}>{product.price} TL</span>}
                  {prodColors.length > 0 ? (
                    <span style={{ fontSize: 10, color: theme.variantText, background: theme.variantBg, padding: '3px 8px', borderRadius: 4 }}>{prodColors.length} renk</span>
                  ) : (
                    <span style={{ fontSize: 10, color: theme.textDim, background: theme.statBg, padding: '3px 8px', borderRadius: 4 }}>tek</span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 700, color: ts > 0 ? theme.stockText : theme.textDim, background: ts > 0 ? theme.stockBg : theme.statBg, padding: '4px 12px', borderRadius: 4, minWidth: 36, textAlign: 'center' }}>{ts}</span>
                  <span style={{ fontSize: 16, color: theme.textDim, transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>&#9662;</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${theme.border}`, padding: '16px 18px', background: theme.cardAlt }}>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 14, alignItems: 'flex-start' }}>
                      <ImageUpload src={product.image_url} onUpload={(img) => updateProductImage(product.id, img)} size={120} dark={dark} />
                      <div style={{ flex: 1 }}>
                        {editingCode === product.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                            <input value={editCodeValue} onChange={e => setEditCodeValue(e.target.value)}
                              style={{ padding: '4px 8px', background: theme.input, border: `1px solid ${theme.code}`, borderRadius: 4, fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: theme.code, width: 120 }}
                              autoFocus onKeyDown={e => { if (e.key === 'Enter') updateProductCode(product.id, editCodeValue); }} />
                            <button onClick={() => updateProductCode(product.id, editCodeValue)}
                              style={{ fontSize: 10, padding: '4px 8px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                            <button onClick={() => setEditingCode(null)}
                              style={{ fontSize: 10, padding: '4px 6px', background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>x</button>
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: theme.code, fontFamily: 'monospace', marginBottom: 6, cursor: 'pointer', display: 'inline-block' }}
                            onClick={() => { setEditingCode(product.id); setEditCodeValue(product.code); }}
                            title="Düzenlemek için tıkla">
                            {product.code} <span style={{ fontSize: 9, color: theme.textDim, marginLeft: 4 }}>düzenle</span>
                          </div>
                        )}

                        {editingName === product.id ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                            <input value={editNameValue} onChange={e => setEditNameValue(e.target.value)}
                              style={{ flex: 1, padding: '6px 10px', background: theme.input, border: `1px solid ${theme.accent}`, borderRadius: 4, fontSize: 15, fontFamily: 'inherit', fontWeight: 600, color: theme.text }}
                              autoFocus onKeyDown={e => { if (e.key === 'Enter') updateProductName(product.id, editNameValue); }} />
                            <button onClick={() => updateProductName(product.id, editNameValue)}
                              style={{ fontSize: 10, padding: '6px 10px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                            <button onClick={() => setEditingName(null)}
                              style={{ fontSize: 10, padding: '6px 8px', background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>x</button>
                          </div>
                        ) : (
                          <div onClick={() => { setEditingName(product.id); setEditNameValue(product.name); }}
                            title="Düzenlemek için tıkla"
                            style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: theme.text, cursor: 'pointer' }}>
                            {product.name}
                          </div>
                        )}

                        <div style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 10, color: theme.textMuted, marginRight: 6 }}>Fiyat:</span>
                          {editingPrice === product.id ? (
                            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                              <input value={editPriceValue} onChange={e => setEditPriceValue(e.target.value)} type="number"
                                style={{ width: 80, padding: '3px 6px', background: theme.input, border: `1px solid ${dark ? '#6ea8fe' : '#0000FF'}`, borderRadius: 4, fontSize: 12, fontFamily: 'inherit', color: theme.text }}
                                autoFocus onKeyDown={e => { if (e.key === 'Enter') updateProductPrice(product.id, editPriceValue); }} />
                              <button onClick={() => updateProductPrice(product.id, editPriceValue)}
                                style={{ fontSize: 10, padding: '3px 7px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                            </span>
                          ) : (
                            <span onClick={() => { setEditingPrice(product.id); setEditPriceValue(String(product.price || 0)); }}
                              style={{ fontSize: 13, color: dark ? '#6ea8fe' : '#0000FF', cursor: 'pointer', fontWeight: 500 }}>
                              {product.price || 0} TL <span style={{ fontSize: 9, color: theme.textDim }}>düzenle</span>
                            </span>
                          )}
                        </div>

                        {prodColors.length === 0 && (
                          <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: theme.textMuted }}>Stok:</span>
                            {editingMainStock === product.id ? (
                              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                <input value={editMainStockValue} onChange={e => setEditMainStockValue(e.target.value)} type="number"
                                  style={{ width: 54, padding: '3px 6px', background: theme.input, border: `1px solid ${theme.stockText}`, borderRadius: 4, fontSize: 11, fontFamily: 'inherit', textAlign: 'center', color: theme.text }}
                                  autoFocus onKeyDown={e => { if (e.key === 'Enter') updateMainStock(product.id, editMainStockValue); }} />
                                <button onClick={() => updateMainStock(product.id, editMainStockValue)}
                                  style={{ fontSize: 10, padding: '3px 7px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                              </div>
                            ) : (
                              <span onClick={() => { setEditingMainStock(product.id); setEditMainStockValue(String(product.stock || 0)); }}
                                style={{ fontSize: 11, color: theme.stockText, background: theme.stockBg, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>{product.stock || 0} adet</span>
                            )}
                          </div>
                        )}

                        <div>
                          <span style={{ fontSize: 10, color: theme.textMuted, marginRight: 6 }}>Not:</span>
                          {editingNote === product.id ? (
                            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                              <input value={editNoteValue} onChange={e => setEditNoteValue(e.target.value)}
                                style={{ width: 250, padding: '3px 6px', background: theme.input, border: `1px solid ${theme.border}`, borderRadius: 4, fontSize: 11, fontFamily: 'inherit', color: theme.text }}
                                autoFocus onKeyDown={e => { if (e.key === 'Enter') updateProductNote(product.id, editNoteValue); }} />
                              <button onClick={() => updateProductNote(product.id, editNoteValue)}
                                style={{ fontSize: 10, padding: '3px 7px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                            </span>
                          ) : (
                            <span onClick={() => { setEditingNote(product.id); setEditNoteValue(product.note || ''); }}
                              style={{ fontSize: 11, color: theme.textMuted, fontStyle: product.note ? 'italic' : 'normal', cursor: 'pointer' }}>
                              {product.note || <span style={{ color: theme.textDim }}>— ekle</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {prodColors.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Renk Varyantları</div>
                        {prodColors.map(color => (
                          <div key={color.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: theme.variantBg, borderRadius: 6, marginBottom: 3 }}>
                            <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 5, overflow: 'hidden', background: dark ? '#3a2f52' : '#dedaf5' }}>
                              {color.image_url ? <img src={color.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                <ImageUpload src={null} onUpload={(img) => updateColorImage(color.id, img)} size={32} dark={dark} />}
                            </div>
                            <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.variantText, minWidth: 85 }}>{color.code}</span>
                            <span style={{ flex: 1, fontSize: 12, color: theme.variantFull }}>{color.name}</span>
                            {editingStock === color.id ? (
                              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                <input value={editStockValue} onChange={e => setEditStockValue(e.target.value)} type="number"
                                  style={{ width: 44, padding: '3px 5px', background: theme.input, border: `1px solid ${theme.variantText}`, borderRadius: 4, fontSize: 11, fontFamily: 'inherit', textAlign: 'center', color: theme.text }}
                                  autoFocus onKeyDown={e => { if (e.key === 'Enter') updateStock(color.id, editStockValue); }} />
                                <button onClick={() => updateStock(color.id, editStockValue)}
                                  style={{ fontSize: 10, padding: '3px 7px', background: theme.accent, color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                              </div>
                            ) : (
                              <span onClick={() => { setEditingStock(color.id); setEditStockValue(String(color.stock)); }}
                                style={{ fontSize: 11, color: theme.stockText, background: theme.stockBg, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>{color.stock}</span>
                            )}
                            <button onClick={() => deleteColor(color.id)}
                              style={{ fontSize: 13, color: theme.textDim, background: 'transparent', border: 'none', cursor: 'pointer' }}>&#10005;</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddColor === product.id ? (
                      <div style={{ background: theme.statBg, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                          {COLOR_PRESETS.map(c => (
                            <button key={c} onClick={() => setNewColorName(c)}
                              style={{ fontSize: 10, padding: '3px 9px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', background: newColorName === c ? theme.variantText : theme.card, color: newColorName === c ? '#fff' : theme.textMuted, border: newColorName === c ? 'none' : `1px solid ${theme.border}` }}>{c}</button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <ImageUpload src={newColorImage} onUpload={setNewColorImage} size={36} dark={dark} />
                          <input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Renk adı"
                            style={{ flex: 2, padding: '6px 9px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 11, fontFamily: 'inherit', color: theme.text }} />
                          <input value={newColorStock} onChange={e => setNewColorStock(e.target.value)} placeholder="Stok" type="number"
                            style={{ width: 50, padding: '6px 8px', background: theme.input, border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 11, fontFamily: 'inherit', textAlign: 'center', color: theme.text }} />
                          <button onClick={() => addColor(product.id, product.code)}
                            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', background: theme.variantText, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Ekle</button>
                          <button onClick={() => { setShowAddColor(null); setNewColorImage(null); }}
                            style={{ padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', background: 'transparent', color: theme.textMuted, border: `1px solid ${theme.border}`, borderRadius: 6, cursor: 'pointer' }}>x</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setShowAddColor(product.id); setNewColorName(''); setNewColorStock(''); setNewColorImage(null); }}
                        style={{ fontSize: 11, padding: '6px 12px', background: theme.variantBg, color: theme.variantText, border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>+ Renk Ekle</button>
                    )}

                    <div style={{ marginTop: 10, borderTop: `1px solid ${theme.border}`, paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { if (confirm(`"${product.name}" silinecek. Emin misiniz?`)) deleteProduct(product.id); }}
                        style={{ fontSize: 11, padding: '6px 14px', background: '#FDEDEC', color: '#C93B32', border: '1px solid #F5C4C0', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                        onMouseEnter={e => { e.target.style.background = '#C93B32'; e.target.style.color = '#fff'; }}
                        onMouseLeave={e => { e.target.style.background = '#FDEDEC'; e.target.style.color = '#C93B32'; }}>Ürünü Sil</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredProducts.length === 0 && !showAddProduct && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: theme.textDim }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>&#9744;</div>
              <div style={{ fontSize: 12 }}>{searchQuery ? 'Sonuç bulunamadı' : 'Bu kategoride henüz ürün yok'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
