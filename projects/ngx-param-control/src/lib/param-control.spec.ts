import { Component, inject, PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  Router,
  provideRouter,
  ActivatedRoute,
  withComponentInputBinding,
} from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { Location } from '@angular/common';

import { paramControl } from './param-control';
import { SERIALIZERS } from './serializers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Minimal host component whose `paramControl()` calls are exercised in tests.
 * The factory must be called in injection context, so we drive it from
 * inside a component class.
 */
@Component({
  selector: 'test-host',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: '',
})
class HostComponent {
  /** Default string control */
  readonly query = paramControl('q', { defaultValue: '' });

  /** Numeric page control */
  readonly page = paramControl('page', {
    serializer: SERIALIZERS.number,
    defaultValue: 1,
  });

  /** Boolean toggle */
  readonly active = paramControl('active', {
    serializer: SERIALIZERS.boolean,
    defaultValue: false,
  });

  /** JSON object control */
  readonly filters = paramControl('filters', {
    serializer: SERIALIZERS.json,
    defaultValue: null,
  });

  /** pushState control */
  readonly sort = paramControl('sort', {
    defaultValue: 'asc',
    pushState: true,
  });

  /** Fast debounce for test speed */
  readonly fast = paramControl('fast', {
    defaultValue: '',
    debounceMs: 50,
  });
}

// ─── Dummy route component ────────────────────────────────────────────────────

@Component({ standalone: true, template: '' })
class DummyComponent {}

// ─── Setup helper ─────────────────────────────────────────────────────────────

