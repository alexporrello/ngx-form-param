import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxFormGroup } from './ngx-form-group';

describe('NgxFormGroup', () => {
  let component: NgxFormGroup;
  let fixture: ComponentFixture<NgxFormGroup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxFormGroup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxFormGroup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
