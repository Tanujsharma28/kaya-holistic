import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm({ clientSecret, onPaymentSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    // Jab user UPI ya Net Banking select karega, Stripe use uske app/bank page par redirect karega 
    // aur payment ke baad is return_url par wapas le aayega.
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/booking?success=true',
      },
      // Yahan hum 'if_required' hata rahe hain taaki UPI/Netbanking jaise methods ke liye 
      // redirect flow properly trigger ho sake.
    });

    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } 
    // Agar redirect nahi hua aur yahin success ho gaya
    else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      setProcessing(false);
      onPaymentSuccess(result.paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="adm-panel" style={{ maxWidth: "400px", margin: "20px auto" }}>
      <h3>Secure Your Appointment</h3>
      <p className="adm-muted" style={{ marginBottom: "15px" }}>
        A $25 non-refundable deposit is required to hold your slot.
      </p>
      
      <div style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', marginBottom: '20px' }}>
        <PaymentElement 
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
          }} 
        />
      </div>

      {error && <div style={{ color: 'red', marginTop: '10px', fontSize: '0.85rem' }}>{error}</div>}
      
      <button 
        type="submit"
        className="adm-btn" 
        style={{ width: "100%", marginTop: "10px" }} 
        disabled={!stripe || processing}
      >
        {processing ? "Processing $25..." : "Pay $25 Deposit"}
      </button>
    </form>
  );
}
