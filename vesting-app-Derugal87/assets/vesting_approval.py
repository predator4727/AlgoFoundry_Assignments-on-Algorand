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
        App.globalPut(Bytes("A"), Txn.accounts[1]),  # advisors
        App.globalPut(Bytes("PI"), Txn.accounts[2]),  # private_investors
        App.globalPut(Bytes("CR"), Txn.accounts[3]),  # company_reserve
        App.globalPut(Bytes("T"), Txn.accounts[4]),  # team
        App.globalPut(Bytes("assetID"), Btoi(Txn.application_args[0])),
        App.globalPut(Bytes("A_balance"), Btoi(Txn.application_args[1])),
        App.globalPut(Bytes("PI_balance"), Btoi(Txn.application_args[2])),
        App.globalPut(Bytes("CR_balance"), Btoi(Txn.application_args[3])),
        App.globalPut(Bytes("T_balance"), Btoi(Txn.application_args[4])),
        App.globalPut(Bytes("A_withdraw_amount"), Int(0)),
        App.globalPut(Bytes("PI_withdraw_amount"), Int(0)),
        App.globalPut(Bytes("CR_withdraw_amount"), Int(0)),
        App.globalPut(Bytes("T_withdraw_amount"), Int(0)),
        Approve(),
    ])

    '''
    Stakeholders' addresses check
    '''
    stakeholder_checks = Or(
        Txn.sender() == App.globalGet(Bytes("A")),
        Txn.sender() == App.globalGet(Bytes("PI")),
        Txn.sender() == App.globalGet(Bytes("CR")),
        Txn.sender() == App.globalGet(Bytes("T"))
    )

    '''
    Initialize balance and withdraw for every stakeholder
    '''
    handle_optin = Seq(
        Assert(App.optedIn(Txn.sender(), Txn.application_id())),
        Approve()
    )

    handle_closeout = Approve()
    handle_updateapp = Reject()
    handle_deleteapp = Reject()

    '''
    Optin
    '''
    optIn = Seq([
        Assert(basic_checks),
        # Assert(App.optedIn(Txn.sender(), Txn.application_id())),
        Assert(Txn.sender() == Global.creator_address()),
        Assert(App.globalGet(Bytes("OptInFlag")) == Int(0)),
        Assert(App.globalGet(Bytes("assetID")) == Txn.assets[0]),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.asset_amount: Int(0),
            TxnField.xfer_asset: Txn.assets[0]
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(Bytes("OptInFlag"), Int(1)),
        Approve()
    ])

    '''
    Start_time
    '''
    get_time = Seq(
        App.globalPut(Bytes("get_time"), Btoi(Txn.application_args[1])),
        Approve()
    )
    current_time = App.globalGet(Bytes("get_time"))

    '''
    Withdraw
    '''
    withdraw_amount = Btoi(Gtxn[1].application_args[1])
    #current_month = (Global.latest_timestamp() - current_time) / Int(2628000)
    current_month = (Global.latest_timestamp() - current_time) / Int(60)
    # available_withdrawal = Or(
    #     # Global.latest_timestamp() > (current_time + Int(31536000)),
    #     Global.latest_timestamp() > (current_time + Int(720)),
    #     current_month > Int(12)
    # )
    available_withdrawal = Seq(
        # Global.latest_timestamp() > (current_time + Int(31536000)),
        Global.latest_timestamp() > (current_time + Int(720)),
        #current_month > Int(12)
    )
    # current_balance = App.localGet(Txn.sender(), Bytes("balance"))
    # current_withdraw_amount = App.localGet(Txn.sender(), Bytes("withdraw_amount"))
    # limit_amount_to_withdraw = If(current_month > Int(24),
    #                               current_balance - current_withdraw_amount,
    #                               (current_balance * ((current_month - Int(1)) / Int(24))) - current_withdraw_amount)
	

    @Subroutine(TealType.none)
    def sign_withdraw_transaction(withdraw_limit, withdrawn):
        return Seq([
            Assert(Global.group_size() == Int(2)),
            Assert(Gtxn[0].type_enum() == TxnType.Payment),
            Assert(Gtxn[1].type_enum() == TxnType.ApplicationCall),
            Assert(App.globalGet(Bytes("assetID")) == Gtxn[1].assets[0]),
            Assert(withdraw_amount > Int(0)), 
            # If(month > Int(24))
            # .Then(App.globalPut(balance, ))
            # .Else(App.globalPut(balance, App.globalGet(balance) * (month - Int(1)) / Int(24)) - App.globalGet(withdrawn)),
            Assert(withdraw_amount <= withdraw_limit),
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_receiver: Gtxn[1].sender(),
                TxnField.asset_amount: withdraw_amount,
                TxnField.xfer_asset: Gtxn[1].assets[0]
            }),
            InnerTxnBuilder.Submit(),
            App.globalPut(withdrawn, App.globalGet(withdrawn) + withdraw_amount),
            # App.localPut(balance, App.localGet(balance) - App.localGet(Gtxn[1].sender(), Bytes("withdraw"))),
        ])
    
    @Subroutine(TealType.none)
    def check_withdrawal_limit(balance, withdrawn, month):
        return Seq([
            If(month > Int(24)).Then(
                sign_withdraw_transaction(App.globalGet(balance) - App.globalGet(withdrawn), withdrawn)
            ).ElseIf(month > Int(12)).Then(
                sign_withdraw_transaction(((App.globalGet(balance) * (month - Int(1))) / Int(24)) - App.globalGet(withdrawn), withdrawn)
            ).Else(Reject())
       ])


    withdraw = Seq([
        Assert(basic_checks),
        Assert(stakeholder_checks),
        Cond(
            [Txn.sender() == App.globalGet(Bytes("A")), 
                If(available_withdrawal).Then(
                    check_withdrawal_limit(Bytes("A_balance"), Bytes("A_withdraw_amount"), current_month)
                ).Else(Reject())],
            [Txn.sender() == App.globalGet(Bytes("PI")), 
                If(available_withdrawal).Then(
                    check_withdrawal_limit(Bytes("PI_balance"), Bytes("PI_withdraw_amount"), current_month)
                ).Else(Reject())],
            [Txn.sender() == App.globalGet(Bytes("CR")), sign_withdraw_transaction(App.globalGet(Bytes("CR_balance")) - App.globalGet(Bytes("CR_withdraw_amount")), Bytes("CR_withdraw_amount"))],
            [Txn.sender() == App.globalGet(Bytes("T")), 
                If(available_withdrawal).Then(
                    check_withdrawal_limit(Bytes("T_balance"), Bytes("T_withdraw_amount"), current_month)
                ).Else(Reject())]
        ),
        Approve()
    ])

    handle_noop = Seq([
        Assert(basic_checks),
        Cond(
            [Txn.application_args[0] == Bytes("asset_optIn"), optIn],
            [Txn.application_args[0] == Bytes("get_time"), get_time],
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
    if (len(sys.argv) > 1):
        params = parse_params(sys.argv[1], params)

    print(compileTeal(vesting_approval(), mode=Mode.Application, version=6))
