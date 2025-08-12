import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

import { delay, of } from 'rxjs';
import { CommonComponentsModule } from '../../../../shared/common-components-module';
import { ConfirmationService } from 'primeng/api';

interface MedicationItem {
  barcode: string;
  name: string;
  quantity: number;
  observation?: string;
}

@Component({
  selector: 'app-product-withdrawal',
  imports: [CommonComponentsModule],
  providers: [ConfirmationService],
  templateUrl: './product-withdrawal.html',
  styleUrl: './product-withdrawal.scss',
})
export class ProductWithdrawal implements AfterViewInit, OnInit {
  @ViewChild('scannerInput')
  barcodeInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('searchProductsInput')
  searchProductsInput!: ElementRef<HTMLInputElement>;

  visible: boolean = false;
  barcodeInput = '';

  cameras: MediaDeviceInfo[] = [];
  selectedCamera: MediaDeviceInfo | null = null;
  selectedCameraLabel: any;

  readonly medications: WritableSignal<MedicationItem[]> = signal([]);
  private readonly medicationsMock: MedicationItem[] = [
    {
      barcode: '1',
      name: 'Dipirona Sódica 500mg',
      quantity: 0,
      observation: '',
    },
    { barcode: '2', name: 'Amoxicilina 250mg', quantity: 0, observation: '' },
    { barcode: '3', name: 'Cefalexina 500mg', quantity: 0, observation: '' },
    { barcode: '4', name: 'Metronidazol 250mg', quantity: 0, observation: '' },
    { barcode: '5', name: 'Prednisolona 20mg', quantity: 0, observation: '' },
    { barcode: '6', name: 'Doxiciclina 100mg', quantity: 0, observation: '' },
    { barcode: '7', name: 'Enrofloxacino 50mg', quantity: 0, observation: '' },
    { barcode: '8', name: 'Ketoprofeno 50mg', quantity: 0, observation: '' },
    { barcode: '9', name: 'Omeprazol 10mg', quantity: 0, observation: '' },
    { barcode: '10', name: 'Ivermectina 6mg', quantity: 0, observation: '' },
    { barcode: '11', name: 'Carprofeno 25mg', quantity: 0, observation: '' },
    { barcode: '12', name: 'Furosemida 40mg', quantity: 0, observation: '' },
    {
      barcode: '13',
      name: 'Cloridrato de Tramadol 50mg',
      quantity: 0,
      observation: '',
    },
    { barcode: '14', name: 'Meloxicam 7,5mg', quantity: 0, observation: '' },
    { barcode: '15', name: 'Ranitidina 150mg', quantity: 0, observation: '' },
    {
      barcode: '16',
      name: 'Sulfametoxazol + Trimetoprim 400/80mg',
      quantity: 0,
      observation: '',
    },
    {
      barcode: '17',
      name: 'Cloridrato de Difenidramina 25mg',
      quantity: 0,
      observation: '',
    },
    {
      barcode: '18',
      name: 'Ciprofloxacino 500mg',
      quantity: 0,
      observation: '',
    },
    {
      barcode: '19',
      name: 'Gentamicina 40mg/mL',
      quantity: 0,
      observation: '',
    },
    { barcode: '20', name: 'Loratadina 10mg', quantity: 0, observation: '' },
  ];

  codeResult: string = '';
  private codeReader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  scan = false;

  failedAttempts = 0;
  maxAttempts = 0;
  lastTriedBarcode = '';

  constructor(
    private cd: ChangeDetectorRef,
    private confirmationService: ConfirmationService // + ADD
  ) {}
  isMobile(): boolean {
    return window.innerWidth < 640; // Tailwind breakpoint sm = 640px
  }

  async ngOnInit() {
    this.cameras = await BrowserMultiFormatReader.listVideoInputDevices();
    this.selectedCamera = this.cameras[0];
    this.cd.detectChanges();
  }

  onCameraChange(): void {
    this.stopScanner();
    this.startScanner();
  }

  // startScanner(): void {
  //   this.scan = true;

  //   if (!this.selectedCamera || !this.videoElement) return;

  //   this.codeReader.decodeFromVideoDevice(
  //     this.selectedCamera.deviceId,
  //     this.videoElement.nativeElement,
  //     (result, err, controls) => {
  //       if (result) {
  //         alert('result: ' + result?.getText());

