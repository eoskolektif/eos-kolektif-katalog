import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';

const CATEGORIES = [
  { id: 'KLY', name: 'Kolyeler' },
  { id: 'KPE', name: 'Küpeler' },
  { id: 'BLK', name: 'Bileklikler' },
  { id: 'YZK', name: 'Yüzükler' },
  { id: 'DEK', name: 'Dekorasyon' },
  { id: 'TBL', name: 'Tablolar' },
  { id: 'AKS', name: 'Aksesuarlar' },
  { id: 'KSL', name: 'Kişiye Özel' },
];

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

function ImageUpload({ src, onUpload, size = 56 }) {
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
    <label htmlFor={inputId} style={{ cursor: 'pointer', display: 'block', width: size, height: size, minWidth: size, borderRadius: 8, overflow: 'hidden', background: '#f5f3ee', border: '1px dashed #ddd', position: 'relative' }}>
      {uploading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 9, color: '#888' }}>yükleniyor</div>
      ) : src ? (
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', flexDirection: 'column' }}>
          <span style={{ fontSize: 18, color: '#ccc', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: 8, color: '#bbb', marginTop: 2 }}>foto</span>
        </div>
      )}
      <input id={inputId} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </label>
  );
}

export default function App() {
  const [activeCategory, setActiveCategory] = useState('KLY');
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState({});
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductNote, setNewProductNote] = useState('');
  const [newProductImage, setNewProductImage] = useState(null);
  const [showAddColor, setShowAddColor] = useState(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorStock, setNewColorStock] = useState('');
  const [newColorImage, setNewColorImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingStock, setEditingStock] = useState(null);
  const [editStockValue, setEditStockValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadProducts(); }, [activeCategory]);

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
      } else {
        setColors({});
      }
    }
    setLoading(false);
  }

  function getNextCode() {
    if (products.length === 0) return `${activeCategory}-1001`;
    const nums = products.map(p => parseInt(p.code.split('-')[1])).filter(n => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 1000;
    return `${activeCategory}-${max + 1}`;
  }

  async function addProduct() {
    if (!newProductName.trim()) return;
    const code = getNextCode();
    const { error } = await supabase.from('products').insert({
      category: activeCategory, code, name: newProductName.trim(),
      price: newProductPrice ? parseFloat(newProductPrice) : 0,
      note: newProductNote.trim() || null,
      image_url: newProductImage || null,
    });
    if (error) { alert('Hata: ' + error.message); return; }
    setNewProductName(''); setNewProductPrice(''); setNewProductNote(''); setNewProductImage(null); setShowAddProduct(false);
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

  const totalStock = (pid) => (colors[pid] || []).reduce((s, c) => s + (c.stock || 0), 0);
  const filteredProducts = searchQuery.trim() ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.code.toLowerCase().includes(searchQuery.toLowerCase())) : products;
  const allVariants = Object.values(colors).flat().length;
  const allStock = products.reduce((s, p) => s + totalStock(p.id), 0);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", maxWidth: 900, margin: '0 auto', padding: '0.5rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75' }}></div>
        <span style={{ fontSize: 11, color: '#888', letterSpacing: 2, textTransform: 'uppercase' }}>Eos Kolektif Ürün Kataloğu</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setExpandedProduct(null); setShowAddProduct(false); setSearchQuery(''); }}
            style={{ padding: '7px 14px', fontSize: 12, fontWeight: activeCategory === cat.id ? 600 : 400, fontFamily: 'inherit', background: activeCategory === cat.id ? '#2C2C2A' : 'transparent', color: activeCategory === cat.id ? '#fff' : '#666', border: activeCategory === cat.id ? 'none' : '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>Ürün</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{products.length}</div>
        </div>
        <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>Varyant</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{allVariants}</div>
        </div>
        <div style={{ background: '#f8f7f4', borderRadius: 8, padding: '10px 16px', flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>Stok</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#1D9E75' }}>{allStock}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddProduct(!showAddProduct)}
          style={{ padding: '9px 18px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: '#2C2C2A', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
          + Yeni Ürün
        </button>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ürün ara..."
          style={{ flex: 1, minWidth: 150, padding: '8px 12px', border: '1px solid #eee', borderRadius: 7, fontSize: 12, fontFamily: 'inherit' }} />
      </div>

      {showAddProduct && (
        <div style={{ background: '#fefcf6', border: '1px solid #e8e4d9', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
            <ImageUpload src={newProductImage} onUpload={setNewProductImage} size={72} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: 150 }}>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 3 }}>Ürün Adı</div>
                  <input value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="Ürün adını girin"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1, minWidth: 80 }}>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 3 }}>Alış Fiyatı (TL)</div>
                  <input value={newProductPrice} onChange={e => setNewProductPrice(e.target.value)} placeholder="0" type="number"
                    style={{ width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#999', marginBottom: 3 }}>Not</div>
                <input value={newProductNote} onChange={e => setNewProductNote(e.target.value)} placeholder="Opsiyonel"
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12, fontFamily: 'inherit' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={addProduct} style={{ padding: '7px 18px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Kaydet</button>
            <button onClick={() => setShowAddProduct(false)} style={{ padding: '7px 14px', fontSize: 12, fontFamily: 'inherit', background: 'transparent', color: '#999', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>İptal</button>
            <span style={{ fontSize: 10, color: '#bbb', marginLeft: 8 }}>Kod: {getNextCode()}</span>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888', fontSize: 13 }}>Yükleniyor...</div>
      ) : (
        <div>
          {filteredProducts.map(product => {
            const isExpanded = expandedProduct === product.id;
            const ts = totalStock(product.id);
            const prodColors = colors[product.id] || [];
            return (
              <div key={product.id} style={{ border: '1px solid #eee', borderRadius: 10, marginBottom: 6, overflow: 'hidden' }}>
                <div onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isExpanded ? '#fafaf8' : '#fff' }}>
                  <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 6, overflow: 'hidden', background: '#f5f3ee' }}>
                    {product.image_url ? <img src={product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ddd', fontSize: 16 }}>&#9633;</div>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#993C1D', fontFamily: 'monospace', minWidth: 70 }}>{product.code}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#2C2C2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
                  {product.price > 0 && <span style={{ fontSize: 11, color: '#888' }}>{product.price} TL</span>}
                  <span style={{ fontSize: 10, color: prodColors.length > 0 ? '#534AB7' : '#ccc', background: prodColors.length > 0 ? '#EEEDFE' : '#f5f5f5', padding: '2px 7px', borderRadius: 4 }}>{prodColors.length} renk</span>
                  <span style={{ fontSize: 10, color: ts > 0 ? '#0F6E56' : '#ccc', background: ts > 0 ? '#E1F5EE' : '#f5f5f5', padding: '2px 7px', borderRadius: 4 }}>{ts}</span>
                  <span style={{ fontSize: 14, color: '#ccc', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>&#9662;</span>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: '1px solid #eee', padding: '12px 14px', background: '#fdfcfa' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <ImageUpload src={product.image_url} onUpload={(img) => updateProductImage(product.id, img)} size={80} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#993C1D', fontFamily: 'monospace', marginBottom: 4 }}>{product.code}</div>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{product.name}</div>
                        {product.price > 0 && <div style={{ fontSize: 13, color: '#0000FF' }}>{product.price} TL</div>}
                        {product.note && <div style={{ fontSize: 11, color: '#999', marginTop: 4, fontStyle: 'italic' }}>{product.note}</div>}
                      </div>
                    </div>

                    {prodColors.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: '#999', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Renk Varyantları</div>
                        {prodColors.map(color => (
                          <div key={color.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#EEEDFE', borderRadius: 6, marginBottom: 3 }}>
                            <div style={{ width: 32, height: 32, minWidth: 32, borderRadius: 5, overflow: 'hidden', background: '#dedaf5' }}>
                              {color.image_url ? <img src={color.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                <ImageUpload src={null} onUpload={(img) => updateColorImage(color.id, img)} size={32} />}
                            </div>
                            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#534AB7', minWidth: 85 }}>{color.code}</span>
                            <span style={{ flex: 1, fontSize: 12, color: '#3C3489' }}>{color.name}</span>
                            {editingStock === color.id ? (
                              <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                <input value={editStockValue} onChange={e => setEditStockValue(e.target.value)} type="number"
                                  style={{ width: 44, padding: '3px 5px', border: '1px solid #AFA9EC', borderRadius: 4, fontSize: 11, fontFamily: 'inherit', textAlign: 'center' }}
                                  autoFocus onKeyDown={e => { if (e.key === 'Enter') updateStock(color.id, editStockValue); }} />
                                <button onClick={() => updateStock(color.id, editStockValue)}
                                  style={{ fontSize: 10, padding: '3px 7px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>OK</button>
                              </div>
                            ) : (
                              <span onClick={() => { setEditingStock(color.id); setEditStockValue(String(color.stock)); }}
                                style={{ fontSize: 11, color: '#0F6E56', background: '#E1F5EE', padding: '2px 8px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>{color.stock}</span>
                            )}
                            <button onClick={() => deleteColor(color.id)}
                              style={{ fontSize: 13, color: '#ddd', background: 'transparent', border: 'none', cursor: 'pointer' }}>&#10005;</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {showAddColor === product.id ? (
                      <div style={{ background: '#f8f7f4', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                          {COLOR_PRESETS.map(c => (
                            <button key={c} onClick={() => setNewColorName(c)}
                              style={{ fontSize: 10, padding: '3px 9px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', background: newColorName === c ? '#534AB7' : '#fff', color: newColorName === c ? '#fff' : '#666', border: newColorName === c ? 'none' : '1px solid #ddd' }}>{c}</button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <ImageUpload src={newColorImage} onUpload={setNewColorImage} size={36} />
                          <input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Renk adı"
                            style={{ flex: 2, padding: '6px 9px', border: '1px solid #ddd', borderRadius: 6, fontSize: 11, fontFamily: 'inherit' }} />
                          <input value={newColorStock} onChange={e => setNewColorStock(e.target.value)} placeholder="Stok" type="number"
                            style={{ width: 50, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 11, fontFamily: 'inherit', textAlign: 'center' }} />
                          <button onClick={() => addColor(product.id, product.code)}
                            style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, fontFamily: 'inherit', background: '#534AB7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Ekle</button>
                          <button onClick={() => { setShowAddColor(null); setNewColorImage(null); }}
                            style={{ padding: '6px 8px', fontSize: 11, fontFamily: 'inherit', background: 'transparent', color: '#999', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>x</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setShowAddColor(product.id); setNewColorName(''); setNewColorStock(''); setNewColorImage(null); }}
                        style={{ fontSize: 11, padding: '6px 12px', background: '#EEEDFE', color: '#534AB7', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>+ Renk Ekle</button>
                    )}

                    <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                      <button onClick={() => { if (confirm(`"${product.name}" silinecek. Emin misiniz?`)) deleteProduct(product.id); }}
                        style={{ fontSize: 10, padding: '4px 10px', background: 'transparent', color: '#ccc', border: '1px solid #eee', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>Ürünü Sil</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredProducts.length === 0 && !showAddProduct && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#ccc' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>&#9744;</div>
              <div style={{ fontSize: 12 }}>{searchQuery ? 'Sonuç bulunamadı' : 'Bu kategoride henüz ürün yok'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
