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

const Lembrete = {};

const calendar = new Calendar(bot, {
	startWeekDay: 0,
	weekDayNames: ["D", "S", "T", "Q", "Q", "S", "S"],
	monthNames: [
		"Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
		"Jul", "Ago", "Set", "Out", "Nov", "Dez"
	]
});

calendar.setDateListener((context, date) => {

  Lembrete["data"] = date;
  
  console.log(context);
  console.log(Lembrete);

  context.scene.enter("finalizar_conversa");
});

const askForReminder = ctx => {
    
  ctx.reply("O que vc quer que eu te lembre?");
  return ctx.wizard.next();
}

const askForDate = ctx =>{

  Lembrete["assunto"] = ctx.message.text;

  const today = new Date();
	const minDate = new Date();
	minDate.setMonth(today.getMonth() - 2);
	const maxDate = new Date();
  maxDate.setMonth(today.getMonth() + 12);
  
  ctx.reply("Em qual data voce quer que eu te lembre?",
            calendar.setMinDate(minDate).setMaxDate(maxDate).getCalendar())
  
  return ctx.scene.next();
}

const finishConversation = ctx =>{
  ctx.reply("Lembrete criado.");
  return ctx.scene.leave();
};

const criarLembrete = new WizardScene(
    "me_lembre",
    askForReminder,
    askForDate
);  

const finalizarConversa = new WizardScene(
  "finalizar_conversa",
  finishConversation
);  

// const currencyConverter = new WizardScene(
//     "currency_converter",
//     ctx => {
//       ctx.reply("Please, type in the currency to convert from (example: USD)");
//       return ctx.wizard.next();
//     },
//     ctx => {
//       /* 
//       * ctx.wizard.state is the state management object which is persistent
//       * throughout the wizard 
//       * we pass to it the previous user reply (supposed to be the source Currency ) 
//       * which is retrieved through `ctx.message.text`
//       */
//       ctx.wizard.state.currencySource = ctx.message.text;
//       ctx.reply(
//         `Got it, you wish to convert from ${
//           ctx.wizard.state.currencySource
//         } to what currency? (example: EUR)`
//       );
//       // Go to the following scene
//       return ctx.wizard.next();
//     },
//     ctx => {
//       /*
//       * we get currency to convert to from the last user's input
//       * which is retrieved through `ctx.message.text`
//       */
//       ctx.wizard.state.currencyDestination = ctx.message.text;
//       ctx.reply(
//         `Enter the amount to convert from ${ctx.wizard.state.currencySource} to ${
//           ctx.wizard.state.currencyDestination
//         }`
//       );
//       return ctx.wizard.next();
//     },
//     ctx => {
//       const amt = (ctx.wizard.state.amount = ctx.message.text);
//       const source = ctx.wizard.state.currencySource;
//       const dest = ctx.wizard.state.currencyDestination;
//       const rates = Converter.getRate(source, dest);
//       rates.then(res => {
//         let newAmount = Object.values(res.data)[0] * amt;
//         newAmount = newAmount.toFixed(3).toString();
//         ctx.reply(
//           `${amt} ${source} is worth \n${newAmount} ${dest}`,
//           Markup.inlineKeyboard([
//             Markup.callbackButton("🔙 Back to Menu", "BACK"),
//             Markup.callbackButton(
//               "💱 Convert Another Currency",
//               "CONVERT_CURRENCY"
//             )
//           ]).extra()
//         );
//       });
//       return ctx.scene.leave();
//     }
//   );

// // Greeter scene
// const greeter = new Scene('greeter')
// greeter.enter((ctx) => ctx.reply('Hi'))
// greeter.leave((ctx) => ctx.reply('Bye'))
// greeter.hears(/hi/gi, leave())
// greeter.on('message', (ctx) => ctx.reply('Send `hi`'))

// Create scene manager
const stage = new Stage()
stage.register(criarLembrete)
stage.register(finalizarConversa);

//stage.command('cancel', leave())

// Scene registration
//stage.register(currencyConverter)

bot.use(session())
bot.use(stage.middleware())
bot.command('melembre', ctx => ctx.scene.enter('me_lembre'));