const platform = './assets/platform.png' //https://stackoverflow.com/questions/72230392/script-from-http-127-0-0-15500-assets-platform-png-was-blocked-because-of-a
const hills = './assets/hills.png'
const background = './assets/background.png'
const platformSmallTall = './assets/platformSmallTall.png'
const endFlag = './assets/endFlag.png'

const spriteRunLeft = './assets/spriteRunLeft.png'
const spriteRunRight = './assets/spriteRunRight.png'
const spriteStandLeft = './assets/spriteStandLeft.png'
const spriteStandRight = './assets/spriteStandRight.png'

const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

//launch a subscriber if needed
//https://lw3-streamr.onrender.com/streamr/start-subscribing/0x4be4f472ff58b8aaa999253cfd2474a8b6cae160%2Flw3_game

// http://127.0.0.1:3001/index.html?username=Jean&wallet=0x25D...z4DD
const urlParams = new URL(document.URL).searchParams;
let username = urlParams.get('username');
let wallet = urlParams.get('wallet');
if (username === null)
    username="None"
if (wallet === null)
    wallet="wallet"
canvas.width = 1024
canvas.height = 576

const gravity = 0.5

class Player {
    constructor(){
        this.speed = 10
        this.position = {
            x: 100,
            y: 100
        }
        this.velocity = {
            x:0,
            y:0
        }
        this.width = 66
        this.height = 150
        this.sprites = {
            stand:{
                right:createImage(spriteStandRight),
                left:createImage(spriteStandLeft),
                cropWidth: 177,
                width: 66
            },
            run:{
                right:createImage(spriteRunRight),
                left:createImage(spriteRunLeft),
                cropWidth: 341,
                width: 127.875
            }
        }
        this.currentSprite = this.sprites.stand.right
        this.currentCropWidth = this.sprites.stand.cropWidth
        this.frames = 0
    }

    draw(){
        c.drawImage(
            this.currentSprite,
            this.currentCropWidth * this.frames, // original position in the sprite image
            0,
            this.currentCropWidth,
            400, 
            this.position.x, 
            this.position.y, 
            this.width, 
            this.height)
    }

    update() {
        this.frames++
        
        if (this.frames > 59 && ((this.currentSprite === this.sprites.stand.right) || (this.currentSprite === this.sprites.stand.left )))
            this.frames = 0
        else if (this.frames > 29 && ((this.currentSprite === this.sprites.run.right) || (this.currentSprite === this.sprites.run.left)))
            this.frames = 0
        this.draw()
        this.position.x += this.velocity.x
        this.position.y += this.velocity.y
        if (this.position.y + this.height + this.velocity.y <= canvas.height)
            this.velocity.y += gravity
        //else this.velocity.y = 0 // uncommen if you want the user to stay on floor
    }
}

class Platform {
    constructor({x , y, image}){
        this.position = {
            x,
            y
        }
        
        this.image = image
        this.width = image.width
        this.height = image.height
    }

    draw(){
        c.drawImage(this.image, this.position.x, this.position.y)
    }
}

class GenericObject {
    constructor({x , y, image}){
        this.position = {
            x,
            y
        }
        
        this.image = image
        this.width = image.width
        this.height = image.height
    }

    draw(){
        c.drawImage(this.image, this.position.x, this.position.y)
    }
}

// Initianilization

function displayText(text, x, y, font = '20px Arial', color = '#000', textAlign = 'left') {
    c.font = font;
    c.fillStyle = color;
    c.textAlign = textAlign;
    c.fillText(text, x, y);
}

function createImage(imageSrc) {
    const image = new Image()
    image.src = imageSrc

    return image
}

let platformImage = createImage(platform)
let platformSmallTallImage = createImage(platformSmallTall)
let endOfTheMap = platformImage.width*5+1000

let start
let finalScore = null;
let gameEnded = false;
let sendData = false;

let player = new Player()
let platforms = []
let genericObjects = []
let endFlagElement 

let lastKey
const keys = {
    right:{
        pressed: false
    },
    left:{
        pressed: false
    },
}

let scrollOffset = 0

function calculateScore(start, end=new Date().getTime()) {
    if (!gameEnded) {
        let time = end - start;
        finalScore = Math.floor(time / 1000);
    }
}

function gameOver() {
    gameEnded = true;  // Set the game state to ended

    let gameOverText = 'You won!';
    let finalScoreText = 'Final score: ' + finalScore;

    c.fillStyle = 'blue';
    c.fillRect(0, 0, canvas.width, canvas.height);

    displayText(gameOverText, canvas.width/2, canvas.height/2 - 50, '30px Arial', '#fff', 'center');
    displayText(finalScoreText, canvas.width/2, canvas.height/2, '30px Arial', '#fff', 'center');
}

function showScore(){
    let scoreText = username +'( '+wallet+ ') - Score: ' + finalScore;
    displayText(scoreText, 10, 30);
}

