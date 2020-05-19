const Telegraf = require("telegraf");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const { leave } = Stage;
const WizardScene = require("telegraf/scenes/wizard");
const Calendar = require("telegraf-calendar-telegram");
const uuid = require("uuid");
//const Scene = require('telegraf/scenes/base');
const awsService = require("./services/awsService.js");
const botHelper = require("./botHelper.js");
const utils = require("./utils/utils.js");

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

  /*const askForExtras = ctx => {
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
  */

  const askForDate = ctx => {
    lembrete["assunto"] = ctx.message.text;
    //lembrete["extras"] = ctx.message.text;

    ctx.reply(
      "Quando? (Exemplo: dia-mês-ano hora:minuto)"
    );

    return ctx.wizard.next();
  };

  const finishConversation = ctx => {
    console.log(ctx.message.text);

    const date = utils.parseDateWithRegex(ctx.message.text);

    if(date === null){
      ctx.reply("Não entendi, pode repetir a data?");
      return;
    }

    ctx.reply("lembrete criado.");
    return ctx.scene.leave();
  };

  /*const calendar = new Calendar(bot, {
    startWeekDay: 0,
    weekDayNames: ["D", "S", "T", "Q", "Q", "S", "S"],
    monthNames: [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez"
    ]
  });*/

  /*calendar.setDateListener(async (ctx, date) => {
    lembrete["data"] = date;

    if (lembrete["data"] && lembrete["assunto"]) {
      await botHelper.sendReminderToQueue(reminder, persistenceQueueUrl);      
      console.log(`Lembrete criado: ${reminder}`);
      ctx.reply("Lembrete criado");
    }
  });*/

  const criarlembrete = new WizardScene(
    "me_lembre",
    askForReminder,
    /*askForExtras,*/
    askForDate,
    finishConversation
  );

  const cadastrarEmail = new WizardScene(
    "cadastrar_email",
    (ctx) => {
      ctx.reply("Me informe seu email: ");
      return ctx.wizard.next();
    },
    async (ctx) => {
      const email = ctx.message.text;
      const username = ctx.update.message.from.username;

      console.log(email);

      await botHelper.registerEmail(email, username);

      ctx.reply("Email cadastrado!");
      return ctx.scene.leave();
    }
  );

  /*const descadastrarEmail = new WizardScene(
    "",
    async (ctx)=>{
      
    }
  );*/



  /*const finalizarConversa = new WizardScene(
      "finalizar_conversa",
      finishConversation
    );*/

  // Create scene manager
  const stage = new Stage();
  stage.register(criarlembrete);
  stage.register(cadastrarEmail);
  stage.command("cancelar", leave());
  //stage.register(finalizarConversa);

  bot.use(session());
  bot.use(stage.middleware());
  bot.command("melembre", ctx => ctx.scene.enter("me_lembre"));
  bot.command("email", ctx => ctx.scene.enter("cadastrar_email"))
  /*bot.command(
    "email", 
    ctx=>ctx.reply(`Funcionalidade vem em breve! Aguarde as novidades em ${process.env.PROJECT_REPO_URL}`)
  );*/
  bot.command(
    "remover_email",
    //ctx=>ctx.reply(`Funcionalidade vem em breve! Aguarde as novidades em ${process.env.PROJECT_REPO_URL}`)
    ctx => ctx.reply("Email removido!")
  );
};
