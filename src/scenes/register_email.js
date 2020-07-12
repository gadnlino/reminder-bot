const WizardScene = require("telegraf/scenes/wizard");
const botHelper = require("../helpers.js");
const utils = require("../utils/utils.js");

function validateEmail(email) {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!regex.test(email)) {
        return "Por favor, digite um email válido."
    }

    return "";
}

module.exports = new WizardScene(
    "register_email",
    (ctx) => {
        ctx.reply("Me informe seu email: ");
        return ctx.wizard.next();
    },
    async (ctx) => {
        
        const email = ctx.message.text;
        const confirmationCode = utils.generateConfirmationCode();
        const username = ctx.message.from.username ||
            ctx.update.message.from.username;
        const from_id = ctx.from.id;
        const chat_id = ctx.chat.id;
        const first_name = ctx.update.message.from.first_name;
        const last_name = ctx.update.message.from.last_name;

        const error = validateEmail(email);

        if (error) {
            ctx.reply(error);
            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

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
            type: "CONFIRM_REGISTRATION",
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

        const {
            confirmationCode,
            email,
            username,
            from_id,
            chat_id,
            first_name,
            last_name,
        } = ctx.session.__scenes.state;

        if (confirmationCode !== userInputCode) {
            ctx.reply("Por favor, digite o mesmo código que foi enviado para o seu email.");

            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

        await botHelper.registerEmail({
            first_name,
            last_name,
            email,
            username,
            from_id,
            chat_id
        });

        await botHelper.sendEmailMessage({
            type: "REGISTRATION_COMPLETED",
            recipientEmail: email,
            parameters: {
                username: username || `${last_name},${first_name}`
            }
        });

        ctx.reply("Email cadastrado!");

        return ctx.scene.leave();
    }
);