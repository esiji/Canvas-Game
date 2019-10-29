const coinSrc = []

let platforms = []
let enemies = []
let coins = []
let arrows = []
let newGame
let player

for(let i=1; i < 11; i++){
    coinSrc.push(`./Images/Gold_${i}.png`)
}

class Sound {
    constructor(src) {
        this.sound =  document.createElement("audio")
        this.sound.src = src
        this.sound.setAttribute("preload", "auto")
        this.sound.setAttribute("controls", "none")
        this.sound.style.display = "none"
    }

    add() {
        document.body.appendChild(this.sound)
    }

    play() {
        this.sound.play()
    }

    stop() {
        this.sound.pause()
    }
}

class Game {
    constructor() {
        this.canvas =  document.getElementById("game")
        this.width = window.screen.width - 100
        this.height = window.screen.height - 200
        this.ctx = null
        this.score = 0
        this.background_img = new Image()
        this.background_img.src = "./Images/Flat Nature Art.png"
        this.start = false
        this.backgroundMusic = new Sound("./Sounds/Background.mp3")
        this.musicOff = true
    }

    startMenu() {
        const ctx = this.ctx
        ctx.drawImage(this.background_img, 0, 0, 1280, 609, 0, 0, this.width, this.height)
        ctx.font = "50px Comic Sans MS"
        ctx.fillStyle = "#000000"
        ctx.textAlign = "center"
        ctx.fillText(`Objectves are simple: Gather maximum amount of coins and don't get killed!`, this.width / 2, this.height / 2 - 200)
        ctx.fillText(`Click anywhere to begin!`, this.width / 2, this.height / 2)
        ctx.fillText(`WASD or arrow keys to move, E to shoot.`, this.width / 2, this.height / 2 + 200)
    }

    initializeGame() {
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.ctx = this.canvas.getContext("2d")
        this.score = 0
        this.canvas.addEventListener("mousedown", e => {
            this.start = true
        })
    }

    clearGameArea() {
        this.ctx.clearRect(0, 0,this.canvas.width, this.canvas.height)
    }

    update() {
        if(this.musicOff) {
            this.backgroundMusic.sound.volume = 0.1
            this.backgroundMusic.sound.loop = true
            this.backgroundMusic.play()
            this.musicOff = false
        }
        const ctx = this.ctx
        ctx.drawImage(this.background_img, 0, 0, 1280, 609, 0, 0, this.width, this.height)
        ctx.font = "20px Comic Sans MS"
        ctx.fillStyle = "#000000"
        ctx.textAlign = "center"
        ctx.fillText(`Coins: ${this.score}/${coins.length}`, this.width - 80, 20)
        ctx.fillText(`Health: ${player.health}`, this.width - 200, 20)
    }
}

class Rectangle{
    constructor(x, y, width, height) {
        this.l = this.ol = x
        this.t = this.ot = y
        this.r = this.or = x + width
        this.b = this.ob = y + height
        this.h = height
        this.w = width
    }

    setBottom(v) {
        this.b = v
        this.t = v - this.h
    }

    setTop(v) {
        this.t = v
        this.b = v + this.h
    }

    setLeft(v) {
        this.l = v
        this.r = v + this.w
    }

    setRight(v) {
        this.r  = v
        this.l = v - this.w
    }
}

class Enemy extends Rectangle {
    constructor(x, y, width, height, game, platform, player) {
        super(x, y, width, height)
        this.game = game
        this.vx = 0
        this.vy = 0
        this.friction = 0.9
        this.gravity = 1
        this.state = "idle"
        this.img = new Image()
        this.src = "./Images/Enemy.png"
        this.img.src = this.src
        this.currentAnimation = 1
        this.animationC = {l: 0, t: 0, w: 51, h: 52}
        this.reverse = false
        this.frame = 0
        this.platform = platform
        this.direction = null
        this.damage = 15
        this.health = 100
        this.player = player
        this.distance = 0
        this.attackRange = 250
        this.bowFrame = 0
        this.shooting = false;
        this.shotD = null
        this.dSound = new Sound("./Sounds/Death.mp3")
    }

