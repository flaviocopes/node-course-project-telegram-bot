const axios = require('axios')
const Telegraf = require('telegraf')
const LocalSession = require('telegraf-session-local')
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.use((new LocalSession({ database: '.data/session.json' })).middleware())

bot.start((ctx) => ctx.reply('Welcome'))

bot.command('from', ctx => {
  const lang = ctx.message.text.substring(6)
    
  if (lang.length > 2 || lang.length === 1) {
    ctx.reply('🤔 language code must be 2 chars, e.g. "en" or "fr"')
    return
  }
  
  ctx.session.from = lang
  ctx.reply(lang ? '✅ "from" language set to ' + lang : '✅ autodetect "from" language')
})

bot.command('to', ctx => {
  const lang = ctx.message.text.substring(4)
  if (lang.length === 0) {
    ctx.reply('🤔 please specify a language code! It must be 2 chars, e.g. "en" or "fr"')
    return
  }
  
  if (lang.length > 2 || lang.length === 1) {
    ctx.reply('🤔 language code must be 2 chars, e.g. "en" or "fr"')
    return
  }
  
  ctx.session.to = lang
  ctx.reply('✅ "to" language set to ' + lang)
})

bot.command('history', ctx => {
  try {
    ctx.reply(JSON.parse(ctx.session.messages).map(message => `${message.text}: ${message.translation}`).join('\n'))
  } catch (err) {
    console.error(err)
  }
})

bot.command('clear', ctx => {
  ctx.session.messages = JSON.stringify([])
  ctx.reply('✅ history cleared')
})

bot.command('dnt', ctx => {
  ctx.session.dnt = true
  ctx.reply('✅ do not track')
})

bot.command('dt', ctx => {
  ctx.session.dnt = false
  ctx.reply('✅ do track')
})

bot.on('message', ctx => {
  const lang = (ctx.session.from ? ctx.session.from + '-' : '') + (ctx.session.to || 'en')
  console.log(lang)
  axios.get('https://translate.yandex.net/api/v1.5/tr.json/translate', {
    params: {
      key: process.env.YANDEX_API_KEY,
      text: ctx.message.text,
      lang: lang
    }
  }).then(res => {
    const translation = res.data.text[0]
    ctx.reply(translation)
    
    if (ctx.session.dnt === true) {
      return
    }
    let messages = JSON.parse(ctx.session.messages) || []
    messages.push({text: ctx.message.text, translation: translation})
    ctx.session.messages = JSON.stringify(messages)
  })
})

bot.startPolling()
