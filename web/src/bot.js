const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const { leave } = Stage;
const WizardScene = require("telegraf/scenes/wizard");
const Calendar = require("telegraf-calendar-telegram");
const awsService = require("./services/awsService.js");
const uuid = require("uuid");
//const Scene = require('telegraf/scenes/base');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const URL = process.env.APP_URL;
const PORT = process.env.PORT;
const hookPath = `${URL}bot${TELEGRAM_TOKEN}`;
const runningLocally = process.env.RUNNING_LOCALLY && 
    process.env.RUNNING_LOCALLY.toLowerCase() === "true";
const persistenceQueueUrl = process.env.PERSISTENCE_QUEUE_URL;

const bot = new Telegraf(TELEGRAM_TOKEN);

module.exports = () => {

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

            const now = new Date();

            const id = uuid.v1();
            const reminder_date = new Date(data);
            reminder_date.setSeconds(now.getSeconds());
            reminder_date.setMinutes(now.getMinutes());
            reminder_date.setHours(now.getHours());

            const reminder = {
                body: assunto,
                creation_date: now.toISOString(),
                reminder_date: reminder_date.toISOString(),
                dismissed: false,
                uuid: id,
                username,
                from_id,
                chat_id
            };

            const reminderStr = JSON.stringify(reminder);

            try {
                const resp = await awsService.sqs.sendMessage(persistenceQueueUrl, reminderStr);
                ctx.reply("Lembrete criado");
            }
            catch (e) {
                throw e;
            }
        }
    });

    const criarlembrete = new WizardScene(
        "me_lembre",
        askForReminder,
        /*askForExtras,*/
        askForDate
    );

    /*const finishConversation = ctx => {
      ctx.reply("lembrete criado.");
      return ctx.scene.leave();
    };*/

    /*const finalizarConversa = new WizardScene(
      "finalizar_conversa",
      finishConversation
    );*/

    // Create scene manager
    const stage = new Stage()
    stage.register(criarlembrete)
    stage.command('cancelar', leave());
    //stage.register(finalizarConversa);

    bot.use(session());
    bot.use(stage.middleware())
    bot.command('melembre', ctx => ctx.scene.enter('me_lembre'));
}