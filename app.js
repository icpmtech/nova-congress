const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const path = require("path");

const app = express();
const port = process.env.PORT || 3001;

// Dummy data in case scraping fails or returns empty
const DUMMY_TRADES = [
  {
    legislator: "Nancy Pelosi",
    ticker: "AAPL",
    transaction: "Buy",
    date: "2025-03-10",
    amount: "$500K - $1M",
  },
  {
    legislator: "John Doe",
    ticker: "TSLA",
    transaction: "Sell",
    date: "2025-02-28",
    amount: "$100K - $250K",
  },
  {
    legislator: "Mikie Sherrill",
    ticker: "UBS",
    transaction: "Buy",
    date: "2025-03-01",
    amount: "15K–50K",
  },
];

// URL to scrape Capitol Trades data
const URL = "https://www.capitoltrades.com/trades?txDate=365d";

// Scrape function
async function fetchTrades() {
  try {
    const response = await axios.get(URL, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const htmlData = response.data;
    const $ = cheerio.load(htmlData);
    const trades = [];
    $(".trade-item").each((index, element) => {
      const legislator = $(element).find(".legislator-name").text().trim();
      const ticker = $(element).find(".ticker-symbol").text().trim();
      const transaction = $(element).find(".transaction-type").text().trim();
      const date = $(element).find(".trade-date").text().trim();
      const amount = $(element).find(".amount").text().trim();
      if (legislator && ticker && transaction && date && amount) {
        trades.push({ legislator, ticker, transaction, date, amount });
      }
    });
    if (trades.length === 0) {
      console.warn("No trades found; using dummy data.");
      return DUMMY_TRADES;
    }
    return trades;
  } catch (error) {
    console.error("Error fetching trade data:", error);
    return DUMMY_TRADES;
  }
}

// /trades endpoint with optional filtering
app.get("/trades", async (req, res) => {
  const { legislator, ticker, transaction } = req.query;
  let trades = await fetchTrades();
  if (legislator) {
    trades = trades.filter(trade =>
      trade.legislator.toLowerCase().includes(legislator.toLowerCase())
    );
  }
  if (ticker) {
    trades = trades.filter(
      trade => trade.ticker.toLowerCase() === ticker.toLowerCase()
    );
  }
  if (transaction) {
    trades = trades.filter(
      trade => trade.transaction.toLowerCase() === transaction.toLowerCase()
    );
  }
  res.json({ total: trades.length, trades });
});

// Root route (for example purposes, using inline HTML)
app.get("/", (req, res) => {
  res.type("html").sendFile(path.join(__dirname, "list.html"));;
});

// Serve the details page using a file from the root folder
app.get("/details", (req, res) => {
  res.sendFile(path.join(__dirname, "details.html"));
});

const server = app.listen(port, () =>
  console.log(`Server running on http://localhost:${port}`)
);
server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
