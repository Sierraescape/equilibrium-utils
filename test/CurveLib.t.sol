// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {EulerSwapTestBase, EulerSwap, TestERC20} from "./EulerSwapTestBase.t.sol";
import {CurveLib} from "../src/CurveLib.sol";

contract CurveLibTest is EulerSwapTestBase {
    EulerSwap public eulerSwap;

    function setUp() public virtual override {
        super.setUp();
    }

    function test_fuzzfInverse(uint256 x, uint256 px, uint256 py, uint256 x0, uint256 y0, uint256 cx, uint256 cy)
        public
        pure
    {
        
        // Params
        px = 1e18;
        py = bound(py, 1, 1e36);
        x0 = bound(x0, 1e2, 1e28);
        y0 = bound(y0, 0, 1e28);
        cx = bound(cx, 1, 1e18);
        cy = bound(cy, 1, 1e18);
        console.log("px", px);
        console.log("py", py);
        console.log("x0", x0);
        console.log("y0", y0);
        console.log("cx", cx);
        console.log("cy", cy);

        // Note without -2 in the max bound, f() sometimes fails when x gets too close to centre.
        // Note small x values lead to large y-values, which causes problems for both f() and fInverse(), so we cap it here
        x = bound(x, 1e2 - 3, x0 - 3);

        uint256 y = CurveLib.f(x, px, py, x0, y0, cx);
        console.log("y    ", y);
        uint256 xCalc = CurveLib.fInverse(y, px, py, x0, y0, cx);
        console.log("xCalc", xCalc);
        uint256 yCalc = CurveLib.f(xCalc, px, py, x0, y0, cx);
        uint256 xBin = binarySearch(y, px, py, x0, y0, cx, 1, x0);
        uint256 yBin = CurveLib.f(xBin, px, py, x0, y0, cx);
        console.log("x    ", x);
        console.log("xCalc", xCalc);
        console.log("xBin ", xBin);
        console.log("y    ", y);
        console.log("yCalc", yCalc);
        console.log("yBin ", yBin);

        if (x < type(uint112).max && y < type(uint112).max) {
            assert(CurveLib.verify(xCalc, y, x0, y0, px, py, cx, cy));
            assert(int256(xCalc) - int256(xBin) <= 3 || int256(yCalc) - int256(yBin) <= 3); // suspect this is 2 wei error in fInverse() + 1 wei error in f()
        }
    }

}