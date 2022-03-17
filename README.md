# Solana Escrow

Escrow program built for Solana blockchain

## TODO

Due to time constraints, only an `initializer.js` has been included in the `/tests` folder to demonstrate
what's possible, and to provide a stepping stone for interested developers.

Thus, the following are the THREE KEY FUNCTIONALITIES yet to be implemented:

- Tests that exercise the SPL token program
- Tests that exercise the escrow program
- A UI for the escrow program

## Application setup

1. Connect to devnet:

```bash
solana config set --url https://devnet.solana.com
```


2. Generate a keypair:

```bash
solana-keygen new
```

3. Airdrop some SOL from the devnet faucet

```bash
solana airdrop 1
```

12. `npm run deploy` the program (smart contract) to the specified network in `solana.escrow.config.json`.
