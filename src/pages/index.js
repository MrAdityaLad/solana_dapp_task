import React, { useState } from "react";
import {
    PublicKey,
    Connection,
    Transaction,
    clusterApiUrl,
} from "@solana/web3.js";
import {
    getAccount,
    createTransferInstruction,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

const recepientAddress = new PublicKey(
    "8MdXvWgNou9jRVturbfnt3egf1aP9p1AjL8wiJavti7F"
);
const mintPublicKey = new PublicKey(
    "7512dgtZnhGDb5PFFd6ndN2sC9wgoYxm3pwxiMZqGzbv"
);

export default function Home() {
    const [sending, setSending] = useState(false);
    const [walletKey, setWalletKey] = useState();
    const [provider, setProvider] = useState();

    const connection = new Connection(
        clusterApiUrl('mainnet-beta'),
        "confirmed"
    );

    const sendNFT = async () => {
        setSending(true);

        const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            walletKey,
            mintPublicKey,
            walletKey
        );

        const recepientTokenAccount = await getAssociatedTokenAddress(
            mintPublicKey,
            recepientAddress
        );

        const transaction = new Transaction();

        try {
            await getAccount(connection, recepientTokenAccount);
        } catch (err) {
            transaction.add(
                createAssociatedTokenAccountInstruction(
                    walletKey,
                    recepientTokenAccount,
                    recepientAddress,
                    mintPublicKey
                )
            );
        }

        transaction.add(
            createTransferInstruction(
                fromTokenAccount.address,
                recepientTokenAccount,
                walletKey,
                1,
                []
            )
        );

        transaction.recentBlockhash = (
            await connection.getLatestBlockhash()
        ).blockhash;
        transaction.feePayer = walletKey;

        await provider.signAndSendTransaction(transaction);

        setSending(false);
    };

    const connectWallet = async () => {
        if ("solana" in window) {
            const provider = window.solana;
            try {
                const response = await provider.connect();
                console.log({ response });
                setProvider(provider);
                setWalletKey(new PublicKey(response.publicKey.toString()));
            } catch (err) {
                console.error(err.message);
            }
        }
    };

    const disconnectWallet = async () => {
        if (provider) {
            provider.disconnect();
            setProvider(undefined);
            setWalletKey(undefined);
        }
    };

    return (
        <main className="bg-dark text-bg-dark d-flex flex-column">
            <div className="py-3 mx-auto">
                <span className="h1">NFT Sender</span>
            </div>
            <div className="my-auto text-center">
                <span>
                    Wallet Address:{" "}
                    {walletKey?.toString() || "Please connect your wallet."}
                </span>
                <div className="mt-3">
                    <button
                        className="btn btn-lg btn-outline-primary me-3"
                        onClick={provider ? disconnectWallet : connectWallet}
                    >
                        {provider ? "Disconnect" : "Connect"}
                    </button>
                    <button
                        className="btn btn-lg btn-outline-success ms-3"
                        disabled={!provider && !sending}
                        onClick={sendNFT}
                    >
                        Send NFT
                    </button>
                </div>
            </div>
        </main>
    );
}
