const WizardScene = require("telegraf/scenes/wizard");
const botHelper = require("../helpers.js");
const utils = require("../utils/utils.js");

module.exports = new WizardScene(
    "unregister_email",
    async ctx => {

        const username = ctx.update.message.from.username;

        const response = await botHelper.getUserEmail(username)

        console.log(response);

        if (!response || response.length === 0) {
            ctx.reply("Você não tem emails cadastrados(Digite /email para cadastrar).")

            return ctx.scene.leave();
        }

        const email = response[0];

        const confirmationCode = utils.generateConfirmationCode();

        ctx.session.__scenes.state = {
            confirmationCode,
            email,
            username
        };

        await botHelper.sendEmailMessage({
            type: "CONFIRM_UNREGISTRATION",
            recipientEmail: email,
            parameters: {
                confirmationCode,
                username
            }
        });

        ctx.reply("Cole aqui no chat o código de confirmação que foi enviado para o seu email para descadastrá-lo.");

        return ctx.wizard.next();
    },
    async (ctx) => {
        const confirmationCode = ctx.message.text;

        if (confirmationCode !== ctx.session.__scenes.state.confirmationCode) {
            ctx.reply("Por favor, digite o mesmo código que foi enviado para o seu email.");

            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

        await botHelper.deregisterEmail(ctx.update.message.from.username);

        await botHelper.sendEmailMessage({
            type: "UNREGISTRATION_COMPLETED",
            recipientEmail: ctx.session.__scenes.state.email,
            parameters: {
                username: ctx.session.__scenes.state.username
            }
        });

        ctx.reply("Email removido!");

        return ctx.scene.leave();
    }
);