import { AcromeanHook } from './hooks/acromean/acromean';
import { BogoVotoHook } from './hooks/bogovoto/bogovoto';
import { FoogleHook } from './hooks/foogle/foogle';
import { RandomojiHook } from './hooks/randomoji/randomoji';
import { SnapchatHook } from './hooks/snapchat/snapchat';
import { WhatHook } from './hooks/what/what';
import { DiscordService } from './services/discord_service';
import { HooksService } from './services/hooks_service';
import { ServiceRegistrySingleton } from './utils/service_registry';
import { SampleHook } from './hooks/sample-hook';
import { VersionHook } from './hooks/version/version';
import { InnovateHook } from './hooks/innovate/innovate';

const ENABLED_HOOKS = [
  'acromeanHook',
  'bogovotoHook',
  'foogleHook',
  'randomojiHook',
  'snapchatHook',
  'whatHook',
  'sampleHook',
  'versionHook',
  'innovateHook',
];

class Main {
  constructor(
    private readonly discordService: DiscordService,
    private readonly hooksService: HooksService) {
    this.start();
  };

  async start() {
    await this.discordService.start();
    await this.hooksService.start(ENABLED_HOOKS);
  }
}

function registerServices() {
  ServiceRegistrySingleton.addService('main', Main);
  ServiceRegistrySingleton.addService('discordService', DiscordService);
  ServiceRegistrySingleton.addService('hooksService', HooksService);

  ServiceRegistrySingleton.addService('acromeanHook', AcromeanHook);
  ServiceRegistrySingleton.addService('bogovotoHook', BogoVotoHook);
  ServiceRegistrySingleton.addService('foogleHook', FoogleHook);
  ServiceRegistrySingleton.addService('randomojiHook', RandomojiHook);
  ServiceRegistrySingleton.addService('snapchatHook', SnapchatHook);
  ServiceRegistrySingleton.addService('whatHook', WhatHook);
  ServiceRegistrySingleton.addService('sampleHook', SampleHook);
  ServiceRegistrySingleton.addService('versionHook', VersionHook);
  ServiceRegistrySingleton.addService('innovateHook', InnovateHook);
}

registerServices();
ServiceRegistrySingleton.inject('main');