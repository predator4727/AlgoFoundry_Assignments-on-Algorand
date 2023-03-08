import algosdk from "algosdk";
import { getAlgodClient } from "./client.js";
import wallets from "./wallets.js";


const update_asset_balance = async (holdAppAddr, network) => {
    const algodClient = getAlgodClient(network);
    let holdAppAcc = await algodClient.accountInformation(holdAppAddr).do();
    // console.log("holdAppAcc", holdAppAcc);
    return holdAppAcc.assets[0].amount;
    
}

const purchaseTesla = async (holdAppAddr, holdAppID, asset_amount, network) => {
    const algodClient = getAlgodClient(network);
    const sender = algosdk.mnemonicToSecretKey(process.env.VUE_APP_ACC1_MNEMONIC).addr;
    let holdAppResponse = await algodClient.getApplicationByID(holdAppID).do();
    // console.log("holdAppResponse: ", holdAppResponse);
    const suggestedParams = await algodClient.getTransactionParams().do();
    suggestedParams.fee = algosdk.ALGORAND_MIN_TX_FEE;
    suggestedParams.flatFee = true;

    let txn1 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        sender,
        sender,
        undefined,
        undefined,
        0,
        undefined,
        holdAppResponse['params']['global-state'][0].value.uint,
        suggestedParams
    );
    //console.log("txn1 is array " + Array.isArray(txn1));
    await wallets.sendAlgoSignerTransactionOptIn(txn1, algodClient);

    let txn2 = algosdk.makePaymentTxnWithSuggestedParams(
        sender,
        holdAppAddr,
        holdAppResponse['params']['global-state'][1].value.uint * asset_amount,
        undefined,
        undefined,
        suggestedParams
    );

    let txn3 = algosdk.makeApplicationNoOpTxn(
        sender,
        suggestedParams,
        holdAppID,
        [new Uint8Array(Buffer.from("asset_sell")), algosdk.encodeUint64(Number(asset_amount))],
        undefined,
        undefined,
        [holdAppResponse['params']['global-state'][0].value.uint]
    );

    // Store txns
    let txns = [txn2, txn3];
    //console.log("txns is array " + Array.isArray(txns));

    // Assign group ID
    algosdk.assignGroupID(txns);

    return await wallets.sendAlgoSignerTransaction(txns, algodClient);
}

const getExplorerURL = (txId, network) => {
    switch (network) {
        case "TestNet":
            return "https://testnet.algoexplorer.io/tx/" + txId;
        default:
            return "http://localhost:8980/v2/transactions/" + txId + "?pretty";
    }
}

export {
    update_asset_balance,
    purchaseTesla,
    getExplorerURL
};
