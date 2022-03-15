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
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const BN = require("bn.js");
const utils_1 = require("./utils");
const bob = () => __awaiter(void 0, void 0, void 0, function* () {
    const bobKeypair = (0, utils_1.getKeypair)("bob");
    const bobXTokenAccountPubkey = (0, utils_1.getPublicKey)("bob_x");
    const bobYTokenAccountPubkey = (0, utils_1.getPublicKey)("bob_y");
    const escrowStateAccountPubkey = (0, utils_1.getPublicKey)("escrow");
    const escrowProgramId = (0, utils_1.getProgramId)();
    const terms = (0, utils_1.getTerms)();
    const connection = new web3_js_1.Connection("http://localhost:8899", "confirmed");
    const escrowAccount = yield connection.getAccountInfo(escrowStateAccountPubkey);
    if (escrowAccount === null) {
        (0, utils_1.logError)("Could not find escrow at given address!");
        process.exit(1);
    }
    const encodedEscrowState = escrowAccount.data;
    const decodedEscrowLayout = utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState);
    const escrowState = {
        escrowAccountPubkey: escrowStateAccountPubkey,
        isInitialized: !!decodedEscrowLayout.isInitialized,
        initializerAccountPubkey: new web3_js_1.PublicKey(decodedEscrowLayout.initializerPubkey),
        XTokenTempAccountPubkey: new web3_js_1.PublicKey(decodedEscrowLayout.initializerTempTokenAccountPubkey),
        initializerYTokenAccount: new web3_js_1.PublicKey(decodedEscrowLayout.initializerReceivingTokenAccountPubkey),
        expectedAmount: new BN(decodedEscrowLayout.expectedAmount, 10, "le"),
    };
    const PDA = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from("escrow")], escrowProgramId);
    const exchangeInstruction = new web3_js_1.TransactionInstruction({
        programId: escrowProgramId,
        data: Buffer.from(Uint8Array.of(1, ...new BN(terms.bobExpectedAmount).toArray("le", 8))),
        keys: [
            { pubkey: bobKeypair.publicKey, isSigner: true, isWritable: false },
            { pubkey: bobYTokenAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: bobXTokenAccountPubkey, isSigner: false, isWritable: true },
            {
                pubkey: escrowState.XTokenTempAccountPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: escrowState.initializerAccountPubkey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: escrowState.initializerYTokenAccount,
                isSigner: false,
                isWritable: true,
            },
            { pubkey: escrowStateAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: PDA[0], isSigner: false, isWritable: false },
        ],
    });
    const aliceYTokenAccountPubkey = (0, utils_1.getPublicKey)("alice_y");
    const [aliceYbalance, bobXbalance] = yield Promise.all([
        (0, utils_1.getTokenBalance)(aliceYTokenAccountPubkey, connection),
        (0, utils_1.getTokenBalance)(bobXTokenAccountPubkey, connection),
    ]);
    console.log("Sending Bob's transaction...");
    yield connection.sendTransaction(new web3_js_1.Transaction().add(exchangeInstruction), [bobKeypair], { skipPreflight: false, preflightCommitment: "confirmed" });
    // sleep to allow time to update
    yield new Promise((resolve) => setTimeout(resolve, 1000));
    if ((yield connection.getAccountInfo(escrowStateAccountPubkey)) !== null) {
        (0, utils_1.logError)("Escrow account has not been closed");
        process.exit(1);
    }
    if ((yield connection.getAccountInfo(escrowState.XTokenTempAccountPubkey)) !==
        null) {
        (0, utils_1.logError)("Temporary X token account has not been closed");
        process.exit(1);
    }
    const newAliceYbalance = yield (0, utils_1.getTokenBalance)(aliceYTokenAccountPubkey, connection);
    if (newAliceYbalance !== aliceYbalance + terms.aliceExpectedAmount) {
        (0, utils_1.logError)(`Alice's Y balance should be ${aliceYbalance + terms.aliceExpectedAmount} but is ${newAliceYbalance}`);
        process.exit(1);
    }
    const newBobXbalance = yield (0, utils_1.getTokenBalance)(bobXTokenAccountPubkey, connection);
    if (newBobXbalance !== bobXbalance + terms.bobExpectedAmount) {
        (0, utils_1.logError)(`Bob's X balance should be ${bobXbalance + terms.bobExpectedAmount} but is ${newBobXbalance}`);
        process.exit(1);
    }
    console.log("✨Trade successfully executed. All temporary accounts closed✨\n");
    console.table([
        {
            "Alice Token Account X": yield (0, utils_1.getTokenBalance)((0, utils_1.getPublicKey)("alice_x"), connection),
            "Alice Token Account Y": newAliceYbalance,
            "Bob Token Account X": newBobXbalance,
            "Bob Token Account Y": yield (0, utils_1.getTokenBalance)(bobYTokenAccountPubkey, connection),
        },
    ]);
    console.log("");
});
bob();
