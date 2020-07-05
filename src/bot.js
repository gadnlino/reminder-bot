const Telegraf = require("telegraf");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const { leave } = Stage;
const dotenv = require("dotenv");
dotenv.config();

const { TELEGRAM_TOKEN, REMINDERS_QUEUE_URL } = process.env;
const URL = process.env.APP_URL;
const PORT = process.env.PORT;
const hookPath = `${URL}bot${TELEGRAM_TOKEN}`;

const bot = new Telegraf(TELEGRAM_TOKEN);

bot.use(session());

module.exports = {
  init: function (debugging) {
    if (debugging) {
      bot.telegram.deleteWebhook();
      console.log("started polling for messages...");
      bot.startPolling();
    } else {
      bot.telegram.setWebhook(hookPath);
      console.log("started webhook");
      bot.startWebhook(`/bot${TELEGRAM_TOKEN}`, null, PORT);
    }
  },

  sendMessage: function (chat_id, message) {
    bot.telegram.sendMessage(chat_id, message);
  },

  createCommand: function(command, scene_id){
    bot.command(command, ctx => ctx.scene.enter(scene_id));
  },

  createStage : function (scenes){
    const stage = new Stage();

    scenes.forEach(s=>{
      stage.register(s);
    });

    stage.command("cancelar", (ctx)=>{
      ctx.reply("Cancelado.");
      return leave();
    })

    bot.use(stage.middleware());
  }
};