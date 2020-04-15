import { AcromeanHook } from "./hooks/acromean/acromean";
import { BogoVotoHook } from "./hooks/bogovoto/bogovoto";
import { FoogleHook } from "./hooks/foogle/foogle";
import { InnovateHook } from "./hooks/innovate/innovate";
import { RandomojiHook } from "./hooks/randomoji/randomoji";
import { ReplybotHook } from "./hooks/replybot/replybot";
import { SampleHook } from "./hooks/sample-hook";
import { SnapchatHook } from "./hooks/snapchat/snapchat";
import { VersionHook } from "./hooks/version/version";
import { WhatHook } from "./hooks/what/what";
import { DadbotHook } from "./hooks/dadbot/dadbot";

import { FuckOffHook } from "./hooks/fuckoff/fuckoff";
import { DiscordService } from "./services/app/discord_service";
import { HooksService } from "./services/app/hooks_service";
import { DateService } from "./services/core/date.service";
import { CountThrottleStrategyService } from "./services/throttle/countThrottleStrategy.service";
import { FuckOffThrottleStrategyService } from "./services/throttle/fuckOffThrottleStrategy.service";
import { TimeThrottleStrategyService } from "./services/throttle/timeThrottleStrategy.service";
import { ServiceRegistrySingleton } from "./utils/service_registry";
import { OrThrottleStrategyService } from "./services/throttle/orThrottleStrategy.service";
import { AndThrottleStrategyService } from "./services/throttle/andThrottleStrategy.service";
import { RandomThrottleStrategyService } from "./services/throttle/randomThrottleStrategy.service";
import { FeedMeWordsHook } from "./hooks/feedmewords/feedmewords";
import { DataService } from "./services/app/data_service";

const ENABLED_HOOKS = [
    "acromeanHook",
    "bogovotoHook",
    "foogleHook",
    "randomojiHook",
    "snapchatHook",
    "whatHook",
    "sampleHook",
    "versionHook",
    "innovateHook",
    "replybotHook",
    "fuckOffHook",
    "dadbotHook",
    "feedMeWordsHook",
];

class Main {
    constructor(
        private readonly discordService: DiscordService,
        private readonly hooksService: HooksService,
        private readonly dataService: DataService,
    ) {
        this.start();
    }

    public async start() {
        await this.discordService.start();
        await this.hooksService.start(ENABLED_HOOKS);

        this.dataService.db.collection('app-data').onSnapshot(e => {
            e.docs.forEach(d => console.log(d.data()));
        });
    }
}

function registerServices() {
    ServiceRegistrySingleton.addService("main", Main);
    ServiceRegistrySingleton.addService("discordService", DiscordService);
    ServiceRegistrySingleton.addService("hooksService", HooksService);
    ServiceRegistrySingleton.addService("dateService", DateService);
    ServiceRegistrySingleton.addService("dataService", DataService);
    ServiceRegistrySingleton.addService("countThrottleStrategyService", CountThrottleStrategyService);
    ServiceRegistrySingleton.addService("timeThrottleStrategyService", TimeThrottleStrategyService);
    ServiceRegistrySingleton.addService("andThrottleStrategyService", AndThrottleStrategyService);
    ServiceRegistrySingleton.addService("orThrottleStrategyService", OrThrottleStrategyService);
    ServiceRegistrySingleton.addService("fuckOffThrottleStrategyService", FuckOffThrottleStrategyService);
    ServiceRegistrySingleton.addService("randomThrottleStrategyService", RandomThrottleStrategyService);

    ServiceRegistrySingleton.addService("acromeanHook", AcromeanHook);
    ServiceRegistrySingleton.addService("bogovotoHook", BogoVotoHook);
    ServiceRegistrySingleton.addService("foogleHook", FoogleHook);
    ServiceRegistrySingleton.addService("randomojiHook", RandomojiHook);
    ServiceRegistrySingleton.addService("snapchatHook", SnapchatHook);
    ServiceRegistrySingleton.addService("whatHook", WhatHook);
    ServiceRegistrySingleton.addService("sampleHook", SampleHook);
    ServiceRegistrySingleton.addService("versionHook", VersionHook);
    ServiceRegistrySingleton.addService("innovateHook", InnovateHook);
    ServiceRegistrySingleton.addService("replybotHook", ReplybotHook);
    ServiceRegistrySingleton.addService("fuckOffHook", FuckOffHook);
    ServiceRegistrySingleton.addService("dadbotHook", DadbotHook);
    ServiceRegistrySingleton.addService("feedMeWordsHook", FeedMeWordsHook);
}

registerServices();
ServiceRegistrySingleton.inject("main");