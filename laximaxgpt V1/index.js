require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');

const client = new Client({
    intents: ['Guilds','GuildMembers','GuildMessages','MessageContent']
});

client.on('ready', () => {
    console.log('Bot Aktif!');
});

const IGNORE_PREFIX = "!";
const CHANNELS = ['calismasini istediginiz','discord kanal id'];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
})

client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    if(message.content.startsWith(IGNORE_PREFIX)) return;
    if(!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {
      message.channel.sendTyping();
    },5000);

     let conversation = [];
     conversation.push({
        role: 'system',
        content: 'LaxiGPT bir arkadas canlisi chatbot.'
     });

     let prevMessages = await message.channel.messages.fetch({ limit: 10} );
     prevMessages.reverse();

     prevMessages.forEach((msg) => {
       if(msg.author.bot && msg.author.id !== client.user.id) return;
       if(msg.content.startsWith(IGNORE_PREFIX)) return;

       const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

       if(msg.author.id === client.user.id){
         conversation.push({
            role: 'assistant',
            name: username,
            content: msg.content,

         });
         return;
       }
          conversation.push({
            role: 'user',
            name: username,
            content: msg.content,
          });
     })

     const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: conversation,
     }).catch((error) => console.error('OpenAI Error:\n',error));
     

     clearInterval(sendTypingInterval);

     if(!response){
        message.reply("ChatGPT Sunucularına erişim sıkıntısı yaşıyorum bir süre sonra tekrar dene.");
        return;
     }
       
     const responseMessage= response.choices[0].message.content;
     const chunkSizeLimit = 2000;

     for(let i = 0; i < responseMessage.length; i += chunkSizeLimit){
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);

        await message.reply(chunk);
     }

     
});

client.login(process.env.TOKEN);
