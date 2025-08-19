import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';

import { CommonComponentsModule } from '@shared/common-components-module';
import { OptionValue, Option } from '../../models/product.model';

@Component({
  standalone: true,
  selector: 'app-product-filters',
  imports: [CommonComponentsModule],
  templateUrl: './product-filter.html',
  styleUrls: ['./product-filter.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductFilters {
  search = model<string>('');
  selectedCategories = model<OptionValue[]>([]);
  statusFilter = model<OptionValue | null>(null);

  categoryOptions = input<Option<OptionValue>[]>([]);
  statusOptions = input<Option<OptionValue>[]>([]);
  selectedItemsLabel = input<string>('{0} categorias selecionadas');

  clear = output<void>();
  create = output<void>();

  onClear() {
    this.clear.emit();
  }
  onCreate() {
    this.create.emit();
  }
}
