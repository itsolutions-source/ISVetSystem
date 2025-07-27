import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicationStockComponent } from './medication-stock.component';

describe('MedicationStockComponent', () => {
  let component: MedicationStockComponent;
  let fixture: ComponentFixture<MedicationStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MedicationStockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