    collideWalls(wall) {
        if(this.b < wall.t || this.t > wall.b || this.l > wall.r || this.r < wall.l) {
            return
        }

        if (this.b >= wall.t && this.ob < wall.t) {
            this.setBottom(wall.t - 0.1);
            this.vy = 0
          } else if (this.t <= wall.b && this.ot > wall.b) {
            this.setTop(wall.b + 0.1)
            this.vy = 0
          } else if (this.r >= wall.l && this.or < wall.l) {
            this.setRight(wall.l - 0.1)
            this.vx = 0
          } else if (this.l <= wall.r && this.ol > wall.r) {
            this.setLeft(wall.r + 0.1)
            this.vx = 0
          }
    }

    move() {
        if(Math.random() * 100 < 1 || !this.direction && !this.shooting) {
            this.direction = this.direction === "left" ? "right" : "left"
        }
        if(this.direction === "left" && !this.shooting) {
            if(this.platform.l < this.l) {
                this.vx -= 0.1
                if(this.state !== "moveLeft") {
                    this.state = "moveLeft"
                    this.frame = 0
                    this.currentAnimation = 1
                }
            }

        }else if(this.direction === "right" && !this.shooting){
            if(this.platform.r > this.r) {
                this.vx += 0.1
                if(this.state !== "moveRight") {
                    this.state = "moveRight"
                    this.frame = 0
                    this.currentAnimation = 1
                }
            }

        }
    }

    shootAtPlayer() {
        if(player.b <= this.b && player.b >= this.t){
            this.distance = (player.l + player.w / 2) - (this.l + this.w /2)
            if(this.distance < 0 && this.distance > -this.attackRange){
                // left
                this.direction = "right"
                this.shotD = "left"
                this.shoot("left")
            }else if(this.distance > 0 && this.distance < this.attackRange) {
                //right
                this.direction = "left"
                this.shotD = "right"
                this.shoot("right")
            }

        }
    }

    shoot(option) {
        if(this.bowFrame > 25 && option === "right" && !this.shooting) {
            this.shooting = true
            this.state = "bowRight"
            this.frame = 0
            this.currentAnimation = 1
        }else if(this.bowFrame > 25 && option === "left" && !this.shooting){
            this.shooting = true
            this.state = "bowLeft"
            this.frame = 0
            this.currentAnimation = 1
        }
    }

    changeState() {
        if(!this.keyPressed && this.vx < 0.2 && this.vx > -0.2 && this.state !== "idle" && !this.shooting) {
            this.state = "idle"
            this.frame = 0
            this.currentAnimation = 0
            this.reverse = false
        }
    }

