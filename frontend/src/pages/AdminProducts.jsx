import { useState, useEffect, useCallback } from "react";
import { apiFetchProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct, apiSeedProducts } from "@/api/products";

const CATEGORIES = ["botanical", "teas", "matcha", "coffee", "traditional"];
const LIFESTYLES = [
  { id: "launchpad", name: "Launchpad" },
  { id: "steady-focus", name: "Steady Focus & Uplift" },
  { id: "find-your-calm", name: "Find Your Calm" },
  { id: "nourish-flourish", name: "Nourish & Flourish" },
  { id: "ceremonial-indulgence", name: "Ceremonial Indulgence" },
  { id: "sundowners-sleep", name: "Sundowners & Sleep" },
];

const EMPTY_PRODUCT = {
  slug: "",
  name: "",
  subname: "",
  category: "teas",
  tagline: "",
  description: "",
  image: "",
  ingredients: "",
  prep: "",
  notes: "",
  nutrition: "",
  benefits: "",
  packSize: "",
  price: "",
  provenance: "",
  lifestyle: [],
};

function toFormData(p) {
  return {
    ...p,
    ingredients: (p.ingredients || []).join(", "),
    notes: (p.notes || []).join(", "),
    nutrition: (p.nutrition || []).join(", "),
    benefits: (p.benefits || []).join(", "),
    lifestyle: p.lifestyle || [],
    packSize: p.packSize || "",
    price: p.price || "",
    provenance: p.provenance || "",
  };
}

function fromFormData(f) {
  const splitTrim = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  return {
    slug: f.slug.trim(),
    name: f.name.trim(),
    subname: f.subname.trim(),
    category: f.category,
    tagline: f.tagline.trim(),
    description: f.description.trim(),
    image: f.image.trim(),
    ingredients: splitTrim(f.ingredients),
    prep: f.prep.trim(),
    notes: splitTrim(f.notes),
    nutrition: splitTrim(f.nutrition),
    benefits: splitTrim(f.benefits),
    packSize: f.packSize.trim() || null,
    price: f.price.trim() || null,
    provenance: f.provenance.trim() || null,
    lifestyle: f.lifestyle,
  };
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: 4 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6, color: "#999" }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 3,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const taStyle = { ...inputStyle, resize: "vertical", minHeight: 72 };

function ProductForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_PRODUCT);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleLifestyle = (id) => {
    setForm((f) => ({
      ...f,
      lifestyle: f.lifestyle.includes(id)
        ? f.lifestyle.filter((x) => x !== id)
        : [...f.lifestyle, id],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(fromFormData(form));
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
      <Field label="Slug" hint="url-safe, e.g. root-and-leaf">
        <input style={inputStyle} value={form.slug} onChange={set("slug")} required pattern="[a-z0-9-]+" />
      </Field>
      <Field label="Name">
        <input style={inputStyle} value={form.name} onChange={set("name")} required />
      </Field>
      <Field label="Subname" hint="blend line">
        <input style={inputStyle} value={form.subname} onChange={set("subname")} />
      </Field>
      <Field label="Category">
        <select style={inputStyle} value={form.category} onChange={set("category")}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Tagline">
          <input style={inputStyle} value={form.tagline} onChange={set("tagline")} />
        </Field>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Description">
          <textarea style={taStyle} value={form.description} onChange={set("description")} />
        </Field>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Image path" hint="e.g. /images/products/root-and-leaf.jpg">
          <input style={inputStyle} value={form.image} onChange={set("image")} />
        </Field>
      </div>
      <Field label="Ingredients" hint="comma-separated">
        <textarea style={taStyle} value={form.ingredients} onChange={set("ingredients")} />
      </Field>
      <Field label="Prep">
        <textarea style={taStyle} value={form.prep} onChange={set("prep")} />
      </Field>
      <Field label="Tasting notes" hint="comma-separated">
        <input style={inputStyle} value={form.notes} onChange={set("notes")} />
      </Field>
      <Field label="Nutrition" hint="comma-separated">
        <input style={inputStyle} value={form.nutrition} onChange={set("nutrition")} />
      </Field>
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Benefits" hint="comma-separated">
          <input style={inputStyle} value={form.benefits} onChange={set("benefits")} />
        </Field>
      </div>
      <Field label="Pack size" hint="optional">
        <input style={inputStyle} value={form.packSize} onChange={set("packSize")} />
      </Field>
      <Field label="Price" hint="e.g. ₹ 350">
        <input style={inputStyle} value={form.price} onChange={set("price")} />
      </Field>
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Provenance" hint="optional">
          <textarea style={{ ...taStyle, minHeight: 56 }} value={form.provenance} onChange={set("provenance")} />
        </Field>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Field label="Lifestyle groups">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {LIFESTYLES.map((l) => (
              <label key={l.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", padding: "5px 10px", border: `1px solid ${form.lifestyle.includes(l.id) ? "#5A5C37" : "#ccc"}`, borderRadius: 3, background: form.lifestyle.includes(l.id) ? "#5A5C37" : "transparent", color: form.lifestyle.includes(l.id) ? "#fff" : "#333" }}>
                <input type="checkbox" style={{ display: "none" }} checked={form.lifestyle.includes(l.id)} onChange={() => toggleLifestyle(l.id)} />
                {l.name}
              </label>
            ))}
          </div>
        </Field>
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 10, marginTop: 8 }}>
        <button type="submit" disabled={saving} style={{ padding: "9px 22px", background: "#242716", color: "#fff", border: "none", borderRadius: 3, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {saving ? "Saving…" : "Save Product"}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: "9px 22px", background: "transparent", color: "#555", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer", fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // null | "add" | { type: "edit", product }
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    apiFetchProducts()
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => { setError("Could not load products from the API. Is the backend running?"); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (text, isError = false) => {
    setMsg({ text, isError });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSeed = async () => {
    setSaving(true);
    try {
      const res = await apiSeedProducts();
      flash(res.message);
      load();
    } catch {
      flash("Seed failed.", true);
    }
    setSaving(false);
  };

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (mode === "add") {
        await apiCreateProduct(data);
        flash(`"${data.name}" added.`);
      } else {
        await apiUpdateProduct(mode.product.slug, data);
        flash(`"${data.name}" updated.`);
      }
      setMode(null);
      load();
    } catch (e) {
      flash(e?.detail || "Save failed.", true);
    }
    setSaving(false);
  };

  const handleDelete = async (slug, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await apiDeleteProduct(slug);
      flash(`"${name}" deleted.`);
      load();
    } catch {
      flash("Delete failed.", true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f2", fontFamily: "system-ui, sans-serif", padding: "40px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#888", margin: 0 }}>Admin — Staging only</p>
            <h1 style={{ fontSize: 26, fontWeight: 300, color: "#242716", margin: "4px 0 0" }}>Product Manager</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {products.length === 0 && !loading && (
              <button onClick={handleSeed} disabled={saving} style={{ padding: "8px 18px", background: "#5A5C37", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 13 }}>
                Seed from defaults
              </button>
            )}
            <button onClick={() => setMode("add")} style={{ padding: "8px 18px", background: "#242716", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              + Add product
            </button>
          </div>
        </div>

        {/* Flash message */}
        {msg && (
          <div style={{ padding: "10px 16px", marginBottom: 20, borderRadius: 3, background: msg.isError ? "#fde8e8" : "#e8f5e9", color: msg.isError ? "#b71c1c" : "#1b5e20", fontSize: 13 }}>
            {msg.text}
          </div>
        )}

        {/* Form panel */}
        {mode && (
          <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 4, padding: 28, marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 600, color: "#242716" }}>
              {mode === "add" ? "Add new product" : `Edit — ${mode.product.name}`}
            </h2>
            <ProductForm
              initial={mode === "add" ? EMPTY_PRODUCT : toFormData(mode.product)}
              onSave={handleSave}
              onCancel={() => setMode(null)}
              saving={saving}
            />
          </div>
        )}

        {/* Product table */}
        {loading ? (
          <p style={{ color: "#888", fontSize: 14 }}>Loading…</p>
        ) : error ? (
          <div style={{ padding: 20, background: "#fde8e8", borderRadius: 4, color: "#b71c1c", fontSize: 14 }}>{error}</div>
        ) : products.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", background: "#fff", borderRadius: 4, border: "1px solid #eee" }}>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>No products in the database yet.</p>
            <p style={{ color: "#aaa", fontSize: 13, margin: "6px 0 0" }}>Click "Seed from defaults" to load the current 14 products, or add one manually.</p>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f0efe9" }}>
                  {["", "Name", "Category", "Price", "Pack size", "Lifestyle", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", borderBottom: "1px solid #ddd" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => (
                  <tr key={p.slug} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "#fff" : "#fafaf8" }}>
                    <td style={{ padding: "10px 14px", width: 48 }}>
                      {p.image && <img src={p.image} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 2, display: "block" }} />}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <strong style={{ color: "#242716" }}>{p.name}</strong>
                      <div style={{ color: "#888", fontSize: 12, marginTop: 2 }}>{p.subname}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>{p.category}</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>{p.price || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#555" }}>{p.packSize || "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#888", fontSize: 12 }}>{(p.lifestyle || []).join(", ") || "—"}</td>
                    <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                      <button onClick={() => setMode({ type: "edit", product: p })} style={{ padding: "5px 12px", marginRight: 6, background: "transparent", border: "1px solid #5A5C37", color: "#5A5C37", borderRadius: 3, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.slug, p.name)} style={{ padding: "5px 12px", background: "transparent", border: "1px solid #c0392b", color: "#c0392b", borderRadius: 3, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 14px", background: "#f7f6f2", borderTop: "1px solid #eee", fontSize: 12, color: "#999" }}>
              {products.length} product{products.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