function init(){
    start = new Date().getTime(); 
    gameEnded = false;
    sendData = false;

    player = new Player()
    platforms = [
        new Platform({
            x:platformImage.width*4+400-3+platformImage.width-platformSmallTallImage.width, 
            y:270, 
            image: platformSmallTallImage}),
        new Platform({
            x:-1, 
            y:470, 
            image: platformImage
        }), 
        new Platform({x:platformImage.width-3, y:470, image: platformImage}),
        new Platform({x:platformImage.width*2+150, y:470, image: platformImage}),
        new Platform({x:platformImage.width*3+400, y:470, image: platformImage}),
        new Platform({x:platformImage.width*4+400-3, y:470, image: platformImage}),
        new Platform({x:platformImage.width*5+1000, y:470, image: platformImage})
    ]

    genericObjects = [
        new GenericObject({
            x:-1, 
            y:-1, 
            image: createImage(background)
        }),
        new GenericObject({
            x:-1, 
            y:-1, 
            image: createImage(hills)
        }),
    ]

    endFlagElement = new GenericObject({
        x:endOfTheMap, 
        y:240, 
        image: createImage(endFlag)
    })

    scrollOffset = 0
}
//Animation 
function animate(){

    requestAnimationFrame(animate)
    c.fillStyle = 'white'
    c.fillRect(0, 0, canvas.width, canvas.height)

    genericObjects.forEach(genericObject => {
        genericObject.draw()
    })

    endFlagElement.draw()

    platforms.forEach(platform => {
        platform.draw()
    })
    
    player.update()
    
    if (keys.right.pressed && player.position.x < 400){
        player.velocity.x = player.speed
    } else if ((keys.left.pressed && player.position.x > 100) || keys.left.pressed && scrollOffset === 0 && player.position.x > 0){
        player.velocity.x = -player.speed
    } else {
        player.velocity.x = 0
        if ( keys.right.pressed && scrollOffset < endOfTheMap){
            scrollOffset += player.speed
            endFlagElement.position.x -= player.speed
            platforms.forEach(platform => {
                platform.position.x -= player.speed
            })
            genericObjects.forEach(genericObject => {
                genericObject.position.x -= player.speed * 0.66
            })
        } else if (keys.left.pressed && scrollOffset > 0){
            scrollOffset -= player.speed
            endFlagElement.position.x += player.speed
            platforms.forEach(platform => {
                platform.position.x += player.speed
            })
            genericObjects.forEach(genericObject => {
                genericObject.position.x += player.speed * 0.66
            })
        }
    }

    // platform collision detection
    platforms.forEach(platform => {
        if (player.position.y + player.height <= platform.position.y && player.position.y + player.height + player.velocity.y >= platform.position.y
            && player.position.x + player.width >= platform.position.x && player.position.x + player.width <= platform.position.x + platform.width){ //if player above and descending
            player.velocity.y = 0

        }
    })

    // Sprite switching
    if (keys.right.pressed && lastKey === 'right' && player.currentSprite !== player.sprites.run.right){
        player.frames = 1 //if the animation (15) has less than the current frame(20), we don't want to come to a non-sence frame value (17)
        player.currentSprite = player.sprites.run.right
        player.currentCropWidth = player.sprites.run.cropWidth
        player.width = player.sprites.run.width
    } else if (keys.left.pressed && lastKey === 'left' && player.currentSprite !== player.sprites.run.left){
        player.frames = 1
        player.currentSprite = player.sprites.run.left
        player.currentCropWidth = player.sprites.run.cropWidth
        player.width = player.sprites.run.width
    } else if (!keys.left.pressed && lastKey === 'left' && player.currentSprite !== player.sprites.stand.left){ // if left key is not moe presse but the last key is left
        player.frames = 1
        player.currentSprite = player.sprites.stand.left
        player.currentCropWidth = player.sprites.stand.cropWidth
        player.width = player.sprites.stand.width
    } else if(!keys.right.pressed && lastKey === 'right' && player.currentSprite !== player.sprites.stand.right){
        player.frames = 1
        player.currentSprite = player.sprites.stand.right
        player.currentCropWidth = player.sprites.stand.cropWidth
        player.width = player.sprites.stand.width
    }

    calculateScore(start)

    //Win condition
    if (scrollOffset > endOfTheMap-400){
        gameOver()
        console.log('You win')

        if (!sendData && gameEnded){
            postData({
                username: username,
                score: finalScore,
                wallet: wallet,
                datetime: new Date().getTime()
            });
            sendData = true;
        }

        sleep(2000).then(() => { init(); });
    }

    //Lose condition
    if (player.position.y > canvas.height){
        console.log('You lose')
        init()
    }

    showScore()
}

init()
animate()

// User Control
window.addEventListener('keydown', ({ keyCode }) => {
    switch(keyCode){
        case 65:
            console.log('left')
            keys.left.pressed = true
            lastKey = 'left'
            break
        case 81:
            console.log('left')
            keys.left.pressed = true
            lastKey = 'left'
            break

        case 83:
            console.log('down')
            break
        case 68:
            console.log('right')
            keys.right.pressed = true
            lastKey = 'right'
            break
        case 87:
            console.log('up')
            player.velocity.y -= 15
            break
        case 90:
            console.log('up')
            player.velocity.y -= 15
            break
    }
})

window.addEventListener('keyup', ({ keyCode }) => {
    switch(keyCode){
        case 65:
            console.log('left')
            keys.left.pressed = false
            break
        case 81:
            console.log('left')
            keys.left.pressed = false
            break

        case 83:
            console.log('down')
            break
        case 68:
            console.log('right')
            keys.right.pressed = false
            
            break
        case 87:
            console.log('up')
            //player.velocity.y -= 1
            break
        case 90:
            console.log('up')
            //player.velocity.y -= 1
            break
    }
})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function postData(data) {
    //const url = "http://localhost:3007/streamr/publish/0x4be4f472ff58b8aaa999253cfd2474a8b6cae160%2Flw3_game"; 
    const url = "https://lw3-streamr.onrender.com/streamr/publish/0x4be4f472ff58b8aaa999253cfd2474a8b6cae160%2Flw3_game"

    try {
        const response = await fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-type": "application/json; charset=UTF-8"
            }
        });

        const json = await response.json();
        console.log(json);
        return json;
    } catch (error) {
        console.error("Error posting data:", error);
        throw error;
    }
}

