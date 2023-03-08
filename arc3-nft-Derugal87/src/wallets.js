/* eslint-disable */
import algosdk from "algosdk";

const sendAlgoSignerTransaction = async (txns, algodClient, creator_acc) => {
    const algorand = window.algorand;
    if (typeof algorand !== "undefined") {
        try {
            // Get the binary and base64 encode it
            let binaryTxns = txns.map((txn) => txn.toByte());
            let base64Txns = binaryTxns.map((binary) => algorand.encoding.msgpackToBase64(binary));
            let signedTxns = await algorand.signTxns([
                {
                    txn: base64Txns[0],
                },
                {
                    txn: base64Txns[1],
                    signers: [],
                },
                {
                    txn: base64Txns[2],
                },
            ]);

            // Convert first and third transactions to binary from the response
            let signedTxn1Binary = algorand.encoding.base64ToMsgpack(signedTxns[0]);
            let signedTxn3Binary = algorand.encoding.base64ToMsgpack(signedTxns[2]);

            // Sign leftover transaction with the SDK
            let signedTxn2Binary = txns[1].signTxn(creator_acc.sk);

            // send txn
            let tx = await algodClient.sendRawTransaction([signedTxn1Binary, signedTxn2Binary, signedTxn3Binary]).do();
            console.log("Transaction: " + tx.txId);

            //wait for confirmation
            let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

            //Get the completed Transaction
            console.log(
                "Transaction " +
                tx.txId +
                " confirmed in round " +
                confirmedTxn["confirmed-round"]
            );
        } catch (err) {
            console.log(err);
        }
    }
};

export default {
    sendAlgoSignerTransaction
};
