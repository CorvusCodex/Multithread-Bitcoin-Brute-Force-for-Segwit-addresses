"use strict";

process.title = "Bitcoin Bruteforce";

//Creaded by: Corvus Codex
//Github: https://github.com/CorvusCodex/
//Licence : MIT License

//Support my work:
//BTC: bc1q7wth254atug2p4v9j3krk9kauc0ehys2u8tgg3
//ETH & BNB: 0x68B6D33Ad1A3e0aFaDA60d6ADf8594601BE492F0
//Buy me a coffee: https://www.buymeacoffee.com/CorvusCodex


// Importing required modules
const CoinKey = require('coinkey');
const fs = require('fs');
const crypto = require('crypto');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const blessed = require('blessed');
const bip39 = require('bip39');
const ecc = require('tiny-secp256k1');
const { BIP32Factory } = require('bip32');
const bitcoin = require('bitcoinjs-lib');

function credit(){
    console.log("=================================================================");
    console.log("Multithread Bitcoin Bruteforce");
    console.log("Created by: Corvus Codex");
    console.log("Github: https://github.com/CorvusCodex/");
    console.log("Licence : MIT License");
    console.log("=================================================================");
    console.log("Support my work:");
    console.log("BTC: bc1q7wth254atug2p4v9j3krk9kauc0ehys2u8tgg3");
    console.log("ETH & BNB: 0x68B6D33Ad1A3e0aFaDA60d6ADf8594601BE492F0");
    console.log("Buy me a coffee: https://www.buymeacoffee.com/CorvusCodex");
    console.log("Buy standalone Windows app: https://www.buymeacoffee.com/CorvusCodex/e/142988");
    console.log("=================================================================");
    console.log("The program is running...");
  
  };
  
  
  console.clear();
    credit();

// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

let addresses;
addresses = new Set();

// Reading data from a file named 'data.txt'
const data = fs.readFileSync('./data.txt');
// Splitting the data by new line and adding each address to the Set
data.toString().split("\n").forEach(address => addresses.add(address));

// Initializing an object to store counts for each worker
let counts = {};

// Initializing an object to store start times for each worker
let startTimes = {};

// Function to generate a private key and check if the corresponding public address is in the Set of addresses
function generate() {
 // Incrementing the count for the current worker
 counts[cluster.worker.id] = (counts[cluster.worker.id] || 0) + 1;
 // Sending the updated counts to the master process
 process.send({counts: counts});

 // Generating a random seed phrase
 let seedPhrase = bip39.generateMnemonic();

 // Generate a seed buffer from the seed phrase
 const seedBuffer = bip39.mnemonicToSeedSync(seedPhrase);

 // Generate a root node from the seed buffer using the bip32 library
 const root = bip32.fromSeed(seedBuffer);

 // Derive the first account's node (m/44'/0'/0')
 const account = root.derivePath("m/44'/0'/0'");

 // Derive the external chain node of this account (m/44'/0'/0'/0)
 const node = account.derivePath("0");

 // Derive the first address from the external chain (m/44'/0'/0'/0/0)
 const child = node.derive(0);

 // Get the public key for this address
 const publicKey = child.publicKey;

 // Generate a P2WPKH (Pay-to-Witness-Public-Key-Hash) output script
 const { address } = bitcoin.payments.p2wpkh({ pubkey: publicKey });

 // Checking if the public address corresponding to the private key is in the Set of addresses
 if(addresses.has(address)){
 console.log("");
 // Making a beep sound
 process.stdout.write('\x07');
 // Logging success message with the public address in green color
 console.log("\x1b[32m%s\x1b[0m", ">> Match Found: " + address);
 var successString = "Wallet: " + address + "\n\nSeed: " + seedPhrase;

 // Saving the wallet and its private key (seed) to a file named 'match.txt'
 fs.writeFileSync('./match.txt', successString, (err) => {
 if (err) throw err;
 })
 // Exiting the process
 process.exit();
 }
}

// Checking if the current process is the master process
if (cluster.isMaster) {
  setInterval(() => {
    let totalLoops = 0;
    let totalKeysPerMin = 0;
    for (let workerId in counts) {
      let elapsedTime = (Date.now() - startTimes[workerId]) / 1000 / 60;
      let keysPerMin = (counts[workerId] / elapsedTime).toFixed(2);
      totalLoops += counts[workerId];
      totalKeysPerMin += parseFloat(keysPerMin);
    }
    console.clear();
    credit();
    console.log("=================================================================");
    console.log("");
    console.log(`Total Keys: ${totalLoops}`);
    console.log(`Keys/min: ${totalKeysPerMin }`);
    console.log("");
    console.log("=================================================================");
  }, 60 * 1000);

  cluster.on('message', (worker, message) => {
    if (message.counts) {
      for (let workerId in message.counts) {
        counts[workerId] = message.counts[workerId];
        if (!startTimes[workerId]) {
          startTimes[workerId] = Date.now();
        }
      }
    }
  });

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  setInterval(generate, 0);
}


    
  


   

    


