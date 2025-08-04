import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Product, ProductService } from './product.service';
import { DatePicker } from 'primeng/datepicker';
import { FloatLabel } from 'primeng/floatlabel';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-crud',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    ToolbarModule,
    RatingModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    RadioButtonModule,
    InputNumberModule,
    DialogModule,
    TagModule,
    InputIconModule,
    IconFieldModule,
    ConfirmDialogModule,
    DatePicker
  ],
  templateUrl: './crud.html',
  providers: [MessageService, ProductService, ConfirmationService],
})
export class Crud implements OnInit {
  productDialog: boolean = false;
  products = signal<Product[]>([]);
  product!: Product;
  selectedProducts!: Product[] | null;
  submitted: boolean = false;

  statuses = [
    { label: 'INSTOCK' },
    { label: 'LOWSTOCK' },
    { label: 'OUTOFSTOCK' },
  ];

  unitOptions = [
    { label: 'comprimido', value: 'comprimido' },
    { label: 'ml', value: 'ml' },
    { label: 'g', value: 'g' },
    { label: 'dose', value: 'dose' },
  ];
  @ViewChild('dt') dt!: Table;
  exportColumns!: ExportColumn[];
  cols!: Column[];

  constructor(
    private productService: ProductService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    this.loadDemoData();
  }

  loadDemoData() {
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
      { field: 'batch', header: 'Lote', customExportHeader: 'Batch Number' },
      {
        field: 'expirationDate',
        header: 'Validade',
        customExportHeader: 'Expiration Date',
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

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  openNew() {
    this.product = {};
    this.submitted = false;
    this.productDialog = true;
  }

  editProduct(product: Product) {
    this.product = { ...product };
    this.productDialog = true;
  }

  deleteSelectedProducts() {
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

  hideDialog() {
    this.productDialog = false;
    this.submitted = false;
  }

  deleteProduct(product: Product) {
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

  findIndexById(id: string): number {
    return this.products().findIndex((p) => p.id === id);
  }

  createId(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }

  getSeverity(status: string) {
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

  saveProduct() {
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

  exportCSV() {
    this.dt.exportCSV();
  }
}
