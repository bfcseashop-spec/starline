import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { BroadcastService } from "./broadcast.service";

/**
 * Lightweight in-process tick (no @nestjs/schedule dep needed) — every 60s
 * we ask the broadcast service to drain due targets. For higher volume,
 * swap this for BullMQ or pg-boss without changing the rest of the code.
 */
@Injectable()
export class SocialSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SocialSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly broadcasts: BroadcastService) {}

  onModuleInit() {
    this.timer = setInterval(() => this.tick().catch((e) => this.logger.error(e)), 60_000);
    setTimeout(() => this.tick().catch((e) => this.logger.error(e)), 5_000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const { processed } = await this.broadcasts.runDueTargets();
      if (processed > 0) this.logger.log(`Processed ${processed} due target(s)`);
    } finally {
      this.running = false;
    }
  }
}
