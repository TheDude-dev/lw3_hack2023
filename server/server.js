import express from 'express';
import cors from 'cors'
import StreamrClient from "streamr-client";
import { startSubscribing } from './streamr.js';// Import the Streamr client
import { config } from 'dotenv';

config();

const app = express();
const PORT = 3007;

// Initialize the client with an Ethereum account
const streamr = new StreamrClient({
    auth: {
        privateKey: process.env.ETHEREUM_PRIVATE_KEY,
    },
})

app.use((req, res, next) =>
  {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });
  
app.use(express.json())
app.use(
    cors({
      origin: ["http://localhost:3001"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    })
  );

app.get('/', (req, res) => {
    res.send('Wecolme to our Stream. Subscribe or public, do what you want...');
});

app.post('/streamr/create', async (req, res) => {
    const { stream_name } = req.body;

    try {
        // Requires MATIC tokens (Polygon blockchain gas token)
        const stream = await streamr.createStream({
            id: stream_name, // "/foo/bar"
        })

        console.log(stream.id) // e.g. `0x123.../foo/bar`

        return res.json({ stream_id: stream.id });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }

  }
);

//streamId : 0x4be4f472ff58b8aaa999253cfd2474a8b6cae160%2Flw3_game
app.post('/streamr/publish/:streamId', async (req, res) => {
    let streamId = req.params.streamId

    const { username, score, wallet, datetime } = req.body;

    const msg = { 
        username: username,
        score: score,
        wallet: wallet,
        datetime: datetime
    }
    try{
        await streamr.publish(streamId, msg)
    }catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }

    return res.status(200).json({'status':'published', 'msg':msg});

  }
);

app.get('/streamr/start-subscribing/:id', (req, res) => {
    let d = req.params.id
    startSubscribing(streamr, d);
    if (d)
        res.send('Started subscribing to Streamr:' + d);
    else
        res.send('Started subscribing to defaut Streamr.');
});

app.get('/streamr/start-subscribing/binance', (req, res) => {
    startSubscribing(streamr, 'binance-streamr.eth/BTCUSDT/ticker');
    res.send('Started subscribing to Binance Streamr.');
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});