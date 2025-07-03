import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-foundry";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  mocha: {
    timeout: 300_000 // 5 minutes
  }
};

export default config;
