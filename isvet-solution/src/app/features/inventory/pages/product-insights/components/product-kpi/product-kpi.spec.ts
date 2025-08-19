import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductKpi } from './product-kpi';

describe('ProductKpi', () => {
  let component: ProductKpi;
  let fixture: ComponentFixture<ProductKpi>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductKpi]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductKpi);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
