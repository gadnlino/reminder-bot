const WizardScene = require("telegraf/scenes/wizard");
const Telegram = require("telegraf/telegram");
const utils = require("../utils/utils.js");
const botHelper = require("../botHelper.js");

let lembrete = {};

const askForReminder = ctx => {
    lembrete = {
        username: ctx.update.message.from.username,
        from_id: ctx.from.id,
        chat_id: ctx.chat.id
    };

    ctx.reply("O quê devo lembrar?");
    return ctx.wizard.next();
};

const askForDate = async ctx => {

    const {
        text,
        audio,
        video,
        video_note,
        animation,
        document,
        photo,
        sticker,
        voice
    } = ctx.message;

    const mp4File = video || animation || video_note || undefined;

    let file;

    if (text) {
        lembrete = {
            ...lembrete,
            assunto: text
        };
    }
    else if (photo) {
        file = Telegram.getFile(photo.fileId)
    }
    else if (sticker) {
        file = Telegram.getFile(sticker.fileId);
    }
    else if (mp4File) {
        file = Telegram.getFile(mp4File.fileId);
    }
    else if (voice) {
        file = Telegram.getFile(voice.fileId);
    }
    else if (audio) {
        file = Telegram.getFile(audio.fileId);
    }
    else if (document) {
        //custom extension
        file = Telegram.getFile(document.fileId);
    }

    // const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

    if (file) {
        const { file_path } = file;

        lembrete = {
            ...lembrete,
            file_path
        };
    }

    ctx.reply(
        `Quando? (Exemplo: 01-04-2020 12:30)`
    );

    return ctx.wizard.next();
};

const finishConversation = async ctx => {
    const date = utils.parseDateWithRegex(ctx.message.text);
    
    if (date === null) {
        ctx.reply("Não entendi, pode repetir a data?");
        return;
    }

    if (date < new Date()) {
        ctx.reply("Escolha uma data posterior ao momento atual.");
        return;
    }

    if (date && lembrete["assunto"]) {
        lembrete = {
            ...lembrete,
            data: date
        };

        await botHelper.persistReminder(lembrete);
        console.log(`Lembrete criado: ${JSON.stringify(lembrete)}`);

        ctx.reply("Lembrete criado");

        return ctx.scene.leave();
    }
};

module.exports = new WizardScene(
    "create_reminder",
    askForReminder,
    askForDate,
    finishConversation
);