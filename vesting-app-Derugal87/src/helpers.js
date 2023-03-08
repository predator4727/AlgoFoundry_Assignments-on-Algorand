import algosdk from "algosdk";
import { getAlgodClient } from "./client.js";
import wallets from "./wallets.js";


const update_sender_asset_balance = async (vestAppID, network, sender) => {
    const algodClient = getAlgodClient(network);
    let vestAppResponse = await algodClient.getApplicationByID(vestAppID).do();

    //advisors
    if (sender === process.env.VUE_APP_ACC1_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("A_balance"))
                return vestAppResponse['params']['global-state'][i].value.uint;
    }
    //private_investors
    else if (sender === process.env.VUE_APP_ACC2_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("PI_balance"))
                return vestAppResponse['params']['global-state'][i].value.uint;
    }
    //company_reserve
    else if (sender === process.env.VUE_APP_ACC3_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("CR_balance"))
                return vestAppResponse['params']['global-state'][i].value.uint;
    }
    //team
    else if (sender === process.env.VUE_APP_ACC4_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("T_balance"))
                return vestAppResponse['params']['global-state'][i].value.uint;
    }
}

const update_sender_asset_amount = async (vestAppID, network, sender, total_allocated_tokens, timestamp) => {
    const algodClient = getAlgodClient(network);
    let amount;
    let vestAppResponse = await algodClient.getApplicationByID(vestAppID).do();

    //advisors
    if (sender === process.env.VUE_APP_ACC1_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("A_withdraw_amount"))
                amount = vestAppResponse['params']['global-state'][i].value.uint;
    }
    //private_investors
    else if (sender === process.env.VUE_APP_ACC2_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("PI_withdraw_amount"))
                amount = vestAppResponse['params']['global-state'][i].value.uint;
    }
    //company_reserve
    else if (sender === process.env.VUE_APP_ACC3_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("CR_withdraw_amount"))
                amount = vestAppResponse['params']['global-state'][i].value.uint;
    }
    //team
    else if (sender === process.env.VUE_APP_ACC4_ADDR) {
        for (let i = 0; i < vestAppResponse['params']['global-state'].length; i++)
            if (vestAppResponse['params']['global-state'][i].key === window.btoa("T_withdraw_amount"))
                amount = vestAppResponse['params']['global-state'][i].value.uint;
    }
    return calculate_sender_asset_amount(total_allocated_tokens, amount, timestamp, sender);
}

const calculate_sender_asset_amount = async (total, amount, timestamp, sender) => {
    const current_month = Math.floor((Math.floor(Date.now() / 1000) - timestamp) / 60);
    // console.log(Math.floor(Date.now() / 1000));
    // console.log(timestamp);
    //console.log(current_month);
    // const current_month = Math.floor((Math.floor(Date.now() / 1000) - timestamp) / 2628000);
    if (sender === process.env.VUE_APP_ACC3_ADDR)
        return (total - amount);
    if (current_month <= 12)
        amount = 0;
    else if (current_month > 24)
        amount = total - amount;
    else
        amount = Math.floor(((current_month - 1) * total / 24) - amount);
    // console.log("amount", amount);
    return amount;
}

const withdrawAsset = async (vestAppAddr, vestAppID, asset_amount, network, sender, assetID) => {
    const algodClient = getAlgodClient(network);
    // console.log("asset amount", asset_amount);
    // let vestAppResponse = await algodClient.getApplicationByID(vestAppID).do();
    let vestInfoResponse = await algodClient.accountInformation(sender).do();
    // console.log("vestAppResponse: ", vestAppResponse);
    // console.log("vestInfoResponse: ", vestInfoResponse);
    // console.log("assesID", assetID);
    const suggestedParams = await algodClient.getTransactionParams().do();
    suggestedParams.fee = algosdk.ALGORAND_MIN_TX_FEE;
    suggestedParams.flatFee = true;
    let flag = 0;

    for (let i = 0; i < vestInfoResponse['assets'].length; i++) {
        if (vestInfoResponse['assets'][i]['asset-id'] === assetID)
            flag = 1;
    }
    if (flag == 0) {
        let txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
            sender,
            sender,
            undefined,
            undefined,
            0,
            undefined,
            assetID,
            suggestedParams
        );
        //console.log("txn1 is array " + Array.isArray(txn1));
        await wallets.sendAlgoSignerTransaction(txn, algodClient);
    }

    try {
        let txn1 = algosdk.makePaymentTxnWithSuggestedParams(
            sender,
            vestAppAddr,
            1000,
            undefined,
            undefined,
            suggestedParams
        );

        let txn2 = algosdk.makeApplicationNoOpTxn(
            sender,
            suggestedParams,
            vestAppID,
            [new Uint8Array(Buffer.from("withdraw")), algosdk.encodeUint64(Number(asset_amount))],
            undefined,
            undefined,
            [assetID]
        );

        // Store txns
        let txns = [txn1, txn2];
        //console.log("txns is array " + Array.isArray(txns));

        // Assign group ID
        algosdk.assignGroupID(txns);

        return await wallets.sendAlgoSignerAtomicTransaction(txns, algodClient);
    } catch (err) {
        console.error(err);
    }
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
    update_sender_asset_balance,
    update_sender_asset_amount,
    withdrawAsset,
    getExplorerURL
};
