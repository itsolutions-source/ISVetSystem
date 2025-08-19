import { Component, input, model, output } from '@angular/core';
import { CommonComponentsModule } from '@shared/common-components-module';
import {
  BatchRow,
  LotRow,
  Option,
  OptionValue,
  ProductForm,
} from '../../models/product.model';

@Component({
  selector: 'app-product-crud',
  imports: [CommonComponentsModule],
  templateUrl: './product-crud.html',
  styleUrl: './product-crud.scss',
})
export class ProductCrud {
  /** Visibilidade (two-way) */
  visible = model<boolean>(false);

  /** Aparência/posicionamento do Drawer */
  position = input<'right' | 'left' | 'top' | 'bottom'>('right');
  styleClass = input<string>('!w-full lg:!w-[50rem]');
  closable = input<boolean>(false);

  /** Título/estado */
  isEditing = input<boolean>(false);

  /** Opções */
  unitOptions = input<Option<OptionValue>[]>([]);
  categoryOptions = input<Option<OptionValue>[]>([]);

  /** Estado do formulário (two-way no pai se quiser) */
  form = model<ProductForm>({
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
  });

  /** Lotes (two-way no pai se quiser) */
  lotRows = model<LotRow[]>([]);

  /** Ações */
  cancel = output<void>();
  save = output<{ product: ProductForm; lots: LotRow[] }>();

  // —— helpers de mutação imutável —— //
  patch(partial: Partial<ProductForm>) {
    const next = { ...this.form(), ...partial };
    this.form.set(next);
  }

  addLotRow() {
    const next = [...this.lotRows(), { lot: '', expiresAt: null, quantity: 0 }];
    this.lotRows.set(next);
  }

  removeLotRow(index: number) {
    const next = this.lotRows().slice();
    next.splice(index, 1);
    this.lotRows.set(next);
  }

  formValid(): boolean {
    const f = this.form();
    const nameOk = (f.name ?? '').trim().length >= 3;
    const minOk = (f.minStock ?? 0) >= 0;
    const qtyOk = (f.currentQty ?? 0) >= 0;
    return nameOk && minOk && qtyOk;
  }

  onCancel() {
    this.cancel.emit();
    this.visible.set(false);
  }

  onSave() {
    if (!this.formValid()) return;
    this.save.emit({ product: this.form(), lots: this.lotRows() });
    // Não fecha automaticamente; deixe o PAI decidir (padrão dumb)
  }
}
