import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductWithdrawal } from './product-withdrawal';

describe('ProductWithdrawal', () => {
  let component: ProductWithdrawal;
  let fixture: ComponentFixture<ProductWithdrawal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductWithdrawal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductWithdrawal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