    handleImageChange() {
        if(this.state === "idle"){
            if(this.reverse) {
                if(this.frame < 10) {
                    this.frame++
                }else {
                    if(this.currentAnimation <= 1){
                        this.reverse = false
                    }else {
                        this.currentAnimation -= 1
                    }
                    this.frame = 0
                }
            }else if(!this.reverse) {
                if(this.frame < 10) {
                    this.frame++
                }else {
                    if(this.currentAnimation >= 7){
                        this.reverse = true
                    }else {
                        this.currentAnimation += 1
                    }
                    this.frame = 0
                }
            }
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 141
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 141
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 141
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 141
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 141
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 141
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 141
                    break
        
            }
        }else if(this.state === "moveRight") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 9){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 718
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 718
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 718
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 718
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 718
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 718
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 718
                    break
                case 8:
                    this.animationC.l = 456
                    this.animationC.t = 718
                    break
                case 9:
                    this.animationC.l = 520
                    this.animationC.t = 718
                    break
        
            }
        }else if(this.state === "moveLeft") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 9){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 589
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 589
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 589
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 589
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 589
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 589
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 589
                    break
                case 8:
                    this.animationC.l = 456
                    this.animationC.t = 589
                    break
                case 9:
                    this.animationC.l = 520
                    this.animationC.t = 589
                    break
        
            }
        }else if(this.state === "bowLeft") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 12){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            this.animationC.w = 58
            this.animationC.h = 59
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 0
                    this.animationC.t = 1093
                    break
                case 2:
                    this.animationC.l = 64
                    this.animationC.t = 1093
                    break
                case 3:
                    this.animationC.l = 128
                    this.animationC.t = 1093
                    break
                case 4:
                    this.animationC.l = 192
                    this.animationC.t = 1093
                    break
                case 5:
                    this.animationC.l = 256
                    this.animationC.t = 1093
                    break
                case 6:
                    this.animationC.l = 320
                    this.animationC.t = 1093
                    break
                case 7:
                    this.animationC.l = 384
                    this.animationC.t = 1093
                    break
                case 8:
                    this.animationC.l = 448
                    this.animationC.t = 1093
                    break
                case 9:
                    this.animationC.l = 512
                    this.animationC.t = 1093
                    break
                case 10:
                    this.animationC.l = 576
                    this.animationC.t = 1093
                    break
                case 11:
                    this.animationC.l = 640
                    this.animationC.t = 1093
                    break
                case 12:
                    this.animationC.l = 704
                    this.animationC.t = 1093
                    break
            }
        }else if(this.state === "bowRight") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 12){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            this.animationC.w = 58
            this.animationC.h = 59
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 1221
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 1221
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 1221
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 1221
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 1221
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 1221
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 1221
                    break
                case 8:
                    this.animationC.l = 456
                    this.animationC.t = 1221
                    break
                case 9:
                    this.animationC.l = 520
                    this.animationC.t = 1221
                    break
                case 10:
                    this.animationC.l = 584
                    this.animationC.t = 1221
                    break
                case 11:
                    this.animationC.l = 648
                    this.animationC.t = 1221
                    break
                case 12:
                    this.animationC.l = 712
                    this.animationC.t = 1221
                    break
            }
        }
    }

    update() {
        this.move()
        this.vy += this.gravity
        this.vx *= this.friction
        this.vy *= this.friction

        this.ol = this.l
        this.ot = this.t
        this.or = this.r
        this.ob = this.b

        this.l += this.vx
        this.t += this.vy
        this.r = this.l + this.w
        this.b = this.t + this.h
        this.bowFrame++

        if(this.state === "bowRight" || this.state === "bowLeft"){
            if(this.currentAnimation === 10 && this.bowFrame > 25) {
                let arrow
                if(this.direction === "left"){
                    arrow = new Arrow(this.l - 0.1, this.t + this.h / 2, 20, 10, this.game , this, this.shotD)
                }else if(this.direction === "right") {
                    arrow = new Arrow(this.r + 0.1, this.t + this.h / 2, 20, 10, this.game , this, this.shotD)
                }
                arrow.setImage()
                this.bowFrame = 0
                this.shooting = false
            }
        }

        if(this.b > this.game.height) {
            this.setBottom(this.game.height)
            this.vy = 0
        }
        if(this.l < 0) {
            this.setLeft(0)
            this.vx = 0
        }
        
        if(this.r > this.game.width) {
            this.setRight(this.game.width)
            this.vx = 0
        }
        this.changeState()
        this.handleImageChange()
        const ctx = this.game.ctx
        ctx.drawImage(this.img, this.animationC.l, this.animationC.t, this.animationC.w, this.animationC.h, this.l, this.t, this.w, this.h)
    }
}

class Coin extends Rectangle {
    constructor(x, y, width, height, game) {
        super(x, y, width, height)
        this.img = new Image()
        this.src = coinSrc
        this.game = game
        this.index = 0
        this.frame = 0
        this.sound = new Sound("./Sounds/coin_pickup.wav")
    }

    changeIndex() {
        if(this.frame >= 10) {
            if(this.index < 9){
                this.index++
            }else {
                this.index = 0
            }
            this.frame = 0
            this.img.src = this.src[this.index]
        }else {
            this.frame++
        }
    }

    update() {
        this.changeIndex()
        const ctx = this.game.ctx
        ctx.drawImage(this.img, 0, 0, 563, 564, this.l, this.t, this.w, this.h)
    }
}

