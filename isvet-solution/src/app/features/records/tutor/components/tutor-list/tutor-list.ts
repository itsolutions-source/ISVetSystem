import {
  Component,
  signal,
  WritableSignal,
  computed,
  EventEmitter,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* PrimeNG */
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Tutor } from '../tutor-form/tutor-form';

@Component({
  selector: 'app-tutor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    FloatLabelModule,
    DividerModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  template: `
    <div class="space-y-4">
      <p-card>
        <div
          class="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
        >
          <div>
            <h2 class="m-0 text-xl font-semibold">Tutores</h2>
            <div class="opacity-70 text-sm">
              Gerencie os tutores e seus animais.
            </div>
          </div>
          <div class="flex gap-2">
            <button
              pButton
              label="Novo Tutor"
              icon="pi pi-plus"
              (click)="openCreate()"
            ></button>
          </div>
        </div>
      </p-card>

      <p-card>
        <div class="flex flex-col sm:flex-row sm:items-end gap-3">
          <p-floatlabel class="w-full sm:w-80" variant="on">
            <input
              pInputText
              id="q"
              class="w-full"
              [(ngModel)]="q"
              placeholder="Nome, telefone, email..."
            />
            <label for="q">Buscar</label>
          </p-floatlabel>

          <p-floatlabel class="w-full sm:w-56" variant="on">
            <input
              pInputText
              id="city"
              class="w-full"
              [(ngModel)]="cityFilter"
              placeholder="Cidade"
            />
            <label for="city">Cidade</label>
          </p-floatlabel>

          <p-floatlabel class="w-full sm:w-24" variant="on">
            <input
              pInputText
              id="uf"
              maxlength="2"
              class="w-full"
              [(ngModel)]="ufFilter"
              placeholder="UF"
            />
            <label for="uf">UF</label>
          </p-floatlabel>

          <span class="flex-1"></span>
          <div class="flex gap-2">
            <button
              pButton
              label="Limpar"
              class="p-button-secondary"
              (click)="clearFilters()"
            ></button>
            <button pButton label="Atualizar" icon="pi pi-refresh"></button>
          </div>
        </div>
      </p-card>

      <p-card>
        <ng-template #caption>
          <div
            class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full"
          >
            <h5 class="m-0 text-center sm:text-left w-full">Resultados</h5>
            <div
              class="text-sm opacity-80 text-center sm:text-right w-full sm:w-auto"
            >
              {{ filtered().length }} tutor(es)
            </div>
          </div>
        </ng-template>

        <p-table
          #dt
          [value]="paged()"
          [paginator]="true"
          [rows]="rowsPerPage"
          [totalRecords]="filtered().length"
          [rowsPerPageOptions]="[10, 20, 50]"
          [tableStyle]="{ 'min-width': '60rem' }"
        >
          <ng-template #header>
            <tr>
              <th style="width: 28%">Nome</th>
              <th style="width: 16%">Telefone</th>
              <th style="width: 22%">Email</th>
              <th style="width: 16%">Cidade/UF</th>
              <th style="width: 8%">Status</th>
              <th style="width: 10%"></th>
            </tr>
          </ng-template>

          <ng-template #body let-t>
            <tr>
              <td class="font-medium">
                {{ t.name }}
                <div class="opacity-70 text-xs" *ngIf="t.animals?.length">
                  {{ animalNames(t) }}
                </div>
              </td>
              <td>{{ t.phone || '—' }}</td>
              <td>{{ t.email || '—' }}</td>
              <td>
                {{ t.city || '—' }}<span *ngIf="t.state">/{{ t.state }}</span>
              </td>
              <td>
                <p-tag
                  [value]="t.active !== false ? 'Ativo' : 'Inativo'"
                  [severity]="t.active !== false ? 'success' : 'warning'"
                />
              </td>
              <td class="text-right">
                <button
                  pButton
                  icon="pi pi-eye"
                  class="p-button-text"
                  (click)="openView(t)"
                ></button>
                <button
                  pButton
                  icon="pi pi-pencil"
                  class="p-button-text"
                  (click)="openEdit(t)"
                ></button>
                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-danger p-button-text"
                  (click)="askDelete(t)"
                ></button>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="text-center py-6">
                Nenhum tutor encontrado.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <p-confirmDialog [style]="{ width: '26rem' }"></p-confirmDialog>
  `,
})
export class TutorListComponent {
  @Output() createRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<Tutor>();
  @Output() viewRequested = new EventEmitter<Tutor>();

  // filtros
  q = '';
  cityFilter = '';
  ufFilter = '';
  rowsPerPage = 10;
  pageIndex = 0;

  // mock
  private readonly data: Tutor[] = [
    {
      id: 'T1',
      name: 'Ana Souza',
      phone: '(11) 98888-1111',
      email: 'ana@ex.com',
      city: 'São Paulo',
      state: 'SP',
      active: true,
      animals: [{ name: 'Thor', species: 'Cão' }],
    },
    {
      id: 'T2',
      name: 'Bruno Lima',
      phone: '(11) 97777-2222',
      email: 'bruno@ex.com',
      city: 'Campinas',
      state: 'SP',
      active: true,
      animals: [
        { name: 'Mimi', species: 'Gato' },
        { name: 'Bob', species: 'Cão' },
      ],
    },
    {
      id: 'T3',
      name: 'Carla Alves',
      phone: '(21) 96666-3333',
      email: 'carla@ex.com',
      city: 'Rio de Janeiro',
      state: 'RJ',
      active: false,
      animals: [],
    },
  ];

  readonly rows: WritableSignal<Tutor[]> = signal(this.data);

  constructor(private confirm: ConfirmationService) {}

  private normalize = (s: string) =>
    s
      ?.normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();

  filtered = computed(() => {
    const nq = this.normalize(this.q || '');
    const ncity = this.normalize(this.cityFilter || '');
    const nuf = (this.ufFilter || '').toUpperCase().trim();

    return this.rows().filter((t) => {
      if (nq) {
        const text = [t.name, t.phone, t.email]
          .map((v) => this.normalize(v || ''))
          .join(' ');
        if (!text.includes(nq)) return false;
      }
      if (ncity && this.normalize(t.city || '') !== ncity) return false;
      if (nuf && (t.state || '').toUpperCase() !== nuf) return false;
      return true;
    });
  });

  paged = computed(() => {
    const start = this.pageIndex * this.rowsPerPage;
    return this.filtered().slice(start, start + this.rowsPerPage);
  });

  animalNames(t: Tutor): string {
    return (t.animals || []).map((a) => a.name).join(', ');
  }

  clearFilters(): void {
    this.q = '';
    this.cityFilter = '';
    this.ufFilter = '';
    this.pageIndex = 0;
  }

  openCreate(): void {
    this.createRequested.emit();
  }
  openEdit(t: Tutor): void {
    this.editRequested.emit(t);
  }
  openView(t: Tutor): void {
    this.viewRequested.emit(t);
  }

  askDelete(t: Tutor): void {
    this.confirm.confirm({
      message: `Remover tutor "${t.name}"? Esta ação não pode ser desfeita.`,
      header: 'Confirmar exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remover',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTutor(t.id),
    });
  }

  private deleteTutor(id: string): void {
    this.rows.set(this.rows().filter((x) => x.id !== id));
  }
}
