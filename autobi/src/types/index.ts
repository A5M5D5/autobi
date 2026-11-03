export type UserRole = 'Employee' | 'Authorized' | 'Manager';

export type Language = 'ar' | 'en';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  nameAr: string;
  nameEn: string;
}

export interface Branch {
  id: string;
  branch_name: string;
  branch_name_ar: string;
  location: string;
}

export interface VehicleCosts {
  purchase_price: number;
  shipping_fees: number;
  customs: number;
  reconditioning_cost: number;
  total_cost: number;
}

export interface MaintenanceRecord {
  date: string;
  service: string;
  service_ar: string;
  cost: number;
}

export interface OdometerRecord {
  date: string;
  reading: number;
}

export interface VehicleHistory {
  accidents_record: string;
  maintenance_history: MaintenanceRecord[];
  odometer_readings: OdometerRecord[];
}

export interface Vehicle {
  id: string;
  vin: string;
  branch_id: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  mileage: number;
  transmission: 'Automatic' | 'Manual';
  fuel_type: 'Gasoline' | 'Hybrid' | 'Electric' | 'Diesel';
  color: string;
  status: 'Available' | 'Sold' | 'Reserved' | 'In-Transit';
  days_on_lot: number;
  selling_price: number;
  target_discount: number;
  image_url: string;
  costs: VehicleCosts;
  history: VehicleHistory;
  created_at: string;
}

export type AcquisitionChannel =
  | 'معارض الحبيبية / البياع'
  | 'سوق مريدي / فيسبوك'
  | 'توصيات وزبائن دائميين'
  | 'إعلانات إنستغرام';

export interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  acquisition_channel: AcquisitionChannel | string;
}

export interface Deal {
  id: string;
  customer_id: string;
  vehicle_id: string;
  employee_id: string;
  pipeline_stage: 'Lead' | 'Test Drive' | 'Negotiation' | 'Closed';
  deal_value: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  vehicle_id: string;
  customer_id: string;
  final_sale_price: number;
  currency: 'USD' | 'SAR' | 'AED' | 'IQD';
  exchange_rate: number;
  front_end_profit: number;
  back_end_profit: number;
  fni_notes: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action_type: string;
  details: string;
  timestamp: string;
}

export interface BIMetrics {
  totalVehicles: number;
  availableCount: number;
  soldCount: number;
  averageDaysOnLot?: number;
  averageVariancePct?: number;
  generatedAt?: string;
  access?: {
    role: UserRole;
    costVisibility: 'full' | 'restricted';
    branch: string;
  };
  totalCapitalLocked: number;
  stagnantCapital: number;
  stagnantCapitalRatio: number;
  totalDailyHoldingCost: number;
  agingAlertsCount: number;
  agingAlertVehicles: Array<{
    id: string;
    vin: string;
    make: string;
    model: string;
    year: number;
    days_on_lot: number;
    selling_price: number;
    total_cost: number;
  }>;
  totalFrontEndProfit: number;
  totalBackEndProfit: number;
  fniRatioPct: number;
  elasticityBrackets: Array<{
    bracket: string;
    avgDays: number;
    volume: number;
  }>;
  valuationVariance: Array<{
    model: string;
    estimatedIntake: number;
    actualIntake: number;
    variancePct: number;
  }>;
  channelPerformance: Array<{
    channel: string;
    leads: number;
    closed: number;
    conversionRate: number;
  }>;
  pipelineCounts: {
    Lead: number;
    'Test Drive': number;
    Negotiation: number;
    Closed: number;
  };
}
