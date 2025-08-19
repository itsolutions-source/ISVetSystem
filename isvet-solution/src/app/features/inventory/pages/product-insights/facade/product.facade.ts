// inventory.facade.ts
import { Injectable, computed, signal } from '@angular/core';
import {
  AuditAction, AuditLogEntry, Batch, InventoryRow, Movement, Product
} from '../models/product.model';
import { AUDIT_LOG, BATCHES, MOVEMENTS, PRODUCTS } from '../mocks/product-mock';
import { daysBetween } from '@shared/utils/utils';

@Injectable({ providedIn: 'root' })
export class InventoryFacade {
  // ===== MOCKS (substitua por chamadas de serviço depois) =====
  readonly products = signal<Product[]>(PRODUCTS);

  readonly batches = signal<Batch[]>(BATCHES);

  readonly movements = signal<Movement[]>(MOVEMENTS);

  readonly auditAllMock = signal<AuditLogEntry[]>(AUDIT_LOG);

  // ===== Derivadas =====
  readonly rows = computed<InventoryRow[]>(() => {
    const byProduct = new Map<string, { total: number; nearest?: string }>();
    const today = new Date();

    for (const b of this.batches()) {
      const entry = byProduct.get(b.productId) ?? { total: 0, nearest: undefined };
      entry.total += b.quantity;
      if (!entry.nearest || new Date(b.expiresAt) < new Date(entry.nearest)) entry.nearest = b.expiresAt;
      byProduct.set(b.productId, entry);
    }

    const lastMovement = new Map<string, string>();
    for (const mv of this.movements()) {
      const prev = lastMovement.get(mv.productId);
      if (!prev || new Date(mv.createdAt) > new Date(prev)) lastMovement.set(mv.productId, mv.createdAt);
    }

    const soonDays = 30; // valor default; o componente pai pode filtrar com outro cutoff
    return this.products().map((p) => {
      const totals  = byProduct.get(p.id) ?? { total: 0, nearest: undefined };
      const nearest = totals.nearest;
      const totalQty = totals.total;
      const belowMin = totalQty < p.minStock;

      const expired = nearest ? new Date(nearest) < today : false;
      const expiringSoon = nearest ? !expired && daysBetween(today, new Date(nearest)) <= soonDays : false;
      const lastMovementAt = lastMovement.get(p.id);

      return { product: p, totalQty, nearestExpiry: nearest, lastMovementAt, belowMin, expired, expiringSoon } as InventoryRow;
    });
  });

  // ===== API fake para salvar =====
  saveProductMock(payload: unknown) {
    console.log('[InventoryFacade] salvar (mock):', payload);
  }

  // helpers para rótulos/severity (opcional)
  labelForAction(a: AuditAction): string {
    switch (a) {
      case 'PRODUCT_CREATED': return 'Cadastro';
      case 'PRODUCT_UPDATED': return 'Edição';
      case 'STOCK_IN':        return 'Entrada';
      case 'STOCK_OUT':       return 'Retirada';
      case 'STOCK_ADJUST':    return 'Ajuste';
      default:                return a;
    }
  }
  severityForAction(a: AuditAction): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    switch (a) {
      case 'PRODUCT_CREATED': return 'success';
      case 'PRODUCT_UPDATED': return 'info';
      case 'STOCK_IN':        return 'success';
      case 'STOCK_OUT':       return 'warning';
      case 'STOCK_ADJUST':    return 'secondary';
      default:                return 'info';
    }
  }
}
