import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';

import { TableModule } from 'primeng/table';
import { delay, of } from 'rxjs';

import { DividerModule } from 'primeng/divider';
import { InputNumber } from 'primeng/inputnumber';

interface MedicationItem {
  barcode: string;
  name: string;
  quantity: number;
  observation?: string;
}

@Component({
  selector: 'app-product-withdrawal',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    FormsModule,
    InputTextModule,
    DialogModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    DividerModule,
    InputNumber,
  ],
  templateUrl: './product-withdrawal.html',
  styleUrl: './product-withdrawal.scss'
})
export class ProductWithdrawal implements AfterViewInit {
  @ViewChild('barcodeInputElement')
  barcodeInputRef!: ElementRef<HTMLInputElement>;
  visible: boolean = false;
  barcodeInput = '';

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

  ngAfterViewInit(): void {
    this.focusInput();
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
}
