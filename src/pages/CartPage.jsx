import Cart from '../components/Cart.jsx'

export default function CartPage({ isAuthenticated, cart, products, onRemove, onEmpty, onCheckout, loadingAction, onIncrease, onDecrease }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Cart
        isAuthenticated={isAuthenticated}
        cart={cart}
        products={products}
        onRemove={onRemove}
        onEmpty={onEmpty}
        onCheckout={onCheckout}
        loadingAction={loadingAction}
        onIncrease={onIncrease}
        onDecrease={onDecrease}
      />
    </div>
  );
}
