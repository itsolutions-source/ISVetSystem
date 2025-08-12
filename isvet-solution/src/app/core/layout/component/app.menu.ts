import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, AppMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    <ng-container *ngFor="let item of model; let i = index">
      <li
        app-menuitem
        *ngIf="!item.separator"
        [item]="item"
        [index]="i"
        [root]="true"
      ></li>
      <li *ngIf="item.separator" class="menu-separator"></li>
    </ng-container>
  </ul> `,
})
export class AppMenu {
  model: MenuItem[] = [];

  ngOnInit() {
    this.model = [
  {
    label: '',
    items: [
      { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
    ],
  },
  {
    label: '',
    items: [
      {
        label: 'Prontuário',
        icon: 'pi pi-fw pi-book',
        items: [
          { label: 'Histórico de Atendimentos', icon: 'pi pi-fw pi-calendar', routerLink: ['/prontuario/historico'] },
          { label: 'Novo Atendimento', icon: 'pi pi-fw pi-plus-circle', routerLink: ['/prontuario/novo'] },
          { label: 'Vacinas e Prescrições', icon: 'pi pi-fw pi-briefcase', routerLink: ['/prontuario/vacinas'] },
        ],
      },
    ],
  },
  {
    label: '',
    items: [
      {
        label: 'Cadastros',
        icon: 'pi pi-fw pi-users',
        items: [
          { label: 'Animais', icon: 'animal', routerLink: ['/cadastros/animal'] },
          { label: 'Tutores', icon: 'pi pi-fw pi-user', routerLink: ['/cadastros/tutor'] },
          { label: 'Funcionários', icon: 'pi pi-fw pi-id-card', routerLink: ['/cadastros/funcionario'] },
          { label: 'Fornecedores', icon: 'pi pi-fw pi-truck', routerLink: ['/cadastros/fornecedor'] },
        ],
      },
    ],
  },
  {
    label: '',
    items: [
      {
        label: 'Estoque',
        icon: 'pi pi-fw pi-box',
        items: [
          { label: 'Lista de Produtos', icon: 'pi pi-fw pi-table', routerLink: ['/estoque/listagem'] },
          { label: 'Entrada de Produtos', icon: 'pi pi-fw pi-plus', routerLink: ['/estoque/entrada'] },
          { label: 'Retirada de Produtos', icon: 'pi pi-fw pi-minus', routerLink: ['/estoque/retirada'] },
          { label: 'Inventário', icon: 'pi pi-fw pi-clipboard', routerLink: ['/estoque/inventario'] },
        ],
      },
    ],
  },
  {
    label: '',
    items: [
      {
        label: 'Internações e Cirurgias',
        icon: 'pi pi-fw pi-heart',
        items: [
          { label: 'Lista de Internações', icon: 'pi pi-fw pi-list', routerLink: ['/internacoes/listagem'] },
          { label: 'Nova Internação', icon: 'pi pi-fw pi-plus-circle', routerLink: ['/internacoes/nova'] },
          { label: 'Histórico do Animal', icon: 'pi pi-fw pi-clock', routerLink: ['/internacoes/historico'] },
          { label: 'Cirurgias', icon: 'pi pi-fw pi-scissors', routerLink: ['/internacoes/cirurgias'] },
        ],
      },
    ],
  },
  {
    label: '',
    items: [
      {
        label: 'Configurações',
        icon: 'pi pi-fw pi-cog',
        items: [
          { label: 'Dados da Clínica', icon: 'pi pi-fw pi-building', routerLink: ['/configuracoes/clinica'] },
          { label: 'Permissões', icon: 'pi pi-fw pi-lock', routerLink: ['/configuracoes/permissoes'] },
        ],
      },
    ],
  },
];

  }
}
