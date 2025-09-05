import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  WritableSignal,
  computed,
  signal,
} from '@angular/core';

/* PrimeNG */
import { CommonComponentsModule } from '../../../../shared/common-components-module';

interface EntryRow {
  barcode: string;
  name: string;
  qty: number;
  lot?: string;
  expiresAt?: Date | null;
  unitCost?: number | null;
  obs?: string;
  unknown?: boolean;
}

interface ProductRef {
  barcode: string;
  name: string;
}

@Component({
  selector: 'app-product-entry',
  standalone: true,
  imports: [CommonComponentsModule],
  templateUrl: './product-entry.html',
  styleUrls: ['./product-entry.scss'],
})
export class ProductEntry implements OnInit {
  @ViewChild('entryInputRef') entryInputRef!: ElementRef<HTMLInputElement>;

  /* Mock de catálogo para “encontrar por código” */
  private catalog: ProductRef[] = [
    { barcode: '789100000001', name: 'Amoxicilina 250mg' },
    { barcode: '789100000002', name: 'Dipirona Sódica 500mg' },
    { barcode: '5601234567890', name: 'Ranitidina 150mg' },
  ];

  /* Estado principal */
  readonly rows: WritableSignal<EntryRow[]> = signal<EntryRow[]>([]);
  entryInput = '';

  /* Drawer leitor */
  scanVisible = false;

  /* Totais computados */
  readonly totalQty = computed(() =>
    this.rows().reduce((acc, r) => acc + (Number(r.qty) || 0), 0)
  );

  ngOnInit(): void {}

  /* -------- Entrada Manual -------- */
  addByInput(): void {
    const input = (this.entryInput || '').trim();
    if (!input) return;

    const isBarcode = /^\d{6,}$/.test(input); // números com 6+ dígitos
    let item: EntryRow | null = null;

    if (isBarcode) {
      const found = this.catalog.find((p) => p.barcode === input);
      if (found) {
        item = {
          barcode: found.barcode,
          name: found.name,
          qty: 1,
          unknown: false,
        };
      } else {
        item = {
          barcode: input,
          name: 'Produto não cadastrado',
          qty: 1,
          unknown: true,
        };
      }
    } else {
      if (input.length < 4) {
        // nome precisa de 4+ letras
        this.entryInputRef?.nativeElement?.focus();
        return;
      }
      // procura primeira ocorrência por nome (simples)
      const found = this.catalog.find((p) =>
        this.normalize(p.name).includes(this.normalize(input))
      );
      if (found) {
        item = {
          barcode: found.barcode,
          name: found.name,
          qty: 1,
          unknown: false,
        };
      } else {
        // sem cadastro, cria com nome digitado
        item = {
          barcode: `MAN-${Date.now()}`,
          name: input,
          qty: 1,
          unknown: true,
        };
      }
    }

    this.mergeOrPush(item!);
    this.entryInput = '';
    setTimeout(() => this.entryInputRef?.nativeElement?.focus(), 0);
  }

  /* -------- Leitor -------- */
  openScanner(): void {
    this.scanVisible = true;
    // integração real com ZXing pode ser plugada aqui
  }

  onScanned(barcode: string): void {
    const found = this.catalog.find((p) => p.barcode === barcode);
    const item: EntryRow = found
      ? { barcode: found.barcode, name: found.name, qty: 1, unknown: false }
      : { barcode, name: 'Produto não cadastrado', qty: 1, unknown: true };
    this.mergeOrPush(item);
  }

  /* -------- NF-e XML -------- */
  // onXmlSelected(ev: any): void {
  //   // Placeholder: leia o File e parseie XML -> items; aqui simulamos
  //   this.simulateXmlImport();
  // }

