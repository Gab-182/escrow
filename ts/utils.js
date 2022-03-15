"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.ESCROW_ACCOUNT_DATA_LAYOUT = exports.getTokenBalance = exports.getTerms = exports.getProgramId = exports.getKeypair = exports.getPrivateKey = exports.getPublicKey = exports.writePublicKey = exports.logError = void 0;
const web3_js_1 = require("@solana/web3.js");
//@ts-expect-error missing types
const BufferLayout = __importStar(require("buffer-layout"));
const fs = __importStar(require("fs"));
const logError = (msg) => {
    console.log(`\x1b[31m${msg}\x1b[0m`);
};
exports.logError = logError;
const writePublicKey = (publicKey, name) => {
    fs.writeFileSync(`./keys/${name}_pub.json`, JSON.stringify(publicKey.toString()));
};
exports.writePublicKey = writePublicKey;
const getPublicKey = (name) => new web3_js_1.PublicKey(JSON.parse(fs.readFileSync(`./keys/${name}_pub.json`)));
exports.getPublicKey = getPublicKey;
const getPrivateKey = (name) => Uint8Array.from(JSON.parse(fs.readFileSync(`./keys/${name}.json`)));
exports.getPrivateKey = getPrivateKey;
const getKeypair = (name) => new web3_js_1.Keypair({
    publicKey: (0, exports.getPublicKey)(name).toBytes(),
    secretKey: (0, exports.getPrivateKey)(name),
});
exports.getKeypair = getKeypair;
const getProgramId = () => {
    try {
        return (0, exports.getPublicKey)("program");
    }
    catch (e) {
        (0, exports.logError)("Given programId is missing or incorrect");
        process.exit(1);
    }
};
exports.getProgramId = getProgramId;
const getTerms = () => {
    return JSON.parse(fs.readFileSync(`./terms.json`));
};
exports.getTerms = getTerms;
const getTokenBalance = (pubkey, connection) => __awaiter(void 0, void 0, void 0, function* () {
    return parseInt((yield connection.getTokenAccountBalance(pubkey)).value.amount);
});
exports.getTokenBalance = getTokenBalance;
/**
 * Layout for a public key
 */
const publicKey = (property = "publicKey") => {
    return BufferLayout.blob(32, property);
};
/**
 * Layout for a 64bit unsigned value
 */
const uint64 = (property = "uint64") => {
    return BufferLayout.blob(8, property);
};
exports.ESCROW_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
    BufferLayout.u8("isInitialized"),
    publicKey("initializerPubkey"),
    publicKey("initializerTempTokenAccountPubkey"),
    publicKey("initializerReceivingTokenAccountPubkey"),
    uint64("expectedAmount"),
]);
