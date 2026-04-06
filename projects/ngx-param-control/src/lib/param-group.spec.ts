import { Component } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { paramGroup } from './param-group';

// ─── Host component ───────────────────────────────────────────────────────────

@Component({
    selector: 'group-host',
    standalone: true,
    imports: [ReactiveFormsModule],
    template: ''
})
class GroupHostComponent {
    readonly filters = paramGroup({
        search: {
            type: 'string',
            debounceMs: 0
        },
        page: {
            type: 'number',
            default: 1,
            debounceMs: 0
        },
        active: {
            type: 'boolean',
            default: false,
            debounceMs: 0
        }
    });
}

// ─── Setup helper ─────────────────────────────────────────────────────────────

async function setup(initialUrl = '/') {
    TestBed.configureTestingModule({
        imports: [GroupHostComponent],
        providers: [
            provideRouter([{ path: '**', component: GroupHostComponent }])
        ]
    });

    const router = TestBed.inject(Router);
    await router.navigateByUrl(initialUrl);

    const fixture = TestBed.createComponent(GroupHostComponent);
    fixture.detectChanges();

    return { fixture, component: fixture.componentInstance, router };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('paramGroup()', () => {
    // ── Structure ──────────────────────────────────────────────────────────────

    describe('FormGroup structure', () => {
        it('returns a FormGroup with the correct control names', async () => {
            const { component } = await setup('/');
            const keys = Object.keys(component.filters.formGroup.controls);
            expect(keys).toContain('search');
            expect(keys).toContain('page');
            expect(keys).toContain('active');
        });

        it('creates a FormControl for each entry in the config', async () => {
            const { component } = await setup('/');
            expect(component.filters.formGroup.controls['search']).toBeTruthy();
            expect(component.filters.formGroup.controls['page']).toBeTruthy();
            expect(component.filters.formGroup.controls['active']).toBeTruthy();
        });
    });

    // ── Initial value hydration ────────────────────────────────────────────────

    describe('initial value hydration', () => {
        it('uses defaultValues when params are absent', async () => {
            const { component } = await setup('/');
            expect(component.filters.formGroup.value).toEqual({
                search: '',
                page: 1,
                active: false
            });
        });

        it('hydrates each control from the URL on creation', async () => {
            const { component } = await setup('/?q=angular&page=3&active=true');
            expect(component.filters.formGroup.value).toEqual({
                search: 'angular',
                page: 3,
                active: true
            });
        });

        it('hydrates partial params, using defaults for absent ones', async () => {
            const { component } = await setup('/?q=test');
            expect(component.filters.formGroup.value).toEqual({
                search: 'test',
                page: 1,
                active: false
            });
        });
    });

    // ── Control → URL ──────────────────────────────────────────────────────────

    describe('control → URL sync', () => {
        it('updates the URL when a control inside the group changes', fakeAsync(async () => {
            const { component, router } = await setup('/');

            component.filters.formGroup.controls['search'].setValue('rxjs');
            tick(0);

            expect(router.url).toContain('q=rxjs');
        }));

        it('updates the URL independently for each control', fakeAsync(async () => {
            const { component, router } = await setup('/');

            component.filters.formGroup.controls['page'].setValue(5);
            tick(0);
            component.filters.formGroup.controls['active'].setValue(true);
            tick(0);

            expect(router.url).toContain('page=5');
            expect(router.url).toContain('active=true');
        }));

        it('removes a param when its value reverts to the default', fakeAsync(async () => {
            const { component, router } = await setup('/?page=5');

            component.filters.formGroup.controls['page'].setValue(1); // back to default
            tick(0);

            expect(router.url).not.toContain('page=');
        }));

        it('patchValue updates multiple controls simultaneously', fakeAsync(async () => {
            const { component, router } = await setup('/');

            component.filters.formGroup.patchValue({
                search: 'forms',
                page: 2
            });
            tick(0);

            expect(router.url).toContain('q=forms');
            expect(router.url).toContain('page=2');
        }));
    });

    // ── URL → Control ──────────────────────────────────────────────────────────

    describe('URL → control sync', () => {
        it('updates individual controls when the URL changes', fakeAsync(async () => {
            const { component, router } = await setup('/');

            await router.navigateByUrl('/?q=signal&page=2');
            tick();

            expect(component.filters.formGroup.controls['search'].value).toBe(
                'signal'
            );
            expect(component.filters.formGroup.controls['page'].value).toBe(2);
        }));

        it('resets controls to defaults when params are removed from URL', fakeAsync(async () => {
            const { component, router } = await setup('/?q=hello&page=3');

            await router.navigateByUrl('/');
            tick();

            expect(component.filters.formGroup.controls['search'].value).toBe(
                ''
            );
            expect(component.filters.formGroup.controls['page'].value).toBe(1);
        }));
    });

    // ── Cleanup ────────────────────────────────────────────────────────────────

    describe('subscription cleanup', () => {
        it('stops updating the URL after the host component is destroyed', fakeAsync(async () => {
            const { component, fixture, router } = await setup('/');

            fixture.destroy();

            const navigateSpy = spyOn(router, 'navigate');
            component.filters.formGroup.controls['search'].setValue('ghost');
            tick(0);

            expect(navigateSpy).not.toHaveBeenCalled();
        }));
    });
});
