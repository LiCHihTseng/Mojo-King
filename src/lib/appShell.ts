import type { InjectionKey, Ref } from "vue";

export interface RouteTransitionController {
  readonly isTransitioning: Readonly<Ref<boolean>>;
  navigateToService(href: string): Promise<void>;
  returnToServices(): Promise<void>;
  preloadImage(src: string): void;
}

export const entranceReadyKey: InjectionKey<Readonly<Ref<boolean>>> =
  Symbol("entranceReady");
export const routeTransitionKey: InjectionKey<RouteTransitionController> =
  Symbol("routeTransition");
