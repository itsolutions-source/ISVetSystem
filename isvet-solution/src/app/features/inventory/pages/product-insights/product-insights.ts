import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import { CommonComponentsModule } from '@shared/common-components-module';
import { ProductCrud } from './components/product-crud/product-crud';
import { ProductDetails } from './components/product-details/product-details';
import { ProductFilters } from './components/product-filter/product-filter';
import { ProductKpi } from './components/product-kpi/product-kpi';
import { ProductLogs } from './components/product-logs/product-logs';
import { ProductTable } from './components/product-table/product-table';
import {
  AuditAction,
  AuditLogEntry,
  AuditSeverity,
  Batch,
  InventoryRow,
  KpiCounts,
  LotRow,
  Movement,
  Product,
  ProductForm,
} from './models/product.model';

import {
  addDays,
  daysBetween,
  normalize,
} from '../../../../shared/utils/utils';
import { BATCHES, MOVEMENTS, PRODUCTS } from './mocks/product-mock';

@Component({
  selector: 'app-catalog-insights',
  standalone: true,
  imports: [
    CommonComponentsModule,
    ProductKpi,
    ProductFilters,
    ProductTable,
    ProductDetails,
    ProductLogs,
    ProductCrud,
  ],
  templateUrl: './product-insights.html',
  styleUrls: ['./product-insights.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInsights {
  // filtro pelos cards (controlado pelo filho via (select))
  activeKpiFilter:
    | 'expiringSoon'
    | 'expired'
    | 'belowMin'
    | 'noMovement'
    | null = null;

  // ================= Mock (substitua por serviços depois) =================
  private readonly products = signal<Product[]>(PRODUCTS);

  private readonly batches = signal<Batch[]>(BATCHES);

  private readonly movements = signal<Movement[]>(MOVEMENTS);

  // ================= Filtros =================
  search = '';
  selectedCategories: string[] = [];
  statusFilter: 'todos' | 'ativos' | 'inativos' = 'todos';
  onlyBelowMin = false; // (sem UI, mas usado na filtragem)
  expiringWithinDays = 30;

  get categoryOptions() {
    const set = new Set(this.products().map((p) => p.category));
    return Array.from(set)
      .sort()
      .map((c) => ({ label: c, value: c }));
  }

  statusOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'Ativos', value: 'ativos' },
    { label: 'Inativos', value: 'inativos' },
  ];

  // ================= Linhas base (computed) =================
  readonly rows = computed<InventoryRow[]>(() => {
    const byProduct = new Map<string, { total: number; nearest?: string }>();
    const today = new Date();

    for (const b of this.batches()) {
      const entry = byProduct.get(b.productId) ?? {
        total: 0,
        nearest: undefined,
      };
      entry.total += b.quantity;
      if (!entry.nearest || new Date(b.expiresAt) < new Date(entry.nearest))
        entry.nearest = b.expiresAt;
      byProduct.set(b.productId, entry);
    }

    const lastMovementByProduct = new Map<string, string>();
    for (const mv of this.movements()) {
      const prev = lastMovementByProduct.get(mv.productId);
      if (!prev || new Date(mv.createdAt) > new Date(prev))
        lastMovementByProduct.set(mv.productId, mv.createdAt);
    }

    const soonDays = this.expiringWithinDays;
    return this.products().map((p) => {
      const totals = byProduct.get(p.id) ?? { total: 0, nearest: undefined };
      const nearest = totals.nearest;
      const totalQty = totals.total;
      const belowMin = totalQty < p.minStock;

      const expired = nearest ? new Date(nearest) < today : false;
      const expiringSoon = nearest
        ? !expired && daysBetween(today, new Date(nearest)) <= soonDays
        : false;

      const lastMovementAt = lastMovementByProduct.get(p.id);

      return {
        product: p,
        totalQty,
        nearestExpiry: nearest,
        lastMovementAt,
        belowMin,
        expired,
        expiringSoon,
      } as InventoryRow;
    });
  });

  // ================= KPIs (computed) =================
  readonly kpiExpired = computed(
    () => this.rows().filter((r) => r.expired).length
  );
  readonly kpiExpiringSoon = computed(
    () => this.rows().filter((r) => r.expiringSoon && !r.expired).length
  );
  readonly kpiBelowMin = computed(
    () => this.rows().filter((r) => r.belowMin).length
  );
  readonly kpiNoMovement = computed(() => {
    const cutoff = addDays(new Date(), -60);
    return this.rows().filter(
      (r) => !r.lastMovementAt || new Date(r.lastMovementAt) < cutoff
    ).length;
  });

  readonly kpi = computed<KpiCounts>(() => ({
    expired: this.kpiExpired(),
    expiringSoon: this.kpiExpiringSoon(),
    belowMin: this.kpiBelowMin(),
    noMovement: this.kpiNoMovement(),
  }));

  // ================= Filtradas (getter) =================
  get filteredRows(): InventoryRow[] {
    const q = normalize(this.search);
    const cats = this.selectedCategories;
    const status = this.statusFilter;
    const belowOnly = this.onlyBelowMin;

    const base = this.rows().filter((r) => {
      if (
        q &&
        !(
          normalize(r.product.name).includes(q) ||
          r.product.barcode.includes(q)
        )
      )
        return false;
      if (cats.length > 0 && !cats.includes(r.product.category)) return false;
      if (status === 'ativos' && !r.product.active) return false;
      if (status === 'inativos' && r.product.active) return false;
      if (belowOnly && !r.belowMin) return false;
      return true;
    });

    if (!this.activeKpiFilter) return base;

    const cutoff = addDays(new Date(), -60);
    switch (this.activeKpiFilter) {
      case 'expired':
        return base.filter((r) => r.expired);
      case 'expiringSoon':
        return base.filter((r) => r.expiringSoon && !r.expired);
      case 'belowMin':
        return base.filter((r) => r.belowMin);
      case 'noMovement':
        return base.filter(
          (r) => !r.lastMovementAt || new Date(r.lastMovementAt) < cutoff
        );
    }
  }

  // ================= Drawer de Detalhe =================
  detailVisible = false;
  selectedRow: InventoryRow | null = null;

  openDetails(row: InventoryRow): void {
    this.selectedRow = row;
    this.detailVisible = true;
  }
  closeDetails(): void {
    this.detailVisible = false;
    this.selectedRow = null;
  }

  // ================= Ações UI =================
  clearFilters(): void {
    this.search = '';
    this.selectedCategories = [];
    this.statusFilter = 'todos';
    this.onlyBelowMin = false;
  }

  // ---- Helpers para o Drawer full ----
  get batchesByProduct() {
    if (!this.selectedRow) return [];
    return this.batches().filter(
      (b) => b.productId === this.selectedRow!.product.id
    );
  }

  get stockSummary() {
    const total = this.selectedRow?.totalQty ?? 0;
    const monthlyDemand = this.priceSummary.monthlyDemand; // mock simples
    return {
      ideal: Math.max(total, (this.selectedRow?.product.minStock ?? 0) * 2),
      excess: Math.max(0, total - (this.selectedRow?.product.minStock ?? 0)),
      estimatedDurationDays: Math.round(
        (total / Math.max(1, monthlyDemand)) * 30
      ),
      monthlyAvg: monthlyDemand,
    };
  }

  // mock simples usado no cálculo acima
  private priceSummary = { monthlyDemand: 1 };

  get outgoSummary() {
    return [
      { month: 'Mai', total: 3 },
      { month: 'Jun', total: 0 },
      { month: 'Jul', total: 0 },
    ];
  }

  get inboundSummary() {
    return [{ date: '2025-06-22', lot: 'L-E', qty: 6 }];
  }

  // ================= Audit Drawer =================
  auditVisible = false;

  auditActionOptions = [
    { label: 'Cadastro', value: 'PRODUCT_CREATED' as AuditAction },
    { label: 'Edição', value: 'PRODUCT_UPDATED' as AuditAction },
    { label: 'Entrada', value: 'STOCK_IN' as AuditAction },
    { label: 'Retirada', value: 'STOCK_OUT' as AuditAction },
    { label: 'Ajuste', value: 'STOCK_ADJUST' as AuditAction },
  ];

  auditFrom?: Date;
  auditTo?: Date;
  auditActions: AuditAction[] = [];
  auditActor = '';

  private auditAllMock: AuditLogEntry[] = [
    {
      id: '1',
      productId: 'p1',
      action: 'PRODUCT_CREATED',
      actorId: 'u1',
      actorName: 'Admin',
      occurredAt: '2025-01-10T09:12:00Z',
      note: 'Cadastro inicial',
    },
    {
      id: '2',
      productId: 'p1',
      action: 'STOCK_IN',
      qty: 50,
      batch: 'L-A',
      actorId: 'u2',
      actorName: 'João',
      occurredAt: '2025-07-20T13:00:00Z',
    },
    {
      id: '3',
      productId: 'p1',
      action: 'STOCK_OUT',
      qty: 8,
      actorId: 'u3',
      actorName: 'Maria',
      occurredAt: '2025-08-10T10:30:00Z',
      note: 'Atendimento #123',
    },
    {
      id: '4',
      productId: 'p1',
      action: 'PRODUCT_UPDATED',
      actorId: 'u1',
      actorName: 'Admin',
      occurredAt: '2025-08-01T16:45:00Z',
      note: 'Atualização de cadastro',
    },
    {
      id: '5',
      productId: 'p2',
      action: 'STOCK_OUT',
      qty: 5,
      actorId: 'u4',
      actorName: 'Carlos',
      occurredAt: '2025-05-01T11:20:00Z',
    },
    {
      id: '6',
      productId: 'p2',
      action: 'STOCK_IN',
      qty: 4,
      batch: 'L-D',
      actorId: 'u2',
      actorName: 'João',
      occurredAt: '2025-07-02T15:10:00Z',
    },
    {
      id: '7',
      productId: 'p3',
      action: 'STOCK_IN',
      qty: 6,
      batch: 'L-E',
      actorId: 'u2',
      actorName: 'João',
      occurredAt: '2025-06-22T09:00:00Z',
    },
  ];

  auditLabel(a: AuditAction): string {
    switch (a) {
      case 'PRODUCT_CREATED':
        return 'Cadastro';
      case 'PRODUCT_UPDATED':
        return 'Edição';
      case 'STOCK_IN':
        return 'Entrada';
      case 'STOCK_OUT':
        return 'Retirada';
      case 'STOCK_ADJUST':
        return 'Ajuste';
      default:
        return a;
    }
  }

  auditSeverity(a: AuditAction): AuditSeverity {
    switch (a) {
      case 'PRODUCT_CREATED':
        return 'success';
      case 'PRODUCT_UPDATED':
        return 'info';
      case 'STOCK_IN':
        return 'success';
      case 'STOCK_OUT':
        return 'warning';
      case 'STOCK_ADJUST':
        return 'secondary';
      default:
        return 'info';
    }
  }

  openAuditDrawer(): void {
    if (!this.selectedRow) return;
    this.auditVisible = true;
  }

  resetAuditFilters(): void {
    this.auditFrom = undefined;
    this.auditTo = undefined;
    this.auditActions = [];
    this.auditActor = '';
  }

  get filteredAuditRows(): AuditLogEntry[] {
    if (!this.selectedRow) return [];
    const pid = this.selectedRow.product.id;
    let items = this.auditAllMock.filter((x) => x.productId === pid);

    // período
    if (this.auditFrom) {
      const from = new Date(this.auditFrom);
      from.setHours(0, 0, 0, 0);
      items = items.filter(
        (x) => new Date(x.occurredAt).getTime() >= from.getTime()
      );
    }
    if (this.auditTo) {
      const to = new Date(this.auditTo);
      to.setHours(23, 59, 59, 999);
      items = items.filter(
        (x) => new Date(x.occurredAt).getTime() <= to.getTime()
      );
    }

    // ações
    if (this.auditActions?.length) {
      const set = new Set(this.auditActions);
      items = items.filter((x) => set.has(x.action));
    }

    // usuário
    const q = this.auditActor.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (x) =>
          x.actorName.toLowerCase().includes(q) ||
          x.actorId.toLowerCase().includes(q)
      );
    }

    // ordena: mais recentes primeiro
    items.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
    return items;
  }

  // CONTROLE DO DRAWER DE FORM
  productFormVisible = false;
  isEditing = false;

  // Estado do formulário
  formProduct: ProductForm = this.blankProduct();
  lotRows: LotRow[] = [];

  // opções
  unitOptions = [
    { label: 'Comprimido', value: 'cp' },
    { label: 'mL', value: 'ml' },
    { label: 'mg', value: 'mg' },
    { label: 'g', value: 'g' },
    { label: 'unidade', value: 'un' },
  ];
  get categoryOptionsCrud() {
    // (se quiser categorias para o CRUD diferentes das do filtro, senão remova)
    return this.categoryOptions;
  }

  private blankProduct(): ProductForm {
    return {
      id: '',
      name: '',
      barcode: '',
      unit: null,
      manufacturer: '',
      category: null,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      description: '',
      currentQty: 0,
      minStock: 0,
      nearestExpiry: null,
      idealStock: null,
      excessStock: null,
      estimatedDurationDays: null,
    };
  }

  openCreateProduct(): void {
    this.isEditing = false;
    this.formProduct = this.blankProduct();
    this.lotRows = [];
    this.productFormVisible = true;
  }

  openEditProduct(row: InventoryRow): void {
    this.isEditing = true;
    this.formProduct = {
      id: row.product.id,
      name: row.product.name,
      barcode: row.product.barcode,
      unit: row.product.unit ?? null,
      manufacturer: row.product.manufacturer ?? '',
      category: row.product.category ?? null,
      active: !!row.product.active,
      createdAt: row.product.createdAt
        ? new Date(row.product.createdAt)
        : new Date(),
      updatedAt: row.product.updatedAt
        ? new Date(row.product.updatedAt)
        : new Date(),
      description: row.product.description ?? '',
      currentQty: row.totalQty ?? 0,
      minStock: row.product.minStock ?? 0,
      nearestExpiry: row.nearestExpiry ? new Date(row.nearestExpiry) : null,
      idealStock: null,
      excessStock: null,
      estimatedDurationDays: null,
    };

    this.lotRows = this.batchesByProduct.map((b) => ({
      lot: b.lot,
      expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      quantity: b.quantity ?? 0,
    }));

    this.productFormVisible = true;
  }

  productFormValid(): boolean {
    const f = this.formProduct;
    return !!f.name && f.name.trim().length >= 3 && f.minStock >= 0;
  }

  saveProduct(_payload?: unknown): void {
    if (!this.productFormValid()) return;
    // aqui faria POST/PUT
    console.log('Salvar produto', { ...this.formProduct, lots: this.lotRows });
    alert(this.isEditing ? 'Produto atualizado!' : 'Produto cadastrado!');
    this.productFormVisible = false;
  }

  cancelProductForm(): void {
    this.productFormVisible = false;
  }

  addLotRow(): void {
    this.lotRows = [...this.lotRows, { lot: '', expiresAt: null, quantity: 0 }];
  }

  removeLotRow(i: number): void {
    this.lotRows = this.lotRows.filter((_, idx) => idx !== i);
  }

  // === Exportar CSV (usando as linhas filtradas atuais) ===
  exportAuditCsv(): void {
    const rows = this.filteredAuditRows;
    const header = ['Data', 'Ação', 'Usuário', 'Qtd', 'Lote', 'Obs'];
    const toLine = (r: AuditLogEntry) => [
      new Date(r.occurredAt).toLocaleString('pt-BR'),
      this.auditLabel(r.action),
      `${r.actorName} (${r.actorId})`,
      r.qty ?? '',
      r.batch ?? '',
      (r.note ?? '').replace(/\n/g, ' '),
    ];
    const csv = [header, ...rows.map(toLine)]
      .map((cols) =>
        cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${this.selectedRow?.product.name || 'produto'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
