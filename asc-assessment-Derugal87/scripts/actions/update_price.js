const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
    // write your code here

    const master = deployer.accountsByName.get("master");
    const holdApp = deployer.getApp("holdApp");
    const holdAppID = holdApp.appID;

    await deployer.executeTX({
        type: types.TransactionType.CallApp,
        sign: types.SignType.SecretKey,
        fromAccount: master,
        appID: holdAppID,
        payFlags: { totalFee: 1000 },
        appArgs: [convert.stringToBytes("update_price"), convert.uint64ToBigEndian(2e6)],
    });

    // get global state
    let globalState = await readAppGlobalState(deployer, master.addr, holdAppID);
    console.log(globalState);

}

module.exports = { default: run };
