import { Component, input, output } from '@angular/core';
import { CommonComponentsModule } from '@shared/common-components-module';
import { KpiCounts, KpiFilter } from '../../models/product.model';

@Component({
  selector: 'app-product-kpi',
  imports: [CommonComponentsModule],
  templateUrl: './product-kpi.html',
  styleUrl: './product-kpi.scss',
})
export class ProductKpi {
  expiringWithinDays = input.required<number>();
  kpi = input<KpiCounts>({
    expiringSoon: 0,
    expired: 0,
    belowMin: 0,
    noMovement: 0,
  });
  active = input<KpiFilter | null>(null);

  select = output<KpiFilter | null>();
  activeKpiFilter: any;
  
  toggleKpiFilter(
    kind: 'expiringSoon' | 'expired' | 'belowMin' | 'noMovement'
  ) {
    this.activeKpiFilter = this.active() === kind ? null : kind; // clique novamente para limpar
    this.select.emit(this.activeKpiFilter);
  }
}
