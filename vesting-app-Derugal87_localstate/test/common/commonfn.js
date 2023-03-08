const { convert, runtime } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

const initContract = (runtime, creatorAccount, approvalProgramFile, clearProgramFile, lcInts, lcBytes, glInts, glBytes, accounts, args, appNameProgram) => {
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
			accounts: accounts,
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
		[],
		"mintApp"
	);
};

const initVest = (runtime, master) => {
	return initContract(
		runtime,
		master,
		"vesting_approval.py",
        "vesting_clearstate.py",
		8,
		0,
		2,
		4,
		accounts,
		[convert.uint64ToBigEndian(assetID)],
		"vestApp"
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
    const assetID = Number(getGlobal(appID, "assetID"));

    return assetID;
}

const optIn = (runtime, account, appID, assetID) => {
    runtime.executeTx([{
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: account,
        appID: appID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
        appArgs: ["asset_optIn"].map(convert.stringToBytes),
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

const withdraw = (runtime, account, assetID, appAccount, appID, assetAmount, algoAmount  ) => {
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
        appArgs: [convert.stringToBytes("withdraw"),convert.uint64ToBigEndian(assetAmount)],
    }]);
}

module.exports = {
    initContract,
    initMint,
    initVest,
    create_asset,
    optIn,
    transferType,
    withdraw
}