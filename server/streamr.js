export const startSubscribing = (streamr, streamId= "0x8ed334e44265a0c89b7739cb66a8f19675a5fc7a/ultrasound.money/fees/burn-categories") => {

    // Add a browser wallet (e.g. Metamask) to check if the address has permission to read the stream
    //const streamr = new StreamrClient({
        //auth: { ethereum: window.ethereum },
        // if you don't want to make your users connect a wallet use this instead:
        // auth: { privateKey: process.env.PRIVATE_KEY },
    //})

    streamr.subscribe(streamId, (message) => {
        console.log(message)
    })
}

