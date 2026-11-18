import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

const INIT_SUPPLY = 1_000_000_000n;

// Define a minimal type for the RPC trace response
type TraceResult = {
  gas: number;
  failed: boolean;
  returnValue: string;
  structLogs: Array<{
    pc: number;
    op: string;
    gas: number;
    gasCost: number;
    depth: number;
  }>;
};

describe("StorageLayoutV2ERC20", async function () {
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  it("metadata1", async function() {
    const name = "TestToken";
    const symbol = "TestToken";
    const token = await viem.deployContract("StorageLayoutV2ERC20", [name, symbol, INIT_SUPPLY]);
    const tokenName = await token.read.name();
    const tokenSymbol = await token.read.symbol();
    assert.equal(name, tokenName);
    assert.equal(symbol, tokenSymbol);
  });

  it("metadata2", async function() {
    const name = "TestToken1234567890abcdefghijklmnoperstuwxyz";
    const symbol = "TT1234567890abcdefghijklmnoperstuwxyz";
    const token = await viem.deployContract("StorageLayoutV2ERC20", [name, symbol, INIT_SUPPLY]);
    const tokenName = await token.read.name();
    const tokenSymbol = await token.read.symbol();
    assert.equal(name, tokenName);
    assert.equal(symbol, tokenSymbol);
  });

  async function countKeccak256(txHash) {
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    // Request the opcode trace from the local node
    // Disabling storage/stack/memory keeps the payload small and fast
    const trace = (await publicClient.request({
      method: "debug_traceTransaction" as any,
      params: [
        txHash,
        {
          disableStorage: true,
          disableStack: true,
          enableMemory: false,
        },
      ],
    })) as TraceResult;

    // Filter and count the target opcode
    const keccak256Count = trace.structLogs.filter(
      (step) => step.op === "KECCAK256"
    ).length;

    return keccak256Count;
  }

  it("transfer", async function() {
    const name = "TestToken";
    const symbol = "TestToken";
    const token = await viem.deployContract("StorageLayoutV2ERC20", [name, symbol, INIT_SUPPLY]);

    const [deployer, otherWallet] = await viem.getWalletClients();
    const amount = 1_000n;
    const txHash = await token.write.transfer([otherWallet.account.address, amount]);
    const keccak256Count = await countKeccak256(txHash);
    console.log("Transfer KECCAK256 count:", keccak256Count);
    assert(amount, await token.read.balanceOf([otherWallet.account.address]));
    assert(INIT_SUPPLY - amount, await token.read.balanceOf([deployer.account.address]));
  });

  it("transferFrom", async function() {
    const name = "TestToken";
    const symbol = "TestToken";
    const token = await viem.deployContract("StorageLayoutV2ERC20", [name, symbol, INIT_SUPPLY]);

    const [deployer, senderWallet, otherWallet] = await viem.getWalletClients();
    const amount = 1_000n;
    const allowance = 10_000n;
    const txHash1 = await token.write.approve([senderWallet.account.address, allowance]);
    const keccak256Count1 = await countKeccak256(txHash1);
    console.log("Approve KECCAK256 count:", keccak256Count1);
    const txHash2 = await token.write.transferFrom([deployer.account.address, otherWallet.account.address, amount], {account: senderWallet.account});
    const keccak256Count2 = await countKeccak256(txHash2);
    console.log("TransferFrom KECCAK256 count:", keccak256Count2);
    assert(amount, await token.read.balanceOf([otherWallet.account.address]));
    assert(INIT_SUPPLY - amount, await token.read.balanceOf([deployer.account.address]));
    assert(allowance-amount, await token.read.allowance([deployer.account.address, senderWallet.account.address]));
  });
});