class Arrow extends Rectangle {
    constructor(x, y, width, height, game, owner, direction) {
        super(x, y, width, height)
        this.game = game
        this.img = new Image()
        this.src = "./Images/Arrows.png"
        this.imgDetails = {l: 0, t: 0, w: 0, h: 0}
        this.direction = direction
        this.frame = 0
        this.owner = owner
        this.sound = new Sound("./Sounds/pew.mp3")
    }

    setImage() {
        this.img.src = this.src
        if(this.direction === "right") {
            this.imgDetails.l = 8
            this.imgDetails.t = 20
            this.imgDetails.w = 34
            this.imgDetails.h = 10
        }else if(this.direction === "left") {
            this.imgDetails.l = 52
            this.imgDetails.t = 20
            this.imgDetails.w = 34
            this.imgDetails.h = 10
        }
        arrows.push(this)
        this.sound.play()
    }

    move() {
        if(this.frame < 40){
            this.frame++
            if(this.direction === "right") {
                this.setRight(this.r + 6)
            }else if(this.direction === "left") {
                this.setLeft(this.l - 6)
            }
        }else {
            arrows.splice(arrows.indexOf(this), 1)

        }
    }

    hit(target) {
        if(this.l < target.r && this.r > target.l && this.t < target.b && this.b > target.t) {
            if(target !== this.owner) {
                target.health -= this.owner.damage
                arrows.splice(arrows.indexOf(this), 1)
                if(this.target === player && !player.invulnerable){
                    player.invulnerable = true
                    player.invulnerableT = 20
                }else if(this.target === player && player.invulnerable) {
                    player.health += this.owner.damage
                }
            }
    }
    }

    update() {
        this.move()
        let ctx = this.game.ctx
        ctx.drawImage(this.img, this.imgDetails.l, this.imgDetails.t, this.imgDetails.w, this.imgDetails.h, this.l, this.t, this.w, this.h)
    }
}

class Platform extends Rectangle{
    constructor(x, y, width, height, game){
        super(x, y, width, height)
        this.game = game
        this.breakable = false
    }


    update() {
        const ctx = this.game.ctx
        ctx.fillStyle = "#8b4513"
        ctx.fillRect(this.l, this.t, this.w, this.h)
    }
}

class Player extends Rectangle{
    constructor(x, y, width, height, game) {
        super(x, y, width, height)
        this.vx = 0
        this.vy = 0
        this.jumping = true
        this.game = game
        this.friction = 0.9
        this.gravity = 1
        this.health = 100
        this.color = "blue"
        this.state = "idle"
        this.img = new Image()
        this.src = "./Images/Player.png"
        this.img.src = this.src
        this.currentAnimation = 1
        this.animationC = {l: 0, t: 0, w: 51, h: 52}
        this.reverse = false
        this.frame = 0
        this.bowFrame = 0
        this.keyPressed = false
        this.shooting = false
        this.direction = "left"
        this.invulnerable = false
        this.invulnerableT = 20
        this.damage = 25
        this.dSound = new Sound("./Sounds/Death.mp3")
        this.jSound = new Sound("./Sounds/Jump.mp3")
    }
    
    collideWalls(wall) {
        if(this.b < wall.t || this.t > wall.b || this.l > wall.r || this.r < wall.l) {
            return
        }

        if (this.b >= wall.t && this.ob < wall.t) {
            this.setBottom(wall.t - 0.1);
            this.vy = 0
            this.jumping = false
          } else if (this.t <= wall.b && this.ot > wall.b) {
            this.setTop(wall.b + 0.1)
            this.vy = 0
          } else if (this.r >= wall.l && this.or < wall.l) {
            this.setRight(wall.l - 0.1)
            this.vx = 0
          } else if (this.l <= wall.r && this.ol > wall.r) {
            this.setLeft(wall.r + 0.1)
            this.vx = 0
          }
    }

