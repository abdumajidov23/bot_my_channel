import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { options } from './telegram-config.factory';
import { TelegramService } from './telegram.service';

@Module({
    imports: [TelegrafModule.forRootAsync(options()), HttpModule],
    providers: [TelegramService],
})
export class TelegramModule {}
