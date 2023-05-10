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

// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);

// Initializing a Set to store addresses
let addresses;
addresses = new Set();

// Reading data from a file named 'data.txt'
const data = fs.readFileSync('./data.txt');
// Splitting the data by new line and adding each address to the Set
data.toString().split("\n").forEach(address => addresses.add(address));

// Initializing an object to store counts for each worker
let counts = {};

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
 // Creating a blessed screen object
 let screen = blessed.screen({
 smartCSR: true
 });

 // Initializing an array to store boxes for each worker
 let boxes = [];

 // Looping through each CPU and creating a box for each worker
 for (let i = 0; i < numCPUs; i++) {
 let box = blessed.box({
 top: `${i * 100/numCPUs}%`,
 left: 0,
 width: '100%',
 height: `${100/numCPUs}%`,
 content: `Worker ${i+1} Loop count: 0`,
 border: {
 type: 'line'
 },
 style: {
 border: {
 fg: 'blue'
 }
 }
 });
 screen.append(box);
 boxes.push(box);
 }

 // Rendering the screen
 screen.render();

 // Listening for messages from worker processes
 cluster.on('message', (worker, message) => {
 if (message.counts) {
 for (let workerId in message.counts) {
 boxes[workerId-1].setContent(`Worker ${workerId} Loop count: ${message.counts[workerId]}`);
 }
 screen.render();
 }
 });
// Forking worker processes for each CPU
for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
    }
   
    // Listening for exit event of worker processes
    cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    });
   } 
   else {
    // Setting an interval to run the generate function repeatedly with no delay
    setInterval(generate, 0);
   }
