import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre from "hardhat";
import { findEquilibriumPoint } from "../src/utils/FindEquilibriumPoint";
import { EquilibriumCalculator } from "../typechain-types";

  const PRECISION = 10n ** 18n;
  
  describe("EquilibriumCalculator", function () {
    type TestParams = {
        calculator: EquilibriumCalculator,
        priceX?: bigint,
        priceY?: bigint,
        concentrationX?: bigint,
        concentrationY?: bigint,
        fee?: bigint,
        protocolFee?: bigint,
        amountIn?: bigint
        exactIn?: boolean,
        assetZeroIsInput?: boolean
        currentReserve0?: bigint,
        currentReserve1?: bigint,
    }

    type FilledTestParams = {
        calculator: EquilibriumCalculator,
        priceX: bigint,
        priceY: bigint,
        concentrationX: bigint,
        concentrationY: bigint,
        fee: bigint,
        protocolFee: bigint,
        amountIn: bigint
        exactIn: boolean,
        assetZeroIsInput: boolean
        currentReserve0: bigint,
        currentReserve1: bigint
    }

    function initParams(testParams: TestParams): FilledTestParams {
        return {
            calculator: testParams.calculator,
            priceX: testParams.priceX ?? PRECISION,
            priceY: testParams.priceY ?? PRECISION,
            concentrationX: testParams.concentrationX ?? PRECISION,
            concentrationY: testParams.concentrationY ?? PRECISION,
            fee: testParams.fee ?? 0n,
            protocolFee: testParams.protocolFee ?? 0n,
            amountIn: testParams.amountIn ?? PRECISION / 3n,
            exactIn: testParams.exactIn ?? true,
            assetZeroIsInput: testParams.assetZeroIsInput ?? true,
            currentReserve0: testParams.currentReserve0 ?? PRECISION,
            currentReserve1: testParams.currentReserve1 ?? PRECISION
        }
    }

    async function test(
        initialParams: TestParams
    ) {
        const params = initParams(initialParams);
        const eulerParams = {
            vault0: hre.ethers.ZeroAddress,
            vault1: hre.ethers.ZeroAddress,
            eulerAccount: hre.ethers.ZeroAddress,
            equilibriumReserve0: params.currentReserve0,
            equilibriumReserve1: params.currentReserve1,
            priceX: params.priceX,
            priceY: params.priceY,
            concentrationX: params.concentrationX,
            concentrationY: params.concentrationY,
            fee: params.fee,
            protocolFee: params.protocolFee,
            protocolFeeRecipient: hre.ethers.ZeroAddress
        }

        const contractResult = await params.calculator.findEquilibriumPoint(
            eulerParams,
            params.amountIn,
            params.exactIn,
            params.assetZeroIsInput,
            params.currentReserve0,
            params.currentReserve1
        );

        const scriptResult = findEquilibriumPoint(
            params.amountIn,
            params.exactIn,
            params.assetZeroIsInput,
            params.currentReserve0,
            params.currentReserve1,
            params.priceX,
            params.priceY,
            params.concentrationX,
            params.concentrationY
        );

        expect(scriptResult).to.equal(contractResult, "The results of the helper script and the contract do not match");
    }

    async function deployFixture() {
      // Contracts are deployed using the first signer/account by default
      const [owner] = await hre.ethers.getSigners();
  
      const equilibriumCalculatorFactory = await hre.ethers.getContractFactory("EquilibriumCalculator");
      const equilibriumCalculator = await equilibriumCalculatorFactory.deploy();
  
      return { equilibriumCalculator, owner };
    }
  
    describe("findEquilibriumPoint", function () {
      it("Helper script should match actual behavior", async function () {
        const { equilibriumCalculator } = await loadFixture(deployFixture);

        await test({
            calculator: equilibriumCalculator,
        });
      });
    });
  });
  