  simulateXmlImport(): void {
    const imported: EntryRow[] = [
      {
        barcode: '789100000001',
        name: 'Amoxicilina 250mg',
        qty: 10,
        lot: 'L-AX1',
        expiresAt: this.addDays(new Date(), 180),
        unitCost: 2.5,
      },
      {
        barcode: '789100000002',
        name: 'Dipirona Sódica 500mg',
        qty: 6,
        lot: 'L-DP1',
        expiresAt: this.addDays(new Date(), 365),
        unitCost: 1.8,
      },
      {
        barcode: '999999999999',
        name: 'Produto não cadastrado',
        qty: 4,
        lot: 'L-UN1',
        expiresAt: this.addDays(new Date(), 90),
        unitCost: 3.2,
        unknown: true,
      },
    ];
    imported.forEach((r) => this.mergeOrPush(r));
  }

  async onXmlSelected(ev: any): Promise<void> {
    try {
      const file: File | undefined =
        ev?.files?.[0] ?? ev?.file ?? ev?.currentFiles?.[0];
      if (!file) {
        alert('Nenhum arquivo selecionado.');
        return;
      }

      const text = await this.readFileAsText(file);
      const rows = this.parseXmlToEntryRows(text);

      if (!rows.length) {
        alert('XML válido, mas nenhum item foi encontrado.');
        return;
      }

      rows.forEach((r) => this.mergeOrPush(r));
    } catch (err) {
      console.error('Falha ao processar XML:', err);
      alert('Falha ao processar o XML. Verifique o arquivo e tente novamente.');
    }
  }

