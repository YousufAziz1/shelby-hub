import { 
  SHELBYUSD_FA_METADATA_ADDRESS, 
  SHELBYUSD_TOKEN_ADDRESS,
  NetworkToShelbyRPCBaseUrl
} from "@shelby-protocol/sdk/browser";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Initialize Aptos SDK for Testnet (ShelbyNet context)
const aptosConfig = new AptosConfig({ network: Network.TESTNET });
export const aptos = new Aptos(aptosConfig);

// Shelby Protocol deployer / treasury address (fee receiver)
export const SHELBY_FEE_RECEIVER = "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a";

// ShelbyUSD FA metadata address (Testnet)
// Used as the "asset" argument in primary_fungible_store::transfer
export const SUSD_METADATA = SHELBYUSD_FA_METADATA_ADDRESS;

// ShelbyUSD uses 6 decimal places (like USDC)
// 1 SUSD = 1_000_000 micro-units
const SUSD_DECIMALS = 1_000_000;

export interface ShelbyBalances {
  apt: number;
  shelbyUsd: number;
}

/**
 * Protocol Fee Schedule — ShelbyUSD (micro amounts)
 * These appear in the Petra wallet popup for every action.
 */
export const PROTOCOL_FEES = {
  LIKE:     0.00001,  // 0.00001 SUSD
  FOLLOW:   0.0005,   // 0.0005 SUSD
  DOWNLOAD: 0.0001,   // 0.0001 SUSD
  EDIT:     0.0005,   // 0.0005 SUSD
  DELETE:   0.001,    // 0.001  SUSD
} as const;

/**
 * Fetches real balance for APT and ShelbyUSD for a given address.
 */
export async function getShelbyBalances(address: string): Promise<ShelbyBalances> {
  try {
    // 1. Fetch APT Balance (Octas → APT)
    let aptBalance = 0;
    try {
      const amount = await aptos.getAccountAPTAmount({ accountAddress: address });
      aptBalance = Number(amount) / 100_000_000;
    } catch (e) {
      console.warn("APT balance fetch failed (account might not exist):", e);
      aptBalance = 0;
    }

    // 2. Fetch ShelbyUSD Fungible Asset balance
    let shelbyUsdBalance = 0;
    try {
      // Use primary_fungible_store::balance view function for most accurate FA tracking
      const result = await aptos.view({
        payload: {
          function: "0x1::primary_fungible_store::balance",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [address, SUSD_METADATA],
        },
      });
      shelbyUsdBalance = Number(result[0]) / SUSD_DECIMALS;
    } catch (faErr) {
      // Fallback: Try legacy CoinStore if FA store isn't settled
      try {
        const tokenData = await aptos.getAccountResource({
          accountAddress: address,
          resourceType: `0x1::coin::CoinStore<${SHELBYUSD_TOKEN_ADDRESS}::shelby_usd::ShelbyUSD>`,
        });
        shelbyUsdBalance = Number((tokenData as any).coin.value) / SUSD_DECIMALS;
      } catch {
        shelbyUsdBalance = 0;
      }
    }

    return { apt: aptBalance, shelbyUsd: shelbyUsdBalance };
  } catch (err) {
    console.error("Balance fetch error:", err);
    return { apt: 0, shelbyUsd: 0 };
  }
}

/**
 * Creates an on-chain ShelbyUSD Fungible Asset transfer payload.
 * This triggers a real Petra wallet popup with the fee amount in SUSD.
 *
 * Uses Aptos primary_fungible_store::transfer:
 *   transfer<T: key>(sender, metadata: Object<T>, recipient: address, amount: u64)
 *
 * @param amount  Fee in SUSD (e.g. 0.0001)
 */
export function createProtocolFeePayload(amount: number) {
  const microUnits = Math.max(1, Math.floor(amount * SUSD_DECIMALS));
  return {
    function: "0x1::primary_fungible_store::transfer" as `${string}::${string}::${string}`,
    typeArguments: ["0x1::fungible_asset::Metadata"] as [`${string}::${string}::${string}`],
    functionArguments: [
      SUSD_METADATA,       // FA metadata object (identifies ShelbyUSD)
      SHELBY_FEE_RECEIVER, // recipient
      microUnits,          // amount in micro-SUSD
    ],
  };
}

/**
 * Returns the current RPC endpoint for Shelby storage operations.
 */
export function getShelbyRPCEndpoint() {
  return NetworkToShelbyRPCBaseUrl.testnet;
}
