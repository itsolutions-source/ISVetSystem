import { Routes } from '@angular/router';
import { AppLayout } from './core/layout/component/app.layout';
import { Crud } from './features/inventory/pages/crud/crud';
import { ProductInsights } from './features/inventory/pages/product-insights/product-insights';
import { ProductWithdrawal } from './features/inventory/pages/product-withdrawal/product-withdrawal';

export const routes: Routes = [
  {
    path: '',
    component: AppLayout,
    children: [
      { path: 'estoque/retirada', component: ProductWithdrawal },
      { path: 'estoque/inventario', component: Crud },
      { path: 'estoque/produto-insights', component: ProductInsights },
    ],
  },
];
