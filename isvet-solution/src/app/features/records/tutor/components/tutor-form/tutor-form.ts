import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToggleSwitchModule } from 'primeng/toggleswitch';

type Animal = {
  id?: string;
  name: string;
  species: 'Cão' | 'Gato' | 'Ave' | 'Réptil' | 'Outros' | '';
  breed?: string;
  sex?: 'Macho' | 'Fêmea' | 'Indefinido';
  color?: string;
  birthDate?: Date | null;
  weightKg?: number | null;
  microchip?: string;
  notes?: string;
  active?: boolean;
};

export type Tutor = {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  phoneAlt?: string;
  email?: string;
  zip?: string;
  address?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  notes?: string;
  marketingOptIn?: boolean;
  animals: Animal[];
  active?:boolean
};

@Component({
  selector: 'app-tutor-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    InputMaskModule,
    ButtonModule,
    DividerModule,
    TableModule,
    TagModule,
    FloatLabelModule,
    DatePickerModule,
    DialogModule,
    SelectModule,
    TextareaModule,
    ToastModule,
    ToggleSwitchModule,
  ],
  templateUrl: './tutor-form.html',
  styleUrls: ['./tutor-form.scss'],
})
export class TutorForm {
  /** Recebe um tutor para edição; se não vier, é novo */
  @Input() value: Tutor | null = null;
  /** Título opcional do form (senão usa padrão) */
  @Input() title?: string;
  @Input() readonly = false;

  /** Emite o tutor salvo */
  @Output() saved = new EventEmitter<Tutor>();
  /** Emite quando cancelado */
  @Output() cancelled = new EventEmitter<void>();

  tutor: Tutor = {
    id: '',
    name: '',
    animals: [],
    marketingOptIn: true,
  };

  // Dialog Animal
  animalDialogVisible = false;
  editingAnimalIndex = -1;
  animalForm: Animal = this.blankAnimal();

  speciesOptions = [
    { label: 'Cão', value: 'Cão' },
    { label: 'Gato', value: 'Gato' },
    { label: 'Ave', value: 'Ave' },
    { label: 'Réptil', value: 'Réptil' },
    { label: 'Outros', value: 'Outros' },
  ];

  sexOptions = [
    { label: 'Macho', value: 'Macho' },
    { label: 'Fêmea', value: 'Fêmea' },
    { label: 'Indefinido', value: 'Indefinido' },
  ];

  /* ---------- Tutor ---------- */
  isTutorValid(): boolean {
    return !!this.tutor.name && this.tutor.name.trim().length >= 3;
  }

  onSave(): void {
    if (!this.isTutorValid()) return;
    const payload: Tutor = structuredClone(this.tutor);
    // se for novo, atribui um id mock
    if (!payload.id) payload.id = 'T' + Date.now();
    this.saved.emit(payload);
    // reset opcional:
    // this.tutor = { name: '', animals: [], marketingOptIn: true };
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  /* ---------- Animal Dialog ---------- */
  openAnimalDialog(): void {
    this.editingAnimalIndex = -1;
    this.animalForm = this.blankAnimal();
    this.animalDialogVisible = true;
  }

  editAnimal(index: number): void {
    this.editingAnimalIndex = index;
    this.animalForm = { ...this.tutor.animals[index] };
    // Ajuste birthDate -> Date (se vier string num backend futuramente)
    if (
      this.animalForm.birthDate &&
      !(this.animalForm.birthDate instanceof Date)
    ) {
      this.animalForm.birthDate = new Date(this.animalForm.birthDate as any);
    }
    this.animalDialogVisible = true;
  }

  isAnimalValid(): boolean {
    return !!this.animalForm.name && this.animalForm.name.trim().length >= 1;
  }

  saveAnimal(): void {
    if (!this.isAnimalValid()) return;

    const clone: Animal = {
      ...this.animalForm,
      name: (this.animalForm.name || '').trim(),
    };

    if (this.editingAnimalIndex === -1) {
      this.tutor.animals = [...this.tutor.animals, clone];
    } else {
      const arr = [...this.tutor.animals];
      arr[this.editingAnimalIndex] = clone;
      this.tutor.animals = arr;
    }

    this.animalDialogVisible = false;
    this.editingAnimalIndex = -1;
    this.animalForm = this.blankAnimal();
  }

  removeAnimal(index: number): void {
    const arr = this.tutor.animals.filter((_, i) => i !== index);
    this.tutor.animals = arr;
  }

  private blankAnimal(): Animal {
    return {
      name: '',
      species: '',
      sex: 'Indefinido',
      birthDate: null,
      weightKg: null,
      active: true,
    };
  }
}
