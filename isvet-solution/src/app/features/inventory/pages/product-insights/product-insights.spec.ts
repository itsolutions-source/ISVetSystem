import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductInsights } from './product-insights';

describe('ProductInsights', () => {
  let component: ProductInsights;
  let fixture: ComponentFixture<ProductInsights>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductInsights]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductInsights);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
