export type MemberRole = 'owner' | 'manager' | 'counter' | 'kitchen';
export type RestaurantStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

export interface RestaurantSummary {
  id: string;
  slug: string;
  name: string;
  status: RestaurantStatus;
}

export interface Membership {
  role: MemberRole;
  restaurant: RestaurantSummary;
}

export interface Branding {
  restaurant_id: string;
  logo_path: string | null;
  cover_path: string | null;
  primary_color: string;
  secondary_color: string;
  description: string | null;
  address: string | null;
  contact_phone: string | null;
}

export interface DayHours {
  closed: boolean;
  open: string;
  close: string;
}
export type OpeningHours = Record<string, DayHours>;

export interface RestaurantSettings {
  restaurant_id: string;
  default_language: 'en' | 'as' | 'hi';
  gst_mode: 'inclusive' | 'separate';
  gst_percent: number;
  opening_hours: OpeningHours;
  accepts_dine_in: boolean;
  accepts_takeaway: boolean;
}

export type Lang = 'en' | 'as' | 'hi';
export type I18n = Record<Lang, string>;
