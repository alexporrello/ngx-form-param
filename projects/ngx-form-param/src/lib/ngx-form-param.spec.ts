import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxFormParam } from './ngx-form-param';

describe('NgxFormParam', () => {
  let component: NgxFormParam;
  let fixture: ComponentFixture<NgxFormParam>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFormParam],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxFormParam);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
