import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductEntry } from './product-entry';

describe('ProductEntry', () => {
  let component: ProductEntry;
  let fixture: ComponentFixture<ProductEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
