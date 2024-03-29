// const config = require('./auth.json');

const { REST, Routes } = require('discord.js');
// const rest = new REST({ version: '10' }).setToken(config.token);
const rest = new REST({ version: '10' }).setToken(process.env.token);

const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
];

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // await rest.put(Routes.applicationCommands(config.appID), { body: commands });
    await rest.put(Routes.applicationCommands(process.env.appID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();


// Create an instance of a Discord client
const { Client, Events, GatewayIntentBits } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	],
});

// Functions & Arrays
// Connection to Mongo DB
const knock_db = new Promise((resolve, reject) => {
  const MongoClient = require('mongodb').MongoClient;
  const uri = process.env.mongo;
  // const uri = config.mongo;
  const mngClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  mngClient.connect((data, err) => {
    const pData = mngClient.db('potato_data');
    pData.collections((err, data) => {
      data.forEach(collection => console.log(collection.collectionName)); //выводит имена коллекций внутри базы потата-дата
      if (err) console.log(err);
    })
    const bDays = pData.collection('b_days'); //подтягивает коллекцию "b_days" и резолвит промис ею
    resolve(bDays); 
    if (err) reject(err);
  });  
})

function checkCheers() {
  knock_db
    .then(collection => {
      collection.find().toArray((err, items) => {
        items.forEach(item => {  
          if (new Date().getMonth() == '0' && (new Date().getDate() == '1' || new Date().getDate() == '2')) { //Хероку перезагружается каждые 24-27 часов, одни сутки могут выпасть
            collection.updateOne({name: item.name}, {'$set': {'cheered': false}}, (err, item) => {
              console.log('Начало года, информация о поздравлении сброшена', item);
            })            
          }
          
          if (item.cheered) {
            console.log(`${item.name} поздравлен`);
          }  
          
          if ((new Date(item.date).getMonth() === new Date().getMonth()) && (new Date(item.date).getDate() === new Date().getDate()) && !item.cheered) {
            if (item.name !== 'Potato-bot') {
              client.channels.fetch('382216359465058306')
                .then(channel => channel.send(`Сегодня (по моим необъяснимым часам) день рождения ${item.name}! Поздравляю от лица всех роботов и картофелин, и желаю, чтобы твой органический процессор никогда не перегревался, а блюда из картошьки всегда были вкусненькими :3`))
                .catch(console.error);                      
            } else {
              client.channels.fetch('382216359465058306')
                .then(channel => channel.send(`А у меня сегодня день рождения :3`))
                .catch(console.error);              
            }            
            collection.updateOne({name: item.name}, {'$set': {'cheered': true}}, (err, item) => {
              console.log('DB updated', item);
            })
          }          
        })
      })
    })
    .catch(error => {
      console.log(error);
    });
}

// Имена бота
const botNames = ['картох', 'картоф', 'картопл', 'картошк', 'потат', 'potato', 'potata']

function checkWord(str, word) {
  let clearedString = str.toLowerCase().trim().replace(/[^a-z0-9а-яё]/g, ' ').replace(/\s+/g,' ').split(' ');
  return clearedString.some(splitedWord => {return splitedWord == word});
}

// Массив результатов игры
const games = []; 

// Выдача реакции из предложенных
const giveReaction = async (message, amount, reactionsArray) => {
    await message.channel.messages.fetch({ limit: 2 })
          .then(messages => {
            let mArray = messages.array();
            while (amount !== 0) {
              let random = Math.floor(Math.random() * reactionsArray.length);
              mArray[mArray.length - 1].react(reactionsArray[random]);
              amount--;
            }
            })
          .catch(error => console.log(`Couldn't fetch messages because of: ${error}`));
          message.delete();
}

// Установка статуса
function setActivity(type, activity, callback) { 
  // if (type && activity) {
  //   client.user.setPresence(activity, {type: type})
  //     .then(presence => console.log(`Activity set to ${presence.activities[0].name} by request`))
  //     .catch(console.error);
  // } else {
  // const activitiesArray = [
  //   {type: 3, name: ['Homeland', 'Армагеддон', 'дзесяты сон', 'як працює кэп', 'беларускае кіно', 'спойлеры', 'на зомби-апокалипсис']},
  //   {type: 0, name: ['Cyberpunk 2077', 'Mass Effect 2', 'Deus Ex: Mankind Divided', 'шашки', 'пасьянс']},
  //   {type: 2, name: ['музяку', 'кэпов плейлист', 'Interstellar OST', 'David Bowie', 'як лётае камар']}
  // ]
  // const randomActivity = Math.floor(Math.random() * activitiesArray.length);
  
  // client.user.setPresence(activitiesArray[randomActivity].list[Math.floor(Math.random() * activitiesArray[randomActivity].list.length)], { type: activitiesArray[randomActivity].type })
  //   .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
  //   .catch(console.error);
  // }
  // if (callback) callback(type, activity);
  client.user.setPresence({ activities: [{ type: 2, name: 'Шульман' }], status: 'idle' });
}

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', () => {
  console.log('I am ready!');
  setActivity();  
  checkCheers(); 
});

