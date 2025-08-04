import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DividerModule } from 'primeng/divider';
import { InputNumber } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';

const PRIME_NG_COMPONENTS = [
  CommonModule,
  FormsModule,
  TableModule,
  InputTextModule,
  DialogModule,
  ButtonModule,
  DividerModule,
  InputNumber,
  SelectModule,
  TagModule,
  FloatLabelModule,
];

const COMMON_COMPONENTS = [CommonModule, FormsModule];
@NgModule({
  declarations: [],
  imports: [COMMON_COMPONENTS, PRIME_NG_COMPONENTS],
  exports: [COMMON_COMPONENTS, PRIME_NG_COMPONENTS],
})
export class CommonComponentsModule {}
