export interface KpiCounts {
  expiringSoon: number;
  expired: number;
  belowMin: number;
  noMovement: number;
}

export type OptionValue = string | number | boolean | null;

export interface Option<T extends OptionValue = string> {
  label: string;
  value: T;
}

export type KpiFilter = 'expiringSoon' | 'expired' | 'belowMin' | 'noMovement';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  unit: string;
  minStock: number;
  active: boolean;
  manufacturer?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Batch {
  id: string;
  productId: string;
  lot: string;
  expiresAt: string;
  quantity: number;
}
export interface Movement {
  id: string;
  productId: string;
  type: string;
  quantity: number;
  batchId?: string;
  createdAt: string;
  reason?: string;
}
export interface InventoryRow {
  product: Product;
  totalQty: number;
  nearestExpiry?: string;
  lastMovementAt?: string;
  belowMin: boolean;
  expired: boolean;
  expiringSoon: boolean;
}

export type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'STOCK_ADJUST';

export type AuditSeverity =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'secondary';

export interface AuditLogEntry {
  id: string;
  productId: string;
  action: AuditAction;
  qty?: number;
  batch?: string | null;
  before?: unknown;
  after?: unknown;
  actorId: string;
  actorName: string;
  occurredAt: string;
  note?: string;
}

export type ProductForm = {
  id: string;
  name: string;
  barcode: string;
  unit: string | null;
  manufacturer: string;
  category: string | null;
  active: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  description: string;

  currentQty: number;
  minStock: number;
  nearestExpiry: Date | null;

  idealStock: number | null;
  excessStock: number | null;
  estimatedDurationDays: number | null;
};

export type LotRow = { lot: string; expiresAt: Date | null; quantity: number };

export interface StockSummary {
  ideal: number;
  excess: number;
  estimatedDurationDays: number;
}

export interface BatchRow {
  lot: string;
  expiresAt: string | Date;
  quantity: number;
}

export interface OutgoRow {
  month: string; // ex.: '07/2025'
  total: number;
}

export interface InboundRow {
  date: string; // ex.: '21/07/2025'
  lot: string;
  qty: number;
}
