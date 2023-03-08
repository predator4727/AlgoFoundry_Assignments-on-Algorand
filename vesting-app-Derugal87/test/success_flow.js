const { assert } = require("chai");
const { types } = require("@algo-builder/web");
const { convert} = require("@algo-builder/algob");
const { Runtime, AccountStore } = require("@algo-builder/runtime");
const commonfn = require("./common/commonfn");


describe("Success Flow", function () {
    // Write your code here

    let master;
	let advisors;
	let private_investors;
	let company_reserves;
	let team;
    let non_creator_stakeholder;
    let runtime;
    let mintAppInfo;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(1000e6); //1000 Algos
        advisors = new AccountStore(1000e6); //1000 Algos
        private_investors = new AccountStore(1000e6); //1000 Algos
        company_reserves = new AccountStore(1000e6); //1000 Algos
        team = new AccountStore(1000e6); //1000 Algos
        non_creator_stakeholder = new AccountStore(1000e6); //1000 Algos
        runtime = new Runtime([master, advisors, private_investors, company_reserves, team, non_creator_stakeholder]);
    }).timeout(10000);

    it("Deploy mint account is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        assert.isDefined(mintAppID);
        const appAccount = runtime.getAccount(mintAppInfo.applicationAccount);
        assert.equal(appAccount.amount, 10e7);
    }).timeout(10000);

    it("Asset is created successfully", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        assert.isDefined(assetID);
    }).timeout(10000);

    it("Deploy vesting contract is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserves.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        assert.isDefined(vestAppID);
        const appAccount = runtime.getAccount(vestAppInfo.applicationAccount);
        assert.equal(appAccount.amount, 10e7);
    }).timeout(10000);

    it("All stakeholders' addresses are optIn successfully", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const accounts = [advisors.account, private_investors.account, company_reserves.account, team.account];
        for (let i = 0; i < accounts.length; i++)
            commonfn.accOptInASA(runtime, accounts[i], assetID);
    }).timeout(10000);

    it("Vesting contract is optIn successfully", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserves.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
    }).timeout(10000);

    it("Transfer to vending contract is successful", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserves.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        const appAccount = runtime.getAccount(vestAppInfo.applicationAccount);
        assert.equal(Number(appAccount.assets.get(assetID).amount), 75_000_000);
    }).timeout(10000);

    it("Withdraw all assets after 24 months", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserves.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        runtime.setRoundAndTimestamp(20, 2 * 720 + 30);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 2 * 31536000 + 3 * (60 * 60 * 24));
        commonfn.withdraw(
            runtime,
            advisors.account,
            assetID,
            vestAppInfo.applicationAccount,
            vestAppID,
            1_000,
            10_000_000
        );
    }).timeout(10000);

    it("Withdraw 50% assets after 1 year and 1 month", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserves.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        runtime.setRoundAndTimestamp(20, 720 + 60);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 31536000 + 2628000);
        commonfn.withdraw(
            runtime,
            advisors.account,
            assetID,
            vestAppInfo.applicationAccount,
            vestAppID,
            1_000,
            5_000_000
        );
    }).timeout(10000);

    it("Company_reserves is not time-sensitive stakeholder, according withdrawal opportunity", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserves.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        commonfn.accOptInASA(runtime, company_reserves.account, assetID);
        runtime.setRoundAndTimestamp(20, 120);
        //runtime.setRoundAndTimestamp(20, (60 * 60 * 24 * 100));
        commonfn.withdraw(
            runtime,
            company_reserves.account,
            assetID,
            vestAppInfo.applicationAccount,
            vestAppID,
            1_000,
            30_000_000
        );
    }).timeout(10000);
});