  /** Lê File como texto */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ''));
      fr.onerror = reject;
      fr.readAsText(file, 'utf-8');
    });
  }

  /** Decide o formato e executa o parsing */
  private parseXmlToEntryRows(xmlText: string): EntryRow[] {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
    // erro de parsing?
    if (doc.getElementsByTagName('parsererror').length) return [];

    const root = doc.documentElement;
    const rootName = root.localName || root.nodeName;
    const ns = root.namespaceURI || '';

    // NF-e 4.00 (reduzido): <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
    const isNFe =
      ns.includes('portalfiscal.inf.br/nfe') ||
      /^(NFe|nfeProc|infNFe)$/i.test(rootName);
    if (isNFe) return this.parseNFe400(doc);

    // Mock simples: <NFeMock>...
    if (/^NFeMock$/i.test(rootName)) return this.parseSimpleMock(doc);

    // fallback: tenta heurísticas
    const hasDet = Array.from(doc.getElementsByTagName('*')).some(
      (n) => n.localName === 'det'
    );
    return hasDet ? this.parseNFe400(doc) : this.parseSimpleMock(doc);
  }

  /** Parser do mock simples (formato #1 e #3) */
  private parseSimpleMock(doc: Document): EntryRow[] {
    const items = Array.from(doc.getElementsByTagName('item'));
    return items.map((item) => {
      const barcode = this.txt(item, 'barcode') || `MAN-${Date.now()}`;
      const name = this.txt(item, 'name') || 'Produto não cadastrado';
      const qtyNum = this.num(this.txt(item, 'qty'), null) ?? 0;
      const lot = this.txt(item, 'lot') || undefined;
      const expiresAt = this.date(this.txt(item, 'expiresAt'));
      const unitCost = this.num(this.txt(item, 'unitCost'), null);

      return <EntryRow>{
        barcode,
        name,
        qty: qtyNum > 0 ? Math.round(qtyNum) : 1,
        lot,
        expiresAt,
        unitCost,
        unknown:
          name.toLowerCase().includes('não cadastrado') ||
          name.toLowerCase().includes('nao cadastrado'),
      };
    });
  }

  /** Parser NF-e 4.00 reduzido (formato #2) */
  private parseNFe400(doc: Document): EntryRow[] {
    // pega todos <det> em qualquer namespace
    const dets = Array.from(doc.getElementsByTagName('*')).filter(
      (n) => n.localName === 'det'
    );

    const rows: EntryRow[] = [];
    for (const det of dets) {
      const prod = Array.from(det.childNodes).find(
        (n) => (n as Element).localName === 'prod'
      ) as Element | undefined;
      if (!prod) continue;

      const cEAN = this.txte(prod, 'cEAN') || this.txte(prod, 'cEANTrib') || '';
      const xProd = this.txte(prod, 'xProd') || 'Produto não cadastrado';
      const qCom = this.num(this.txte(prod, 'qCom'), null);
      const vUnCom = this.num(this.txte(prod, 'vUnCom'), null);

      // rastro (lote/validade)
      const rastro = Array.from(prod.getElementsByTagName('*')).find(
        (n) => n.localName === 'rastro'
      ) as Element | undefined;
      const nLote = rastro ? this.txte(rastro, 'nLote') : undefined;
      const dVal = rastro ? this.txte(rastro, 'dVal') : undefined;

      const barcode = cEAN || `MAN-${Date.now()}`;
      const name = xProd;
      const qComNum = qCom ?? 0;
      const qty = qComNum > 0 ? Math.round(qComNum) : 1;
      const lot = nLote || undefined;
      const expiresAt = this.date(dVal);
      const unitCost = vUnCom;

      rows.push(<EntryRow>{
        barcode,
        name,
        qty,
        lot,
        expiresAt,
        unitCost,
        unknown: !cEAN, // se não veio EAN, provavelmente não cadastrado no seu catálogo
      });
    }
    return rows;
  }

  /** Helpers de extração (sem namespaces) */
  private txt(parent: Element, tag: string): string {
    const el = parent.getElementsByTagName(tag)[0];
    return el?.textContent?.trim() || '';
  }
  /** Helpers que ignoram namespaces (usa localName) */
  private txte(parent: Element, tagLocal: string): string {
    const el = Array.from(parent.getElementsByTagName('*')).find(
      (n) => (n as Element).localName === tagLocal
    ) as Element | undefined;
    return el?.textContent?.trim() || '';
  }

  /** Números — aceita “1.234,56” e “1234.56” */
  private num(
    s: string | null | undefined,
    fallback: number | null
  ): number | null {
    if (!s) return fallback;
    const norm = s.replace(/\./g, '').replace(',', '.').trim();
    const v = Number(norm);
    return Number.isFinite(v) ? v : fallback;
  }

  /** Datas — aceita ISO, “yyyy-mm-dd”, “dd/mm/yyyy” */
  private date(s: string | null | undefined): Date | null {
    if (!s) return null;
    const t = s.trim();
    // dd/mm/yyyy
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
    if (m) {
      const [_, dd, mm, yyyy] = m;
      return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    }
    // yyyy-mm-dd (ou ISO)
    const d = new Date(t);
    return isNaN(d.getTime()) ? null : d;
  }

  /* -------- Helpers -------- */
  private mergeOrPush(item: EntryRow): void {
    const arr = this.rows();
    const idx = arr.findIndex((r) => r.barcode === item.barcode);
    if (idx >= 0) {
      const updated = [...arr];
      updated[idx] = {
        ...updated[idx],
        name:
          updated[idx].name === 'Produto não cadastrado' && !item.unknown
            ? item.name
            : updated[idx].name,
        qty: (updated[idx].qty || 0) + (item.qty || 0),
        unknown:
          updated[idx].unknown && !item.unknown ? false : updated[idx].unknown,
      };
      this.rows.set(updated);
    } else {
      this.rows.set([...arr, item]);
    }
  }

  removeRow(i: number): void {
    const arr = this.rows().filter((_, idx) => idx !== i);
    this.rows.set(arr);
  }

  clearAll(): void {
    this.rows.set([]);
    this.entryInput = '';
    setTimeout(() => this.entryInputRef?.nativeElement?.focus(), 0);
  }

  confirmEntry(): void {
    // Aqui você pode validar lote/validade quando obrigatório
    const payload = this.rows().map((r) => ({
      barcode: r.barcode,
      name: r.name,
      qty: r.qty,
      lot: r.lot || null,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      unitCost: r.unitCost ?? null,
      obs: r.obs ?? null,
      unknown: !!r.unknown,
    }));

    console.log('CONFIRMAR ENTRADA:', payload);
    alert('Entrada confirmada! (protótipo)\nVeja o payload no console.');
    this.clearAll();
  }

  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  private addDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }
}
