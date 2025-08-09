import { NextApiRequest, NextApiResponse } from "next";
import {
  APIError,
  createPrivyClient,
  fetchAndVerifyAuthorization,
} from "../../../lib/utils";
import { WalletApiRpcResponseType } from "@privy-io/public-api";
const client = createPrivyClient();

export default async function POST(
  req: NextApiRequest,
  res: NextApiResponse<WalletApiRpcResponseType | APIError>
) {
  const errorOrVerifiedClaims = await fetchAndVerifyAuthorization(
    req,
    res,
    client
  );
  const authorized = errorOrVerifiedClaims && "appId" in errorOrVerifiedClaims;
  if (!authorized) return errorOrVerifiedClaims;

  const message = req.body.message;
  const walletId = req.body.wallet_id;

  console.log('Solana signing request:', { message, walletId });

  if (!message || !walletId) {
    return res
      .status(400)
      .json({ error: "Message and wallet_id are required" });
  }

  try {
    // Convert message to Uint8Array for Solana if it's a string
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message)
      : message;

    console.log('Message bytes:', messageBytes);
    console.log('Message type:', typeof message);
    console.log('Wallet ID:', walletId);

    // Sign the message using Privy's wallet API
    const { signature } = await client.walletApi.solana.signMessage({
      walletId,
      message: messageBytes,
    });

    console.log('Raw signature:', signature);
    console.log('Signature type:', typeof signature);

    return res.status(200).json({
      method: "signMessage",
      data: {
        signature: Buffer.from(signature).toString("base64"),
        encoding: "base64",
      },
    });
  } catch (error) {
    console.error("Error signing Solana message:", error);
    console.error("Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    return res.status(500).json({
      error: (error as Error).message,
      cause: (error as Error).stack,
    });
  }
}
