const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // write your code here
    const master = deployer.accountsByName.get("master");
    const mintApp = deployer.getApp("mintApp");
    const burnApp = deployer.getApp("burnApp");
    const mintAppID = mintApp.appID;
    const burnAppID = burnApp.appID;
    const mintAppAddr = mintApp.applicationAccount;
    const burnAppAddr = burnApp.applicationAccount;

    let globalState = await readAppGlobalState(deployer, master.addr, appID);
    const assetID = globalState.get("teslaID");

    // fund contract account
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: burnAppAddr,
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 },
    });

    // opt in to the asset
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: burnAppID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
        appArgs: ["asset_optIn_burn"].map(convert.stringToBytes),
    });

    // app call to burn asset
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: mintAppID,
        payFlags: { totalFee: 1000 },
        accounts: [burnAppAddr],
        foreignAssets: [assetID],
        appArgs: [convert.stringToBytes("burn"), convert.uint64ToBigEndian(2e5)],
    });

    let mintAppAcc = await deployer.algodClient.accountInformation(mintAppAddr).do();
    console.log(mintAppAcc);
    let burnAppAcc = await deployer.algodClient.accountInformation(burnAppAddr).do();
    console.log(burnAppAcc);
}

module.exports = { default: run };