    collideEnemy(enemy) {
        if(this.l < enemy.r && this.r > enemy.l && this.t < enemy.b && this.b > enemy.t) {
            this.collideWalls(enemy)
            if(this.state === "moveRight" || this.state === "idle" && enemy.direction === "left") {
                this.setRight(enemy.l - 25)
            }else if(this.state === "moveLeft" || this.state === "idle" && enemy.direction === "right"){
                this.setLeft(enemy.r + 25)
            }
            if(!this.invulnerable) {
                this.health -= enemy.damage
                this.invulnerable = true
                this.invulnerableT=  20
            }
        }
    }

    takeCoin(coin) {
        if(this.l < coin.r && this.r > coin.l && this.t < coin.b && this.b > coin.t) {
            coin.sound.add()
            coin.sound.play()
            delete coins[coins.indexOf(coin)]
            this.game.score++
        }
    }   

    move(option) {
        if(option === "left" && !this.shooting){  
            this.vx -= 0.5
            if(this.state !== "left") {
                this.state = "left"
                this.frame = 0
                this.currentAnimation = 0
            }
        }else if(option === "right" && !this.shooting){
            this.vx += 0.5
            if(this.state !== "right") {
                this.state = "right"
                this.frame = 0
                this.currentAnimation = 0
            }
        }
    }

    jump() {
        if(!this.jumping && !this.shooting){
            this.jumping = true
            this.jSound.sound.volume = 0.2
            this.jSound.play()
            this.vy -= 20 
        }
    }

    shoot() {
        if(this.bowFrame > 25 && this.direction === "right" && !this.shooting) {
            this.shooting = true
            this.state = "bowRight"
            this.frame = 0
            this.currentAnimation = 1
        }else if(this.bowFrame > 25 && this.direction === "left" && !this.shooting){
            this.shooting = true
            this.state = "bowLeft"
            this.frame = 0
            this.currentAnimation = 1
        }
    }

    changeState() {
        if(!this.keyPressed && this.vx < 0.2 && this.vx > -0.2 && this.state !== "idle" && !this.shooting) {
            this.state = "idle"
            this.frame = 0
            this.currentAnimation = 0
            this.reverse = false
        }
    }

