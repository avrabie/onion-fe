import Cart from '../components/Cart.jsx'

export default function CartPage({ cart, onRemove, onEmpty, onCheckout, loadingAction }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Cart
        cart={cart}
        onRemove={onRemove}
        onEmpty={onEmpty}
        onCheckout={onCheckout}
        loadingAction={loadingAction}
      />
    </div>
  );
}
