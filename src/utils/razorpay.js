import { paymentService } from '../services';

const SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';
let loading = null;
/** Load Razorpay's checkout script once. */
function loadCheckout() {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = SCRIPT; s.async = true; s.onload = resolve;
      s.onerror = () => { loading = null; reject(new Error('Could not load the payment window. Check your connection and try again.')); };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Thrown when the person closes the payment window without paying. Not an error to show in red. */
export class PaymentCancelled extends Error { constructor() { super('Payment cancelled.'); this.name = 'PaymentCancelled'; } }

/**
 * Pay for a top-up ({ kind: 'topup', amount }) or a plan ({ kind: 'plan', planId }).
 * The server creates the order and the amount; Razorpay Checkout collects the money; the server verifies the signature and credits.
 * Resolves with the verify result ({ wallet, plans, ... }). Rejects with PaymentCancelled if the window is closed.
 */
export async function pay(body, user) {
  const { data: o } = await paymentService.createOrder(body);
  if (o.provider === 'demo') return (await paymentService.verify({ orderId: o.orderId })).data; // no gateway in demo mode

  await loadCheckout();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay({
      key: o.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency, name: o.name, description: o.description,
      prefill: { name: user && user.name, email: user && user.email },
      theme: { color: '#12285E' },
      handler: async (res) => {
        try { resolve((await paymentService.verify({ orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature })).data); } catch (e) { reject(e); }
      },
      modal: { ondismiss: () => reject(new PaymentCancelled()) }
    });
    rz.on('payment.failed', (r) => reject(new Error((r.error && r.error.description) || 'The payment failed. You have not been charged.')));
    rz.open();
  });
}
