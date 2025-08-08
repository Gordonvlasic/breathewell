import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechniqueDetailComponent } from './technique-detail.component';

describe('TechniqueDetailComponent', () => {
  let component: TechniqueDetailComponent;
  let fixture: ComponentFixture<TechniqueDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TechniqueDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechniqueDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
