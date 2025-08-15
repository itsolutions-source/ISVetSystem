import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { delay, of } from 'rxjs';
import { CommonComponentsModule } from '../../../../shared/common-components-module';
import { ConfirmationService } from 'primeng/api';
import { MedicationItem } from '../../models/medication-item';
import { MEDICATIONS_MOCK } from '../../data/medications.mock';

@Component({
  selector: 'app-product-withdrawal',
  standalone: true,
  imports: [CommonComponentsModule],
  providers: [ConfirmationService],
  templateUrl: './product-withdrawal.html',
  styleUrl: './product-withdrawal.scss',
})
export class ProductWithdrawal
  implements AfterViewInit, OnInit, OnDestroy
{
  // Template references
  @ViewChild('scannerInput') barcodeInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('searchProductsInput') searchProductsInput!: ElementRef<HTMLInputElement>;

  // Scanner state
  visible = false;
  barcodeInput = '';
  cameras: MediaDeviceInfo[] = [];
  selectedCamera: MediaDeviceInfo | null = null;
  selectedCameraLabel: string | null = null;
  codeResult = '';
  private codeReader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  scan = false;
  failedAttempts = 0;
  maxAttempts = 0;
  lastTriedBarcode = '';

  // Medication data
  readonly medications: WritableSignal<MedicationItem[]> = signal([]);
  allProducts: MedicationItem[] = MEDICATIONS_MOCK;
  filteredProducts: MedicationItem[] = [...MEDICATIONS_MOCK];

  // Form for manually adding new product
  showNewProductForm = false;
  newProduct: MedicationItem = { barcode: '', name: '', quantity: 0, observation: '' };
  newProductErrors = { name: false, barcode: false, barcodeExists: false, nameExists: false };
  canSaveNewProduct = false;

  // Product selection dialog
  productSelectVisible = false;
  productToResolve: MedicationItem | null = null;
  productSearch = '';
  selectedProduct: MedicationItem | null = null;

  // Keyboard scanner simulation
  barcodeBuffer = '';
  scanTimeout?: ReturnType<typeof setTimeout>;

  constructor(
    private cd: ChangeDetectorRef,
    private confirmationService: ConfirmationService,
  ) {}

  // Lifecycle --------------------------------------------------

  ngOnInit(): void {
    this.loadCameras();
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  private async loadCameras(): Promise<void> {
    this.cameras = await BrowserMultiFormatReader.listVideoInputDevices();
    this.selectedCamera = this.cameras[0] ?? null;
    this.cd.detectChanges();
  }

  // Utils ------------------------------------------------------

  isMobile(): boolean {
    return window.innerWidth < 640; // Tailwind breakpoint sm = 640px
  }

  private focusInput(): void {
    setTimeout(() => this.barcodeInputRef?.nativeElement?.focus(), 0);
  }

  // Scanner ----------------------------------------------------

  onCameraChange(): void {
    this.stopScanner();
    this.startScanner();
  }

  startScanner(): void {
    this.scan = true;
    this.failedAttempts = 0;
    this.maxAttempts = 10;
    this.lastTriedBarcode = '';

    if (!this.selectedCamera || !this.videoElement) {
      return;
    }

    this.codeReader.decodeFromVideoDevice(
      this.selectedCamera.deviceId,
      this.videoElement.nativeElement,
      (result, err, controls) => {
        if (result) {
          const scannedCode = result.getText();
          if (scannedCode && scannedCode !== this.lastTriedBarcode) {
            this.lastTriedBarcode = scannedCode;

            this.fetchMedicationName(scannedCode).subscribe({
              next: (name) => {
                if (name) {
                  this.addMedication(scannedCode, name);
                  controls.stop();
                  this.scan = false;
                  this.cd.detectChanges();
                } else {
                  this.failedAttempts++;
                  this.tryHandleNotFound(scannedCode, controls);
                }
              },
              error: () => {
                this.failedAttempts++;
                this.tryHandleNotFound(scannedCode, controls);
              },
            });
          }
        }
        this.controls = controls;
      }
    );
  }

  private tryHandleNotFound(barcode: string, controls: IScannerControls): void {
    if (this.failedAttempts >= this.maxAttempts) {
      this.addMedication(barcode, 'Medicação não encontrada');
      controls.stop();
      this.scan = false;
      this.cd.detectChanges();
    }
  }

  stopScanner(): void {
    this.controls?.stop();
  }

  onOpenCamera(): void {
    const simulatedCode = '123';
    this.onScan(simulatedCode);
  }

  // Medication operations --------------------------------------

  private addMedication(barcode: string, name: string): void {
    const current = this.medications();
    const idx = current.findIndex((m) => m.barcode === barcode);

    if (idx >= 0) {
      this.medications.update((arr) => {
        arr[idx].quantity++;
        return [...arr];
      });
    } else {
      this.medications.update((arr) => [
        ...arr,
        { barcode, name, quantity: 1, observation: '' },
      ]);
    }

    this.barcodeInput = '';
    this.focusInput();
  }

  onScan(input: string): void {
    if (!input) return;

    const term = input.trim();
    let match: MedicationItem | undefined;

    const norm = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    if (/^\d+$/.test(term)) {
      match = MEDICATIONS_MOCK.find((m) => m.barcode === term);
    } else if (term.length >= 4) {
      const nterm = norm(term);
      match = MEDICATIONS_MOCK.find((m) => norm(m.name).includes(nterm));
    }

    if (match) {
      this.addMedication(match.barcode, match.name);
    } else {
      this.addMedication(term, 'Medicação não encontrada');
    }

    this.barcodeInput = '';
    this.focusInput();
  }

  onCancel(barcode: string): void {
    const current = this.medications();
    const idx = current.findIndex((m) => m.barcode === barcode);
    if (idx >= 0) {
      if (current[idx].quantity > 1) {
        this.medications.update((arr) => {
          arr[idx].quantity--;
          return [...arr];
        });
      } else {
        this.medications.update((arr) => arr.filter((_, i) => i !== idx));
      }
    }
    this.focusInput();
  }

  cancelAllFromBarcode(barcode: string): void {
    this.medications.update((arr) => arr.filter((m) => m.barcode !== barcode));
    this.focusInput();
  }

  hasUnidentifiedMedication(): boolean {
    return this.medications().some((m) => m.name === 'Medicação não encontrada');
  }

  private fetchMedicationName(barcode: string) {
    const found = MEDICATIONS_MOCK.find((m) => m.barcode === barcode);
    const name = found ? found.name : 'Medicação não encontrada';
    return of(name).pipe(delay(300));
  }

  // Keyboard simulation ----------------------------------------

  handleKey(event: KeyboardEvent): void {
    const key = event.key;

    if (this.scanTimeout) clearTimeout(this.scanTimeout);

    if (key === 'Enter') {
      const scanned = this.barcodeBuffer.trim();
      this.barcodeBuffer = '';

      if (scanned) {
        this.onScan(scanned);
      }
    } else if (key.length === 1) {
      this.barcodeBuffer += key;

      this.scanTimeout = setTimeout(() => {
        this.barcodeBuffer = '';
      }, 1000);
    }
  }

  // Manual selection & creation --------------------------------

  openManualSelection(medication: MedicationItem): void {
    this.productToResolve = medication;
    this.selectedProduct = null;
    this.productSearch = '';
    this.filteredProducts = [...this.allProducts];
    this.productSelectVisible = true;
    this.showNewProductForm = false;
    this.resetNewProduct();
    setTimeout(() => this.searchProductsInput?.nativeElement?.focus(), 300);
  }

  toggleNewProduct(open: boolean): void {
    this.showNewProductForm = open;
    if (open) {
      this.resetNewProduct();
      setTimeout(() => {
        const el = document.getElementById('newProdName') as HTMLInputElement | null;
        el?.focus();
      }, 0);
    } else {
      this.resetNewProduct();
    }
  }

  private resetNewProduct(): void {
    this.newProduct = { barcode: '', name: '', quantity: 0, observation: '' };
    this.newProductErrors = {
      name: false,
      barcode: false,
      barcodeExists: false,
      nameExists: false,
    };
    this.canSaveNewProduct = false;
  }

  validateNewProduct(): void {
    const nameNorm = this.normalize(this.newProduct.name || '');
    const nameOk = nameNorm.length >= 4;

    const bc = (this.newProduct.barcode || '').trim();
    const barcodeExists = !!bc && this.allProducts.some((p) => p.barcode === bc);

    const nameExists =
      !!nameNorm && this.allProducts.some((p) => this.normalize(p.name) === nameNorm);

    this.newProductErrors.name = !nameOk;
    this.newProductErrors.barcodeExists = barcodeExists;
    this.newProductErrors.nameExists = nameExists;

    this.canSaveNewProduct = nameOk && !barcodeExists;
  }

  saveNewProductAndUse(): void {
    this.validateNewProduct();
    if (!this.canSaveNewProduct) return;

    const bc = (this.newProduct.barcode || '').trim();
    const existingByBarcode = bc
      ? this.allProducts.find((p) => p.barcode === bc)
      : undefined;
    const nameNorm = this.normalize(this.newProduct.name || '');
    const existingByName = nameNorm
      ? this.allProducts.find((p) => this.normalize(p.name) === nameNorm)
      : undefined;

    let chosen: MedicationItem | null = null;

    if (existingByBarcode) {
      chosen = existingByBarcode;
    } else if (existingByName) {
      this.confirmationService.confirm({
        header: 'Produto já existente',
        message:
          `Já existe um produto com este nome:\n` +
          `• ${existingByName.name} (cód. ${existingByName.barcode})\n\n` +
          `Deseja usar o existente ou criar um novo?`,
        icon: 'pi pi-exclamation-triangle',
        rejectLabel: 'Criar novo',
        acceptLabel: 'Usar existente',
        accept: () => {
          this.selectedProduct = existingByName;
          this.confirmSelectProduct();
          this.toggleNewProduct(false);
        },
        reject: () => {
          const barcodeToUse = bc || `MAN-${Date.now()}`;
          const created: MedicationItem = {
            barcode: barcodeToUse,
            name: this.newProduct.name.trim(),
            quantity: 0,
            observation: '',
          };
          this.allProducts.push(created);
          this.filteredProducts = [...this.allProducts];
          this.selectedProduct = created;
          this.confirmSelectProduct();
          this.toggleNewProduct(false);
        },
      });

      return;
    }

    if (!chosen) {
      const barcodeToUse = bc || `MAN-${Date.now()}`;
      const created: MedicationItem = {
        barcode: barcodeToUse,
        name: this.newProduct.name.trim(),
        quantity: 0,
        observation: '',
      };
      this.allProducts.push(created);
      this.filteredProducts = [...this.allProducts];
      chosen = created;
    }

    this.selectedProduct = chosen;
    this.confirmSelectProduct();
    this.toggleNewProduct(false);
  }

  goToSearchExisting(): void {
    const bc = (this.newProduct.barcode || '').trim();
    const name = (this.newProduct.name || '').trim();

    const query = bc || name;
    if (!query) return;

    this.productSearch = query;
    this.filterProducts();
    this.showNewProductForm = false;

    setTimeout(() => this.searchProductsInput?.nativeElement?.focus(), 0);
  }

  confirmIfSingleResult(): void {
    if (this.filteredProducts.length === 1) {
      this.selectedProduct = this.filteredProducts[0];
      this.confirmSelectProduct();
    }
  }

  filterProducts(): void {
    const q = this.normalize(this.productSearch);
    if (!q) {
      this.filteredProducts = [...this.allProducts];
      this.selectedProduct = null;
      return;
    }

    if (/^\d+$/.test(q)) {
      this.filteredProducts = this.allProducts.filter(
        (p) => this.normalize(p.barcode) === q
      );
    } else {
      if (q.length < 2) {
        this.filteredProducts = [...this.allProducts];
        this.selectedProduct = null;
        return;
      }
      this.filteredProducts = this.allProducts.filter((p) =>
        this.normalize(p.name).includes(q)
      );
    }

    this.selectedProduct = null;
  }

  clearProductSearch(): void {
    this.productSearch = '';
    this.filteredProducts = [...this.allProducts];
    this.selectedProduct = null;
    this.searchProductsInput?.nativeElement?.focus();
  }

  confirmSelectProduct(): void {
    if (!this.productToResolve || !this.selectedProduct) return;

    this.medications.update((arr) => {
      const idx = arr.indexOf(this.productToResolve!);
      if (idx === -1) return [...arr];

      const chosen = this.selectedProduct!;
      const existingIdx = arr.findIndex(
        (m, i) => m.barcode === chosen.barcode && i !== idx
      );

      if (existingIdx >= 0) {
        arr[existingIdx].quantity += arr[idx].quantity;
        arr.splice(idx, 1);
      } else {
        arr[idx] = {
          ...arr[idx],
          barcode: chosen.barcode,
          name: chosen.name,
        };
      }

      return [...arr];
    });

    this.productSelectVisible = false;
    this.productToResolve = null;
    this.selectedProduct = null;

    this.focusInput();
  }

  // Helpers ----------------------------------------------------

  private normalize(txt: string): string {
    return txt
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }
}
