# StorageLayoutV2 contracts

The contracts explore the unofficial experimental feature of solidity compiler: StorageLayoutV2.
The feature itself and contracts here are an experiment,
not connected to the solidity team,
and should not be used in production.

In order to run the contracts, you need to used a custom `solc` from this
[location](https://github.com/lukasz-glen/solidity/tree/feat/storage-layout-v2).

The goal is to measure the number of KECCAK256 opcode executions performed by the contracts. 
Keccak256 executions that are performed by blockchain state updates are out of scope.

The contract `contracts/StorageLayoutV2ERC20` is a simple ERC20 implementation.

## Installation

- Requires node >= 22
- `npm install`
- Download the target solidity repo `https://github.com/lukasz-glen/solidity/tree/feat/storage-layout-v2` to an external directory
- Build solidity following `StorageLayoutV2.md`
- Locate `solc` in the solidity build
- Run in this directory `cp .env.example .env` and set `SOLC` value

## Running

To execute contracts
```shell
npx hardhat compile
npx hardhat test
```

The experimental mode can be turned off. Open `contracts/StorageLayoutV2ERC20.sol` and manually comment out directive `pragma experimental StorageLayoutV2;`
(sorry for inconvenience).
Then recompile contracts. Or use the official compiler
```shell
npx hardhat compile --build-profile standard
npx hardhat test
```

## Results

The number of KECCAK256 executions are compared for the contract `StorageLayoutV2ERC20`,
with and without the experimental StorageLayoutV2 feature.

| function | experimental | standard |
|----------|--------------|----------|
| approve | 1 | 2 |
| transfer | 0 | 3 |
| transferFrom | 2 | 7 |
