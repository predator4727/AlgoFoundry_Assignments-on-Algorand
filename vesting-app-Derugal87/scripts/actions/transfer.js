const { convert, readAppGlobalState, readAppLocalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {
	const master = deployer.accountsByName.get("master");

	// get app info
	const mintApp = deployer.getApp('mintApp');
	console.log(mintApp);
	const mintAppID = mintApp.appID;
	const mintAppAddr = mintApp.applicationAccount;
	const vestApp = deployer.getApp('vestApp');
	const vestAppID = vestApp.appID;
	const vestAppAddr = vestApp.applicationAccount;
	let globalState = await readAppGlobalState(deployer, master.addr, vestAppID);
	const assetID = globalState.get("assetID");


	// fund contract account
	await deployer.executeTx({
		type: types.TransactionType.TransferAlgo,
		sign: types.SignType.SecretKey,
		fromAccount: master,
		toAccountAddr: vestAppAddr,
		amountMicroAlgos: 10e7, //20 algos
		payFlags: { totalFee: 1000 },
	});

	// optin
	await deployer.executeTx({
		type: types.TransactionType.CallApp,
		sign: types.SignType.SecretKey,
		fromAccount: master,
		appID: vestAppID,
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
		accounts: [vestAppAddr],
		foreignAssets: [assetID],
		appArgs: [convert.stringToBytes("transferToVest")],
	});

	// callApp to store get_time in global state
	await deployer.executeTx({
		type: types.TransactionType.CallApp,
		sign: types.SignType.SecretKey,
		fromAccount: master,
		appID: vestAppID,
		payFlags: { totalFee: 1000 },
		appArgs: [convert.stringToBytes("get_time"), convert.uint64ToBigEndian(vestApp.timestamp)],
	});

	let globalStateVest = await readAppGlobalState(deployer, master.addr, vestAppID);
	console.log(globalStateVest);

}

module.exports = { default: run };