const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const WizardScene = require("telegraf/scenes/wizard");
const Calendar = require("telegraf-calendar-telegram");
//const askForReminder = require("./handlers/askForReminder");
//const finishConversation = require("./handlers/finishConversation");

const { leave } = Stage;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.APP_URL;
const PORT = process.env.PORT || 2000;

const bot = new Telegraf(TELEGRAM_TOKEN);
bot.telegram.setWebhook(`${URL}bot${TELEGRAM_TOKEN}`);
bot.startWebhook(`/bot${TELEGRAM_TOKEN}`, null, PORT);

let lembrete = {};

const calendar = new Calendar(bot, {
	startWeekDay: 0,
	weekDayNames: ["D", "S", "T", "Q", "Q", "S", "S"],
	monthNames: [
		"Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
		"Jul", "Ago", "Set", "Out", "Nov", "Dez"
	]
});

calendar.setDateListener((context, date) => {

  lembrete["data"] = date;
  console.log(lembrete);

  if(lembrete["data"] && lembrete["assunto"]){

  }

});

const askForReminder = ctx => {
    
  ctx.reply("O que vc quer que eu te lembre?");
  return ctx.wizard.next();
}

const askForExtras = ctx =>{
  lembrete["assunto"] = ctx.message.text;

  ctx.reply("Alguma observacao adicional?");

  return ctx.wizard.next();
};

const askForDate = ctx =>{

  lembrete["extras"] = ctx.message.text;

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

const finishConversation = ctx =>{
  ctx.reply("lembrete criado.");
  return ctx.scene.leave();
};

const criarlembrete = new WizardScene(
    "me_lembre",
    askForReminder,
    askForExtras,
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

bot.use(session())
bot.use(stage.middleware())
bot.command('melembre', ctx => ctx.scene.enter('me_lembre'));