    handleImageChange() {
        if(this.state === "idle"){
            if(this.reverse) {
                if(this.frame < 10) {
                    this.frame++
                }else {
                    if(this.currentAnimation <= 1){
                        this.reverse = false
                    }else {
                        this.currentAnimation -= 1
                    }
                    this.frame = 0
                }
            }else if(!this.reverse) {
                if(this.frame < 10) {
                    this.frame++
                }else {
                    if(this.currentAnimation >= 7){
                        this.reverse = true
                    }else {
                        this.currentAnimation += 1
                    }
                    this.frame = 0
                }
            }
            this.animationC.w = 51
            this.animationC.h = 52
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 141
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 141
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 141
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 141
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 141
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 141
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 141
                    break
        
            }
        }else if(this.state === "right") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 9){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            this.animationC.w = 51
            this.animationC.h = 52
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 718
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 718
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 718
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 718
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 718
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 718
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 718
                    break
                case 8:
                    this.animationC.l = 456
                    this.animationC.t = 718
                    break
                case 9:
                    this.animationC.l = 520
                    this.animationC.t = 718
                    break
        
            }
        }else if(this.state === "left") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 9){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            this.animationC.w = 51
            this.animationC.h = 52
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 589
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 589
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 589
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 589
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 589
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 589
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 589
                    break
                case 8:
                    this.animationC.l = 456
                    this.animationC.t = 589
                    break
                case 9:
                    this.animationC.l = 520
                    this.animationC.t = 589
                    break
        
            }
        }else if(this.state === "bowLeft") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 12){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            this.animationC.w = 58
            this.animationC.h = 59
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 0
                    this.animationC.t = 1093
                    break
                case 2:
                    this.animationC.l = 64
                    this.animationC.t = 1093
                    break
                case 3:
                    this.animationC.l = 128
                    this.animationC.t = 1093
                    break
                case 4:
                    this.animationC.l = 192
                    this.animationC.t = 1093
                    break
                case 5:
                    this.animationC.l = 256
                    this.animationC.t = 1093
                    break
                case 6:
                    this.animationC.l = 320
                    this.animationC.t = 1093
                    break
                case 7:
                    this.animationC.l = 384
                    this.animationC.t = 1093
                    break
                case 8:
                    this.animationC.l = 448
                    this.animationC.t = 1093
                    break
                case 9:
                    this.animationC.l = 512
                    this.animationC.t = 1093
                    break
                case 10:
                    this.animationC.l = 576
                    this.animationC.t = 1093
                    break
                case 11:
                    this.animationC.l = 640
                    this.animationC.t = 1093
                    break
                case 12:
                    this.animationC.l = 704
                    this.animationC.t = 1093
                    break
            }
        }else if(this.state === "bowRight") {
            if(this.frame < 10) {
                this.frame++
            }else {
                if(this.currentAnimation >= 12){
                    this.currentAnimation = 1
                }else {
                    this.currentAnimation += 1
                }
                this.frame = 0
            }
            this.animationC.w = 58
            this.animationC.h = 59
            switch(this.currentAnimation) {
                case 1:
                    this.animationC.l = 8
                    this.animationC.t = 1221
                    break
                case 2:
                    this.animationC.l = 72
                    this.animationC.t = 1221
                    break
                case 3:
                    this.animationC.l = 136
                    this.animationC.t = 1221
                    break
                case 4:
                    this.animationC.l = 200
                    this.animationC.t = 1221
                    break
                case 5:
                    this.animationC.l = 264
                    this.animationC.t = 1221
                    break
                case 6:
                    this.animationC.l = 328
                    this.animationC.t = 1221
                    break
                case 7:
                    this.animationC.l = 392
                    this.animationC.t = 1221
                    break
                case 8:
                    this.animationC.l = 456
                    this.animationC.t = 1221
                    break
                case 9:
                    this.animationC.l = 520
                    this.animationC.t = 1221
                    break
                case 10:
                    this.animationC.l = 584
                    this.animationC.t = 1221
                    break
                case 11:
                    this.animationC.l = 648
                    this.animationC.t = 1221
                    break
                case 12:
                    this.animationC.l = 712
                    this.animationC.t = 1221
                    break
            }
        }
    }

    update() {
        this.vy += this.gravity
        this.vx *= this.friction
        this.vy *= this.friction

        this.ol = this.l
        this.ot = this.t
        this.or = this.r
        this.ob = this.b

        this.l += this.vx
        this.t += this.vy
        this.r = this.l + this.w
        this.b = this.t + this.h

        this.direction = this.state === "left" || this.state === "right" ? this.state : this.direction
        this.bowFrame++

        if(this.b > this.game.height) {
            this.setBottom(this.game.height)
            this.jumping = false
            this.vy = 0
        }
        if(this.l < 0) {
            this.setLeft(0)
            this.vx = 0
        }
        
        if(this.r > this.game.width) {
            this.setRight(this.game.width)
            this.vx = 0
        }
        if(this.t < 0) {
            this.setTop(0)
            this.vy = 0
        }
        if(this.state === "bowRight" || this.state === "bowLeft"){
            if(this.currentAnimation === 10 && this.bowFrame > 25) {
                let arrow
                if(this.direction === "left"){
                    arrow = new Arrow(this.l - 0.1, this.t + this.h / 2, 20, 10, this.game , this, this.direction)
                }else if(this.direction === "right") {
                    arrow = new Arrow(this.r + 0.1, this.t + this.h / 2, 20, 10, this.game , this, this.direction)
                }
                arrow.setImage()
                this.bowFrame = 0
                this.shooting = false
            }
        }
        if(this.invulnerableT > 0){
            this.invulnerableT--
        }
        if(this.invulnerableT < 1) {
            this.invulnerable = false
        }
        this.changeState()
        this.handleImageChange()
        const ctx = this.game.ctx
        ctx.drawImage(this.img, this.animationC.l, this.animationC.t, this.animationC.w, this.animationC.h, this.l, this.t, this.w, this.h)
    }
}

