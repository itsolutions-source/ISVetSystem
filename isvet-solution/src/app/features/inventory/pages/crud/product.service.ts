import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Product {
  id?: string;
  barcode?: string;
  name?: string;
  description?: string;
  manufacturer?: string;
  batch?: string;
  expirationDate?: string; // ou Date
  stock?: number;
  stockMin?: number;
  status?: 'INSTOCK' | 'LOWSTOCK' | 'OUTOFSTOCK';
  unit?: 'comprimido' | 'ml' | 'g' | 'dose' | string;
}

@Injectable()
export class ProductService {
  constructor(private http: HttpClient) {}

  getProductsData(): Product[] {
    return [
      {
        id: '1',
        barcode: '789123456001',
        name: 'Dipirona Sódica 500mg',
        description: 'Analgésico e antipirético',
        manufacturer: 'Vetfarma',
        batch: 'L20240801',
        expirationDate: '2026-08-01',
        stock: 120,
        status: 'INSTOCK',
        unit: 'comprimido',
      },
      {
        id: '2',
        barcode: '789123456002',
        name: 'Doxiciclina 100mg',
        description: 'Antibiótico de amplo espectro',
        manufacturer: 'PetLife',
        batch: 'L20240712',
        expirationDate: '2025-12-31',
        stock: 35,
        status: 'LOWSTOCK',
        unit: 'comprimido',
      },
      {
        id: '3',
        barcode: '789123456003',
        name: 'Ivermectina 0,6%',
        description: 'Antiparasitário',
        manufacturer: 'Vetnil',
        batch: 'L20240610',
        expirationDate: '2025-10-10',
        stock: 0,
        status: 'OUTOFSTOCK',
        unit: 'ml',
      },
      // ... mais medicamentos conforme necessário
    ];
  }

  getProducts(): Promise<Product[]> {
    return Promise.resolve(this.getProductsData());
  }

  getProductsMini(): Promise<Product[]> {
    return Promise.resolve(this.getProductsData().slice(0, 5));
  }

  getProductsSmall(): Promise<Product[]> {
    return Promise.resolve(this.getProductsData().slice(0, 10));
  }

  generateProduct(): Product {
    const units = ['comprimido', 'ml', 'g', 'dose'];
    const statuses: Product['status'][] = ['INSTOCK', 'LOWSTOCK', 'OUTOFSTOCK'];

    return {
      id: this.generateId(),
      barcode: this.generateBarcode(),
      name: this.generateName(),
      description: 'Descrição genérica',
      manufacturer: this.generateManufacturer(),
      batch: `L${new Date().getFullYear()}${this.generateId().slice(0, 4)}`,
      expirationDate: this.generateFutureDate(),
      stock: this.generateQuantity(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      unit: units[Math.floor(Math.random() * units.length)],
    };
  }

  private generateId(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  private generateBarcode(): string {
    return String(Math.floor(Math.random() * 1_000_000_000_000)).padStart(12, '0');
  }

  private generateName(): string {
    const names = [
      'Enrofloxacino 50mg',
      'Rimadyl 25mg',
      'Hemolitan Pet',
      'Prednisolona 20mg',
      'Vacina V10',
      'Ketofen 10%',
      'Vermivet Plus',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateManufacturer(): string {
    const manufacturers = ['Zoetis', 'Vetnil', 'Vetfarma', 'Ceva', 'PetLife'];
    return manufacturers[Math.floor(Math.random() * manufacturers.length)];
  }

  private generateQuantity(): number {
    return Math.floor(Math.random() * 150);
  }

  private generateFutureDate(): string {
    const now = new Date();
    now.setFullYear(now.getFullYear() + 1);
    return now.toISOString().split('T')[0];
  }
}
