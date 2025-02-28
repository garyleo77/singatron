import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FencingGeminiComponent } from './fencing-gemini.component';

describe('FencingGeminiComponent', () => {
  let component: FencingGeminiComponent;
  let fixture: ComponentFixture<FencingGeminiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FencingGeminiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FencingGeminiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
