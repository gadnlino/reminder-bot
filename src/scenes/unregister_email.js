const WizardScene = require("telegraf/scenes/wizard");
const botHelper = require("../botHelper.js");

module.exports = new WizardScene(
    "unregister_email",
    async ctx => {
        await botHelper.deregisterEmail(ctx.update.message.from.username);
        ctx.reply("Email removido!");
        return ctx.scene.leave();
    }
);