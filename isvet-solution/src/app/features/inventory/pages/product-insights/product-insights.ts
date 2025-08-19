// product-insights.ts
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonComponentsModule } from '@shared/common-components-module';
import { addDays, normalize } from '@shared/utils/utils';
import { ProductCrud } from './components/product-crud/product-crud';
import { ProductDetails } from './components/product-details/product-details';
import { ProductFilters } from './components/product-filter/product-filter';
import { ProductKpi } from './components/product-kpi/product-kpi';
import { ProductLogs } from './components/product-logs/product-logs';
import { ProductTable } from './components/product-table/product-table';
import { InventoryFacade } from './facade/product.facade';
import {
  AuditAction,
  AuditLogEntry,
  InventoryRow,
  KpiCounts,
  LotRow,
  ProductForm,
} from './models/product.model';

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
  private readonly fac = inject(InventoryFacade);

  // --- Filtros / Lista ---
  activeKpiFilter:
    | 'expiringSoon'
    | 'expired'
    | 'belowMin'
    | 'noMovement'
    | null = null;

  search = '';
  selectedCategories: string[] = [];
  statusFilter: 'todos' | 'ativos' | 'inativos' = 'todos';
  onlyBelowMin = false;
  expiringWithinDays = 30;

  statusOptions = [
    { label: 'Todos', value: 'todos' },
    { label: 'Ativos', value: 'ativos' },
    { label: 'Inativos', value: 'inativos' },
  ];

  // --- Detalhe ---
  detailVisible = false;
  selectedRow: InventoryRow | null = null;

  // --- Auditoria ---
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

  // --- CRUD ---
  productFormVisible = false;
  isEditing = false;
  formProduct: ProductForm = this.blankProduct();
  lotRows: LotRow[] = [];
  unitOptions = [
    { label: 'Comprimido', value: 'cp' },
    { label: 'mL', value: 'ml' },
    { label: 'mg', value: 'mg' },
    { label: 'g', value: 'g' },
    { label: 'unidade', value: 'un' },
  ];

  readonly rows = this.fac.rows;

  // --- KPIs (readonly) ---
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

  // --- Filtros / Lista ---
  get categoryOptions() {
    const set = new Set(this.fac.products().map((p) => p.category));
    return Array.from(set)
      .sort()
      .map((c) => ({ label: c, value: c }));
  }

  get filteredRows(): InventoryRow[] {
    const q = normalize(this.search);
    const cats = this.selectedCategories;
    const status = this.statusFilter;
    const belowOnly = this.onlyBelowMin;

    const base = this.rows().filter((r) => {
      if (
        q &&
        !(
          normalize(r.product.name).includes(q) || r.product.barcode.includes(q)
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

  clearFilters() {
    this.search = '';
    this.selectedCategories = [];
    this.statusFilter = 'todos';
    this.onlyBelowMin = false;
  }

  // --- Detalhe ---
  openDetails(row: InventoryRow) {
    this.selectedRow = row;
    this.detailVisible = true;
  }
  closeDetails() {
    this.detailVisible = false;
    this.selectedRow = null;
  }

  get batchesByProduct() {
    if (!this.selectedRow) return [];
    return this.fac
      .batches()
      .filter((b) => b.productId === this.selectedRow!.product.id);
  }
  get stockSummary() {
    const total = this.selectedRow?.totalQty ?? 0;
    const monthlyDemand = 1; // mock
    return {
      ideal: Math.max(total, (this.selectedRow?.product.minStock ?? 0) * 2),
      excess: Math.max(0, total - (this.selectedRow?.product.minStock ?? 0)),
      estimatedDurationDays: Math.round(
        (total / Math.max(1, monthlyDemand)) * 30
      ),
      monthlyAvg: monthlyDemand,
    };
  }
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

  // --- Auditoria ---
  openAuditDrawer() {
    if (this.selectedRow) this.auditVisible = true;
  }
  resetAuditFilters() {
    this.auditFrom = undefined;
    this.auditTo = undefined;
    this.auditActions = [];
    this.auditActor = '';
  }

  get filteredAuditRows(): AuditLogEntry[] {
    if (!this.selectedRow) return [];
    const pid = this.selectedRow.product.id;
    let items = this.fac.auditAllMock().filter((x) => x.productId === pid);

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

    if (this.auditActions?.length) {
      const set = new Set(this.auditActions);
      items = items.filter((x) => set.has(x.action));
    }

    const q = this.auditActor.trim().toLowerCase();
    if (q)
      items = items.filter(
        (x) =>
          x.actorName.toLowerCase().includes(q) ||
          x.actorId.toLowerCase().includes(q)
      );

    items.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
    return items;
  }

  auditLabel = (a: AuditAction) => this.fac.labelForAction(a);
  auditSeverity = (a: AuditAction) => this.fac.severityForAction(a);

  exportAuditCsv() {
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

  // --- CRUD ---
  get categoryOptionsCrud() {
    return this.categoryOptions;
  }

  openCreateProduct() {
    this.isEditing = false;
    this.formProduct = this.blankProduct();
    this.lotRows = [];
    this.productFormVisible = true;
  }

  openEditProduct(row: InventoryRow) {
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

  saveProduct(ev: { product: ProductForm; lots: LotRow[] }) {
    this.fac.saveProductMock(ev);
    alert(this.isEditing ? 'Produto atualizado!' : 'Produto cadastrado!');
    this.productFormVisible = false;
  }

  cancelProductForm() {
    this.productFormVisible = false;
  }

  // --- CRUD ---
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
}
