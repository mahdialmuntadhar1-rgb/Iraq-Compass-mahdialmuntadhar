/**
 * Iraq Compass - Type Definitions
 */

export type PriceRange = 'budget' | 'mid' | 'premium';

export interface Business {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string; // Category ID
  city: string;     // City ID
  phone: string;
  rating: number;
  reviewCount: number;
  description: string;
  isVerified: boolean;
  isFeatured: boolean;
  imageEmoji: string;
  priceRange: PriceRange;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  color: string;
}

export interface City {
  id: string;
  nameEn: string;
  nameAr: string;
  emoji: string;
  region: string;
}

export interface Deal {
  id: string;
  businessId: string;
  title: string;
  discount: string;
  expiresAt: string; // ISO Date string
}

export interface Event {
  id: string;
  title: string;
  titleAr: string;
  city: string; // City ID
  date: string; // Formatted date string
  category: string;
  emoji: string;
}
