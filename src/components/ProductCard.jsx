export default function ProductCard({ product, onAdd }) {
  const outOfStock = product.quantity <= 0;
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-white/5 flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
        ) : (
          <span className="text-5xl">🧅</span>
        )}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        <p className="text-sm text-white/70 line-clamp-2">{product.description || 'Delicious onion from the finest fields.'}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xl font-bold text-emerald-300">${product.price?.toFixed ? product.price.toFixed(2) : product.price}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${outOfStock ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
          {outOfStock ? 'Out of stock' : `${product.quantity} in stock`}
        </span>
      </div>
      <button
        disabled={outOfStock}
        onClick={() => onAdd(product)}
        className={`w-full mt-2 py-2 rounded-lg font-medium transition ${outOfStock ? 'bg-gray-600 cursor-not-allowed text-white/60' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
      >
        Add to cart
      </button>
    </div>
  );
}
