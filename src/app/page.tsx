"use client";

import Link from "next/link";
import {
  Rocket,
  Shield,
  Zap,
  TrendingUp,
  Star,
  ArrowRight,
  Globe,
  Lock,
  DollarSign,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen galaxy-bg text-white">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">
            MetaOrbit Galaxy
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Pricing
          </a>
          <a
            href="#about"
            className="text-gray-300 hover:text-white transition-colors"
          >
            About
          </a>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-gray-300 hover:text-white transition-colors font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 text-center px-6 py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
          <Rocket className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-gray-300">
            The Future of Digital Earning
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Earn in the{" "}
          <span className="gradient-text">MetaOrbit Galaxy</span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of users earning digital assets through our secure,
          transparent, and rewarding ecosystem. Start your journey today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 text-lg w-full sm:w-auto justify-center"
          >
            Start Earning Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 glass text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 text-lg w-full sm:w-auto justify-center hover:bg-white/10"
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">50K+</div>
            <div className="text-gray-400 text-sm mt-1">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">$2M+</div>
            <div className="text-gray-400 text-sm mt-1">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text">99.9%</div>
            <div className="text-gray-400 text-sm mt-1">Uptime</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Why Choose <span className="gradient-text">MetaOrbit</span>?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Built with cutting-edge technology to ensure security, speed, and
            maximum earnings for every user.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              title: "Bank-Grade Security",
              description:
                "Your assets are protected with military-grade encryption and multi-factor authentication.",
              color: "from-blue-500 to-indigo-600",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              description:
                "Process thousands of transactions per second with near-zero latency.",
              color: "from-yellow-500 to-orange-600",
            },
            {
              icon: TrendingUp,
              title: "Maximum Returns",
              description:
                "Optimized earning strategies to maximize your returns in the digital economy.",
              color: "from-green-500 to-emerald-600",
            },
            {
              icon: Globe,
              title: "Global Access",
              description:
                "Access your earnings from anywhere in the world, 24/7, 365 days a year.",
              color: "from-purple-500 to-pink-600",
            },
            {
              icon: Lock,
              title: "Full Control",
              description:
                "You own your assets. No hidden fees, no lock-ins, complete transparency.",
              color: "from-red-500 to-rose-600",
            },
            {
              icon: DollarSign,
              title: "Multiple Revenue Streams",
              description:
                "Diversify your earnings with staking, trading, referrals, and more.",
              color: "from-cyan-500 to-teal-600",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-gray-400 text-lg">
            Choose the plan that works best for you
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "KSh 499",
              features: [
                "Fast activation gateway",
                "Basic earning tasks",
                "Daily payout tracking",
                "Email support",
              ],
              popular: false,
              href: "/register?plan=starter",
            },
            {
              name: "Basic",
              price: "KSh 1,499",
              features: [
                "Higher task limits",
                "Performance analytics",
                "Faster payouts",
                "Priority support",
              ],
              popular: true,
              href: "/register?plan=basic",
            },
            {
              name: "Premium",
              price: "KSh 3,499",
              features: [
                "VIP campaign access",
                "Early task rewards",
                "Priority customer support",
                "Higher earning ceilings",
              ],
              popular: false,
              href: "/register?plan=premium",
            },
          ].map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-b from-indigo-600 to-purple-700 border-2 border-indigo-400"
                  : "glass"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">{plan.price}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-200">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-3 h-3 text-green-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`block text-center font-bold py-3 px-6 rounded-xl transition-all duration-200 ${
                  plan.popular
                    ? "bg-white text-indigo-700 hover:bg-gray-100"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20 text-center">
        <div className="max-w-3xl mx-auto glass rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start <span className="gradient-text">Earning</span>?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Join over 50,000 users already earning in the MetaOrbit Galaxy
            ecosystem.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-200 text-lg"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-gray-400">
        <p>
          © 2024 MetaOrbit Galaxy Earn. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
