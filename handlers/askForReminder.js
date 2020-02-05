export default ctx=>{
    
    ctx.reply("O que vc quer que eu te lembre?");
    return ctx.wizard.next();
}