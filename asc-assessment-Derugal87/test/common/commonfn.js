const { convert } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

const initContract = (runtime, creatorAccount, approvalProgramFile, clearProgramFile, lcInts, lcBytes, glInts, glBytes, args, appNameProgram) => {
    // create new app
    runtime.deployApp(
        creatorAccount,
        {
            metaType: types.MetaType.FILE,
            approvalProgramFilename: approvalProgramFile,
            clearProgramFilename: clearProgramFile,
            localInts: lcInts,
            localBytes: lcBytes,
            globalInts: glInts,
            globalBytes: glBytes,
            appArgs: args,
            appName: appNameProgram,
        },
        { totalFee: 1000 }, //pay flags
    );

    const appInfo = runtime.getAppByName(appNameProgram);
    const appAddress = appInfo.applicationAccount;

    // fund the contract
    runtime.executeTx([{
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: creatorAccount, //use the account object
        toAccountAddr: appAddress, //app address
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 },
    }]);

    return appInfo;
};

const initMint = (runtime, master) => {
    return initContract(
        runtime,
        master,
        "mint_approval.py",
        "mint_clearstate.py",
        0,
        0,
        1,
        0,
        [],
        "mintApp"
    );
};

const initHold = (runtime, master, assetID) => {
    return initContract(
        runtime,
        master,
        "holdings_approval.py",
        "holdings_clearstate.py",
        0,
        0,
        2,
        0,
        [convert.uint64ToBigEndian(assetID)],
        "holdApp"
    );
};

const initBurn = (runtime, master, assetID) => {
    return initContract(
        runtime,
        master,
        "burn_approval.py",
        "burn_clearstate.py",
        0,
        0,
        1,
        0,
        [convert.uint64ToBigEndian(assetID)],
        "burnApp"
    );
};

const create_asset = (runtime, master, appID) => {
    //create asset
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: appID,
        payFlags: { totalFee: 1000 },
        appArgs: ["createAsset"].map(convert.stringToBytes),
    }]);

    //get asset ID
    const getGlobal = (appID, key) => runtime.getGlobalState(appID, key);
    const assetID = Number(getGlobal(appID, "teslaID"));

    return assetID;
}

const optInType = (runtime, account, appID, assetID, type) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
        appArgs: [type].map(convert.stringToBytes),
    }]);
};

const transferType = (runtime, account, appID, appAccount, assetID, type, assetAmount) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        accounts: [appAccount],
        foreignAssets: [assetID],
        appArgs: [convert.stringToBytes(type), convert.uint64ToBigEndian(assetAmount)],
    }]);
};

const updatePrice = (runtime, account, appID, newPrice) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        appArgs: [convert.stringToBytes("update_price"), convert.uint64ToBigEndian(newPrice)],
    }]);
};

const asset_selling = (runtime, account, assetID, appAccount, appID, assetAmount, algoAmount ) => {
    runtime.executeTx([{
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        toAccountAddr: appAccount,
        amountMicroAlgos: algoAmount,
        payFlags: { totalFee: 1000 },
    },{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
        appArgs: [convert.stringToBytes("asset_sell"),convert.uint64ToBigEndian(assetAmount)],
    }]);
}

const assetSell = (runtime, non_creator, assetID, appID, assetAmount) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: non_creator.account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
        appArgs: [convert.stringToBytes("asset_sell"),convert.uint64ToBigEndian(assetAmount)],
    }]);
}


module.exports = {
    initContract,
    initMint,
    initHold,
    initBurn,
    create_asset,
    optInType,
    transferType,
    updatePrice,
    asset_selling,
    assetSell
}