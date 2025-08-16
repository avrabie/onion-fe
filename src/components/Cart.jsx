export default function Cart({ cart, onRemove, onEmpty, onCheckout, loadingAction }) {
  const items = cart?.items || [];
  const total = cart?.totalPrice ?? 0;
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.03] p-4 sm:p-5 flex flex-col gap-3 min-w-80 shadow-card">
      <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
        🧺 Cart <span className="text-sm text-white/60">({items.length} items)</span>
      </h2>
      <div className="divide-y divide-white/10 max-h-80 overflow-auto pr-1">
        {items.length === 0 && (
          <div className="text-white/60 text-sm py-6 text-center">Your cart is empty.</div>
        )}
        {items.map((it) => (
          <div key={it.id ?? `${it.productId}`} className="py-3 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-white">Product #{it.productId}</span>
              <span className="text-xs text-white/60">Qty: {it.quantity}</span>
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
