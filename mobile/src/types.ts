// ==============================================================================
// SAHAKARI SEVA MOBILE — TYPES & INTERFACES
// ==============================================================================

export type UserRole = 'customer' | 'worker' | 'admin';
export type AvailabilityStatus = 'available' | 'busy' | 'offline' | 'emergency_only';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'in_progress' | 'completed' | 'scheduled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface CustomerAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface CustomerEmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface AdminProfile {
  id: string;
  officer_name: string;
  designation: string;
  department: string;
  authority_code: string;
  state: string;
  jurisdiction_districts: number;
  affiliated_cooperatives: number;
  statutory_minimum_wage: number;
  mandatory_certification: boolean;
  emergency_mobilization_override: boolean;
  patronage_dividend_rate: number;
  last_audit_date: string;
  integrity_hash: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  profile_photo?: string;
  address?: string;
  city: string;
  state: string;
  pincode: string;
  language: string;
  membership_id?: string;
  total_spent?: number;
  coop_savings?: number;
  welfare_contribution?: number;
  saved_addresses?: CustomerAddress[];
  emergency_contacts?: CustomerEmergencyContact[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  name_hi: string;
  description: string;
  description_hi: string;
  icon: string;
  base_price: number;
  emergency_available: boolean;
  active: boolean;
}

export interface Worker {
  id: string;
  profile_id: string;
  cooperative_id: string;
  worker_code: string;
  skill_category: string;
  skills: string[];
  experience_years: number;
  bio?: string;
  service_area: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  location_updated_at?: string;
  location_accuracy?: number;
  service_radius_km?: number;
  hourly_or_base_rate: number;
  availability_status: AvailabilityStatus;
  verification_status: VerificationStatus;
  average_rating: number;
  total_jobs: number;
  total_earnings: number;
  welfare_status: string;
  insurance_status: string;
  certification_name?: string;
  certification_url?: string;
  verification_notes?: string;

  profile?: Profile;
  cooperative?: {
    id: string;
    name: string;
  };
}

export interface MatchingScoreBreakdown {
  distanceScore: number;
  availabilityScore: number;
  ratingScore: number;
  reliabilityScore: number;
  serviceMatchScore: number;
  totalScore: number;
}

export interface NearbyWorkerResult {
  workerId: string;
  name: string;
  service: string;
  skills: string[];
  latitude: number;
  longitude: number;
  distance_km: number;
  within_radius: boolean;
  rating: number;
  total_jobs: number;
  hourly_rate: number;
  availability: AvailabilityStatus;
  verification: VerificationStatus;
  cooperative_name?: string;
  matchScore: number;
  breakdown: MatchingScoreBreakdown;
  approximate_location: {
    area: string;
    city: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
}

export type ExtraTaskType = 'part' | 'labor' | 'repair';
export type SupplementalBillStatus = 'draft' | 'pending_approval' | 'approved' | 'denied';

export interface ExtraTaskItem {
  id: string;
  title: string;
  description?: string;
  cost: number;
  type: ExtraTaskType;
}

export interface SupplementalBill {
  id: string;
  booking_id: string;
  status: SupplementalBillStatus;
  diagnosis_notes: string;
  items: ExtraTaskItem[];
  subtotal: number;
  total_amount: number;
  created_at: string;
  responded_at?: string;
  denial_reason?: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  customer_id: string;
  worker_id: string;
  service_category_id: string;
  cooperative_id: string;
  booking_date: string;
  booking_time: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  service_description: string;
  estimated_amount: number;
  final_amount: number;
  is_emergency: boolean;
  status: BookingStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;

  completion_requested?: boolean;
  completion_requested_at?: string;
  completion_code?: string;
  completion_qr_payload?: string;

  is_advance_scheduled?: boolean;
  auto_dispatch_lead_hours?: number;
  auto_dispatch_time?: string;

  customer?: Profile;
  worker?: Worker;
  service_category?: ServiceCategory;
  supplemental_bill?: SupplementalBill;
}

export interface DemandForecastRecord {
  id: string;
  location_zone: string;
  service_category: string;
  forecast_date: string;
  forecast_time_window: string;
  predicted_demand: number;
  confidence_score: number;
  confidence_lower_bound?: number;
  confidence_upper_bound?: number;
  model_version: string;
  is_baseline_fallback: boolean;
  status_note?: string;
  generated_at: string;
}

export type AllocationStatus = 'understaffed' | 'balanced' | 'overstaffed';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';

export interface WorkforceAllocation {
  id: string;
  location_zone: string;
  service_category: string;
  target_date: string;
  predicted_demand: number;
  available_workers: number;
  shortage_or_surplus: number;
  allocation_status: AllocationStatus;
  recommended_mobilization: number;
  priority_level: PriorityLevel;
  recommendation_notes: string;
  generated_at: string;
}

export type LocationPermissionState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'manual_fallback';

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'cash' | 'demo';

export interface Rating {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  rating: number;
  feedback?: string;
  tags?: string[];
  customer_name?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference: string;
  status: PaymentStatus;
  payment_gateway: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  customer_id: string;
  worker_id: string;
  subtotal: number;
  platform_fee: number;      // 5%
  cooperative_share: number; // 10%
  worker_amount: number;     // 85%
  tax: number;               // 0%
  total_amount: number;
  generated_at: string;
}

export interface Welfare {
  id: string;
  worker_id: string;
  welfare_scheme: string;
  enrollment_status: 'Active' | 'Pending' | 'Renewed' | 'Expired';
  contribution_balance: number;
  insurance_status: string;
  insurance_provider: string;
  policy_reference?: string;
  valid_until?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

