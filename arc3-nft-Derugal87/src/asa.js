/* eslint-disable */
import algosdk  from "algosdk";
import { getAlgodClient } from "./client.js";
import wallets from "./wallets.js";
import { convertByte32ToIpfsCidV0 } from "../scripts/helpers/ipfs2bytes32.js";

const purchaseNFT = async (creator, receiver, nftId, fungibleTokenId, network) => {
    
    const algodClient = getAlgodClient(network);
    console.log(creator, receiver, nftId, fungibleTokenId, network);
    const creator_acc = algosdk.mnemonicToSecretKey(process.env.VUE_APP_CREATOR_MNEMONIC);
    const receiver_acc = algosdk.mnemonicToSecretKey(process.env.VUE_APP_BUYER_MNEMONIC);
    const suggestedParams = await algodClient.getTransactionParams().do();

    // 1. Buyer opt into the asset
    console.log("Buyer opt into the asset");
    let txn1 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        receiver_acc.addr,
        receiver_acc.addr,
        undefined,
        undefined,
        0,
        undefined,
        nftId,
        suggestedParams
    );

    // 2. Creator sends the NFT to the buyer
    console.log("Creator sends the NFT to the buyer");
    let txn2 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        creator_acc.addr,
        receiver_acc.addr,
        undefined,
        undefined,
        1,
        undefined,
        nftId,
        suggestedParams
    );

    // 3. Buyer pays 5 tokens to creator
    console.log("Buyer pays 5 tokens to creator");
    let txn3 = algosdk.makeAssetTransferTxnWithSuggestedParams(
        receiver_acc.addr,
        creator_acc.addr,
        undefined,
        undefined,
        5,
        undefined,
        fungibleTokenId,
        suggestedParams
    );

    // Store all transactions
    let txns = [txn1, txn2, txn3];

    // Group all transactions
    let txgroup = algosdk.assignGroupID(txns);


    // call sendAlgoSignerTransaction
    return (await wallets.sendAlgoSignerTransaction(txns, algodClient, creator_acc));
}

const getAccountInfo = async (address, network) => {
    const algodClient = getAlgodClient(network);

    return await algodClient.accountInformation(address).do();
};

const checkMetadataHash = (uint8ArrHash, assetURL) => {
    // convert uint8array to hex string
    let metadataHash = Buffer.from(uint8ArrHash).toString("hex");

    // get IPFS cid of json metadata 
    const cid = convertByte32ToIpfsCidV0(metadataHash);

    // check if cid from assetURL is the same as cid extracted from metadata hash
    let cid_from_assetURL = assetURL.replace("ipfs://", "");
    cid_from_assetURL = cid_from_assetURL.replace("#arc3", "");

    return cid_from_assetURL === cid;
}

export default {
    purchaseNFT,
    checkMetadataHash,
    getAccountInfo,
};