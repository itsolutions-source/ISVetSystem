import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutorPage } from './tutor-page';

describe('TutorPage', () => {
  let component: TutorPage;
  let fixture: ComponentFixture<TutorPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutorPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
