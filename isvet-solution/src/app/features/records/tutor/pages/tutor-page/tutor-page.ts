// tutor-page.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

/* Componentes filhos */
import { Tutor, TutorForm } from '../../components/tutor-form/tutor-form';
import { TutorListComponent } from '../../components/tutor-list/tutor-list';

@Component({
  selector: 'app-tutor-page',
  standalone: true,
  imports: [CommonModule, DialogModule, TutorListComponent, TutorForm],
  template: `
    <div class="space-y-4">
      <!-- Lista -->
      <app-tutor-list
        (createRequested)="openCreate()"
        (editRequested)="openEdit($event)"
        (viewRequested)="openEdit($event)"
      ></app-tutor-list>
    </div>

    <!-- Dialog com o formulário -->
    <p-dialog
      [(visible)]="formVisible"
      [modal]="true"
      [style]="{ width: '72rem', maxWidth: '95vw' }"
      [breakpoints]="{ '1199px': '85vw', '768px': '95vw' }"
      [draggable]="false"
      [resizable]="false"
      [dismissableMask]="true"
      [closeOnEscape]="true"
    >
      <app-tutor-form
        [value]="editingTutor"
        (saved)="handleSaved($event)"
        (cancelled)="formVisible = false"
        [readonly]="viewMode"
      ></app-tutor-form>
    </p-dialog>
  `,
})
export class TutorPageComponent {
  formVisible = false;
  editingTutor: Tutor | null = null;
  viewMode = false;

  // mocks locais (poderia estar num service/store)
  // OBS: a lista real exibida está dentro do TutorListComponent;
  // para efeitos de protótipo, vamos só abrir/fechar o modal e logar.
  // Quando conectar com API/store, você injeta um service compartilhado.

  openCreate(): void {
    this.editingTutor = null;
    this.formVisible = true;
  }

  openEdit(tutor: Tutor): void {
    this.editingTutor = tutor;
    this.formVisible = true;
  }

  handleSaved(t: Tutor): void {
    console.log('SALVAR/ATUALIZAR TUTOR (container, protótipo):', t);
    // Aqui você chamaria o service:
    //  if (existente) update; else create; depois refresh lista (via service/store)
    this.formVisible = false;
  }
}
