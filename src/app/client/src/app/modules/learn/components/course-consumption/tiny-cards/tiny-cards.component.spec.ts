import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TinyCardsComponent } from './tiny-cards.component';

describe('TinyCardsComponent', () => {
  let component: TinyCardsComponent;
  let fixture: ComponentFixture<TinyCardsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TinyCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TinyCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
