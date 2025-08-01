import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryListPage } from './inventory-list.page';

describe('InventoryListPage', () => {
  let component: InventoryListPage;
  let fixture: ComponentFixture<InventoryListPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryListPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
