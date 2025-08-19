import { Component, input, model, output } from '@angular/core';
import { CommonComponentsModule } from '@shared/common-components-module';
import {
  BatchRow,
  InboundRow,
  InventoryRow,
  OutgoRow,
  StockSummary,
} from '../../models/product.model';

@Component({
  selector: 'app-product-details',
  imports: [CommonComponentsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss',
})
export class ProductDetails {
  visible = model<boolean>(false);

  // dados
  selectedRow = input<InventoryRow | null>();
  stockSummary = input<StockSummary>();
  batchesByProduct = input<BatchRow[]>([]);
  outgoSummary = input<OutgoRow[]>([]);
  inboundSummary = input<InboundRow[]>([]);

  // ações
  audit = output<void>();
  edit = output<InventoryRow>();
  closed = output<void>();

  onClose() {
    this.visible.set(false);
    this.closed.emit();
  }
}
