const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;
app.use(cors());
app.use(express.json());

app.post('/fetchDexSwap', async (req, res) => {
  const { tokenOne, tokenTwo, tokenOneAmount, address, slippage } = req.body;

  try {
    const allowance = await axios.get(`https://api.1inch.io/v5.0/1/approve/allowance?tokenAddress=${tokenOne.address}&walletAddress=${address}`);

    if (allowance.data.allowance === "0") {
      const approve = await axios.get(`https://api.1inch.io/v5.0/1/approve/transaction?tokenAddress=${tokenOne.address}`);

      res.json({ txDetails: approve.data, message: "not approved" });
      return;
    }

    const tx = await axios.get(
      `https://api.1inch.io/v5.0/1/swap?fromTokenAddress=${tokenOne.address}&toTokenAddress=${tokenTwo.address}&amount=${tokenOneAmount.padEnd(tokenOne.decimals + tokenOneAmount.length, '0')}&fromAddress=${address}&slippage=${slippage}`
    );

    let decimals = Number(`1E${tokenTwo.decimals}`);
    const tokenTwoAmountCalculated = (Number(tx.data.toTokenAmount) / decimals).toFixed(2);

    res.json({ txDetails: tx.data.tx, tokenTwoAmount: tokenTwoAmountCalculated });
  } catch (error) {
    console.error('Error fetching Dex swap:', error);
    res.status(500).json({ error: 'Error fetching Dex swap' });
  }
});

app.get("/tokenPrice", async (req, res) => {

  const {query} = req;

  const responseOne = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressOne
  })

  const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
    address: query.addressTwo
  })

  const usdPrices = {
    tokenOne: responseOne.raw.usdPrice,
    tokenTwo: responseTwo.raw.usdPrice,
    ratio: responseOne.raw.usdPrice/responseTwo.raw.usdPrice
  }
  

  return res.status(200).json(usdPrices);
});

Moralis.start({
  apiKey: process.env.MORALIS_KEY
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  })
});
