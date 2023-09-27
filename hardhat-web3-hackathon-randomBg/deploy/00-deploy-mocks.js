const { network } = require("hardhat")
const { developmentsChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.utils.parseEther("0.25") // 0,25 is the premium, it costs 0,25Link a request
const GAS_PRICE_LINK = 1e9
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentsChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        // deploy a mock vrfCoordinator

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed!")
        log("----------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
