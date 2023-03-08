import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def vesting_approval():

	basic_checks = And(
		Txn.rekey_to() == Global.zero_address(),
		Txn.close_remainder_to() == Global.zero_address(),
		Txn.asset_close_to() == Global.zero_address()
	)

	'''
    Initialize stakeholders addresses
    '''
	handle_creation = Seq([
		Assert(basic_checks),
		App.globalPut(Bytes("advisors"), Txn.accounts[1]),
		App.globalPut(Bytes("private_investors"), Txn.accounts[2]),
		App.globalPut(Bytes("company_reserve"), Txn.accounts[3]),
		App.globalPut(Bytes("team"), Txn.accounts[4]),
		App.globalPut(Bytes("assetID"), Btoi(Txn.application_args[0])),
		Approve(),
	])

	'''
    Stakeholders' addresses check
    '''
	stakeholder_checks = Or(
		Txn.sender() == App.globalGet(Bytes("advisors")),
		Txn.sender() == App.globalGet(Bytes("private_investors")),
		Txn.sender() == App.globalGet(Bytes("company_reserve")),
		Txn.sender() == App.globalGet(Bytes("team"))
	)

	'''
    Initialize balance and withdraw for every stakeholder
    '''
	handle_optin = Seq([
		Assert(basic_checks),
		Assert(App.optedIn(Txn.sender(), Txn.application_id())),
		Assert(stakeholder_checks),
		App.localPut(Txn.sender(), Bytes("withdraw_amount"), Int(0)),
		Approve()
	])

	handle_closeout = Approve()
	handle_updateapp = Reject()
	handle_deleteapp = Reject()

	'''
    Optin
    '''
	optIn = Seq([
		Assert(basic_checks),
		# Assert(App.optedIn(Txn.sender(), Txn.application_id())),
		Assert(App.globalGet(Bytes("assetID")) == Txn.assets[0]),
		InnerTxnBuilder.Begin(),
		InnerTxnBuilder.SetFields({
			TxnField.type_enum: TxnType.AssetTransfer,
			TxnField.asset_receiver: Global.current_application_address(),
			TxnField.asset_amount: Int(0),
			TxnField.xfer_asset: Txn.assets[0]
		}),
		InnerTxnBuilder.Submit(),
		Approve()
	])

	'''
    Balance
    '''
	get_balance = Seq(
		Assert(basic_checks),
		Assert(stakeholder_checks),
		App.localPut(Txn.sender(), Bytes("balance"), Btoi(Txn.application_args[1])),
		Approve()
	)

	'''
    Start_time
    '''
	get_time = Seq(
		App.globalPut(Bytes("get_time"), Btoi(Txn.application_args[1])),
		Approve()
	)

	'''
    Withdraw
    '''
	withdraw_amount = Btoi(Gtxn[1].application_args[1])
	current_month = (Global.latest_timestamp() - App.globalGet(Bytes("get_time"))) / Int(60 * 60 * 24 * 30)
	current_balance = App.localGet(Txn.sender(), Bytes("balance"))
	current_withdraw_amount = App.localGet(Txn.sender(), Bytes("withdraw_amount"))
	limit_amount_to_withdraw = If(current_month > Int(24),
								current_balance - current_withdraw_amount,
								(current_balance * ((current_month - Int(1)) / Int(24))) - current_withdraw_amount)


	sign_withdraw_transaction = Seq([
		Assert(Global.group_size() == Int(2)),
		Assert(Gtxn[0].type_enum() == TxnType.Payment),
		Assert(Gtxn[1].type_enum() == TxnType.ApplicationCall),
		Assert(App.globalGet(Bytes("assetID")) == Gtxn[1].assets[0]),
		Assert(withdraw_amount > Int(0)),
		Assert(withdraw_amount <= limit_amount_to_withdraw),
		InnerTxnBuilder.Begin(),
		InnerTxnBuilder.SetFields({
			TxnField.type_enum: TxnType.AssetTransfer,
			TxnField.asset_receiver: Gtxn[1].sender(),
			TxnField.asset_amount: withdraw_amount,
			TxnField.xfer_asset: Gtxn[1].assets[0]
		}),
		InnerTxnBuilder.Submit(),
		App.localPut(Gtxn[1].sender(), Bytes("withdraw_amount"), App.localGet(Gtxn[1].sender(), Bytes("withdraw_amount")) + withdraw_amount),
		App.localPut(Gtxn[1].sender(), Bytes("balance"), App.localGet(Gtxn[1].sender(), Bytes("balance")) - App.localGet(Gtxn[1].sender(), Bytes("withdraw"))),
		Approve()
	])

	check_withdraw_cond = Seq([
		Assert(stakeholder_checks),
		If(current_month > Int(12), sign_withdraw_transaction, Reject()),
	])


	withdraw = Seq([
		Assert(basic_checks),
		Assert(stakeholder_checks),
		Cond(
			[Txn.sender() == App.globalGet(Bytes("advisors")),
				If(Global.latest_timestamp() > (App.globalGet(Bytes("get_time")) + Int(60 * 60 * 24 * 365)), check_withdraw_cond, Reject())
			],
			[Txn.sender() == App.globalGet(Bytes("private_investors")),
				If(Global.latest_timestamp() > (App.globalGet(Bytes("get_time")) + Int(60 * 60 * 24 * 365)), check_withdraw_cond, Reject())
			],
			[Txn.sender() == App.globalGet(Bytes("company_reserve")),
				If(Global.latest_timestamp() > (App.globalGet(Bytes("get_time")) + Int(60 * 60 * 24 * 365)), sign_withdraw_transaction, Reject())
			],
			[Txn.sender() == App.globalGet(Bytes("team")),
				If(Global.latest_timestamp() > (App.globalGet(Bytes("get_time")) + Int(60 * 60 * 24 * 365)), check_withdraw_cond, Reject())
			]
		),
		Approve()
	])

	handle_noop = Seq([
		Assert(basic_checks),
		Cond(
			[Txn.application_args[0] == Bytes("asset_optIn"), optIn],
			[Txn.application_args[0] == Bytes("get_time"), get_time],
			[Txn.application_args[0] == Bytes("get_balance"), get_balance],
			[Txn.application_args[0] == Bytes("withdraw"), withdraw]
		)
	])

	program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

	return program


if __name__ == "__main__":
    params = {}

    # Overwrite params if sys.argv[1] is passed
    if(len(sys.argv) > 1):
        params = parse_params(sys.argv[1], params)

    print(compileTeal(vesting_approval(), mode=Mode.Application, version=6))