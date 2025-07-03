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
  const MAX_UINT112 = 2n ** 112n - 1n;
  
  describe("EquilibriumCalculator", function () {
    type TestParams = {
        calculator: EquilibriumCalculator,
        priceX?: bigint,
        priceY?: bigint,
        concentrationX?: bigint,
        concentrationY?: bigint,
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
        amountIn: bigint
        exactIn: boolean,
        assetZeroIsInput: boolean
        currentReserve0: bigint,
        currentReserve1: bigint
    }

    function stringifyTestParams(params: FilledTestParams): string {
        return JSON.stringify(params, (key, value) => {
            if (key === 'calculator') {
                return value.address;
            }
            return typeof value === 'bigint' ? value.toString() : value
            }
        );
    }

    function initParams(testParams: TestParams): FilledTestParams {
        return {
            calculator: testParams.calculator,
            priceX: testParams.priceX ?? PRECISION,
            priceY: testParams.priceY ?? PRECISION,
            concentrationX: testParams.concentrationX ?? PRECISION,
            concentrationY: testParams.concentrationY ?? PRECISION,
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
            fee: 0n,
            protocolFee: 0n,
            protocolFeeRecipient: hre.ethers.ZeroAddress
        }

        let contractResult;
        try {
        contractResult = await params.calculator.findEquilibriumPoint(
            eulerParams,
            params.amountIn,
            params.exactIn,
            params.assetZeroIsInput,
            params.currentReserve0,
            params.currentReserve1
        );
        } catch (e: any) {
            contractResult = "FAILED";
        }

        let scriptResult;
        try {
            scriptResult = findEquilibriumPoint(
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
        } catch (e: any) {
            scriptResult = "FAILED";
        }

        const errorMessage = `Params ${stringifyTestParams(params)}\nScript result: ${scriptResult}\nContract result: ${contractResult}\n`;
        expect(typeof scriptResult).to.equal(typeof contractResult, errorMessage);
        expect(scriptResult).to.equal(contractResult, errorMessage);
        return scriptResult;
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

      it("Compares errors correctly", async function () {
        const { equilibriumCalculator } = await loadFixture(deployFixture);

        expect(await test({
            calculator: equilibriumCalculator,
            currentReserve1: 0n,
            exactIn: false,
        })).to.equal("FAILED");
      })

      it("Handles special cases", async function () {
        const { equilibriumCalculator } = await loadFixture(deployFixture);

        await test({
            calculator: equilibriumCalculator,
            currentReserve0: 1n,
            priceX: 0n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: 0n,
            amountIn: hre.ethers.MaxUint256,
        });

        await test({
            calculator: equilibriumCalculator,
            priceX: 0n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: 10n ** 36n,
            amountIn: 1n
        });

        await test({
            calculator: equilibriumCalculator,
            priceX: 0n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: 10n**36n,
            amountIn: 1n,
            currentReserve0: 10n**24n,
            currentReserve1: 0n
        })

        await test({
            calculator: equilibriumCalculator,
            priceX: 0n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: hre.ethers.MaxUint256,
            amountIn: 1n,
            currentReserve0: 1n,
            currentReserve1: 1000n
        })

        await test({
            calculator: equilibriumCalculator,
            priceX: 0n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: hre.ethers.MaxUint256,
            amountIn: 1n,
            currentReserve0: 1000n,
            currentReserve1: 0n
        })

        await test({
            calculator: equilibriumCalculator,
            priceX: hre.ethers.MaxUint256,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: 0n,
            amountIn: 1n,
            currentReserve0: 1000n,
            currentReserve1: MAX_UINT112
        });
      })

      it("Handles more special cases", async function () {
        const { equilibriumCalculator } = await loadFixture(deployFixture);

        await test({
            calculator: equilibriumCalculator,
            priceX: 1n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: 0n,
            amountIn: hre.ethers.MaxUint256,
            currentReserve0: 0n,
            currentReserve1: MAX_UINT112
        });

        await test({
            calculator: equilibriumCalculator,
            priceX: 1n,
            priceY: 0n,
            concentrationX: 0n,
            concentrationY: 0n,
            amountIn: hre.ethers.MaxUint256,
            assetZeroIsInput: false,
            currentReserve0: 1n,
            currentReserve1: 1n
        })

        await test({
            calculator: equilibriumCalculator,
            priceX: 1n,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: hre.ethers.MaxUint256,
            amountIn: 1n,
            exactIn: false,
            currentReserve0: 1n,
            currentReserve1: 1000n
        });

        await test({
            calculator: equilibriumCalculator,
            priceX: hre.ethers.MaxUint256,
            priceY: 1n,
            concentrationX: 0n,
            concentrationY: 0n,
            amountIn: 1n,
            exactIn: false,
            currentReserve0: 1n,
            currentReserve1: MAX_UINT112
        });
    });

      it("Generally matches contract behavior", async function () {
        const { equilibriumCalculator } = await loadFixture(deployFixture);

        const uint112Points = [0n, 1n, 10n ** 3n, 10n ** 24n, MAX_UINT112];
        const uint256Points = [0n, 1n, 10n ** 3n, 10n ** 36n, hre.ethers.MaxUint256];

        // Test a broad range of possibilities for all inputs
        // 2^2 * 4^7 = 65536 combinations
        // Reduce to 10,000 combinations to avoid timeout
        for (let exactIn of [true, false]) {
            for (let assetZeroIsInput of [true, false]) {
                for (let priceX of uint256Points) {
                    for (let priceY of uint256Points) {
                        for (let concentrationX of uint256Points) {
                            for (let concentrationY of uint256Points) {
                                for (let amountIn of uint256Points) {
                                    for (let currentReserve0 of uint112Points) {
                                        for (let currentReserve1 of uint112Points) {
                                            if (Math.random() > 0.16) {
                                                continue;
                                            }
                                            await test({
                                                calculator: equilibriumCalculator,
                                                priceX,
                                                priceY,
                                                concentrationX,
                                                concentrationY,
                                                amountIn,
                                                exactIn,
                                                assetZeroIsInput,
                                                currentReserve0,
                                                currentReserve1
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
      })
    });
  });
  