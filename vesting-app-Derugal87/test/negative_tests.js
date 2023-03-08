const { assert } = require("chai");
const { types } = require("@algo-builder/web");
const { convert} = require("@algo-builder/algob");
const { Runtime, AccountStore } = require("@algo-builder/runtime");
const commonfn = require("./common/commonfn");

// Errors
const RUNTIME_ERR1007 = "RUNTIME_ERR1007: Teal code rejected by logic";
const RUNTIME_ERR1009 = 'RUNTIME_ERR1009: TEAL runtime encountered err opcode';


describe("Negative Tests", function () {
    // Write your code here

    let master;
	let advisors;
	let private_investors;
	let company_reserve;
	let team;
    let non_creator_stakeholder;
    let runtime;
    let mintAppInfo;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(1000e6); //1000 Algos
        advisors = new AccountStore(1000e6); //1000 Algos
        private_investors = new AccountStore(1000e6); //1000 Algos
        company_reserve = new AccountStore(1000e6); //1000 Algos
        team = new AccountStore(1000e6); //1000 Algos
        non_creator_stakeholder = new AccountStore(1000e6); //1000 Algos
        runtime = new Runtime([master, advisors, private_investors, company_reserve, team, non_creator_stakeholder]);
    });

    it("Double asset creation fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        // create asset  
        commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        // create asset again
        assert.throws(() => {
            commonfn.create_asset(runtime, master.account, mintAppInfo.appID)
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Asset creation fails when non-creator calls", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);

        // create asset 
        assert.throws(() => {
            commonfn.create_asset(runtime, non_creator_stakeholder.account, mintAppInfo.appID)
        },
            RUNTIME_ERR1009);
    }).timeout(10000);

    it("Transfer to vesting contract fails when non-creator calls", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        assert.throws(() => {
            commonfn.transfer(
                runtime,
                non_creator_stakeholder.account,
                mintAppID,
                vestAppInfo.applicationAccount,
                assetID,
                75_000_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Transfer coins to non-Vest app fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        assert.throws(() => {
            commonfn.transfer(
                runtime,
                non_creator_stakeholder.account,
                mintAppID,
                mintAppInfo.applicationAccount,
                assetID,
                75_000_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Vest app opting in asset twice fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        assert.throws(() => {
            commonfn.appOptInASA(
                runtime,
                master.account,
                vestAppID,
                assetID,
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Non creator opt-in calls fail", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        assert.throws(() => {
            commonfn.appOptInASA(
                runtime, 
                non_creator_stakeholder.account, 
                vestAppID, 
                assetID
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Opt-in call to incorrect asset ID fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        assert.throws(() => {
            commonfn.appOptInASA(
                runtime, 
                master.account, 
                vestAppID, 
                (assetID - 1)
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Before 1 year staking, withdrawal fails (if stakeholder is not Company_reserve)", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        runtime.setRoundAndTimestamp(20, 720);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 31516000);
        assert.throws(() => {
            commonfn.withdraw(
                runtime,
                advisors.account,
                assetID,
                vestAppInfo.applicationAccount,
                vestAppID,
                1_000_000,
                1_000
            )
        }, RUNTIME_ERR1007);
    }).timeout(10000);

    it("Overlimit withdraw amount during current month fails (case 1)", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        runtime.setRoundAndTimestamp(20, 720 + 60);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 31536000 + 2629000);
        assert.throws(() => {
            commonfn.withdraw(
                runtime,
                advisors.account,
                assetID,
                vestAppInfo.applicationAccount,
                vestAppID,
                8_000_000,
                1_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Overlimit withdraw amount during current month fails (case 2)", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        runtime.setRoundAndTimestamp(20, 720 + 60);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 31536000 + 2629000);
        commonfn.withdraw(
            runtime,
            advisors.account,
            assetID,
            vestAppInfo.applicationAccount,
            vestAppID,
            4_000_000,
            1_000
        )
        assert.throws(() => {
            commonfn.withdraw(
                runtime,
                advisors.account,
                assetID,
                vestAppInfo.applicationAccount,
                vestAppID,
                4_000_000,
                1_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("0 assets withdrawal fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        runtime.setRoundAndTimestamp(20, 720 + 60);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 31536000 + 2629000);
        assert.throws(() => {
            commonfn.withdraw(
                runtime,
                advisors.account,
                assetID,
                vestAppInfo.applicationAccount,
                vestAppID,
                0,
                1_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);

    it("Non stakeholder withdraw fails", () => {
        mintAppInfo = commonfn.initMint(runtime, master.account);
        const mintAppID = mintAppInfo.appID;
        const accounts = [advisors.account.addr, private_investors.account.addr, company_reserve.account.addr, team.account.addr];
        const assetID = commonfn.create_asset(runtime, master.account, mintAppInfo.appID);
        const vestAppInfo = commonfn.initVest(runtime, master.account, accounts, assetID);
        const vestAppID = vestAppInfo.appID;
        commonfn.accOptInASA(runtime, advisors.account, assetID);
        commonfn.appOptInASA(runtime, master.account, vestAppID, assetID);
        commonfn.transfer(
            runtime,
            master.account,
            mintAppID,
            vestAppInfo.applicationAccount,
            assetID,
            75_000_000
        );
        runtime.setRoundAndTimestamp(20, 720 + 60);
        // 1 month - 2628000
        // 1 year - 31536000
        //runtime.setRoundAndTimestamp(20, 31536000 + 2629000);
        assert.throws(() => {
            commonfn.withdraw(
                runtime,
                non_creator_stakeholder.account,
                assetID,
                vestAppInfo.applicationAccount,
                vestAppID,
                1_000_000,
                1_000
            )
        }, RUNTIME_ERR1009);
    }).timeout(10000);
});