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

        const error = validateEmail(email);

        if (error) {
            ctx.reply(error);
            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

        const confirmationCode = utils.generateConfirmationCode();
        const username = ctx.update.message.from.username;

        ctx.session.__scenes.state = {
            confirmationCode,
            email,
            username
        };

        await botHelper.sendEmailMessage({
            type: "CONFIRM_REGISTRATION",
            recipientEmail: email,            
            parameters: {
                confirmationCode,
                username    
            }
        });

        ctx.reply("Cole aqui no chat o código de confirmação que foi enviado para o seu email para completar o cadastro.");

        return ctx.wizard.next();
    },

    async (ctx) => {
        const confirmationCode = ctx.message.text;

        if (confirmationCode !== ctx.session.__scenes.state.confirmationCode) {
            ctx.reply("Por favor, digite o mesmo código que foi enviado para o seu email.");

            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

        await botHelper.registerEmail({
            first_name: ctx.update.message.from.first_name,
            last_name: ctx.update.message.from.last_name,
            email: ctx.session.__scenes.state.email,
            username: ctx.session.__scenes.state.username
        });

        await botHelper.sendEmailMessage({
            type: "REGISTRATION_COMPLETED",
            recipientEmail: ctx.session.__scenes.state.email,            
            parameters: {
                username: ctx.session.__scenes.state.username    
            }
        });

        ctx.reply("Email cadastrado!");

        return ctx.scene.leave();
    }
);