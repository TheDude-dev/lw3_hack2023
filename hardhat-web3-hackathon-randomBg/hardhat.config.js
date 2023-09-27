require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */

const MAINNET_RPC_URL =
    process.env.MAINNET_RPC_URL ||
    "https://eth-mainnet.g.alchemy.com/v2/VhkXmp-sBj8MzPfMHNWIUivu4XIze-Mw"
const SEPOLIA_RPC_URL =
    process.env.SEPOLIA_RPC_URL ||
    "https://eth-sepolia.g.alchemy.com/v2/pr2wyRUsQ28lhyu8IVlsNPYMBUy3lmez"
const POLYGON_MAINNET_RPC_URL =
    process.env.POLYGON_MAINNET_RPC_URL ||
    "https://polygon-mainnet.g.alchemy.com/v2/aN4nx7XwNqUZj6CHFHwgo9InfUG5h7D8"
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x"

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "MXXDSD8RWMYXJ3GUDMPEDPYM9MIJ1BIMXC"
const COINMARKETCAP_KEY =
    process.env.COINMARKETCAP_API_KEY || "adf076d0-1a23-47bb-8a6d-5b5fbf2988df"
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "FJUIH1RRWUQIBXHZK4J9TRXP2T3286FG6W"
const REPORT_GAS = process.env.REPORT_GAS || false

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        localhost: {
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            chainId: 11155111,
            saveDeployments: true,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
        },
        mainnet: {
            url: MAINNET_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            saveDeployments: true,
            chainId: 1,
        },
        polygon: {
            url: POLYGON_MAINNET_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            saveDeployments: true,
            chainId: 137,
        },
    },
    etherscan: {
        // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
            polygon: POLYGONSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: REPORT_GAS,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    },
    contractSizer: {
        runOnCompile: false,
        only: ["BackgroundFactory"],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
            },
            {
                version: "0.4.24",
            },
        ],
    },
    mocha: {
        timeout: 500000, // 200 seconds max
    },
}
