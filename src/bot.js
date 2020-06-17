const Telegraf = require("telegraf");
const Telegram = require("telegraf/telegram");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const { leave } = Stage;
const WizardScene = require("telegraf/scenes/wizard");
//const Calendar = require("telegraf-calendar-telegram");
//const Scene = require('telegraf/scenes/base');
//const awsService = require("./services/awsService.js");
const botHelper = require("./botHelper.js");
const utils = require("./utils/utils.js");
const uuid = require("uuid");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.APP_URL;
const PORT = process.env.PORT;
const hookPath = `${URL}bot${TELEGRAM_TOKEN}`;
const runningLocally =
  process.env.RUNNING_LOCALLY &&
  process.env.RUNNING_LOCALLY.toLowerCase() === "true";
const persistenceQueueUrl = process.env.PERSISTENCE_QUEUE_URL;
const bot = new Telegraf(TELEGRAM_TOKEN);

module.exports = () => {

  if (runningLocally) {
    bot.telegram.deleteWebhook();
    console.log("started polling for messages...");
    bot.startPolling();
  } else {
    bot.telegram.setWebhook(hookPath);
    console.log("started webhook");
    bot.startWebhook(`/bot${TELEGRAM_TOKEN}`, null, PORT);
  }

  let lembrete = null;

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

    if (text) {
      lembrete = {
        ...lembrete,
        assunto: text
      };
    }
    else if (photo) {
      //jpg
      const file = Telegram.getFile(photo.fileId);

      const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      const fileStream = await botHelper.downloadFile(downloadLink);

      const s3FileKey = await botHelper.uploadFile(fileStream, "jpg");

      lembrete = {
        ...lembrete,
        photo : s3FileKey
      }
    }
    else if (sticker) {
      //webp

      const file = Telegram.getFile(sticker.fileId);

      const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      const fileStream = await botHelper.downloadFile(downloadLink);

      const s3FileKey = await botHelper.uploadFile(fileStream, "webp");

      lembrete = {
        ...lembrete,
        sticker : s3FileKey
      }
    }
    else if (mp4File) {
      const file = Telegram.getFile(mp4File.fileId);

      const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      const fileStream = await botHelper.downloadFile(downloadLink);

      const s3FileKey = await botHelper.uploadFile(fileStream, "mp4");

      lembrete = {
        ...lembrete,
        mp4File : s3FileKey
      }
    }
    else if (voice) {
      //ogg
      
      const file = Telegram.getFile(voice.fileId);

      const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      const fileStream = await botHelper.downloadFile(downloadLink);

      const s3FileKey = await botHelper.uploadFile(fileStream, "ogg");

      lembrete = {
        ...lembrete,
        voice : s3FileKey
      }
    }
    else if(audio){
      //mp3

      const file = Telegram.getFile(audio.fileId);

      const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      const fileStream = await botHelper.downloadFile(downloadLink);

      const s3FileKey =  await botHelper.uploadFile(fileStream, "mp3"); 
      
      lembrete = {
        ...lembrete,
        audio : s3FileKey
      }
    }
    else if(document){
      //custom extension
      const file = Telegram.getFile(document.fileId);

      const downloadLink = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

      const fileStream = await botHelper.downloadFile(downloadLink);

      const extension = file.file_path.substring(file.file_path.lastIndexOf("."));

      const s3FileKey = await botHelper.uploadFile(fileStream, extension); 
      
      lembrete = {
        ...lembrete,
        document : s3FileKey
      }
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

      await botHelper.sendReminderToQueue(lembrete, persistenceQueueUrl);
      console.log(`Lembrete criado: ${lembrete}`);

      ctx.reply("Lembrete criado");

      return ctx.scene.leave();
    }
  };

  const createReminder = new WizardScene(
    "me_lembre",
    askForReminder,
    askForDate,
    finishConversation
  );

  const registerEmail = new WizardScene(
    "cadastrar_email",
    (ctx) => {
      ctx.reply("Me informe seu email: ");
      return ctx.wizard.next();
    },
    async (ctx) => {

      await botHelper.registerEmail({
        first_name: ctx.update.message.from.first_name,
        last_name: ctx.update.message.from.last_name,
        email: ctx.message.text,
        username: ctx.update.message.from.username
      });

      ctx.reply("Email cadastrado!");

      return ctx.scene.leave();
    }
  );

  const deregisterEmail = new WizardScene(
    "remover_email",
    async ctx => {
      await botHelper.deregisterEmail(ctx.update.message.from.username);
      ctx.reply("Email removido!");
      return ctx.scene.leave();
    }
  );

  const stage = new Stage();
  stage.register(createReminder);
  stage.register(registerEmail);
  stage.command("cancelar", leave());

  bot.use(session());
  bot.use(stage.middleware());
  bot.command("melembre", ctx => ctx.scene.enter("me_lembre"));
  bot.command("email", ctx => ctx.scene.enter("cadastrar_email"));
  bot.command("remover_email", ctx => ctx.scene.enter("remover_email"));
};