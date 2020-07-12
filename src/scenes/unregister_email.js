const WizardScene = require("telegraf/scenes/wizard");
const botHelper = require("../helpers.js");
const utils = require("../utils/utils.js");

module.exports = new WizardScene(
    "unregister_email",
    async ctx => {

        const confirmationCode = utils.generateConfirmationCode();
        const username = ctx.message.from.username ||
            ctx.update.message.from.username;
        const from_id = ctx.from.id;
        const chat_id = ctx.chat.id;
        const first_name = ctx.update.message.from.first_name;
        const last_name = ctx.update.message.from.last_name;

        const response = await botHelper.getUserEmail(username, from_id);

        if (!response || response.length === 0) {
            ctx.reply("Você não tem emails cadastrados (Digite /email para cadastrar).")

            return ctx.scene.leave();
        }

        const email = response[0];

        ctx.session.__scenes.state = {
            confirmationCode,
            email,
            username,
            from_id,
            chat_id,
            first_name,
            last_name
        };

        await botHelper.sendEmailMessage({
            type: "CONFIRM_UNREGISTRATION",
            recipientEmail: email,
            parameters: {
                confirmationCode,
                username: username || `${last_name},${first_name}`
            }
        });

        ctx.reply("Cole aqui no chat o código de confirmação que foi enviado para o seu email para completar o cadastro(Não esqueça de verificar a caixa de spam!)");

        return ctx.wizard.next();
    },
    async (ctx) => {
        const userInputCode = ctx.message.text;
        const cursor = ctx.wizard.cursor;

        const {
            confirmationCode,
            email,
            username,
            from_id,
            first_name,
            last_name
        } = ctx.session.__scenes.state;

        if (confirmationCode !== userInputCode) {
            ctx.reply("Por favor, digite o mesmo código que foi enviado para o seu email.");

            return ctx.wizard.selectStep(cursor);
        }

        await botHelper.deregisterEmail(username, from_id);

        await botHelper.sendEmailMessage({
            type: "UNREGISTRATION_COMPLETED",
            recipientEmail: email,
            parameters: {
                username: username || `${last_name},${first_name}`
            }
        });

        ctx.reply("Email removido!");

        return ctx.scene.leave();
    }
);