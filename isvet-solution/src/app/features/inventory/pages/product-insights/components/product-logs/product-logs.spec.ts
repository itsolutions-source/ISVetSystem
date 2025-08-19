import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductLogs } from './product-logs';

describe('ProductLogs', () => {
  let component: ProductLogs;
  let fixture: ComponentFixture<ProductLogs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductLogs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductLogs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
