
import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { DatePicker } from 'primeng/datepicker';
import { RadioButtonModule } from 'primeng/radiobutton';
import { RatingModule } from 'primeng/rating';
import { SelectModule } from 'primeng/select';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { Product, ProductService } from './product.service';
import { CommonComponentsModule } from '../../../../shared/common-components-module';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

const STATUS_OPTIONS = [
  { label: 'INSTOCK' },
  { label: 'LOWSTOCK' },
  { label: 'OUTOFSTOCK' },
] as const;

const UNIT_OPTIONS = [
  { label: 'comprimido', value: 'comprimido' },
  { label: 'ml', value: 'ml' },
  { label: 'g', value: 'g' },
  { label: 'dose', value: 'dose' },
];

@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [
    CommonComponentsModule
  ],
  templateUrl: './crud.html',
  providers: [MessageService, ProductService, ConfirmationService],
})
export class Crud implements OnInit {
  productDialog = false;
  products = signal<Product[]>([]);
  product!: Product;
  selectedProducts!: Product[] | null;
  submitted = false;

  readonly statuses = STATUS_OPTIONS;
  unitOptions = UNIT_OPTIONS;


  @ViewChild('dt') dt!: Table;
  exportColumns!: ExportColumn[];
  cols!: Column[];

  constructor(
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}
  ngOnInit(): void {
    this.loadDemoData();
  }

  private loadDemoData(): void {
    this.productService.getProducts().then((data) => {
      this.products.set(data);
    });

    this.cols = [
      {
        field: 'barcode',
        header: 'Código de Barras',
        customExportHeader: 'Barcode',
      },
      {
        field: 'name',
        header: 'Nome do Medicamento',
        customExportHeader: 'Medication Name',
      },
      {
        field: 'description',
        header: 'Descrição',
        customExportHeader: 'Description',
      },
      {
        field: 'manufacturer',
        header: 'Fabricante',
        customExportHeader: 'Manufacturer',
      },
      {
        field: 'stock',
        header: 'Estoque',
        customExportHeader: 'Stock Quantity',
      },
      {
        field: 'stockMin',
        header: 'Estoque mínimo',
        customExportHeader: 'Stock Quantity',
      },
      {
        field: 'status',
        header: 'Status',
        customExportHeader: 'Inventory Status',
      },
      { field: 'unit', header: 'Unidade', customExportHeader: 'Unit' },
    ];

    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

  onGlobalFilter(table: Table, event: Event): void {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openNew(): void {
    this.product = {};
    this.submitted = false;
    this.productDialog = true;
  }

  editProduct(product: Product): void {
    this.product = { ...product };
    this.productDialog = true;
  }

  deleteSelectedProducts(): void {
    this.confirmationService.confirm({
      message:
        'Tem certeza de que deseja excluir os medicamentos selecionados?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.products.set(
          this.products().filter((val) => !this.selectedProducts?.includes(val))
        );
        this.selectedProducts = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Medicamentos excluídos',
          life: 3000,
        });
      },
    });
  }

  hideDialog(): void {
    this.productDialog = false;
    this.submitted = false;
  }

  deleteProduct(product: Product): void {
    this.confirmationService.confirm({
      message: `Tem certeza de que deseja excluir ${product.name}?`,
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.products.set(
          this.products().filter((val) => val.id !== product.id)
        );
        this.product = {};
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Medicamento excluído',
          life: 3000,
        });
      },
    });
  }

  private findIndexById(id: string): number {
    return this.products().findIndex((p) => p.id === id);
  }

  private createId(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  getSeverity(status: string): string {
    switch (status) {
      case 'INSTOCK':
        return 'success';
      case 'LOWSTOCK':
        return 'warn';
      case 'OUTOFSTOCK':
        return 'danger';
      default:
        return 'info';
    }
  }

  saveProduct(): void {
    this.submitted = true;

    if (this.product.name?.trim()) {
      const currentProducts = this.products();

      if (this.product.id) {
        const index = this.findIndexById(this.product.id);
        currentProducts[index] = this.product;
        this.products.set([...currentProducts]);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Medicamento atualizado',
          life: 3000,
        });
      } else {
        this.product.id = this.createId();
        this.products.set([...currentProducts, this.product]);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Medicamento criado',
          life: 3000,
        });
      }

      this.productDialog = false;
      this.product = {};
    }
  }

  exportCSV(): void {
    this.dt.exportCSV();
  }
}
