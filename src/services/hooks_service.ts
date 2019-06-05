import { ServiceRegistrySingleton } from "../utils/service_registry";
import { Hook } from "../utils/hook";

export class HooksService {
  private registeredHooks: Hook[] = [];

  async start(enabledHooks: string[]) {
    // Register
    for (const hook of enabledHooks) {
      const injectedHook = ServiceRegistrySingleton.inject<Hook>(hook);
      if (injectedHook) {
        this.registeredHooks.push(injectedHook);
      }
    }

    // Init
    for (const hook of this.registeredHooks) {
      await hook.init();
    }
  }
}
