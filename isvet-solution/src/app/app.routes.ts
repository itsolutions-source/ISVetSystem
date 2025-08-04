import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/component/app.layout';
import { ProductWithdrawal } from './features/inventory/pages/product-withdrawal/product-withdrawal';
import { Crud } from './features/inventory/pages/crud/crud';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'estoque/retirada', component: ProductWithdrawal },
      { path: 'estoque/inventario', component: Crud },
    ],
  },
];
