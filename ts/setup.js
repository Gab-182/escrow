"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const utils_1 = require("./utils");
const createMint = (connection, { publicKey, secretKey }) => {
    return spl_token_1.Token.createMint(connection, {
        publicKey,
        secretKey,
    }, publicKey, null, 0, spl_token_1.TOKEN_PROGRAM_ID);
};
const setupMint = (name, connection, alicePublicKey, bobPublicKey, clientKeypair) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Creating Mint ${name}...`);
    const mint = yield createMint(connection, clientKeypair);
    (0, utils_1.writePublicKey)(mint.publicKey, `mint_${name.toLowerCase()}`);
    console.log(`Creating Alice TokenAccount for ${name}...`);
    const aliceTokenAccount = yield mint.createAccount(alicePublicKey);
    (0, utils_1.writePublicKey)(aliceTokenAccount, `alice_${name.toLowerCase()}`);
    console.log(`Creating Bob TokenAccount for ${name}...`);
    const bobTokenAccount = yield mint.createAccount(bobPublicKey);
    (0, utils_1.writePublicKey)(bobTokenAccount, `bob_${name.toLowerCase()}`);
    return [mint, aliceTokenAccount, bobTokenAccount];
});
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    const alicePublicKey = (0, utils_1.getPublicKey)("alice");
    const bobPublicKey = (0, utils_1.getPublicKey)("bob");
    const clientKeypair = (0, utils_1.getKeypair)("id");
    const connection = new web3_js_1.Connection("http://localhost:8899", "confirmed");
    console.log("Requesting SOL for Alice...");
    // some networks like the local network provide an airdrop function (mainnet of course does not)
    yield connection.requestAirdrop(alicePublicKey, web3_js_1.LAMPORTS_PER_SOL * 10);
    console.log("Requesting SOL for Bob...");
    yield connection.requestAirdrop(bobPublicKey, web3_js_1.LAMPORTS_PER_SOL * 10);
    console.log("Requesting SOL for Client...");
    yield connection.requestAirdrop(clientKeypair.publicKey, web3_js_1.LAMPORTS_PER_SOL * 10);
    const [mintX, aliceTokenAccountForX, bobTokenAccountForX] = yield setupMint("X", connection, alicePublicKey, bobPublicKey, clientKeypair);
    console.log("Sending 50X to Alice's X TokenAccount...");
    yield mintX.mintTo(aliceTokenAccountForX, clientKeypair.publicKey, [], 50);
    const [mintY, aliceTokenAccountForY, bobTokenAccountForY] = yield setupMint("Y", connection, alicePublicKey, bobPublicKey, clientKeypair);
    console.log("Sending 50Y to Bob's Y TokenAccount...");
    yield mintY.mintTo(bobTokenAccountForY, clientKeypair.publicKey, [], 50);
    console.log("✨Setup complete✨\n");
    console.table([
        {
            "Alice Token Account X": yield (0, utils_1.getTokenBalance)(aliceTokenAccountForX, connection),
            "Alice Token Account Y": yield (0, utils_1.getTokenBalance)(aliceTokenAccountForY, connection),
            "Bob Token Account X": yield (0, utils_1.getTokenBalance)(bobTokenAccountForX, connection),
            "Bob Token Account Y": yield (0, utils_1.getTokenBalance)(bobTokenAccountForY, connection),
        },
    ]);
    console.log("");
});
setup();
