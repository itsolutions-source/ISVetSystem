// audit-drawer.component.ts
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';

import { CommonComponentsModule } from '@shared/common-components-module';
import {
  AuditAction,
  AuditLogEntry,
  AuditSeverity,
  Option,
  OptionValue,
} from '../../models/product.model';

@Component({
  standalone: true,
  selector: 'app-product-logs',
  imports: [CommonComponentsModule],
  templateUrl: './product-logs.html',
  styleUrl: './product-logs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductLogs {
  visible = model<boolean>(false);

  position = input<'right' | 'left' | 'top' | 'bottom'>('right');
  modal = input<boolean>(true);
  dismissible = input<boolean>(true);
  blockScroll = input<boolean>(true);
  styleClass = input<string>('!w-full md:!w-80 lg:!w-[70rem]');
  closable = input<boolean>(true);

  from = model<Date>();
  to = model<Date>();
  actor = model<string>('');
  actions = model<OptionValue[]>([]);

  actionOptions = input<Option<OptionValue>[]>([]);
  selectedItemsLabel = input<string>('{0} ações');

  rows = input<AuditLogEntry[]>([]);

  paginator = input<boolean>(true);
  pageSize = input<number>(10);
  pageSizeOptions = input<number[]>([10, 20, 50]);
  rowHover = input<boolean>(true);
  minWidth = input<string>('52rem');

  labelForAction = input<(a: AuditAction) => string>((a) => a);

  severityForAction = input<(a: AuditAction) => AuditSeverity>((_a) => 'info');

  exportCsv = output<void>();
  clear = output<void>();
}
