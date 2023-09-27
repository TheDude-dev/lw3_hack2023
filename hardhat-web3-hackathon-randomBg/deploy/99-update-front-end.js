const { frontEndContractsFile, frontEndAbiFile } = require("../helper-hardhat-config")
const fs = require("fs")
const { network } = require("hardhat")

module.exports = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const backgroundFactory = await ethers.getContract("BackgroundFactory")
    fs.writeFileSync(
        frontEndAbiFile,
        backgroundFactory.interface.format(ethers.utils.FormatTypes.json),
    )
}

async function updateContractAddresses() {
    const backgroundFactory = await ethers.getContract("BackgroundFactory")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (network.config.chainId.toString() in contractAddresses) {
        if (
            !contractAddresses[network.config.chainId.toString()].includes(
                backgroundFactory.address,
            )
        ) {
            contractAddresses[network.config.chainId.toString()].push(backgroundFactory.address)
        }
    } else {
        contractAddresses[network.config.chainId.toString()] = [backgroundFactory.address]
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}
module.exports.tags = ["all", "frontend"]
