### 1. Smart Contract

- To run smart contract tests:

```bash
./java-run-tests.sh
```

- To build the contract:

```bash
cd rust
cargo partisia-contract build --release
```

🗂 **Build Output:**  
Located in `target/wasm32-unknown-unknown/release/`

📤 **Deployment:**  
Use the [Partisia Testnet Explorer](https://browser.testnet.partisiablockchain.com/contracts/deploy)  
Upload the `trivia.abi` and `trivia.zkwa` files for deployment.
