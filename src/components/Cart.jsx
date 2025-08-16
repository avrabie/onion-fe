export default function Cart({ cart, products = [], onRemove, onEmpty, onCheckout, loadingAction, onIncrease, onDecrease }) {
  const items = cart?.items || [];
  const total = cart?.totalPrice ?? 0;
  // Ensure stable rendering order and names
  const sortedItems = [...items].sort((a, b) => (a.productId ?? 0) - (b.productId ?? 0));
  function getName(productId) {
    return products.find((p) => p.id === productId)?.name || `Product #${productId}`;
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-4 sm:p-5 flex flex-col gap-3 min-w-80 shadow-card">
      <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
        🧺 Cart <span className="text-sm text-white/60">({items.length} items)</span>
      </h2>
      <div className="divide-y divide-white/10 max-h-80 overflow-auto pr-1">
        {items.length === 0 && (
          <div className="text-white/60 text-sm py-6 text-center">Your cart is empty.</div>
        )}
        {sortedItems.map((it) => (
          <div key={it.productId} className="py-3 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-white">{getName(it.productId)}</span>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => onDecrease?.(it.productId)}
                  disabled={loadingAction}
                  className="h-6 w-6 text-sm rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="text-xs text-white/80 w-8 text-center">{it.quantity}</span>
                <button
                  onClick={() => onIncrease?.(it.productId)}
                  disabled={loadingAction}
                  className="h-6 w-6 text-sm rounded bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-300 font-semibold">${(it.totalPrice ?? (it.price * it.quantity)).toFixed(2)}</span>
              <button
                onClick={() => onRemove(it.productId)}
                disabled={loadingAction}
                className="text-xs px-2 py-1 rounded-lg bg-red-600/90 hover:bg-red-600 text-white disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2">
        <span className="text-white/80">Total</span>
        <span className="text-xl font-bold text-emerald-300">${Number(total).toFixed(2)}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onEmpty}
          disabled={items.length === 0 || loadingAction}
          className="flex-1 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white disabled:opacity-50"
        >
          Empty
        </button>
        <button
          onClick={onCheckout}
          disabled={items.length === 0 || loadingAction}
          className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
