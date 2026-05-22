export type PackagePlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  popular: boolean;
};

export const PACKAGES: PackagePlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Begin your MetaOrbit journey with essential earning tools.",
    price: 499,
    durationDays: 30,
    features: [
      "Activate your account",
      "Access basic earning tasks",
      "Daily payout tracking",
      "Standard customer support",
    ],
    popular: false,
  },
  {
    id: "basic",
    name: "Basic",
    description: "Unlock faster earnings and priority payout processing.",
    price: 1499,
    durationDays: 30,
    features: [
      "All Starter features",
      "Higher task limits",
      "Performance analytics",
      "Faster payout approvals",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    description: "Go premium for advanced tools and elite rewards.",
    price: 3499,
    durationDays: 30,
    features: [
      "All Basic features",
      "Priority support",
      "VIP reward campaigns",
      "Early access to new tasks",
    ],
    popular: false,
  },
  {
    id: "vip",
    name: "VIP",
    description: "The full MetaOrbit experience for serious earners.",
    price: 6999,
    durationDays: 30,
    features: [
      "All Premium features",
      "Dedicated account manager",
      "Higher daily earning caps",
      "Exclusive campaign access",
    ],
    popular: false,
  },
];

export const PAYNECTA_BASE_URL =
  process.env.NEXT_PUBLIC_PAYNECTA_URL ||
  "https://paynecta.co.ke/pay/metaorbit";
