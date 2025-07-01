// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.27;

import {IEVC} from "ethereum-vault-connector/interfaces/IEthereumVaultConnector.sol";
import {IEVault} from "euler-vault-kit/src/EVault/IEVault.sol";
import {IEulerSwap} from "./interfaces/IEulerSwap.sol";
import {CtxLib} from "./libraries/CtxLib.sol";
import {CurveLib} from "./libraries/CurveLib.sol";

error SwapLimitExceeded();

contract EquilibriumCalculator {
    function findEquilibriumPoint(IEulerSwap.Params memory p, uint256 amount, bool exactIn, bool asset0IsInput, uint112 currentReserve0, uint112 currentReserve1)
        external
        pure
        returns (uint256 output)
    {
        uint256 px = p.priceX;
        uint256 py = p.priceY;
        uint256 x0 = p.equilibriumReserve0;
        uint256 y0 = p.equilibriumReserve1;
        uint256 cx = p.concentrationX;
        uint256 cy = p.concentrationY;

        uint256 xNew;
        uint256 yNew;

        if (exactIn) {
            // exact in
            if (asset0IsInput) {
                // swap X in and Y out
                xNew = currentReserve0 + amount;
                if (xNew <= x0) {
                    // remain on f()
                    yNew = CurveLib.f(xNew, px, py, x0, y0, cx);
                } else {
                    // move to g()
                    yNew = CurveLib.fInverse(xNew, py, px, y0, x0, cy);
                }
                output = currentReserve1 > yNew ? currentReserve1 - yNew : 0;
            } else {
                // swap Y in and X out
                yNew = currentReserve1 + amount;
                if (yNew <= y0) {
                    // remain on g()
                    xNew = CurveLib.f(yNew, py, px, y0, x0, cy);
                } else {
                    // move to f()
                    xNew = CurveLib.fInverse(yNew, px, py, x0, y0, cx);
                }
                output = currentReserve0 > xNew ? currentReserve0 - xNew : 0;
            }
        } else {
            // exact out
            if (asset0IsInput) {
                // swap Y out and X in
                require(currentReserve1 > amount, SwapLimitExceeded());
                yNew = currentReserve1 - amount;
                if (yNew <= y0) {
                    // remain on g()
                    xNew = CurveLib.f(yNew, py, px, y0, x0, cy);
                } else {
                    // move to f()
                    xNew = CurveLib.fInverse(yNew, px, py, x0, y0, cx);
                }
                output = xNew > currentReserve0 ? xNew - currentReserve0 : 0;
            } else {
                // swap X out and Y in
                require(currentReserve0 > amount, SwapLimitExceeded());
                xNew = currentReserve0 - amount;
                if (xNew <= x0) {
                    // remain on f()
                    yNew = CurveLib.f(xNew, px, py, x0, y0, cx);
                } else {
                    // move to g()
                    yNew = CurveLib.fInverse(xNew, py, px, y0, x0, cy);
                }
                output = yNew > currentReserve1 ? yNew - currentReserve1 : 0;
            }
        }
    }
}