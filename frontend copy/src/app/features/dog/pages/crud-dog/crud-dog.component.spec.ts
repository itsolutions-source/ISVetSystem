import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrudDogComponent } from './crud-dog.component';

describe('CrudDogComponent', () => {
  let component: CrudDogComponent;
  let fixture: ComponentFixture<CrudDogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrudDogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrudDogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
