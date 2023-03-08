const { convert, readAppGlobalState } = require("@algo-builder/algob");
const { types } = require("@algo-builder/web");

async function run(runtimeEnv, deployer) {

	const master = deployer.accountsByName.get("master");
	const advisors_address = deployer.accountsByName.get("advisors");
	const private_investor_address = deployer.accountsByName.get("private_investors");
	const company_reserve = deployer.accountsByName.get("company_reserves");
	const team_address = deployer.accountsByName.get("team");

	/*
	// Mint app
	*/
	await deployer.deployApp(
		master,
		{
			metaType: types.MetaType.FILE,
            approvalProgramFilename: "mint_approval.py",
            clearProgramFilename: "mint_clearstate.py",
            localInts: 0,
            localBytes: 0,
            globalInts: 1,
            globalBytes: 0,
            appArgs: [],
			appName: 'mintApp'
		},
		{ totalFee: 1000 }
	)

	// get app info
	const mintApp = deployer.getApp('mintApp');
	console.log(mintApp);
	const mintAppID = mintApp.appID;
	const mintAppAddr = mintApp.applicationAccount;
	console.log("mintApp account address: ", mintAppAddr);

	// fund contract account
	await deployer.executeTx({
		type: types.TransactionType.TransferAlgo,
		sign: types.SignType.SecretKey,
		fromAccount: master,
		toAccountAddr: mintAppAddr,
		amountMicroAlgos: 2e7,
		payFlags: { totalFee: 1000 }
	})

	// create asset
	await deployer.executeTx({
		type: types.TransactionType.CallApp,
		sign: types.SignType.SecretKey,
		fromAccount: master,
		appID: mintAppID,
		payFlags: { totalFee: 1000 },
		appArgs: ["createAsset"].map(convert.stringToBytes)
	})

	let mintAppAcc = await deployer.algodClient.accountInformation(mintAppAddr).do()
	console.log(mintAppAcc);
	let globalState = await readAppGlobalState(deployer, master.addr, mintAppID);
	console.log(globalState);
	const assetID = globalState.get("assetID");
	deployer.addCheckpointKV("assetID", assetID);

	/*
	// Vest app
	*/
	await deployer.deployApp(
		master,
		{
			metaType: types.MetaType.FILE,
			approvalProgramFilename: "vesting_approval.py",
			clearProgramFilename: "vesting_clearstate.py",
			localInts: 0,
			localBytes: 0,
			globalInts: 12,
			globalBytes: 4,
			accounts: [
				advisors_address.addr,
				private_investor_address.addr,
				company_reserve.addr,
				team_address.addr,
			],
			appArgs: [
				convert.uint64ToBigEndian(assetID),
                convert.uint64ToBigEndian(10000000),
                convert.uint64ToBigEndian(20000000),
                convert.uint64ToBigEndian(30000000),
                convert.uint64ToBigEndian(15000000),
			],
			appName: 'vestApp'
		},
		{ totalFee: 1000 }
	);

	const vestApp = deployer.getApp("vestApp");
	console.log(vestApp);
	const vestAppID = vestApp.appID;
	const vestAppAddr = vestApp.applicationAccount;
	console.log("vestApp account address:", vestAppAddr);
	deployer.addCheckpointKV('vestAppID', vestAppID);
	deployer.addCheckpointKV('vestAppAddr', vestAppAddr);
	deployer.addCheckpointKV('vestAppTimestamp', vestApp.timestamp);
	let vestAppAcc = await deployer.algodClient.accountInformation(vestAppAddr).do();
	console.log(vestAppAcc);


	let globalStateVest = await readAppGlobalState(deployer, master.addr, vestAppID);
	console.log(globalStateVest);

}

module.exports = { default: run };