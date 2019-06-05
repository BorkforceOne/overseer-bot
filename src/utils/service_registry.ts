const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;

interface ClassConstructor<T> {
  new(...args: any[]): T;
}

interface ServiceRegistryEntry<T> {
  name: string;
  constr: ClassConstructor<T>;
  scope: ServiceRegistryScope,
}

type ServiceRegistryRuntimeEntries = { [name: string]: any };

// TODO(borkforceone): Scope not yet fully implemented
export enum ServiceRegistryScope {
  TRANSIENT,
  SINGLETON,
}

/**
 * Simple Service Registry that handles dependency injection.
 */
export class ServiceRegistry {
  private services: { [name: string]: ServiceRegistryEntry<any> } = {};
  private runtimeServices: ServiceRegistryRuntimeEntries = {};

  addService<T>(name: string, service: ClassConstructor<T>, scope: ServiceRegistryScope = ServiceRegistryScope.SINGLETON) {
    this.services[name] = {
      name,
      constr: service,
      scope,
    };
  }

  inject<T>(name: string): T | null {
    const service = this.services[name];

    if (!service) {
      throw new Error(`No service registered for '${name}'`);
    }

    if (service.scope === ServiceRegistryScope.SINGLETON && this.runtimeServices[name]) {
      return this.runtimeServices[name];
    }

    // Inject parameters
    const paramNames = this.getParamNames(service.constr);
    const params = [];

    for (const param of paramNames) {
      const dependency = this.inject(param);

      if (!dependency) {
        console.error(`Could not inject: ${param}`);
        return null;
      }

      params.push(dependency)
    }

    // Create new service
    const runtimeService = this.applyToConstructor(service.constr, params);

    // Save new service
    if (service.scope === ServiceRegistryScope.SINGLETON) {
      this.runtimeServices[name] = runtimeService;
    }

    return runtimeService;
  }

  private getParamNames(func: ClassConstructor<any>): string[] {
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

    if (result === null)
      return [];

    return result;
  }

  private applyToConstructor(constructor: any, argArray: any) {
    const args = [null].concat(argArray);
    const factoryFunction = constructor.bind.apply(constructor, args);
    return new factoryFunction();
  }
}

/* Singleton version of the registry */
export const ServiceRegistrySingleton = new ServiceRegistry();
