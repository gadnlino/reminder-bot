const Telegraf = require("telegraf");
const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const { leave } = Stage;
const config = require("./config.js");

const bot = new Telegraf(config.telegramToken);
bot.use(session());

module.exports = {
  init: function () {

    if (config.polling) {
      bot.telegram.deleteWebhook();
      console.log("started polling for messages...");
      bot.startPolling();
    } 
    else {
      bot.telegram.setWebhook(`${config.appUrl}bot${config.telegramToken}`);
      console.log("started webhook");
      bot.startWebhook(`/bot${config.telegramToken}`, null, config.port);
    }
  },

  sendMessage: function (chat_id, message) {
    bot.telegram.sendMessage(chat_id, message);
  },

  createCommand: function (command, scene_id) {
    bot.command(command, ctx => ctx.scene.enter(scene_id));
  },

  createStage: function (scenes) {
    const stage = new Stage();

    scenes.forEach(s => {
      stage.register(s);
    });

    stage.command("cancelar", (ctx) => {

      ctx.reply("Cancelado.");
      return ctx.scene.leave();
    })

    bot.use(stage.middleware());
  }
};