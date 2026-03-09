import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_placeholder', {
  apiVersion: '2026-02-25.clover',
  typescript: true,
})

// Price IDs from Stripe Dashboard — set in env vars
export const STRIPE_PRICES = {
  // Regular prices
  monthly: process.env.STRIPE_PRICE_MONTHLY!,   // 1,00 €/Einheit/Monat
  yearly: process.env.STRIPE_PRICE_YEARLY!,     // 0,85 €/Einheit/Monat
  // Founder prices (Year 1 discount)
  founderMonthly: process.env.STRIPE_PRICE_FOUNDER_MONTHLY!, // 0,50 €/Einheit/Monat
  founderYearly: process.env.STRIPE_PRICE_FOUNDER_YEARLY!,   // 0,43 €/Einheit/Monat
  // One-time setup fee
  setupFee: process.env.STRIPE_PRICE_SETUP_FEE!,             // 349 € (Gründer) or 699 €
}

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://zerodamage.de'
