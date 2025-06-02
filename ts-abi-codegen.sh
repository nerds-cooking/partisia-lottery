#!/usr/bin/env bash

cargo partisia-contract abi codegen --ts \
    ./rust/target/wasm32-unknown-unknown/release/lottery.abi \
    ./api/src/utils/LotteryApiGenerated.ts

cargo partisia-contract abi codegen --ts \
    ./rust/target/wasm32-unknown-unknown/release/lottery.abi \
    ./frontend/src/lib/LotteryApiGenerated.ts