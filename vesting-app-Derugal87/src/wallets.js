import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import MyAlgoConnect from "@randlabs/myalgo-connect";

// Contains a list of methods to send transactions via different wallet connectors

const sendAlgoSignerAtomicTransaction = async (txns, algodClient) => {
    const algorand = window.algorand;
    // console.log(Array.isArray(txns));
    if (typeof algorand !== "undefined") {
            try {
                // Get the binary and base64 encode it
                let binaryTxns = txns.map((txn) => txn.toByte());
                let base64Txns = binaryTxns.map((binary) => algorand.encoding.msgpackToBase64(binary));

                let signedTxs = await algorand.signTxns([
                    {
                        txn: base64Txns[0],
                    },
                    {
                        txn: base64Txns[1],
                    },
                ]);
                // Get the base64 encoded signed transaction and convert it to binary
                let binarySignedTx = signedTxs.map((tx) => algorand.encoding.base64ToMsgpack(tx));

                const response = await algodClient
                    .sendRawTransaction(binarySignedTx)
                    .do();
                console.log("Transaction " + response.txId);

                //wait for confirmation
                let confirmedTxn = await algosdk.waitForConfirmation(algodClient, response.txId, 4);
                
                //Get the completed Transaction
                console.log(
                    "Transaction " +
                    response.txId +
                    " confirmed in round " +
                    confirmedTxn["confirmed-round"]
                );

                return response;
            } catch (err) {
                console.error(err);
            }
    }
};

const sendAlgoSignerTransaction = async (txn, algodClient) => {
    const algorand = window.algorand;

    if (typeof algorand !== "undefined") {
        try {
            // Get the binary and base64 encode it
            let binaryTx = txn.toByte();
            let base64Tx = algorand.encoding.msgpackToBase64(binaryTx);

            let signedTxs = await algorand.signTxns([
                {
                    txn: base64Tx,
                },
            ]);

            // Get the base64 encoded signed transaction and convert it to binary
            let binarySignedTx = algorand.encoding.base64ToMsgpack(signedTxs[0]);

            const response = await algodClient.sendRawTransaction(binarySignedTx).do();
            console.log(response);
            
            //wait for confirmation
            let confirmedTxn = await algosdk.waitForConfirmation(algodClient, response.txId, 4);
                
            //Get the completed Transaction
            console.log(
                "Transaction " +
                response.txId +
                " confirmed in round " +
                confirmedTxn["confirmed-round"]
            );
            return response;
        } catch (err) {
            console.error(err);
        }
    }
};

const sendWalletConnectTransaction = async (connector, txn, algodClient) => {
    try {
        // Sign transaction
        // txns is an array of algosdk.Transaction like below
        // i.e txns = [txn, ...someotherTxns], but we've only built one transaction in our case
        const txns = [txn];
        const txnsToSign = txns.map((txn) => {
            const encodedTxn = Buffer.from(
                algosdk.encodeUnsignedTransaction(txn)
            ).toString("base64");

            return {
                txn: encodedTxn,
                message: "Description of transaction being signed",
                // Note: if the transaction does not need to be signed (because it's part of an atomic group
                // that will be signed by another party), specify an empty singers array like so:
                // signers: [],
            };
        });

        const requestParams = [txnsToSign];

        const request = formatJsonRpcRequest("algo_signTxn", requestParams);
        const result = await connector.sendCustomRequest(request);
        const decodedResult = result.map((element) => {
            return element
                ? new Uint8Array(Buffer.from(element, "base64"))
                : null;
        });

        const response = await algodClient
            .sendRawTransaction(decodedResult)
            .do();
        console.log(response);

        return response;
    } catch (err) {
        console.error(err);
    }
};

const sendMyAlgoTransaction = async (txn, algodClient) => {
    try {
        const myAlgoWallet = new MyAlgoConnect();

        const signedTxn = await myAlgoWallet.signTransaction(txn.toByte());
        const response = await algodClient
            .sendRawTransaction(signedTxn.blob)
            .do();
        console.log(response);

        return response;
    } catch (err) {
        console.error(err);
    }
};

export default {
    sendWalletConnectTransaction,
    sendMyAlgoTransaction,
    sendAlgoSignerAtomicTransaction,
    sendAlgoSignerTransaction
};