client.on(Events.InteractionCreate, async interaction => {
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await interaction.reply('Pong!');
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);
  }  
});

// Create an event listener for messages
client.on(Events.MessageCreate, async message => {

  if (message.author.bot) return false;

  //COMMANDS
  if (message.content.toLowerCase() === '!help') {
    message.channel.send(`!bot — Ich bin Kartoffel
!love — Удаляет сообщение с командой, к сообщению выше ставит 3 случайных смайлика с сердечками
!outrage — -//- с недовольными мордами
!cry — -//- со слезами
!omg — -//- с удивленными лицами
!lol — -//- с бугагашками
!ping — посчитает пинг. Не знаю зачем, прост
!count [слово] — посчитает использование слова на всех каналах (ееее)
!gif [запрос] — постит гифку по запросу (иногда медленно)
кто молодец? — скажет, что спросивший молодец
кто хороший мальчик? — скажет, что он
%bot_name% [прекрати / перестань / прекращай / хватит] — сменит статус
%bot_name% [поиграй / послушай / посмотри] [запрос] — сменит статус на запрошенный
%bot_name% [азот / нитроген] — постит картинку с жидким азотом
%bot_name% [чаю + леди / сэру / госпоже / господину] — постит картинку с чаем
%bot_name% [вина / винишка] — постит эмодзи с вином
%bot_name% [виски / чего покрепче] — постит эмодзи с виски
%bot_name% [возмутись / возмутительно] — поддакивает
`);
  }   
  
  if (message.content.toLowerCase() === '!bot' && !message.author.bot) {
    message.channel.send('Мяне клічуць бульба');
  }
  
  if (message.content.toLowerCase() === '!love' && !message.author.bot) {
    giveReaction(message, 3, ['😍', '😘', '😍', '😘', '💖', '💕', '❤', '💜', '😻', '😽']);
  }   
  
  if (message.content.toLowerCase() === '!outrage' && !message.author.bot) {
    giveReaction(message, 3, ['👿', '😡', '👺', '😤', '😠', message.guild.emojis.resolve('572080324981293066'), message.guild.emojis.resolve('575710002187206686')]);
  }
  
  if (message.content.toLowerCase() === '!cry' && !message.author.bot) {
    giveReaction(message, 3, ['😟', '😨', '😰', '😥', '😢', '😭', '😖', '😣', '😞']);
  }

  if (message.content.toLowerCase() === '!omg' && !message.author.bot) {
    giveReaction(message, 3, ['🙀', '🙈', '😱', '😮', '😯', message.guild.emojis.resolve('572080651704991771'), message.guild.emojis.resolve('575702079373443099'), message.guild.emojis.resolve('600204266170220545')]);
  }
  
  if (message.content.toLowerCase() === '!lol' && !message.author.bot) {
    giveReaction(message, 3, ['😃', '😄', '😁', '😆', '😅', '😂']);
  }  
  
  if (message.content.toLowerCase() === '!satan' && !message.author.bot) {
    await message.channel.messages.fetch({ limit: 2 })
          .then(messages => {
            let mArray = messages.array();
            mArray[mArray.length - 1].react(message.guild.emojis.resolve('572082882839969813'));
            mArray[mArray.length - 1].react('🔥');
            mArray[mArray.length - 1].react(message.guild.emojis.resolve('697787222027665428'));
          })
          .catch(error => console.log(`Couldn't fetch messages because of: ${error}`));
          message.delete();    
  }   
   
  if(message.content.toLowerCase() === "!ping" && !message.author.bot) {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. Client latency is ${client.ws.ping}ms.`);
  }  
    
  if (message.content.toLowerCase().includes('!count') && !message.author.bot) {
    let total = 0;
    const sought = message.content.substring(message.content.indexOf('!count') + 6).trim().toLowerCase();
    
    const fetchAll = async (channel) => {
      let fetchinPromise = new Promise(async (resolve, reject) => {

        const fetchedMessages = [];  
        let fetchingLimit = 99;
        let fetchingBefore = channel.lastMessageID;

        while (fetchingLimit == 99) {
          await channel.messages.fetch({ limit: fetchingLimit, before: fetchingBefore})
            .then(messages => {
              messages.each(singleMessage => fetchedMessages.push(singleMessage.content));
              fetchingBefore = messages.last().id;
              if (messages.array().length < fetchingLimit) {
                fetchingLimit = messages.array().length;
                resolve({array: fetchedMessages, lookinFor: sought, channelName: channel.name});
              }
            })
            .catch(error => {
              console.log(`Couldn't fetch messages because of: ${error}`)
              reject(error);
            }); 
        }      
      });

      fetchinPromise
        .then(
          result => {
            let counted = result.array.filter(singleMessage => singleMessage.toLowerCase().includes(result.lookinFor));
            total += counted.length;
            message.channel.send(`Искал слово ${result.lookinFor} среди ${result.array.length} сообщений на канале #${result.channelName}, нашёл совпадений: ${counted.length}. Суммарно: ${total}.`);
          },
          error => console.log(`Rejected because of: ` + error)
        )
    }
    message.client.channels.cache.each(singleChannel => {
      if (singleChannel.type == 'text' && singleChannel.id !== '598888793369608192' && singleChannel.id !== '699852094471143504') {
       fetchAll(singleChannel);
      }
    });    
  }
  
  if (!message.author.bot && message.content.toLowerCase().includes('!gif')) {
    const param = {
      url: 'api.giphy.com/v1/gifs/search',
      apiKey: 'ATdqioLenb44FbYJc88LmlBShmX1F1Bw',
      requested: message.content.substring(message.content.indexOf('!gif') + 4).trim().toLowerCase(),
      limit: 5,
      rating: 'R'
    }
    
    const rp = require('request-promise');
    rp(`https://${param.url}?api_key=${param.apiKey}&q=${param.requested}&limit=${param.limit}&offset=0&rating=${param.rating}&lang=en`)
    .then(data => {
        try {
          let parsedData = JSON.parse(data);
          let random = Math.floor(Math.random() * parsedData.data.length);
          console.log(random);
          
          if (parsedData.data[random].images.original.size < 8388000) {
            message.channel.send({
              files: [`${parsedData.data[random].images.original.url}?size=${parsedData.data[random].images.original.width}`]
            })
              .then(console.log(`Posted a gif for "${param.requested}" request`))
              .catch(console.error);          
          } else {
            message.channel.send({
              files: [`${parsedData.data[random].images.downsized.url}?size=${parsedData.data[random].images.downsized.width}`]
            })
              .then(console.log(`Posted a gif for "${param.requested}" request`))
              .catch(console.error);          
            }
        }
        catch(err) {
          console.log(err);
          message.channel.send('Не могу, что-то пошло не так :(');
        }
    })
    .catch(err => {
        console.log(err);
        message.channel.send('Не могу, что-то пошло не так :(');
    });
  }
  
  //CHATTING & REACTING
  if (!message.author.bot && message.content.length >= 150 && Math.floor(Math.random() * 3) == 1) {    
    let answersArray = ['Хорошо сказано', 'Дело говоришь', 'Вот да', 'Поддерживаю', 'Точно-точно'];
    let answersRandom = Math.floor(Math.random() * answersArray.length);    
    message.channel.send(`${answersArray[answersRandom]}, ${message.author.username}!`);
  }
  
  if (!message.author.bot 
      &&
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
      &&
      (message.content.toLowerCase().includes('спасиб') || message.content.toLowerCase().includes('милый') || message.content.toLowerCase().includes('хороший') || message.content.toLowerCase().includes('умница') || checkWord(message.content, 'молодец') || message.content.toLowerCase().includes('ты ж моя'))
      &&
      (!message.content.includes('?'))
     ) {
    let answersArray = ['Всегда рад 😊', 'Всегда пожалуйста 😇', 'Aww 😻', ':)'];
    let answersRandom = Math.floor(Math.random() * answersArray.length);    
    message.channel.send(answersArray[answersRandom]);
  }
  
  if (!message.author.bot 
      &&
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
      &&
      (checkWord(message.content, 'скажи') || checkWord(message.content, 'подтверди') || checkWord(message.content, 'согласись') || checkWord(message.content, 'согласен') || (checkWord(message.content, 'правда') && message.content.includes('?')))
      &&
      (!message.content.toLowerCase().includes('кто молодец?') && !message.content.toLowerCase().includes('кто хороший мальчик?'))
     ) {
    
    let startArray = ['А я всегда считал, что', 'Вне всякого сомнения,', 'Согласен,', '', 'Невозможно спорить, что'];
    let finishArray = ['!', ':)', '💯', '))', '🙃', '😊', '😺'];
    let shortArray = ['А как же', 'Точно-точно', 'Абсолютно согласен', 'Как скажешь', 'Ага', 'fuf', 'Ещё бы!', 'THIS 👆', 'dthyj!'];
    function random(array) {
      let randomNum = Math.floor(Math.random() * array.length);
      return array[randomNum];
    }
    
    let command;
    if (checkWord(message.content, 'скажи')) command = 'скажи';
    if (checkWord(message.content, 'подтверди')) command = 'подтверди';
    if (checkWord(message.content, 'согласись')) command = 'согласись';
    if (checkWord(message.content, 'согласен')) command = 'согласен';
    if (checkWord(message.content, 'правда')) command = 'правда';
    
    const answerArr = message.content.substring(message.content.toLowerCase().indexOf(command) + command.length).trim().split(' ');

    
    if (answerArr[0] && (answerArr[0] == ',' || answerArr[0] == ':' || answerArr[0] == '?' || answerArr[0] == '!' || answerArr[0] == '') || answerArr[0].length == 0) answerArr.shift();
    if (answerArr[0] && (answerArr[0].replace(/[^a-z0-9а-яё]/g, '') == 'же')) answerArr.shift();
    if (answerArr[0] && (answerArr[0] == 'что')) answerArr.shift();
    
    if (answerArr[0]) {
      let lookingForName = answerArr[0].toLowerCase().replace(/[^a-z0-9а-яё]/g, '');
      console.log(lookingForName);
      if (botNames.some(name => {return lookingForName.includes(name)}) || lookingForName == 'бот') answerArr.shift();    
    }
    
    console.log(answerArr);
    
    if (answerArr.length == 0) {
      let randomShort = random(shortArray);
      
      if (randomShort == 'dthyj!') {
        const m = await message.channel.send('dthyj!');
        setTimeout(() => m.edit('Верно!').then(msg => console.log(`Edited: ${msg}`)).catch(console.error), 4000);
      } else {
        message.channel.send([randomShort, random(finishArray)].join(''));      
      }
      
      if (randomShort == 'fuf') {
        message.channel.send(`в смысле "ага" ХД`);
      }
    } else {
      if (answerArr.join(' ').includes('прекрати') || answerArr.join(' ').includes('перестань') || answerArr.join(' ').includes('прекращай') || answerArr.join(' ').includes('хватит')) {
        message.channel.send('Дак сказать или прекратить?');
      } else {
        message.channel.send([[random(startArray), answerArr.join(' ')].join(' '), random(finishArray)].join(''));
      }
    }
  }  
  
  if (!message.author.bot 
      &&
      ( checkWord(message.content, 'хватит') || checkWord(message.content, 'прекращай') || checkWord(message.content, 'перестань') || checkWord(message.content, 'прекрати') ) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    setActivity();
    let answersArray = ['Всё-всё!', 'Ну ещё 5 минуточек(', 'Ладно, прекращаю', 'Ничего нельзя(', 'Со мной легко договориться!'];
    let answersRandom = Math.floor(Math.random() * answersArray.length);    
    message.channel.send(answersArray[answersRandom]);
  }  
  
  if (!message.author.bot 
      &&
      (message.content.toLowerCase().includes('посмотри') || message.content.toLowerCase().includes('послушай') || message.content.toLowerCase().includes('поиграй')) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    
    let type;
    let activity;
    message.content.split(' ').forEach(elem => {
      if (elem.toLowerCase() == 'посмотри' || elem.toLowerCase() == 'посмотри,' || elem.toLowerCase() == 'послушай' || elem.toLowerCase() == 'послушай,' || elem.toLowerCase() == 'поиграй') {    
        
        if (elem.toLowerCase() == 'посмотри' || elem.toLowerCase() == 'посмотри,') type = 'WATCHING';
        if (elem.toLowerCase() == 'послушай' || elem.toLowerCase() == 'послушай,') type = 'LISTENING';
        if (elem.toLowerCase() == 'поиграй') type = 'PLAYING';
        
        activityArr = message.content.substring(message.content.indexOf(elem) + elem.length).trim().split(' ');
        if (type == 'PLAYING' && activityArr[0] == 'в') {
          activityArr.shift();
          activity = activityArr.join(' ');
        } else {
          activity = activityArr.join(' ');
        }
      }
    });
    
    if (activity && activity.length > 50) {
      message.channel.send('длинна, сложна, нипанятна :(');
      return;
    } else {
      setActivity(type, activity, (type, activity) => {
        if (type, activity) {
          let answersArray = ['Так точно!', 'Уже :)', '👌', 'Окь'];
          let answersRandom = Math.floor(Math.random() * answersArray.length);    
          message.channel.send(answersArray[answersRandom]);
        } else if (!type) {
          message.channel.send('Я не знаю, что с этим делать D:');
        } else if (!activity) {
          message.channel.send('Я не знаю, что именно надо делать D:');
        }
      });
    }
  }    
  
  // Камень, ножницы, бумага 
  if (!message.author.bot 
      &&
      (message.content.toLowerCase().includes('давай играть') || message.content.toLowerCase().includes('давай поиграем')) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    message.channel.send('Давай! Камень, ножницы, бумага?');
    games.forEach(game => {
      if (game.player == message.author.username && !game.finished) {
        game.finished = true;
      }
    });
    games.push({player: message.author.username, finished: false, points: {player: 0, bot: 0}});
  }  
  
  if (!message.author.bot 
      &&
      (message.content.toLowerCase() == 'камень' || message.content == '✊' || message.content.toLowerCase() == 'ножницы' || message.content == '✌' || message.content.toLowerCase() == 'бумага' || message.content == '🤚') 
     ) {
    //console.log(games);
    if (games.length !== 0 && games.every(game => {return (game.player == message.author.username && game.finished)})) {
      message.channel.send(`${message.author.username}, игра уже закончена, чтобы начать новую, скажи "бот, давай играть"`);
    } else if (!games.some(game => {return (game.player == message.author.username && !game.finished)})) {
      message.channel.send(`${message.author.username}, чтобы сыграть, скажи "бот, давай играть"`);
    } else {
      let botCasted = rollDie(message);
      games.forEach(game => {
        if (game.player == message.author.username && !game.finished) {
          let playerCast = transfrom(message.content.toLowerCase());
          let botCast = transfrom(botCasted);
          console.log(playerCast, botCast);
          addPoints(game, playerCast, botCast);
        }    
      });
      checkResult(message.author.username, message);
    }
  }
  
  function rollDie(message) {
    let castArray = ['✊', '✌', '🤚'];
    let castRandom = Math.floor(Math.random() * castArray.length);    
    let cast = castArray[castRandom];
    message.channel.send(cast);
    return cast;
  }
  
  function transfrom(cast) {
    if (cast == 'камень' || cast == '✊') {
      return 'камень';
    }
    if (cast == 'ножницы' || cast == '✌') {
      return 'ножницы';
    }
    if (cast == 'бумага' || cast == '🤚') {
      return 'бумага';
    }    
  }
  
  function addPoints(game, playerCast, botCast) {
    if (playerCast == 'бумага' && botCast == 'ножницы') game.points.bot++;
    if (playerCast == 'ножницы' && botCast == 'бумага') game.points.player++;

    if (playerCast == 'камень' && botCast == 'ножницы') game.points.player++;
    if (playerCast == 'ножницы' && botCast == 'камень') game.points.bot++;

    if (playerCast == 'бумага' && botCast == 'камень') game.points.player++;
    if (playerCast == 'камень' && botCast == 'бумага') game.points.bot++;
    console.log(game);
  }
  
  function checkResult(player, message) {
    games.forEach(game => {
      if (game.player == player && !game.finished) {
        if (game.points.player == game.points.bot) {
          if (game.points.player == 0) {
            message.channel.send(`0:0, ничья, давай ещё!`);    
          } else if (game.points.player == 1) {
            message.channel.send(`1:1, ничья, давай ещё!`);
          }
        }
        if ((game.points.player == 1 && game.points.bot == 0)) {
          message.channel.send(`1:0 в твою пользу, давай ещё!`);
        }
        if ((game.points.player == 0 && game.points.bot == 1)) {
          message.channel.send(`1:0 в мою пользу :) Давай ещё!`);
        }
        if (game.points.player == 2) {
          message.channel.send(`Победа твоя, ${message.author.username}!`);
          game.finished = true;
        }
        if (game.points.bot == 2) {
          message.channel.send(`Я выиграл :3`);
          game.finished = true;
        }       
      }
    });
    console.log(games);
  }
  
  /////////////////
  
  if (!message.author.bot && message.content.toLowerCase().includes('кто молодец?')) {
    message.channel.send(`Ты молодец, <@${message.author.id}>!`);
    message.react('😍')
      .then(console.log(`Liked that: ${message.content}`))
      .catch(console.error);
  }
  
  if (!message.author.bot && message.content.toLowerCase().includes('кто хороший мальчик?')) {
    message.channel.send(`Я хороший мальчик! 😊`);
    message.react('😊')
      .then(console.log(`Liked that: ${message.content}`))
      .catch(console.error);
  }
  
  if (message.content.toLowerCase().includes('кофе') || message.content.toLowerCase().includes('спать хо') || message.content.toLowerCase().includes('хочу спать') || message.content.toLowerCase().includes('хочется спат') || message.content.toLowerCase().includes('утро') || message.content.toLowerCase().includes('утра') || message.content.toLowerCase() === 'утр') {
        
    let foodArray = ['🥐', '🧀', '🥞', '🍳', '🍰', '🍩'];
    let foodRandom = Math.floor(Math.random() * foodArray.length);       
    let coffeeArray = ['☕', '🍵', '🥛'];
    let coffeeRandom = Math.floor(Math.random() * coffeeArray.length); 
    
    message.react(foodArray[foodRandom])
      .then(console.log(`Liked that: ${message.content}`))
      .catch(console.error);    
    
    message.react(coffeeArray[coffeeRandom])
      .then(console.log(`Liked that: ${message.content}`))
      .catch(console.error);
  }
  
  if (!message.author.bot 
      &&
      (message.content.toLowerCase().includes('кофе')) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    message.channel.send('☕');
  }
  
  if (!message.author.bot 
      &&
      ( (message.content.toLowerCase().includes('чаю') || message.content.toLowerCase().includes('чая')) && (message.content.toLowerCase().includes('леди') || message.content.toLowerCase().includes('сэру') || message.content.toLowerCase().includes('госпо')) ) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    let teaUrl = `sources/img/tea${Math.floor(Math.random() * 9)}.gif`; //do i regret dis? i regret not
    message.channel.send({
      files: [{
        attachment: teaUrl
      }]
    })
      .then(console.log('Posted tea gif'))
      .catch(console.error);
  }  
  
  if (!message.author.bot 
      &&
      ( message.content.toLowerCase().includes('возмути') ) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    let outrageUrl = `sources/img/angry${Math.floor(Math.random() * 3)}.gif`; //do i regret dis? also not
    message.channel.send('Безобразие!', {
      files: [{
        attachment: outrageUrl
      }]
    })
      .then(console.log('Posted outrage gif'))
      .catch(console.error);
  }
  
  if (!message.author.bot 
      &&
      ( message.content.toLowerCase().includes('азот') || message.content.toLowerCase().includes('нитроген') ) 
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    let nitrogenUrl = `sources/img/azot${Math.floor(Math.random() * 3)}.jpg`;
    message.channel.send(`Бежу, ${message.author.username}!`, {
      files: [{
        attachment: nitrogenUrl
      }]
    })
      .then(console.log('brought nitrogen'))
      .catch(console.error);
  }  
    
  if (!message.author.bot 
      &&
      (message.content.toLowerCase().includes('вино') || message.content.toLowerCase().includes('винишк') || message.content.toLowerCase().includes('вина'))
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    message.channel.send('🍷');
  }   
  
  if (!message.author.bot 
      &&
      (message.content.toLowerCase().includes('виски') || message.content.toLowerCase().includes('вискар') || message.content.toLowerCase().includes('чего покрепче'))
      && 
      (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот'))
     ) {
    message.channel.send('🥃');
  }   
  
  if (botNames.some(name => {return message.content.toLowerCase().includes(name)}) || checkWord(message.content, 'бот')) {
    message.react('🥔')
      .then(console.log(`Liked that: ${message.content}`))
      .catch(console.error);
  }   
  
  if (message.content.toLowerCase().includes('пицц')) {
    message.react('🍕')
      .then(console.log(`Liked that: ${message.content}`))
      .catch(console.error);
  }   
    
  if (message.content.toLowerCase().includes('пиу')) {
    message.channel.send('Вжух!');
  }
  
  if (message.content.toLowerCase() == '🥔') {
    message.channel.send('Туть!');
  }  
});

// Log our bot in 
client.login(process.env.token);
// client.login(config.token);
