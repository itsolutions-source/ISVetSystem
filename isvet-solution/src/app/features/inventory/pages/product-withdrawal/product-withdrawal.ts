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

interface MedicationItem {
  barcode: string;
  name: string;
  quantity: number;
  observation?: string;
}

@Component({
  selector: 'app-product-withdrawal',
  imports: [CommonComponentsModule],
  templateUrl: './product-withdrawal.html',
  styleUrl: './product-withdrawal.scss',
})
export class ProductWithdrawal implements AfterViewInit, OnInit {
  @ViewChild('barcodeInputElement')
  barcodeInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('scannerInput') scannerInput!: ElementRef<HTMLInputElement>;

  visible: boolean = false;
  barcodeInput = '';

  cameras: MediaDeviceInfo[] = [];
  selectedCamera: MediaDeviceInfo | null = null;
  selectedCameraLabel: any;

  readonly medications: WritableSignal<MedicationItem[]> = signal([]);
  private readonly medicationsMock: Record<string, string> = {
    '1': 'Dipirona Sódica 500mg',
    '2': 'Amoxicilina 250mg',
    '3': 'Cefalexina 500mg',
    '4': 'Metronidazol 250mg',
    '5': 'Prednisolona 20mg',
    '6': 'Doxiciclina 100mg',
    '7': 'Enrofloxacino 50mg',
    '8': 'Ketoprofeno 50mg',
    '9': 'Omeprazol 10mg',
    '10': 'Ivermectina 6mg',
    '11': 'Carprofeno 25mg',
    '12': 'Furosemida 40mg',
    '13': 'Cloridrato de Tramadol 50mg',
    '14': 'Meloxicam 7,5mg',
    '15': 'Ranitidina 150mg',
    '16': 'Sulfametoxazol + Trimetoprim 400/80mg',
    '17': 'Cloridrato de Difenidramina 25mg',
    '18': 'Ciprofloxacino 500mg',
    '19': 'Gentamicina 40mg/mL',
    '20': 'Loratadina 10mg',
  };

  codeResult: string = '';
  private codeReader = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  scan = false;

  failedAttempts = 0;
  maxAttempts = 0;
  lastTriedBarcode = '';

  constructor(private cd: ChangeDetectorRef) {}

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
    // this.focusInput();
    this.keepScannerFocused();
  }

  keepScannerFocused(): void {
    const input = this.scannerInput.nativeElement;

    // Aplica o foco de forma contínua com delay
    input.focus();

    // input.addEventListener('blur', () => {
    //   setTimeout(() => input.focus(), 100);
    // });
  }
  hasUnidentifiedMedication(): boolean {
    return this.medications().some(
      (m) => m.name === 'Medicação não encontrada'
    );
  }

  showDialog() {
    this.visible = true;
  }

  onScan(barcode: string): void {
    if (!barcode) return;

    this.fetchMedicationName(barcode).subscribe({
      next: (name) => {
        if (!name) {
          this.barcodeInput = '';
          this.focusInput();
          return;
        }

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
      },
      error: () => {
        this.barcodeInput = '';
        this.focusInput();
      },
    });
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
    const name = this.medicationsMock[barcode] ?? 'Medicação não encontrada';
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
}
