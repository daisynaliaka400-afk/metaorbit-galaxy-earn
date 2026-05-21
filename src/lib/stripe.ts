import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

export const getStripeJs = async () => {
  const { loadStripe } = await import("@stripe/stripe-js");
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for getting started",
    price: 9.99,
    priceId: "price_starter", // Replace with actual Stripe price ID
    features: [
      "Up to 100 transactions/month",
      "Basic analytics",
      "Email support",
      "1 wallet",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For serious earners",
    price: 29.99,
    priceId: "price_pro", // Replace with actual Stripe price ID
    features: [
      "Unlimited transactions",
      "Advanced analytics",
      "Priority support",
      "5 wallets",
      "API access",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 99.99,
    priceId: "price_enterprise", // Replace with actual Stripe price ID
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "Unlimited wallets",
      "White-label options",
    ],
    popular: false,
  },
];
