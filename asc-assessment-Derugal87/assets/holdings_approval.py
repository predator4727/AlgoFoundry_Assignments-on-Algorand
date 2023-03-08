import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def holdings_approval():

    basic_checks = And(
        Txn.rekey_to() == Global.zero_address(), 
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.asset_close_to() == Global.zero_address(),
    )

    assetID = Btoi(Txn.application_args[0])
    handle_creation = Seq([
        Assert(basic_checks),
        App.globalPut(Bytes("assetID"), assetID),
        App.globalPut(Bytes("purchase_price"), Int(5_000_000)), # 5 algo
        Approve()
    ])

    handle_optin = Seq([
        Assert(App.optedIn(Txn.sender(), Txn.application_id())),
        Approve()
    ])

    handle_closeout = Approve()
    handle_updateapp = Reject()
    handle_deleteapp = Reject()

    '''
    Asset Opt In
    '''
    asset_optIn = Seq([
        Assert(basic_checks),
        Assert(Txn.sender() == Global.creator_address()),
        Assert(App.globalGet(Bytes("assetID")) == Txn.assets[0]),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields
        ({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Global.current_application_address(),
            TxnField.asset_amount: Int(0),
            TxnField.xfer_asset: Txn.assets[0]
        }),
        InnerTxnBuilder.Submit(),
        Approve()
    ])

    '''
    Update price
    '''
    new_purchase_price = Btoi(Txn.application_args[1])
    update_price = Seq([
        Assert(basic_checks),
        Assert(Txn.sender() == Global.creator_address()),
        App.globalPut(Bytes("purchase_price"), new_purchase_price),
        Approve()
    ])

    '''
    General data for any transfer
    '''
    sender_asset_balance = AssetHolding.balance(Global.current_application_address(), App.globalGet(Bytes("assetID")))
    current_asset_amount = Seq(
        sender_asset_balance,
        Assert(sender_asset_balance.hasValue()),
        sender_asset_balance.value()
    )

    '''
    Sell tokens
    '''
    avail_spend_balance = Balance(Gtxn[1].sender()) - MinBalance(Gtxn[1].sender())
    asset_amount_for_transfer = Btoi(Gtxn[1].application_args[1])
    purchase_price = App.globalGet(Bytes("purchase_price"))
    asset_sell = Seq([
        Assert(basic_checks),
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[1].type_enum() == TxnType.ApplicationCall),
        Assert(asset_amount_for_transfer > Int(0)),
        Assert(Gtxn[1].assets[0] == App.globalGet(Bytes("assetID"))),
        Assert(current_asset_amount >= asset_amount_for_transfer),
        Assert(avail_spend_balance >= (purchase_price * asset_amount_for_transfer + Int(1000))),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Gtxn[1].sender(),
            TxnField.asset_amount: asset_amount_for_transfer,
            TxnField.xfer_asset: Gtxn[1].assets[0]
        }),
        InnerTxnBuilder.Submit(),
        Approve()
    ])

    handle_noop = Seq([
        Assert(basic_checks),
        Cond(
            [Txn.application_args[0] == Bytes("asset_optIn"), asset_optIn],
            [Txn.application_args[0] == Bytes("update_price"), update_price],
            [Txn.application_args[0] == Bytes("asset_sell"), asset_sell],
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

    print(compileTeal(holdings_approval(), mode=Mode.Application, version=6))