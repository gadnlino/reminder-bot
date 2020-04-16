const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const { leave } = Stage;
const WizardScene = require("telegraf/scenes/wizard");
const Calendar = require("telegraf-calendar-telegram");
const Extra = require('telegraf/extra');
const sendToAWSQueue = require("./sendToQueue.js");
//const Scene = require('telegraf/scenes/base');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.APP_URL;
const PORT = process.env.PORT;
const hookPath = `${URL}bot${TELEGRAM_TOKEN}`;
const runningLocally = process.env.RUNNING_LOCALLY.toLowerCase() === "true";

const bot = new Telegraf(TELEGRAM_TOKEN);

if(runningLocally){
  bot.telegram.deleteWebhook();
  bot.startPolling();
}
else{
  bot.telegram.setWebhook(hookPath);
  bot.startWebhook(`/bot${TELEGRAM_TOKEN}`, null, PORT);
}

let lembrete = null;

const calendar = new Calendar(bot, {
  startWeekDay: 0,
  weekDayNames: ["D", "S", "T", "Q", "Q", "S", "S"],
  monthNames: [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ]
});

calendar.setDateListener((ctx, date) => {

  lembrete["data"] = date;  

  if (lembrete["data"] && lembrete["assunto"]) {

    // Enviar o lembrete para a fila de persistencia
    sendToAWSQueue(lembrete);
    ctx.reply("Lembrete criado");
  }
});

const askForReminder = ctx => {
  lembrete = {username : ctx.update.message.from.username};
  
  ctx.reply("O que vc quer que eu te lembre?");
  return ctx.wizard.next();
}

const askForExtras = ctx => {
  lembrete["assunto"] = ctx.message.text;

  //Colocar inline keyboard para a peessoa decidir se quer alguma observacao adicional ou nao

  ctx.reply("Alguma observacao adicional?", Extra.HTML().markup((m) => {
    m.keyboard(['Menu'])
      .oneTime()
      .resize()
      .extra();
    m.inlineKeyboard([
      m.callbackButton('Inline Menu1', 'cbMenu1'),
      m.callbackButton('Inline Menu2', 'cbMenu2')
    ])
    return m.extra();
  }));

  return ctx.wizard.next();
};

const askForDate = ctx => {
  lembrete["assunto"] = ctx.message.text;
  //lembrete["extras"] = ctx.message.text;

  const today = new Date();
  const minDate = new Date();
  minDate.setMonth(today.getMonth() - 2);
  const maxDate = new Date();
  maxDate.setMonth(today.getMonth() + 12);

  ctx.reply("Em qual data voce quer que eu te lembre?",
    calendar
      .setMinDate(minDate)
      .setMaxDate(maxDate)
      .getCalendar())

  return ctx.wizard.next();
}

const finishConversation = ctx => {
  ctx.reply("lembrete criado.");
  return ctx.scene.leave();
};

const criarlembrete = new WizardScene(
  "me_lembre",
  askForReminder,
  /*askForExtras,*/
  askForDate
);

const finalizarConversa = new WizardScene(
  "finalizar_conversa",
  finishConversation
);

// Create scene manager
const stage = new Stage()
stage.register(criarlembrete)
stage.register(finalizarConversa);
stage.command('cancelar', leave());

bot.use(session())
bot.use(stage.middleware())
bot.command('melembre', ctx => ctx.scene.enter('me_lembre'));