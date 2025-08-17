import { Link } from 'react-router-dom'
export default function ProductCard({ product, onAdd }) {
  const outOfStock = product.quantity <= 0;
  const price = product.price?.toFixed ? product.price.toFixed(2) : product.price;
  // Use slug provided by backend API; do not generate locally
  const slug = product?.slug ?? encodeURIComponent(product?.name ?? '');
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] border border-white/10 p-3 sm:p-4 flex flex-col shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
      {/* Image */}
      <Link to={`/product/${slug}`} aria-label={`View details for ${product.name}`} className="relative block aspect-square w-full overflow-hidden rounded-xl bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/40">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🧅</div>
        )}
        {!outOfStock && (
          <span className="absolute left-3 top-3 text-[10px] tracking-wide uppercase px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/20">
            In stock
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 text-[10px] tracking-wide uppercase px-2 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-400/20">
            Out of stock
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex-1 pt-3 sm:pt-4">
        <Link to={`/product/${slug}`} className="text-base sm:text-lg font-semibold text-white leading-snug hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-400/40">{product.name}</Link>
        <p className="mt-1 text-xs sm:text-sm text-white/70 line-clamp-2">{product.description || 'Delicious onion from the finest fields.'}</p>
      </div>

      {/* Footer */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-lg sm:text-xl font-bold text-emerald-300">${price}</span>
          <span className="text-[10px] text-white/50">/ kg</span>
        </div>
        <button
          disabled={outOfStock}
          onClick={() => onAdd(product)}
          className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${outOfStock ? 'bg-gray-600 cursor-not-allowed text-white/60' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
        >
          <span className="hidden sm:inline">Add to cart</span>
          <span className="sm:hidden">Add</span>
          <span>➕</span>
        </button>
      </div>
    </div>
  );
}
