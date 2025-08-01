import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { IMedication } from '../../models/medication.model';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import Quagga from 'quagga';

@Component({
  selector: 'app-withdraw-dialog',
  imports: [MatDialogModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './withdraw-dialog.component.html',
  styleUrls: ['./withdraw-dialog.component.scss']
})
export class WithdrawDialogComponent implements OnInit {
  quantidade: number = 1;
  scannedCode: string | null = null;
  cameraStatus: boolean = true

  constructor(
    public dialogRef: MatDialogRef<WithdrawDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IMedication
  ) {}
  ngOnInit(): void {
    this.setup().initReader()
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  confirmar(): void {
    // aqui você pode enviar os dados para o backend ou atualizar localmente
    this.dialogRef.close({ quantidade: this.quantidade });
  }

  setup() {
    this.cameraStatus = true
    const initReader = () => {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: document.querySelector('#barcode-scanner'), // elemento onde o vídeo será renderizado
          },
          decoder: {
            readers: ['ean_reader'], // escolha os tipos de códigos que você quer ler
          },
        },
        (err: any) => {
          if (err) {
            console.error(err);
            return;
          }
          Quagga.start();

          Quagga.onDetected((result: any) => {
            onDetected(result);
          });
        }
      );
    };

    const stopReader = () => {
      Quagga.stop();
      this.cameraStatus = false
    };

    const onDetected = (data: any) => {
      this.scannedCode = data.codeResult.code;
      console.log('Código detectado:', data.codeResult.code);
      stopReader()
    };

    return {
      initReader,
      stopReader,
    };
  }
}