async function setup(initialUrl = '/') {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      provideRouter(
        [{ path: '**', component: HostComponent }],
        withComponentInputBinding(),
      ),
    ],
  });

  const router = TestBed.inject(Router);
  const location = TestBed.inject(Location);

  // Navigate to the initial URL before creating the component.
  await router.navigateByUrl(initialUrl);

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, router, location };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('paramControl()', () => {
  // ── Initial value from URL ─────────────────────────────────────────────────

  describe('initial value hydration', () => {
    it('picks up a string value from the URL on creation', async () => {
      const { component } = await setup('/?q=hello');
      expect(component.query.value).toBe('hello');
    });

    it('uses the defaultValue when the param is absent from the URL', async () => {
      const { component } = await setup('/');
      expect(component.query.value).toBe('');
      expect(component.page.value).toBe(1);
      expect(component.active.value).toBe(false);
    });

    it('hydrates a numeric param correctly', async () => {
      const { component } = await setup('/?page=5');
      expect(component.page.value).toBe(5);
    });

    it('hydrates a boolean param correctly', async () => {
      const { component } = await setup('/?active=true');
      expect(component.active.value).toBe(true);
    });

    it('hydrates a JSON param correctly', async () => {
      const { component } = await setup('/?filters=%7B%22tag%22%3A%22ng%22%7D');
      expect(component.filters.value).toEqual({ tag: 'ng' });
    });

    it('falls back to null when no defaultValue is supplied and param is absent', async () => {
      @Component({ standalone: true, template: '' })
      class NullDefaultHost {
        readonly ctrl = paramControl('x');
      }

      TestBed.configureTestingModule({
        imports: [NullDefaultHost],
        providers: [provideRouter([{ path: '**', component: NullDefaultHost }])],
      });

      const router = TestBed.inject(Router);
      await router.navigateByUrl('/');
      const fixture = TestBed.createComponent(NullDefaultHost);
      fixture.detectChanges();
      expect(fixture.componentInstance.ctrl.value).toBeNull();
    });
  });

  // ── Control → URL ──────────────────────────────────────────────────────────

  describe('control → URL sync', () => {
    it('updates the URL query param after the debounce', fakeAsync(async () => {
      const { component, router } = await setup('/');

      component.fast.setValue('angular');
      tick(50); // debounceMs

      const url = router.url;
      expect(url).toContain('fast=angular');
    }));

    it('removes the param from the URL when the value equals the default', fakeAsync(async () => {
      const { component, router } = await setup('/?fast=angular');

      component.fast.setValue(''); // back to default
      tick(50);

      expect(router.url).not.toContain('fast=');
    }));

    it('does not write to the URL before the debounce window expires', fakeAsync(async () => {
      const { component, router } = await setup('/');

      component.fast.setValue('typing...');
      tick(10); // less than 50 ms

      expect(router.url).not.toContain('fast=');

      tick(40); // complete the window
      expect(router.url).toContain('fast=typing...');
    }));

    it('coalesces rapid changes into a single navigation', fakeAsync(async () => {
      const { component, router } = await setup('/');

      component.fast.setValue('a');
      tick(20);
      component.fast.setValue('ab');
      tick(20);
      component.fast.setValue('abc');
      tick(50);

      // Only the last value should be in the URL.
      expect(router.url).toContain('fast=abc');
      expect(router.url).not.toContain('fast=ab&');
    }));

    it('uses replaceUrl by default (no new history entry)', fakeAsync(async () => {
      const { component, location } = await setup('/');

      const historyLengthBefore = (window.history as History).length;

      component.fast.setValue('test');
      tick(50);

      // replaceUrl means history length should stay the same.
      expect((window.history as History).length).toBe(historyLengthBefore);
    }));

    it('serializes numbers correctly into the URL', fakeAsync(async () => {
      const { component, router } = await setup('/');

      @Component({ standalone: true, template: '' })
      class NumHost {
        readonly p = paramControl('p', {
          serializer: SERIALIZERS.number,
          defaultValue: 1,
          debounceMs: 0,
        });
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [NumHost],
        providers: [provideRouter([{ path: '**', component: NumHost }])],
      });
      const r = TestBed.inject(Router);
      await r.navigateByUrl('/');
      const fix = TestBed.createComponent(NumHost);
      fix.detectChanges();

      fix.componentInstance.p.setValue(42);
      tick(0);
      expect(r.url).toContain('p=42');
    }));

    it('serializes booleans correctly into the URL', fakeAsync(async () => {
      @Component({ standalone: true, template: '' })
      class BoolHost {
        readonly flag = paramControl('flag', {
          serializer: SERIALIZERS.boolean,
          defaultValue: false,
          debounceMs: 0,
        });
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [BoolHost],
        providers: [provideRouter([{ path: '**', component: BoolHost }])],
      });
      const r = TestBed.inject(Router);
      await r.navigateByUrl('/');
      const fix = TestBed.createComponent(BoolHost);
      fix.detectChanges();

      fix.componentInstance.flag.setValue(true);
      tick(0);
      expect(r.url).toContain('flag=true');
    }));

    it('serializes JSON objects correctly into the URL', fakeAsync(async () => {
      @Component({ standalone: true, template: '' })
      class JsonHost {
        readonly data = paramControl<unknown>('data', {
          serializer: SERIALIZERS.json,
          defaultValue: null,
          debounceMs: 0,
        });
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [JsonHost],
        providers: [provideRouter([{ path: '**', component: JsonHost }])],
      });
      const r = TestBed.inject(Router);
      await r.navigateByUrl('/');
      const fix = TestBed.createComponent(JsonHost);
      fix.detectChanges();

      fix.componentInstance.data.setValue({ x: 1 });
      tick(0);
      expect(decodeURIComponent(r.url)).toContain('data={"x":1}');
    }));
  });

  // ── URL → Control ──────────────────────────────────────────────────────────

  describe('URL → control sync', () => {
    it('updates the control immediately when the URL changes', fakeAsync(async () => {
      const { component, router } = await setup('/');

      await router.navigateByUrl('/?q=updated');
      TestBed.inject(ActivatedRoute); // trigger CD
      tick();

      expect(component.query.value).toBe('updated');
    }));

    it('resets the control to defaultValue when the param is removed from the URL', fakeAsync(async () => {
      const { component, router } = await setup('/?q=foo');

      await router.navigateByUrl('/');
      tick();

      expect(component.query.value).toBe('');
    }));

    it('does not emit a valueChange event when updating from URL', fakeAsync(async () => {
      const { component, router } = await setup('/');

      const emitted: Array<string | null> = [];
      component.query.valueChanges.subscribe((v) => emitted.push(v));

      // Simulate a URL navigation triggered externally.
      await router.navigateByUrl('/?q=from-url');
      tick();

      // Because setValue is called with emitEvent: false, no valueChange fires.
      expect(emitted).toEqual([]);
    }));
  });

  // ── SSR guard ──────────────────────────────────────────────────────────────

  describe('SSR safety', () => {
    it('does not call router.navigate on a non-browser platform', fakeAsync(async () => {
      @Component({ standalone: true, template: '' })
      class SsrHost {
        readonly ctrl = paramControl('x', { defaultValue: '', debounceMs: 0 });
      }

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [SsrHost],
        providers: [
          provideRouter([{ path: '**', component: SsrHost }]),
          // Simulate server-side (non-browser) platform.
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });

      const r = TestBed.inject(Router);
      spyOn(r, 'navigate').and.callThrough();

      await r.navigateByUrl('/');
      const fix = TestBed.createComponent(SsrHost);
      fix.detectChanges();

      fix.componentInstance.ctrl.setValue('changed');
      tick(0);

      // Should NOT have been called by the control→URL subscription.
      expect(r.navigate).not.toHaveBeenCalled();
    }));
  });

  // ── Cleanup ────────────────────────────────────────────────────────────────

  describe('subscription cleanup', () => {
    it('does not update the URL after the component is destroyed', fakeAsync(async () => {
      const { component, fixture, router } = await setup('/');

      fixture.destroy();

      // After destroy, changing the value should not trigger navigation.
      const navigateSpy = spyOn(router, 'navigate');
      component.fast.setValue('ghost');
      tick(50);

      expect(navigateSpy).not.toHaveBeenCalled();
    }));
  });
});
