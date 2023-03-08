const { assert } = require("chai");
const { types } = require("@algo-builder/web");
const { convert} = require("@algo-builder/algob");
const { Runtime, AccountStore } = require("@algo-builder/runtime");
const commonfn = require("./common/commonfn");

// Errors
const RUNTIME_ERR1009 = 'RUNTIME_ERR1009: TEAL runtime encountered err opcode';
const RUNTIME_ERR1007 = "RUNTIME_ERR1007: Teal code rejected by logic";

describe("Negative Tests", function () {
    // Write your code here

    let master;
	let advisors;
	let private_investors;
	let company_reserve;
	let 
    let non_creator_stakeholder;
    let runtime;
    let mintAppInfo;

    // do this before each test
    this.beforeEach(async function () {
        master = new AccountStore(1000e6); //1000 Algos
        non_creator = new AccountStore(1000e6); //1000 Algos
        runtime = new Runtime([master, non_creator]);
    });



});