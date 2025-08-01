import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/component/app.layout';
import { ProductWithdrawal } from './features/inventory/pages/product-withdrawal/product-withdrawal';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [{ path: 'estoque/retirada', component: ProductWithdrawal }],
  },
];
