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
const alice = () => __awaiter(void 0, void 0, void 0, function* () {
    const escrowProgramId = (0, utils_1.getProgramId)();
    const terms = (0, utils_1.getTerms)();
    const aliceXTokenAccountPubkey = (0, utils_1.getPublicKey)("alice_x");
    const aliceYTokenAccountPubkey = (0, utils_1.getPublicKey)("alice_y");
    const XTokenMintPubkey = (0, utils_1.getPublicKey)("mint_x");
    const aliceKeypair = (0, utils_1.getKeypair)("alice");
    const tempXTokenAccountKeypair = new web3_js_1.Keypair();
    const connection = new web3_js_1.Connection("http://localhost:8899", "confirmed");
    const createTempTokenAccountIx = web3_js_1.SystemProgram.createAccount({
        programId: spl_token_1.TOKEN_PROGRAM_ID,
        space: spl_token_1.AccountLayout.span,
        lamports: yield connection.getMinimumBalanceForRentExemption(spl_token_1.AccountLayout.span),
        fromPubkey: aliceKeypair.publicKey,
        newAccountPubkey: tempXTokenAccountKeypair.publicKey,
    });
    const initTempAccountIx = spl_token_1.Token.createInitAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, XTokenMintPubkey, tempXTokenAccountKeypair.publicKey, aliceKeypair.publicKey);
    const transferXTokensToTempAccIx = spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, aliceXTokenAccountPubkey, tempXTokenAccountKeypair.publicKey, aliceKeypair.publicKey, [], terms.bobExpectedAmount);
    const escrowKeypair = new web3_js_1.Keypair();
    const createEscrowAccountIx = web3_js_1.SystemProgram.createAccount({
        space: utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.span,
        lamports: yield connection.getMinimumBalanceForRentExemption(utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.span),
        fromPubkey: aliceKeypair.publicKey,
        newAccountPubkey: escrowKeypair.publicKey,
        programId: escrowProgramId,
    });
    const initEscrowIx = new web3_js_1.TransactionInstruction({
        programId: escrowProgramId,
        keys: [
            { pubkey: aliceKeypair.publicKey, isSigner: true, isWritable: false },
            {
                pubkey: tempXTokenAccountKeypair.publicKey,
                isSigner: false,
                isWritable: true,
            },
            {
                pubkey: aliceYTokenAccountPubkey,
                isSigner: false,
                isWritable: false,
            },
            { pubkey: escrowKeypair.publicKey, isSigner: false, isWritable: true },
            { pubkey: web3_js_1.SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: spl_token_1.TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(Uint8Array.of(0, ...new BN(terms.aliceExpectedAmount).toArray("le", 8))),
    });
    const tx = new web3_js_1.Transaction().add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);
    console.log("Sending Alice's transaction...");
    yield connection.sendTransaction(tx, [aliceKeypair, tempXTokenAccountKeypair, escrowKeypair], { skipPreflight: false, preflightCommitment: "confirmed" });
    // sleep to allow time to update
    yield new Promise((resolve) => setTimeout(resolve, 1000));
    const escrowAccount = yield connection.getAccountInfo(escrowKeypair.publicKey);
    if (escrowAccount === null || escrowAccount.data.length === 0) {
        (0, utils_1.logError)("Escrow state account has not been initialized properly");
        process.exit(1);
    }
    const encodedEscrowState = escrowAccount.data;
    const decodedEscrowState = utils_1.ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState);
    if (!decodedEscrowState.isInitialized) {
        (0, utils_1.logError)("Escrow state initialization flag has not been set");
        process.exit(1);
    }
    else if (!new web3_js_1.PublicKey(decodedEscrowState.initializerPubkey).equals(aliceKeypair.publicKey)) {
        (0, utils_1.logError)("InitializerPubkey has not been set correctly / not been set to Alice's public key");
        process.exit(1);
    }
    else if (!new web3_js_1.PublicKey(decodedEscrowState.initializerReceivingTokenAccountPubkey).equals(aliceYTokenAccountPubkey)) {
        (0, utils_1.logError)("initializerReceivingTokenAccountPubkey has not been set correctly / not been set to Alice's Y public key");
        process.exit(1);
    }
    else if (!new web3_js_1.PublicKey(decodedEscrowState.initializerTempTokenAccountPubkey).equals(tempXTokenAccountKeypair.publicKey)) {
        (0, utils_1.logError)("initializerTempTokenAccountPubkey has not been set correctly / not been set to temp X token account public key");
        process.exit(1);
    }
    console.log(`✨Escrow successfully initialized. Alice is offering ${terms.bobExpectedAmount}X for ${terms.aliceExpectedAmount}Y✨\n`);
    (0, utils_1.writePublicKey)(escrowKeypair.publicKey, "escrow");
    console.table([
        {
            "Alice Token Account X": yield (0, utils_1.getTokenBalance)(aliceXTokenAccountPubkey, connection),
            "Alice Token Account Y": yield (0, utils_1.getTokenBalance)(aliceYTokenAccountPubkey, connection),
            "Bob Token Account X": yield (0, utils_1.getTokenBalance)((0, utils_1.getPublicKey)("bob_x"), connection),
            "Bob Token Account Y": yield (0, utils_1.getTokenBalance)((0, utils_1.getPublicKey)("bob_y"), connection),
            "Temporary Token Account X": yield (0, utils_1.getTokenBalance)(tempXTokenAccountKeypair.publicKey, connection),
        },
    ]);
    console.log("");
});
alice();
