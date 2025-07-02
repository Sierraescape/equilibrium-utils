import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre from "hardhat";
import { findEquilibriumPoint } from "../src/utils/FindEquilibriumPoint";

  const PRECISION = 10n ** 18n;
  
  describe("EquilibriumCalculator", function () {
    async function deployFixture() {
      // Contracts are deployed using the first signer/account by default
      const [owner] = await hre.ethers.getSigners();
  
      const equilibriumCalculatorFactory = await hre.ethers.getContractFactory("EquilibriumCalculator");
      const equilibriumCalculator = await equilibriumCalculatorFactory.deploy();
  
      return { equilibriumCalculator, owner };
    }
  
    describe("findEquilibriumPoint", function () {
      it("Helper script should match actual behavior", async function () {
        const { equilibriumCalculator, owner } = await loadFixture(deployFixture);

        const amountIn = 1000n;
        const exactIn = true;
        const assetZeroIsInput = true;
        const currentReserve0 = PRECISION
        const currentReserve1 = PRECISION;

        const priceX = PRECISION
        const priceY = PRECISION;
        const concentrationX = PRECISION;
        const concentrationY = PRECISION;
        const fee = 0n;
        const protocolFee = 0n;

        const testResult = await equilibriumCalculator.findEquilibriumPoint(
            {
                vault0: hre.ethers.ZeroAddress,
                vault1: hre.ethers.ZeroAddress,
                eulerAccount: hre.ethers.ZeroAddress,
                equilibriumReserve0: currentReserve0,
                equilibriumReserve1: currentReserve1,
                priceX,
                priceY,
                concentrationX,
                concentrationY,
                fee,
                protocolFee,
                protocolFeeRecipient: hre.ethers.ZeroAddress
            },
            amountIn,
            exactIn,
            assetZeroIsInput,
            currentReserve0,
            currentReserve1
        );

        const simulated = findEquilibriumPoint(
            amountIn,
            exactIn,
            assetZeroIsInput,
            currentReserve0,
            currentReserve1,
            priceX,
            priceY,
            concentrationX,
            concentrationY
            );

        expect(simulated).to.equal(testResult);
      });
    });
  });
  