  //         this.codeResult = result.getText();
  //         this.onScan(this.codeResult);
  //         this.scan = false;
  //         controls.stop();
  //         this.cd.detectChanges();
  //       }
  //       this.controls = controls;
  //     }
  //   );
  // }

  startScanner(): void {
    this.scan = true;
    this.failedAttempts = 0;
    this.maxAttempts = 10;
    this.lastTriedBarcode = '';

    if (!this.selectedCamera || !this.videoElement) return;

    this.codeReader.decodeFromVideoDevice(
      this.selectedCamera.deviceId,
      this.videoElement.nativeElement,
      (result, err, controls) => {
        if (result) {
          const scannedCode = result.getText();

          // Evita processar o mesmo código repetidamente
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

  private tryHandleNotFound(barcode: string, controls: any): void {
    if (this.failedAttempts >= this.maxAttempts) {
      this.addMedication(barcode, 'Medicação não encontrada');
      controls.stop();
      this.scan = false;
      this.cd.detectChanges();
    }
  }

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
        { barcode, name, quantity: 1, observacao: '' },
      ]);
    }

    this.barcodeInput = '';
    this.focusInput();
  }

  stopScanner(): void {
    this.controls?.stop();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  ngAfterViewInit(): void {
    this.focusInput();
    // this.keepScannerFocused();
  }

  // keepScannerFocused(): void {
  //   // const input = this.scannerInput.nativeElement;

  //   // Aplica o foco de forma contínua com delay
  //   // input.focus();

  //   // input.addEventListener('blur', () => {
  //   //   setTimeout(() => input.focus(), 100);
  //   // });
  // }
  hasUnidentifiedMedication(): boolean {
    return this.medications().some(
      (m) => m.name === 'Medicação não encontrada'
    );
  }

  onScan(input: string): void {
    if (!input) return;

    const term = input.trim();
    let match: MedicationItem | undefined;

    // Helper para normalizar (remove acentos) e comparar em minúsculas
    const norm = (s: string) =>
      s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();

    // 1) Tenta match exato por código de barras (apenas dígitos)
    if (/^\d+$/.test(term)) {
      match = this.medicationsMock.find((m) => m.barcode === term);
    } else {
      // 2) Se não é código, só tenta por nome se tiver pelo menos 4 caracteres
      if (term.length >= 4) {
        const nterm = norm(term);
        match = this.medicationsMock.find((m) => norm(m.name).includes(nterm));
      }
    }

    // 3) Aplica o resultado
    if (match) {
      this.addMedication(match.barcode, match.name);
    } else {
      // Se quiser NÃO adicionar "não encontrada" quando for < 4 letras,
      // basta trocar a condição abaixo:
      // if (/^\d+$/.test(term)) { this.addMedication(term, 'Medicação não encontrada'); }
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

  onOpenCamera(): void {
    const simulatedCode = '123'; // aqui seria substituído por leitura real da câmera
    this.onScan(simulatedCode);
  }

  cancelAllFromBarcode(barcode: string): void {
    this.medications.update((arr) => arr.filter((m) => m.barcode !== barcode));
    this.focusInput();
  }

  cancelAll(): void {
    this.medications.set([]);
    this.focusInput();
  }

  private fetchMedicationName(barcode: string) {
    const found = this.medicationsMock.find((m) => m.barcode === barcode);
    const name = found ? found.name : 'Medicação não encontrada';
    return of(name).pipe(delay(300));
  }

  private focusInput(): void {
    setTimeout(() => this.barcodeInputRef?.nativeElement?.focus(), 0);
  }

  barcodeBuffer: string = '';
  scanTimeout: any;

  handleKey(event: KeyboardEvent): void {
    const key = event.key;

    if (this.scanTimeout) clearTimeout(this.scanTimeout);

    if (key === 'Enter') {
      const scanned = this.barcodeBuffer.trim();
      this.barcodeBuffer = '';

      if (scanned) {
        console.log('Simulação de leitura:', scanned);
        this.onScan(scanned); // como se fosse o leitor
      }
    } else if (key.length === 1) {
      this.barcodeBuffer += key;

      // Se o Enter não vier, zera o buffer após 1s
      this.scanTimeout = setTimeout(() => {
        this.barcodeBuffer = '';
      }, 1000);
    }
  }

  // Form de novo produto
  showNewProductForm = false;
  newProduct: MedicationItem = {
    barcode: '',
    name: '',
    quantity: 0,
    observation: '',
  };
  newProductErrors = {
    name: false,
    barcode: false,
    barcodeExists: false,
    nameExists: false,
  };
  canSaveNewProduct = false;

  // Controle de exibição do diálogo de seleção de produto
  productSelectVisible = false;

  // Armazena a referência da medicação "não encontrada" que o usuário está corrigindo
  productToResolve: MedicationItem | null = null;

  // Controle de busca no diálogo
  productSearch = '';

  // Produto atualmente selecionado na tabela do diálogo
  selectedProduct: MedicationItem | null = null;

  // Lista completa de produtos disponíveis (vinda do mock ou da API)
  allProducts: MedicationItem[] = this.medicationsMock;

  // Lista filtrada para exibir no diálogo (inicia igual à completa)
  filteredProducts: MedicationItem[] = [...this.medicationsMock];

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
      // opcional: focar no campo de nome
      setTimeout(() => {
        const el = document.getElementById(
          'newProdName'
        ) as HTMLInputElement | null;
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
    const barcodeExists =
      !!bc && this.allProducts.some((p) => p.barcode === bc);

    const nameExists =
      !!nameNorm &&
      this.allProducts.some((p) => this.normalize(p.name) === nameNorm);

    this.newProductErrors.name = !nameOk;
    this.newProductErrors.barcodeExists = barcodeExists;
    this.newProductErrors.nameExists = nameExists;

    // Continua permitindo salvar mesmo se o nome existir (soft warning)
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
      // 1) Se o código já existe, reaproveita sempre
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
          this.confirmSelectProduct(); // mantém o merge por barcode
          this.toggleNewProduct(false);
        },
        reject: () => {
          // Criar novo e usar
          const bc = (this.newProduct.barcode || '').trim();
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

      return; // importante: aguarda a escolha no diálogo
    }

    if (!chosen) {
      // 3) Criar novo
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

    // Usa o escolhido e confirma (com merge por barcode naquele método)
    this.selectedProduct = chosen;
    this.confirmSelectProduct();

    // Limpa/fecha form
    this.toggleNewProduct(false);
  }

  goToSearchExisting(): void {
    // Prioriza pesquisar por código se informado; caso contrário, usa o nome
    const bc = (this.newProduct.barcode || '').trim();
    const name = (this.newProduct.name || '').trim();

    const query = bc || name;
    if (!query) return;

    this.productSearch = query;
    this.filterProducts(); // já atualiza a tabela
    this.showNewProductForm = false; // recolhe o mini-form

    // foca no input de busca para permitir Enter imediato
    setTimeout(() => this.searchProductsInput?.nativeElement?.focus(), 0);
  }

  confirmIfSingleResult(): void {
    if (this.filteredProducts.length === 1) {
      this.selectedProduct = this.filteredProducts[0];
      this.confirmSelectProduct();
    }
  }

  private normalize(txt: string): string {
    return txt
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  }

  filterProducts(): void {
    const q = this.normalize(this.productSearch);
    if (!q) {
      this.filteredProducts = [...this.allProducts];
      this.selectedProduct = null;
      return;
    }

    if (/^\d+$/.test(q)) {
      // busca por código exato
      this.filteredProducts = this.allProducts.filter(
        (p) => this.normalize(p.barcode) === q
      );
    } else {
      // busca por nome (2+ caracteres no diálogo para ser responsivo)
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

      // Procura outra linha com o mesmo barcode escolhido (diferente da linha atual)
      const existingIdx = arr.findIndex(
        (m, i) => m.barcode === chosen.barcode && i !== idx
      );

      if (existingIdx >= 0) {
        // 🔁 Já existe um item com esse barcode: MERGE
        arr[existingIdx].quantity += arr[idx].quantity; // soma as quantidades
        // Opcional: você pode limpar observação da linha existente, se quiser
        // (arr[existingIdx] as any).observacao = '';
        // (arr[existingIdx] as any).observation = '';

        // Remove a linha "não encontrada" (a que estava sendo corrigida)
        arr.splice(idx, 1);
      } else {
        // 🪄 Não existe duplicado: apenas substitui código e nome mantendo a quantidade da linha
        arr[idx] = {
          ...arr[idx],
          barcode: chosen.barcode,
          name: chosen.name,
          // Opcional: limpar observação se desejar
          // observation: '',
          // (arr[idx] as any).observacao = '';
        };
      }

      return [...arr];
    });

    // Fecha diálogo e limpa estados
    this.productSelectVisible = false;
    this.productToResolve = null;
    this.selectedProduct = null;

    this.focusInput();
  }
}
