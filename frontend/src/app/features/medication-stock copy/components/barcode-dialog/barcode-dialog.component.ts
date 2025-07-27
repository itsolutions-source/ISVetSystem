import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import Quagga from 'quagga';
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

@Component({
  selector: 'app-barcode-dialog',
  imports: [
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './barcode-dialog.component.html',
  styleUrl: './barcode-dialog.component.scss',
})
export class BarcodeDialogComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    this.setup().initReader();
    // this.setupHtml5();
  }
  scannedCode: string | null = null;
  cameraStatus = true;

  html5QrCode!: Html5Qrcode;

  setup() {
    this.cameraStatus = true;

    const initReader = () => {
      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            constraints: {
              width: 640,
              height: 480,
              facingMode: 'environment', // usa câmera traseira se disponível
            },
            target: document.querySelector('#barcode-scanner'), // elemento onde o vídeo será renderizado
          },
          decoder: {
            readers: ['code_128_reader', 'ean_reader', 'ean_8_reader'], // escolha os tipos de códigos que você quer ler
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
    };

    const onDetected = (data: any) => {
      alert('entrou: ' + data.codeResult.code);
      if (data.codeResult.code == '7622201050757') {
        alert('entrou: ' + data.codeResult.code);
        this.cameraStatus = false;

        stopReader();
      }

      this.scannedCode = data.codeResult.code;
      console.log('Código detectado:', data.codeResult.code);
    };

    return {
      initReader,
      stopReader,
    };
  }

  //  setup() {
  //   this.cameraStatus = false;
  //   const initReader = () => {
  //     Quagga.init(
  //       {
  //         inputStream: {
  //           name: 'Live',
  //           type: 'LiveStream',
  //           target: document.querySelector('#barcode-scanner'), // elemento onde o vídeo será renderizado
  //         },
  //         decoder: {
  //           readers: ['ean_reader'], // escolha os tipos de códigos que você quer ler
  //         },
  //       },
  //       (err: any) => {
  //         if (err) {
  //           console.error(err);
  //           return;
  //         }
  //         Quagga.start();

  //         Quagga.onDetected((result: any) => {
  //           onDetected(result);
  //         });
  //       }
  //     );
  //   };

  //   const stopReader = () => {
  //     Quagga.stop();
  //     this.cameraStatus = true;
  //   };

  //   const onDetected = (data: any) => {
  //     alert(data.codeResult.code);

  //     this.scannedCode = data.codeResult.code;
  //     console.log('Código detectado:', data.codeResult.code);
  //     // stopReader()
  //   };

  //   return {
  //     initReader,
  //     stopReader,
  //   };
  // }

  setupHtml5() {
    const config = { fps: 10, qrbox: 250 };

    this.html5QrCode = new Html5Qrcode('barcode-scanner');

    this.html5QrCode
      .start(
        { facingMode: { exact: 'environment' } }, // câmera traseira
        config,
        (decodedText, decodedResult) => {
          this.scannedCode = decodedText;
          alert('entrou: ' + decodedText);

          if (decodedText == '7622201050757') {
            alert('entrou: ' + decodedText);
            // this.cameraStatus = false;
            this.html5QrCode.stop().then(() => {
              console.log('Scanner parado.');
            });
          }
          this.html5QrCode.stop().then(() => {
            console.log('Scanner parado.');
          });
        },
        (errorMessage) => {
          console.warn('Erro ao ler: ', errorMessage);
        }
      )
      .catch((err) => {
        console.error('Erro ao iniciar o scanner:', err);
      });
  }
}
