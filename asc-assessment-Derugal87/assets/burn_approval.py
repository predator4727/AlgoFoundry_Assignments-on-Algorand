import sys
sys.path.insert(0,'.')

from algobpy.parse import parse_params
from pyteal import *

def burn_approval():

    basic_checks = And(
        Txn.rekey_to() == Global.zero_address(), 
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.asset_close_to() == Global.zero_address(),
    )

    assetID = Btoi(Txn.application_args[0])
    handle_creation = Seq([
        Assert(basic_checks),
        App.globalPut(Bytes("assetID"), assetID),
        Approve()
    ])

    
    # handle_optin = Seq([
    #     Assert(App.optedIn(Txn.sender(), Txn.application_id())),
    #     Approve()
    # ])

    handle_optin = Reject()
    handle_closeout = Approve()
    handle_updateapp = Reject()
    handle_deleteapp = Reject()

    
    '''
    Asset Opt In
    '''
    asset_optIn_burn = Seq(
        Assert(basic_checks),
        # Assert(Txn.sender() == Global.creator_address()),
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
    )

    handle_noop = Seq([
        Assert(basic_checks),
        Cond(
            [Txn.application_args[0] == Bytes("asset_optIn_burn"), asset_optIn_burn],
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

    print(compileTeal(burn_approval(), mode=Mode.Application, version=6))