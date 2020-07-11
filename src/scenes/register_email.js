const WizardScene = require("telegraf/scenes/wizard");
const botHelper = require("../helpers.js");

function validateEmail(email){
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if(!regex.test(email)){
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

        if(error){
            ctx.reply(error);
            return ctx.wizard.selectStep(ctx.wizard.cursor);
        }

        await botHelper.registerEmail({
            first_name: ctx.update.message.from.first_name,
            last_name: ctx.update.message.from.last_name,
            email,
            username: ctx.update.message.from.username
        });

        ctx.reply("Email cadastrado!");

        return ctx.scene.leave();
    }
);