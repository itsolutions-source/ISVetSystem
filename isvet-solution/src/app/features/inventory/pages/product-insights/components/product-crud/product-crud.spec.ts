import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCrud } from './product-crud';

describe('ProductCrud', () => {
  let component: ProductCrud;
  let fixture: ComponentFixture<ProductCrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
