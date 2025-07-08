const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying CertificateFactory contract...");
  
  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy CertificateFactory
  const CertificateFactory = await ethers.getContractFactory("CertificateFactory");
  const factory = await CertificateFactory.deploy();
  
  await factory.deployed();
  
  console.log("CertificateFactory deployed to:", factory.address);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    factoryAddress: factory.address,
    network: network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });