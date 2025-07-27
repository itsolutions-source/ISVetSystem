import Quagga from 'quagga';
import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IMedication } from './models/medication.model';
import { MatDialog } from '@angular/material/dialog';
import { WithdrawDialogComponent } from './components/withdraw-dialog/withdraw-dialog.component';
import { BarcodeDialogComponent } from './components/barcode-dialog/barcode-dialog.component';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-medication-stock',
  imports: [
    MatFormFieldModule,
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './medication-stock.component.html',
  styleUrl: './medication-stock.component.scss',
})
export class MedicationStockComponent implements OnDestroy {
  filtro: string = '';
  dadosOriginais: IMedication[] = [
    {
      nome: 'Carprofen',
      codigoBarras: '12345678901',
      lote: 'A12345',
      validade: new Date('2024-08-15'),
      fornecedor: 'VetPharm',
      quantidade: 25,
    },
    {
      nome: 'Amoxicillin',
      codigoBarras: '12345678901',
      lote: 'B23456',
      validade: new Date('2023-12-20'),
      fornecedor: 'AnimalMed',
      quantidade: 50,
    },
    {
      nome: 'Meloxicam',
      codigoBarras: '12345678904',
      lote: 'C34567',
      validade: new Date('2024-05-10'),
      fornecedor: 'PetHealth',
      quantidade: 40,
    },
    {
      nome: 'Enrofloxacin',
      codigoBarras: '12345678905',
      lote: 'D45678',
      validade: new Date('2023-07-25'),
      fornecedor: 'Veterinarly Supplies',
      quantidade: 30,
    },
    {
      nome: 'Cefovecin',
      codigoBarras: '12345678906',
      lote: 'E56789',
      validade: new Date('2024-09-30'),
      fornecedor: 'MediVet',
      quantidade: 20,
    },
    {
      nome: 'Maropitant',
      codigoBarras: '12345678907',
      lote: 'F67890',
      validade: new Date('2024-03-05'),
      fornecedor: 'Petz',
      quantidade: 15,
    },
  ];
  dadosFiltrados = new MatTableDataSource(this.dadosOriginais);
  colunas: string[] = [
    'nome',
    'codigoBarras',
    'lote',
    'validade',
    'fornecedor',
    'quantidade',
    'acoes',
  ];

  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;
  codeResult: string = '';
  private codeReader = new BrowserMultiFormatReader();
  cameraStatus: boolean = false;
  constructor(private dialog: MatDialog) {}

  scannedCode: string | null = null;

  teste(): void {
    this.codeReader
      .decodeFromVideoDevice(
        undefined,
        this.videoElement.nativeElement,
        (result: any, error: any) => {
          if (result) {
            this.codeResult = result.getText();
          }
        }
      )
      .catch((err) => console.error('Erro ao acessar câmera:', err));
  }
  filtrar() {
    const filtroLower = this.filtro.toLowerCase();
    this.dadosFiltrados.data = this.dadosOriginais.filter(
      (med) =>
        med.nome.toLowerCase().includes(filtroLower) ||
        med.codigoBarras.includes(filtroLower)
    );
  }

  abrirFormulario() {
    // lógica para abrir modal de cadastro de medicação
  }

  editar(med: IMedication) {
    // lógica para editar medicação
  }

  retirar(med: IMedication) {
    this.dialog.open(WithdrawDialogComponent, {
      data: med,
    });
  }

  abrirLeitorCamera() {
    // this.setup().initReader();
    // this.dialog.open(BarcodeDialogComponent, {});
    this.teste();
  }

  setup() {
    this.cameraStatus = false;
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
      this.cameraStatus = true;
    };

    const onDetected = (data: any) => {
      alert(data.codeResult.code);

      this.scannedCode = data.codeResult.code;
      console.log('Código detectado:', data.codeResult.code);
      // stopReader()
    };

    return {
      initReader,
      stopReader,
    };
  }

  ngOnDestroy(): void {
    Quagga.stop();
    Quagga.offDetected(() => {});

    // this.destroy$.next();
    // this.destroy$.complete();
    // if (this.stream) {
    //   this.stream.getTracks().forEach((track) => track.stop());
    // }
  }

  ////////////////////////////////////////

  gravando = false;
  audioUrl: string | null = null;
  audioBlob: Blob | null = null;
  mediaRecorder!: MediaRecorder;
  chunks: Blob[] = [];
  nomeArquivo: string = 'consulta-audio.webm';
  streamRef!: MediaStream;

  iniciarGravacao() {
    this.audioUrl = null;
    this.audioBlob = null;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        this.streamRef = stream;
        this.mediaRecorder = new MediaRecorder(stream);
        this.chunks = [];

        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            this.chunks.push(e.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          if (this.chunks.length) {
            this.audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
            this.audioUrl = URL.createObjectURL(this.audioBlob);
          }
          this.streamRef.getTracks().forEach((track) => track.stop());
        };

        this.mediaRecorder.start();
        this.gravando = true;
      })
      .catch((err) => {
        console.error('Erro ao acessar microfone:', err);
      });
  }

  pararGravacao() {
    if (this.mediaRecorder && this.gravando) {
      this.mediaRecorder.stop();
      this.gravando = false;
    }
  }

  salvarAudio() {
    if (!this.audioBlob) return;
    const blob = this.audioBlob;
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = this.nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  //////////////

  // private stream: MediaStream | null = null;
  // private mediaRecorder: MediaRecorder | null = null;
  // private audioChunks: Blob[] = [];
  // private destroy$ = new Subject<void>();
  // isRecording: boolean = false;
  // audioBlob: Blob | null = null;
  // audioUrl: string | null = null;

  // downloadAudio(): void {
  //   if (this.audioBlob) {
  //     const link = document.createElement('a');
  //     link.href = this.audioUrl!;
  //     link.download = 'audio_gravado.wav';
  //     link.click();
  //   }
  // }

  // stopRecording(): void {
  //   if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
  //     this.mediaRecorder.stop();
  //     this.isRecording = false;
  //   }
  // }

  // startRecording(): void {
  //   this.audioChunks = [];
  //   this.audioBlob = null;
  //   this.audioUrl = null;
  //   this.isRecording = true;
  //   navigator.mediaDevices
  //     .getUserMedia({ audio: true })
  //     .then((stream) => {
  //       this.stream = stream;
  //       this.mediaRecorder = new MediaRecorder(stream);
  //       this.mediaRecorder.ondataavailable = (event) => {
  //         this.audioChunks.push(event.data);
  //       };
  //       this.mediaRecorder.onstop = () => {
  //         console.log("entrouuu")
  //         this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
  //         this.audioUrl = window.URL.createObjectURL(this.audioBlob);
  //         this.stream?.getTracks().forEach((track) => track.stop());
  //                   console.log("audioUrl: ", this.audioUrl)

  //       };
  //       this.mediaRecorder.start();
  //     })
  //     .catch((err) => {
  //       console.error('Error accessing the microphone:', err);
  //       this.isRecording = false;
  //     });
  // }
}
