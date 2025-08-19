import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { CommonComponentsModule } from '@shared/common-components-module';
import { InventoryRow } from '../../models/product.model';

@Component({
  standalone: true,
  selector: 'app-product-table',
  imports: [CommonComponentsModule],
  templateUrl: './product-table.html',
  styleUrls: ['./product-table.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductTable {
  rows = input<InventoryRow[]>([]);
  paginator = input<boolean>(true);
  pageSize = input<number>(10);
  pageSizeOptions = input<number[]>([10, 20, 50]);
  rowHover = input<boolean>(true);
  minWidth = input<string>('60rem');

  rowSelected = output<InventoryRow>();
}
