const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // write your code here
    const master = deployer.accountsByName.get("master");
    const mintApp = deployer.getApp("mintApp");
    const holdApp = deployer.getApp("holdApp");
    const mintAppID = mintApp.appID; 
    const holdAppID = holdApp.appID; 
    const mintAppAddr = mintApp.applicationAccount;
    const holdAppAddr = holdApp.applicationAccount;

    let globalState = await readAppGlobalState(deployer, master.addr, mintAppID);
    const assetID = globalState.get("teslaID");


    // fund contract account
    await deployer.executeTx({
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        toAccountAddr: holdAppAddr,
        amountMicroAlgos: 2e7, //20 algos
        payFlags: { totalFee: 1000 },
    });

    // optin
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: holdAppID,
        payFlags: { totalFee: 1000 },
        foreignAssets: [assetID],
        appArgs: ["asset_optIn"].map(convert.stringToBytes),
    });

    // app call to transfer
    await deployer.executeTx({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: mintAppID,
        payFlags: { totalFee: 1000 },
        accounts: [holdAppAddr],
        foreignAssets: [assetID],
        appArgs: [convert.stringToBytes("transfer"), convert.uint64ToBigEndian(1e5)],
    });

    let globalStateHold = await readAppGlobalState(deployer, master.addr, holdAppID);
    console.log(globalStateHold);

    let mintAppAcc = await deployer.algodClient.accountInformation(mintAppAddr).do();
    console.log(mintAppAcc);
    let holdAppAcc = await deployer.algodClient.accountInformation(holdAppAddr).do();
    console.log(holdAppAcc);
}

module.exports = { default: run };
