import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Command, Ctx, Hears, Message, On, Start, Update } from 'nestjs-telegraf';
import { Observable, filter, map, mergeMap, tap } from 'rxjs';
import { Scenes, Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
dotenv.config();


interface TelegramMesage {
    message: {
        voice: {
            duration: number;
            mime_type: string;
            file_id: string;
            file_unique_id: string;
            file_size: number;
        };
    };
}

export interface Context extends Scenes.SceneContext {}

@Update()
export class TelegramService extends Telegraf {
    private _token: string;
    constructor(
        private readonly config: ConfigService,
        private readonly httpService: HttpService,
    ) {
        super(config.get('TELEGRAM_BOT_TOKEN'));
        this._token = config.get('TELEGRAM_BOT_TOKEN');
    }

    @Start()
    async onStart(@Ctx() ctx: Context) {
        await ctx.replyWithHTML(`
            Assalomu alaykum va rohmatulloh, Salomatmisiz <b>${ctx.from.first_name}</b> !\nSizga qanday yordam bera olaman?`);
        }
        
    @Hears(/assalomu alaykum/i)
    async onSalam(@Ctx() ctx: Context) {
        const reply = `Va alaykumussalam ${ctx.from.first_name ? ctx.from.first_name : ''}! Sizga qanday yordam bera olaman, Salomatmisiz?`;
        await ctx.reply(reply);
        }
        
    @Command('/challenge')
    async onChallenge(@Ctx() ctx: Context) {
            const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];

            for (const adminId of adminIds) {
                try {
                    await ctx.telegram.sendMessage(adminId, 'Test xabari');
                } catch (error) {
                    console.error(`Admin ID: ${adminId}, Xato:`, error);
                }
            }
        }
        

    @On('text')
    async onText(@Ctx() ctx: Context) {
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []; 
        const userMessage = (ctx.message as any).text; 
        const userId = ctx.from.id;
        const username = ctx.from.username || ' username yo‘q ❌';
        const userName = ctx.from.first_name || 'Foydalanuvchi';
    
        for (const adminId of adminIds) {
            await ctx.telegram.sendMessage(
                adminId,
                `📝 Yangi savol yoki taklif:\n` +
                `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n@${username}\n` +
                `📩 Xabar: ${userMessage}\n`
            );
        }
    
        await ctx.reply('Savolingiz yoki taklifingiz uchun rahmat! Tez orada javob beramiz. 😊');
    }
    
    @On('photo')
    async onPhoto(@Ctx() ctx: Context) {
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []; 

        const photos = (ctx.message as any).photo; 
        const userId = ctx.from.id;
        const username = ctx.from.username || " username yo‘q ❌";
        const userName = ctx.from.first_name || 'Foydalanuvchi';
        const caption = (ctx.message as any).caption || ''; 
    
        if (photos && Array.isArray(photos) && photos.length > 0) {
            const largestPhoto = photos[photos.length - 1]; 
            const fileId = largestPhoto.file_id;
    
            for (const adminId of adminIds) {
                await ctx.telegram.sendPhoto(
                    adminId,
                    fileId,
                    {
                        caption: `🖼 Yangi rasm:\n` +
                        `📝 Izoh: ${caption}\n` +
                        `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n@${username}`
                    }
                );
            }
    
            await ctx.reply('🎉');
            await ctx.reply('Qabul qilindi \nRasmingiz uchun rahmat! Tez orada javob beramiz. 😊');
        } else {
            await ctx.reply('☹️❌');
            await ctx.reply('Kechirasiz, rasmni qabul qila olmadim. Iltimos, qayta urinib ko‘ring.');
        }
    }


    @On("video_note")
    async onVideoNote(@Ctx() ctx: Context) {
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || [];
        const userId = ctx.from?.id;
        const username = ctx.from?.username || ' username yo‘q ❌';
        const userName = ctx.from?.first_name || 'Foydalanuvchi';
        const videoNote = (ctx.message as any).video_note;
    
        if (!videoNote) {
            await ctx.reply('Dumaloq video topilmadi. ❌');
            return;
        }
    
        try {
            for (const adminId of adminIds) {
                await ctx.telegram.sendMessage(
                    adminId,
                    `📹 Yangi dumaloq video:\n` +
                    `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n` +
                    `@${username}\n⏳ Uzunligi: ${videoNote.duration} soniya.\n` +
                    `🔘 Hajmi: ${videoNote.length} px.`
                );
    
                await ctx.telegram.sendVideoNote(adminId, videoNote.file_id);
            }
    
            await ctx.reply("Video murojaatingiz uchun rahmat. Biz tez orada javob qaytaramiz.");
        } catch (error) {
            console.error('Xatolik yuz berdi:', error);
            await ctx.reply('Dumaloq videoni yuborishda xatolik yuz berdi. ❌');
        }
    }

    @On("video")
    async onVideo(@Ctx() ctx: Context) {
        const caption = (ctx.message as any).caption || '';
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []; 
        const userId = ctx.from?.id;
        const username = ctx.from?.username || ' username yo‘q ❌';
        const userName = ctx.from?.first_name || 'Foydalanuvchi';
        const video = (ctx.message as any).video;

        if (!video) {
            await ctx.reply('Ovozli xabar topilmadi. ❌');
            return;
        }

        try {
            for (const adminId of adminIds) {
                await ctx.telegram.sendMessage(
                    adminId,
                    `🎞 Yangi video xabar:\n` +
                    `📜 Izoh: ${caption}\n` +
                    `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n` +
                    `@${username}\n⏳ Uzunligi: ${video.duration} soniya.`
                );

                await ctx.telegram.sendVideo(adminId, video.file_id);
            }

            await ctx.reply('Video uchun rahmat! Tez orada javob beramiz. 😊');
        } catch (error) {
            console.error('Xatolik yuz berdi:', error);
            await ctx.reply('Ovozli xabarni yuborishda xatolik yuz berdi. ❌');
        }
    }

    
    @On("voice")
    async onVoice(@Ctx() ctx: Context) {
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []; 
        const userId = ctx.from?.id;
        const username = ctx.from?.username || ' username yo‘q ❌';
        const userName = ctx.from?.first_name || 'Foydalanuvchi';
        const voice = (ctx.message as any).voice;

        if (!voice) {
            await ctx.reply('Ovozli xabar topilmadi. ❌');
            return;
        }

        try {
            for (const adminId of adminIds) {
                await ctx.telegram.sendMessage(
                    adminId,
                    `🔊 Yangi ovozli xabar:\n` +
                    `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n` +
                    `@${username}\n⏳ Uzunligi: ${voice.duration} soniya.`
                );

                await ctx.telegram.sendVoice(adminId, voice.file_id);
            }

            await ctx.reply('Ovozli xabaringiz uchun rahmat! Tez orada javob beramiz. 😊');
        } catch (error) {
            console.error('Xatolik yuz berdi:', error);
            await ctx.reply('Ovozli xabarni yuborishda xatolik yuz berdi. ❌');
        }
    }

    @On("message")
    async onMessage(@Ctx() ctx: Context) {
        const adminIds = process.env.ADMIN_IDS?.split(',').map(id => parseInt(id.trim())) || []; 
        const userId = ctx.from.id;
        const username = ctx.from.username || " username yo‘q ❌";
        const userName = ctx.from.first_name || " Foydalanuvchi";

    
        const sticker = (ctx.message as any).sticker;
        const animation = (ctx.message as any).animation;
        const document = (ctx.message as any).document;
    
        if (sticker) {
            const stickerId = sticker.file_id;
        
            for (const adminId of adminIds) {
                await ctx.telegram.sendSticker(adminId, stickerId);
        
                await ctx.telegram.sendMessage(
                    adminId,
                    `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n@${username}`
                );
            }
            await ctx.reply("Stikeringiz uchun rahmat😊!");
    
        
        } else if (animation) {
            const animationId = animation.file_id;
    
            for (const adminId of adminIds) {
                await ctx.telegram.sendAnimation(adminId, animationId, {
                    caption: `👤 Foydalanuvchi: ${userName} (ID: ${userId})\n@${username}`,
                });
            }
    
            await ctx.reply("GIF uchun rahmat! Tez orada javob beramiz. 😊");
        } else if (document) {
            const documentId = document.file_id;
            const caption = (ctx.message as any).caption || ''; 
            for (const adminId of adminIds) {
                await ctx.telegram.sendDocument(adminId, documentId, {
                    caption: `📄 Yangi fayl:\n📜 Izoh: ${caption}\n👤 Foydalanuvchi: ${userName} (ID: ${userId})\n@${username}`,
                });
            }
    
            await ctx.reply("Faylingiz uchun rahmat! Tez orada javob beramiz. 😊");
        } else {
            await ctx.reply("Kechirasiz, bu turdagi xabarni qabul qila olmadim. Iltimos, qayta urinib ko‘ring yoki boshqa xabar yuborib ko'ring!");
            await ctx.replyWithHTML(`${userName}, Noqulaylik uchun uzur`)
        }
    }
    
    
    private async fileFromTelegram(fileId: string): Promise<Observable<Buffer>> {
        const { file_path } = await this.telegram.getFile(fileId);
        const url = `https://api.telegram.org/file/bot${this._token}/${file_path}`;
        
        return this.httpService.get(url, { responseType: 'arraybuffer' }).pipe(
            filter((data) => !!data?.data),
            map(({ data }) => Buffer.from(data)),

        );
        
    }
    
    
    
}
