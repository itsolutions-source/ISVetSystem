import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DividerModule } from 'primeng/divider';
import { InputNumber, InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { DrawerModule } from 'primeng/drawer';
import { MultiSelectModule } from 'primeng/multiselect';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { TextareaModule } from 'primeng/textarea';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { DatePicker } from 'primeng/datepicker';

const PRIME_NG_COMPONENTS = [
  TableModule,
  InputTextModule,
  DialogModule,
  ButtonModule,
  DividerModule,
  InputNumber,
  SelectModule,
  TagModule,
  FloatLabelModule,
  ConfirmDialogModule,
  CardModule,
  CheckboxModule,
  TooltipModule,
  DrawerModule,
  MultiSelectModule,
  RippleModule,
  ToastModule,
  ToolbarModule,
  RatingModule,
  TextareaModule,
  RadioButtonModule,
  InputNumberModule,
  InputIconModule,
  IconFieldModule,
  DatePicker,
];

const COMMON_COMPONENTS = [CommonModule, FormsModule];
@NgModule({
  declarations: [],
  imports: [COMMON_COMPONENTS, PRIME_NG_COMPONENTS],
  exports: [COMMON_COMPONENTS, PRIME_NG_COMPONENTS],
})
export class CommonComponentsModule {}
