import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def mint_approval():

    basic_checks = And(
        Txn.rekey_to() == Global.zero_address(),
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.asset_close_to() == Global.zero_address()
    )

    handle_creation = Seq(
        Assert(basic_checks),
        App.globalPut(Bytes("assetID"), Int(0)),
        Approve()
    )

    handle_optin = Reject()
    handle_closeout = Approve()
    handle_updateapp = Reject()
    handle_deleteapp = Reject()


    '''
    Create asset
    '''
    assetID = App.globalGet(Bytes("assetID"))
    asset_create = Seq([
        Assert(basic_checks),
        Assert(Txn.sender() == Global.creator_address()),
        Assert(assetID == Int(0)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(100_000_000),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_name: Bytes("VACoin"),
            TxnField.config_asset_unit_name: Bytes("VAC")
        }),
        InnerTxnBuilder.Submit(),
        App.globalPut(Bytes("assetID"), InnerTxn.created_asset_id()),
        Assert(assetID > Int(0)),
        Approve()
    ])


    '''
    Transfer_to_vending_contract
    '''
    sender_asset_balance = AssetHolding.balance(Global.current_application_address(), assetID)
    current_amount_asset = Seq([
        sender_asset_balance,
        Assert(sender_asset_balance.hasValue()),
        sender_asset_balance.value()
    ])
    asset_amount_to_transfer = Int(75_000_000);
    asset_transfer_to_vendAcc = Seq([
        Assert(basic_checks),
        Assert(Txn.sender() == Global.creator_address()),
        Assert(asset_amount_to_transfer <= current_amount_asset),
        Assert(assetID == Txn.assets[0]),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.asset_receiver: Txn.accounts[1],
            TxnField.asset_amount: asset_amount_to_transfer,
            TxnField.xfer_asset: Txn.assets[0]
        }),
        InnerTxnBuilder.Submit(),
        Approve()
    ])


    handle_noop = Seq([
        Assert(basic_checks),
        Cond(
            [Txn.application_args[0] == Bytes("createAsset"), asset_create],
            [Txn.application_args[0] == Bytes("transferToVend"), asset_transfer_to_vendAcc],
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

    print(compileTeal(mint_approval(), mode=Mode.Application, version=6))