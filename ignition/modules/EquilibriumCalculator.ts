import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const LockModule = buildModule("LockModule", (m) => {
  const equilibriumCalculator = m.contract("Lock", []);

  return { equilibriumCalculator };
});

export default LockModule;
