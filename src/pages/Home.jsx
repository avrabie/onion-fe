import { useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'
import { Link } from 'react-router-dom'

export default function Home({ products, onAdd, loading, error }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('popular')
  const [category, setCategory] = useState('all')

  const categories = ['all', 'yellow', 'red', 'spring', 'sweet']

  const filtered = useMemo(() => {
    let list = Array.isArray(products) ? products.slice() : []
    // Category filter (naive: checks name includes category)
    if (category !== 'all') {
      const c = category.toLowerCase()
      list = list.filter(p => `${p.category || p.name || ''}`.toLowerCase().includes(c))
    }
    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(p => `${p.name} ${p.description || ''}`.toLowerCase().includes(q))
    }
    // Sort
    if (sort === 'price-asc') list.sort((a,b) => (a.price||0) - (b.price||0))
    if (sort === 'price-desc') list.sort((a,b) => (b.price||0) - (a.price||0))
    if (sort === 'name') list.sort((a,b) => `${a.name}`.localeCompare(`${b.name}`))
    return list
  }, [products, query, sort, category])

  const showSkeletons = loading && (!products || products.length === 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Hero */}
      <section className="mb-6 sm:mb-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-700/40 via-slate-800 to-slate-900 p-6 sm:p-10">
          <div className="relative z-10 max-w-3xl">
            <p className="text-sm text-emerald-200/80 tracking-wider uppercase">Locally sourced • Delivered fast</p>
            <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight flex items-center gap-3">
              <span>Comrade‑approved Soviet Onions</span>
              <span className="hidden sm:inline text-4xl">🧅</span>
            </h1>
            <p className="mt-3 text-white/80 text-sm sm:text-base">From sweet to sharp, stock your pantry with the finest bulbs. Zero tears at checkout.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {categories.slice(1).map((c) => (
                <span key={c} className="px-3 py-1.5 rounded-full text-xs bg-white/10 border border-white/10 text-white/80">{c}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a href="#shop" className="inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/40">Shop Soviet onions</a>
              <Link to="/about" className="inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 px-4 py-2.5 font-medium border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/30">Learn more</Link>
            </div>
            <div className="mt-6 flex gap-6 text-xs text-white/70">
              <div className="flex items-center gap-2"><span>⚡</span><span>Next‑day delivery</span></div>
              <div className="flex items-center gap-2"><span>🌱</span><span>Organic options</span></div>
              <div className="flex items-center gap-2"><span>💳</span><span>Secure checkout</span></div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
        </div>
      </section>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-600/15 border border-red-600/30 text-red-200 text-sm" role="alert">{error}</div>
      )}

      {/* Controls */}
      <section id="shop" className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-white/60">🔎</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Soviet onions…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/50"
              aria-label="Search products"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs border transition ${category === c ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'}`}
                aria-pressed={category === c}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <label htmlFor="sort" className="text-xs text-white/60">Sort</label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="popular">Most popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>
      </section>

      {/* Promo banner */}
      <section className="mb-6 sm:mb-8">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold text-emerald-200">Summer Harvest Sale</p>
            <p className="text-white/80">Get 10% off red Soviet onions. Limited time only — supply convoy pending.</p>
          </div>
          <a href="#shop" className="shrink-0 inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-medium">Shop deals</a>
        </div>
      </section>

      {/* Product grid */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg sm:text-xl font-bold">Browse Soviet onions</h2>
          <span className="text-xs text-white/60">{filtered.length} items</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {showSkeletons && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="aspect-square rounded-xl bg-white/10" />
              <div className="mt-4 h-4 w-2/3 bg-white/10 rounded" />
              <div className="mt-2 h-3 w-1/2 bg-white/10 rounded" />
              <div className="mt-6 h-9 w-full bg-white/10 rounded" />
            </div>
          ))}

          {!showSkeletons && filtered.length === 0 && (
            <div className="col-span-full text-center py-12 border border-white/10 rounded-2xl bg-white/5">
              <div className="text-4xl mb-2">😿</div>
              <p className="text-white/80">No Soviet onions matched the five‑year plan. Adjust filters, comrade.</p>
              <button onClick={() => { setQuery(''); setCategory('all'); setSort('popular'); }} className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500">Reset filters</button>
            </div>
          )}

          {!showSkeletons && filtered.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={onAdd} />
          ))}
        </div>
      </section>
    </div>
  );
}
