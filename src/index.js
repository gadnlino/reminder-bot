const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const { leave } = Stage;
const WizardScene = require("telegraf/scenes/wizard");
const Calendar = require("telegraf-calendar-telegram");
const Extra = require('telegraf/extra');
const awsService = require("./services/awsService.js");
const uuid = require("uuid");
const Markup = require('telegraf/markup')
//const Scene = require('telegraf/scenes/base');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.APP_URL;
const PORT = process.env.PORT;
const hookPath = `${URL}bot${TELEGRAM_TOKEN}`;
const runningLocally = process.env.RUNNING_LOCALLY.toLowerCase() === "true";
const remindersTableName = process.env.REMINDERS_BOT_TABLE;

const bot = new Telegraf(TELEGRAM_TOKEN);

if (runningLocally) {
  bot.telegram.deleteWebhook();
  bot.startPolling();
}
else {
  bot.telegram.setWebhook(hookPath);
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
}

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
};*/

const askForDate = ctx => {
  lembrete["assunto"] = ctx.message.text;
  //lembrete["extras"] = ctx.message.text;  

  ctx.reply("Quando?",
    calendar
      .setMinDate(new Date().setMonth(new Date().getMonth()))
      .setMaxDate(new Date().setMonth(new Date().getMonth() + 12))
      .getCalendar())

  return ctx.wizard.next();
}

const calendar = new Calendar(bot, {
  startWeekDay: 0,
  weekDayNames: ["D", "S", "T", "Q", "Q", "S", "S"],
  monthNames: [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ]
});

calendar.setDateListener(async (ctx, date) => {

  lembrete["data"] = date;

  if (lembrete["data"] && lembrete["assunto"]) {
    const { data, assunto, username, from_id, chat_id } = lembrete;

    const response = await awsService.dynamodb.putItem(remindersTableName, {
      body: assunto,
      creation_date: new Date().toISOString(),
      reminder_date: new Date(data).toISOString(),
      dismissed: false,
      uuid: uuid.v1(),
      username,
      from_id,
      chat_id
    });

    if (response.$response.httpResponse.statusCode === 200) {
      ctx.reply("Lembrete criado");
    }
  }
});

/*const finishConversation = ctx => {
  ctx.reply("lembrete criado.");
  return ctx.scene.leave();
};*/

const criarlembrete = new WizardScene(
  "me_lembre",
  askForReminder,
  /*askForExtras,*/
  askForDate
);

/*const finalizarConversa = new WizardScene(
  "finalizar_conversa",
  finishConversation
);*/

// Create scene manager
const stage = new Stage()
stage.register(criarlembrete)
//stage.register(finalizarConversa);
stage.command('cancelar', leave());

bot.use(session())
bot.use(stage.middleware())
bot.command('melembre', ctx => ctx.scene.enter('me_lembre'));

bot.on('callback_query', async ctx => {
  const uuid = ctx.update.callback_query.data;

  const response = await awsService.dynamodb.updateItem(remindersTableName, {
    "uuid": uuid
  },
    "set dismissed= :d",
    {
      ":d": true
    });

  if (response.$response.httpResponse.statusCode === 200) {
    ctx.reply("Lembrete apagado");
  }
});

const pollReminders = async () => {

  try {
    const date = `${new Date().toISOString().split("T")[0]}T00:00:00.000Z`;

    const response = await
      awsService.dynamodb.queryItems(remindersTableName, "#yr = :date and #flag = :done", {
        "#yr": "reminder_date",
        "#flag": "dismissed"
      }, {
        ":date": date,
        ":done": false
      });

    response.Items.forEach(reminder => {

      bot.telegram
        .sendMessage(reminder.chat_id, `Lembrete : ${reminder.body}`,
          Extra.markup(Markup.inlineKeyboard([
            Markup.callbackButton('Já lembrei!', reminder.uuid)
          ])));
    });
  }
  catch (e) {
    console.log(e);
  }
}

setInterval(pollReminders, parseInt(process.env.POLL_INTERVAL)); //5min