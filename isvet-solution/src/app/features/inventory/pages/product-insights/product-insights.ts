import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

// PrimeNG
import { CommonComponentsModule } from '../../../../shared/common-components-module';

// Tipos
interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  unit: string;
  minStock: number;
  active: boolean;
  manufacturer?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
interface Batch {
  id: string;
  productId: string;
  lot: string;
  expiresAt: string; // ISO
  quantity: number;
}
interface Movement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  batchId?: string;
  createdAt: string; // ISO
  reason?: string;
}
interface InventoryRow {
  product: Product;
  totalQty: number;
  nearestExpiry?: string; // ISO
  lastMovementAt?: string; // ISO
  belowMin: boolean;
  expired: boolean;
  expiringSoon: boolean;
}

type AuditAction =
  | 'PRODUCT_CREATED'
  | 'PRODUCT_UPDATED'
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'STOCK_ADJUST';

interface AuditLogEntry {
  id: string;
  productId: string;
  action: AuditAction;
  qty?: number;
  batch?: string | null;
  before?: unknown;
  after?: unknown;
  actorId: string;
  actorName: string;
  occurredAt: string; // ISO
  note?: string;
}

@Component({
  selector: 'app-catalog-insights',
  standalone: true,
  imports: [CommonComponentsModule],
  templateUrl: './product-insights.html',
  styleUrls: ['./product-insights.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInsights {
  // estado do filtro rápido pelos cards
  activeKpiFilter:
    | 'expiringSoon'
    | 'expired'
    | 'belowMin'
    | 'noMovement'
    | null = null;

  // ================= Mock (substitua por serviços depois) =================
  private readonly products = signal<Product[]>([
    {
      id: 'p1',
      name: 'Dipirona 500mg',
      barcode: '789100000001',
      category: 'Analgésico',
      unit: 'comprimido',
      minStock: 20,
      active: true,
      manufacturer: 'ACME Vet',
      createdAt: '2025-01-10',
      updatedAt: '2025-08-01',
    },
    {
      id: 'p2',
      name: 'Amoxicilina 250mg',
      barcode: '789100000002',
      category: 'Antibiótico',
      unit: 'cápsula',
      minStock: 10,
      active: true,
      manufacturer: 'VetLabs',
      createdAt: '2025-03-15',
      updatedAt: '2025-07-20',
    },
    {
      id: 'p3',
      name: 'Gentamicina 40mg/mL',
      barcode: '789100000019',
      category: 'Antibiótico',
      unit: 'frasco',
      minStock: 5,
      active: true,
      manufacturer: 'BioVet',
      createdAt: '2025-02-05',
      updatedAt: '2025-06-30',
    },
    {
      id: 'p4',
      name: 'Ranitidina 150mg',
      barcode: '789100000015',
      category: 'Gastro',
      unit: 'comprimido',
      minStock: 15,
      active: false,
      manufacturer: 'PharmaX',
      createdAt: '2024-11-20',
      updatedAt: '2025-04-08',
    },
  ]);

  private readonly batches = signal<Batch[]>([
    {
      id: 'b1',
      productId: 'p1',
      lot: 'L-A',
      expiresAt: this.isoDaysFromNow(25),
      quantity: 12,
    },
    {
      id: 'b2',
      productId: 'p1',
      lot: 'L-B',
      expiresAt: this.isoDaysFromNow(90),
      quantity: 30,
    },
    {
      id: 'b3',
      productId: 'p2',
      lot: 'L-C',
      expiresAt: this.isoDaysFromNow(-3),
      quantity: 3,
    },
    {
      id: 'b4',
      productId: 'p2',
      lot: 'L-D',
      expiresAt: this.isoDaysFromNow(12),
      quantity: 4,
    },
    {
      id: 'b5',
      productId: 'p3',
      lot: 'L-E',
      expiresAt: this.isoDaysFromNow(50),
      quantity: 6,
    },
    {
      id: 'b6',
      productId: 'p4',
      lot: 'L-F',
      expiresAt: this.isoDaysFromNow(180),
      quantity: 100,
    },
  ]);

  private readonly movements = signal<Movement[]>([
    {
      id: 'm1',
      productId: 'p1',
      type: 'in',
      quantity: 50,
      createdAt: '2025-07-20',
    },
    {
      id: 'm2',
      productId: 'p1',
      type: 'out',
      quantity: 8,
      createdAt: '2025-08-10',
    },
    {
      id: 'm3',
      productId: 'p2',
      type: 'out',
      quantity: 5,
      createdAt: '2025-05-01',
    },
    {
      id: 'm4',
      productId: 'p3',
      type: 'in',
      quantity: 6,
      createdAt: '2025-06-22',
    },
  ]);

  // ================= Filtros =================
  search = '';
  selectedCategories: string[] = [];
  statusFilter: 'todos' | 'ativos' | 'inativos' = 'todos';
  onlyBelowMin = false;
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
      if (!entry.nearest || new Date(b.expiresAt) < new Date(entry.nearest)) {
        entry.nearest = b.expiresAt;
      }
      byProduct.set(b.productId, entry);
    }

    const lastMovementByProduct = new Map<string, string>();
    for (const mv of this.movements()) {
      const prev = lastMovementByProduct.get(mv.productId);
      if (!prev || new Date(mv.createdAt) > new Date(prev)) {
        lastMovementByProduct.set(mv.productId, mv.createdAt);
      }
    }

    const soonDays = this.expiringWithinDays;
    return this.products().map((p) => {
      const totals = byProduct.get(p.id) ?? { total: 0, nearest: undefined };
      const nearest = totals.nearest;
      const totalQty = totals.total;
      const belowMin = totalQty < p.minStock;

      const expired = nearest ? new Date(nearest) < today : false;
      const expiringSoon = nearest
        ? !expired && this.daysBetween(today, new Date(nearest)) <= soonDays
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
    const cutoff = this.addDays(new Date(), -60);
    return this.rows().filter(
      (r) => !r.lastMovementAt || new Date(r.lastMovementAt) < cutoff
    ).length;
  });

  // ================= Filtradas (getter) =================

  toggleKpiFilter(
    kind: 'expiringSoon' | 'expired' | 'belowMin' | 'noMovement'
  ) {
    this.activeKpiFilter = this.activeKpiFilter === kind ? null : kind; // clique novamente para limpar
  }

  get filteredRows(): InventoryRow[] {
    const q = this.normalize(this.search);
    const cats = this.selectedCategories; // <-- array
    const status = this.statusFilter;
    const belowOnly = this.onlyBelowMin;

    const base = this.rows().filter((r) => {
      if (
        q &&
        !(
          this.normalize(r.product.name).includes(q) ||
          r.product.barcode.includes(q)
        )
      )
        return false;

      if (cats.length > 0 && !cats.includes(r.product.category)) return false; // <-- multi

      if (status === 'ativos' && !r.product.active) return false;
      if (status === 'inativos' && r.product.active) return false;
      if (belowOnly && !r.belowMin) return false;
      return true;
    });

    if (!this.activeKpiFilter) return base;

    const cutoff = this.addDays(new Date(), -60);
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

  // ================= Utils =================
  private normalize(s: string): string {
    return (s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
  private isoDaysFromNow(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
  private daysBetween(a: Date, b: Date): number {
    const MS = 1000 * 60 * 60 * 24;
    return Math.ceil((b.getTime() - a.getTime()) / MS);
  }

  // ---- Helpers para o Drawer full ----

  // lotes do produto selecionado
  get batchesByProduct() {
    if (!this.selectedRow) return [];
    return this.batches().filter(
      (b) => b.productId === this.selectedRow!.product.id
    );
  }

  // resumo de estoque (mockado aqui; depois pode vir do backend)
  get stockSummary() {
    const total = this.selectedRow?.totalQty ?? 0;
    return {
      ideal: Math.max(total, (this.selectedRow?.product.minStock ?? 0) * 2),
      excess: Math.max(0, total - (this.selectedRow?.product.minStock ?? 0)),
      estimatedDurationDays: Math.round(
        (total / Math.max(1, this.priceSummary.monthlyDemand)) * 30
      ),
      monthlyAvg: this.priceSummary.monthlyDemand,
    };
  }

  // preço/custo (placeholder – substitua pelos dados reais)
  priceSummary = {
    salePrice: 212.92,
    costPrice: 106.46,
    targetMarkup: 100,
    currentMarkup: 100,
    showInList: true,
    monthlyDemand: 1, // usado para estimativa de duração
  };

  // desconto (placeholder)
  discountSummary = {
    allowsOverride: true,
  };

  // comissão (placeholder)
  commissionSummary = {
    enabled: false,
    percent: 0,
  };

  // histórico de saídas (placeholder)
  get outgoSummary() {
    // monte a partir de this.movements() se quiser; aqui é exemplo fixo
    return [
      { month: 'Mai', sales: 2, internal: 1, total: 3 },
      { month: 'Jun', sales: 0, internal: 0, total: 0 },
      { month: 'Jul', sales: 0, internal: 0, total: 0 },
    ];
  }

  // entradas (placeholder)
  get inboundSummary() {
    // a partir de movements type: 'in' + batches; aqui estático
    return [
      // { date: '2025-06-22', lot: 'L-E', qty: 6 }
    ];
  }

  // flag admin mock (troque depois pelo AuthService)
  isAdmin = true;

  // controle do drawer secundário
  auditVisible = false;

  // === Opções de filtro (labels) ===
  auditActionOptions = [
    { label: 'Cadastro', value: 'PRODUCT_CREATED' as AuditAction },
    { label: 'Edição', value: 'PRODUCT_UPDATED' as AuditAction },
    { label: 'Entrada', value: 'STOCK_IN' as AuditAction },
    { label: 'Retirada', value: 'STOCK_OUT' as AuditAction },
    { label: 'Ajuste', value: 'STOCK_ADJUST' as AuditAction },
  ];

  // === Estado de filtros/paginação ===
  auditFrom?: Date;
  auditTo?: Date;
  auditActions: AuditAction[] = [];
  auditActor = '';
  auditPage = 1;
  auditPageSize = 10;
  auditLoading = false;

  // === Dados de tabela (paginados) ===
  auditRows: AuditLogEntry[] = [];
  auditTotal = 0;

  // === MOCK: base com alguns registros por productId ===
  private auditAllMock: AuditLogEntry[] = [
    // p1
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

    // p2
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

    // p3
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

  // === Helpers de rótulo/severidade para o <p-tag> ===
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
    }
  }
  auditSeverity(
    a: AuditAction
  ): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
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
    }
  }

  // === Carregar (filtrar em memória) ===
  loadAudit(): void {
    if (!this.selectedRow) {
      this.auditRows = [];
      this.auditTotal = 0;
      return;
    }

    this.auditLoading = true;
    const pid = this.selectedRow.product.id;

    // 1) base por produto
    let items = this.auditAllMock.filter((x) => x.productId === pid);

    // 2) filtros
    if (this.auditFrom) {
      const from = this.auditFrom.setHours(0, 0, 0, 0);
      items = items.filter((x) => new Date(x.occurredAt).getTime() >= from);
    }
    if (this.auditTo) {
      const to = this.auditTo.setHours(23, 59, 59, 999);
      items = items.filter((x) => new Date(x.occurredAt).getTime() <= to);
    }
    if (this.auditActions.length) {
      const set = new Set(this.auditActions);
      items = items.filter((x) => set.has(x.action));
    }
    if (this.auditActor.trim()) {
      const q = this.auditActor.trim().toLowerCase();
      items = items.filter(
        (x) =>
          x.actorName.toLowerCase().includes(q) ||
          x.actorId.toLowerCase().includes(q)
      );
    }

    // 3) ordenação (recente primeiro)
    items.sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );

    // 4) paginação em memória
    this.auditTotal = items.length;
    const start = (this.auditPage - 1) * this.auditPageSize;
    this.auditRows = items.slice(start, start + this.auditPageSize);

    this.auditLoading = false;
  }

  resetAuditFilters(): void {
    this.auditFrom = undefined;
    this.auditTo = undefined;
    this.auditActions = [];
    this.auditActor = '';
    this.auditPage = 1;
    this.loadAudit();
  }

  onAuditPageChange(ev: any): void {
    // PrimeNG Table onPage: {first, rows, page} (page é zero-based)
    this.auditPage = (ev?.page ?? 0) + 1;
    this.auditPageSize = ev?.rows ?? this.auditPageSize;
    this.loadAudit();
  }

  // === Exportar CSV (em memória) ===
  exportAuditCsv(): void {
    const rows = this.auditRows;
    const header = ['Data', 'Ação', 'Usuário', 'Qtd', 'Lote', 'Obs'];
    const lines = rows.map((r) => [
      new Date(r.occurredAt).toLocaleString('pt-BR'),
      this.auditLabel(r.action),
      `${r.actorName} (${r.actorId})`,
      r.qty ?? '',
      r.batch ?? '',
      (r.note ?? '').replace(/\n/g, ' '),
    ]);
    const csv = [header, ...lines]
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

  openAuditDrawer(): void {
    if (!this.selectedRow) return;
    this.auditVisible = true;
    // reseta paginação e carrega
    this.auditPage = 1;
    // this.loadAudit();
  }

  closeAuditDrawer(): void {
    this.auditVisible = false;
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

    // usuário (id ou nome)
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
}