function generatePlatforms() {
    let width 
    let dWidth
    let platform1
    let platform2
    const height = newGame.height
    const ph = player.h + 20
    for(let i=height - ph; i > 0; i -= ph){
        if(i - ph > 0) {
            width = Math.round(Math.random() * newGame.width) - 60
            width = width > 120 ? width : width + 120
            dWidth = newGame.width - width
            platform1 = new Platform(0, i, width- 30, 5, newGame)
            platform2 = new Platform(width + 30, i, dWidth - 30, 5, newGame)
            platforms.push(platform1)
            platforms.push(platform2)
        }
    }
}

function placeCoints() {
    platforms.forEach((platform, i) => {
        let randomNum = Math.round(Math.random() * 2)
        if(platforms.indexOf(platform) % randomNum === 0){
            let coin
            if(platforms.indexOf(platform) % 2 === 0){
                coin = new Coin(Math.round(Math.random() * (platform.w - 10)), platform.t - 25, 20, 20, newGame)
            }else {
                coin = new Coin(Math.round(Math.random() * (platform.w - 10)+ platforms[i - 1].w + 40), platform.t - 25, 20, 20, newGame)
            }
            coins.push(coin)
        }
    })
}

function startNewGame() {
    newGame = new Game()
    newGame.initializeGame()
    player = new Player(0, newGame.height, 30, 50, newGame)
    generatePlatforms()
    placeCoints()
}


function updateGame() {
    if(newGame.score !== coins.length && player.health > 0 && newGame.start) {
        if(enemies.length < 10) {
            let random = Math.floor(Math.random() * platforms.length)
            let randomPlatform = platforms[random]
            if(randomPlatform.w > 80 && enemies.every(enemy => enemy.platform !== randomPlatform)) {
                if(random % 2 === 0) {
                    let enemy = new Enemy(randomPlatform.l + randomPlatform.w / 2, randomPlatform.t - 1, 30, 50, newGame, randomPlatform, player)
                    enemies.push(enemy)
                }else {
                    let enemy = new Enemy(randomPlatform.l + randomPlatform.w / 2 + platforms[random-1].w, randomPlatform.t - 1, 30, 50, newGame, randomPlatform, player)
                    enemies.push(enemy)
                }
            }

        }
        newGame.clearGameArea()
        newGame.update()
        player.update()
        arrows.forEach(arrow => {
            arrow.update()
            enemies.forEach(enemy => {
                arrow.hit(enemy)
            })
            arrow.hit(player)
        })
        enemies.forEach(enemy => {
            if(enemy.health > 0) {
                enemy.update()
                player.collideEnemy(enemy)
                enemy.shootAtPlayer()
            }else{
                enemy.dSound.play()
                enemies.splice(enemies.indexOf(enemy), 1)
            }
        })
        platforms.forEach(platform => {
            platform.update()
            player.collideWalls(platform)
            enemies.forEach(enemy => {
                enemy.collideWalls(platform)
            })
        })
        coins.forEach(coin => {
            coin.update()
            player.takeCoin(coin)
        })
        window.requestAnimationFrame(updateGame)
    }else if(!newGame.start){
        newGame.startMenu()
        window.requestAnimationFrame(updateGame)
    }else {
        player.dSound.play()
        platforms = []
        coins = []
        enemies = []
        startNewGame()
        newGame.start = true
        newGame.musicOff = false
        window.requestAnimationFrame(updateGame)
    }
}

window.addEventListener("keydown", e => {
    if(e.keyCode === 65 || e.keyCode == 37) {
        player.move("left")
        player.keyPressed = true
    }if(e.keyCode === 83 || e.keyCode === 40){
    }if(e.keyCode === 68 || e.keyCode === 39){
        player.move("right")
        player.keyPressed = true
    }if(e.keyCode === 87 || e.keyCode === 38){
        player.jump()
        player.keyPressed = true
    }if(e.keyCode === 69) {
        player.shoot()
    }
})
window.addEventListener("keyup", e => {
    player.keyPressed = false
})

startNewGame()
updateGame()
