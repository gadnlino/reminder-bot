const WizardScene = require("telegraf/scenes/wizard");
const botHelper = require("../botHelper.js");

module.exports = new WizardScene(
    "register_email",
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