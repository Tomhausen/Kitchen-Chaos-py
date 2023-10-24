namespace SpriteKind {
    export const icon = SpriteKind.create()
    export const recipe_items = SpriteKind.create()
    export const plate = SpriteKind.create()
    export const belt = SpriteKind.create()
    export const pan = SpriteKind.create()
}

//  add
//  vars
let item_carrying : Sprite = null
let recipe : string[] = []
//  sprites
let cook = sprites.create(assets.image`cook`, SpriteKind.Player)
controller.moveSprite(cook)
let pan = sprites.create(assets.image`pan`, SpriteKind.pan)
//  add
//  setup
scene.centerCameraAt(80, 68)
info.startCountdown(60)
let ingredients = ["meat", "bread", "lettuce", "tomato"]
let prepared_ingredients = ["cooked meat", "bread", "lettuce", "tomato"]
//  add
function setup() {
    let icon: Sprite;
    let belt: Sprite;
    scene.setTileMapLevel(assets.tilemap`kitchen`)
    for (let i = 0; i < ingredients.length; i++) {
        icon = sprites.create(images.getImage(ingredients[i]), SpriteKind.icon)
        sprites.setDataString(icon, "ingredient", ingredients[i])
        tiles.placeOnTile(icon, tiles.getTilesByType(assets.tile`crate`)[i])
    }
    for (let tile of tiles.getTilesByType(assets.tile`conveyor spawn`)) {
        belt = sprites.create(image.create(16, 16), SpriteKind.belt)
        tiles.placeOnTile(belt, tile)
        animation.runImageAnimation(belt, assets.animation`conveyor belt`, 200, true)
    }
    tiles.placeOnRandomTile(pan, assets.tile`counter`)
    //  add
    tiles.setTileAt(pan.tilemapLocation(), assets.tile`corner counter`)
}

//  add
setup()
function create_order() {
    
    recipe = [prepared_ingredients[0], prepared_ingredients[1]]
    //  edit
    if (randint(1, 2) == 1) {
        recipe.push(prepared_ingredients[2])
    }
    
    //  edit
    if (randint(1, 2) == 1) {
        recipe.push(prepared_ingredients[3])
    }
    
    //  edit
    let plate = sprites.create(assets.image`plate`, SpriteKind.plate)
    plate.scale = 1 / 3
    tiles.placeOnRandomTile(plate, assets.tile`counter`)
    display_order()
    //  guided
    sprites.destroyAllSpritesOfKind(SpriteKind.StatusBar)
    let timer_bar = statusbars.create(60, 4, StatusBarKind.Energy)
    timer_bar.left = 5
    timer_bar.y = 20
    timer_bar.max = randint(20, 35)
    timer_bar.value = timer_bar.max
    timer_bar.setColor(7, 1)
}

//  /guided
create_order()
function display_order() {
    let recipe_item: Sprite;
    sprites.destroyAllSpritesOfKind(SpriteKind.recipe_items)
    for (let i = 0; i < recipe.length; i++) {
        recipe_item = sprites.create(images.getImage(recipe[i]), SpriteKind.recipe_items)
        recipe_item.setPosition(i * 16 + 16, 16)
    }
}

// 
function get_new_item(crate: Sprite) {
    
    item_carrying = sprites.create(crate.image, SpriteKind.Food)
    let ingredient = sprites.readDataString(crate, "ingredient")
    sprites.setDataString(item_carrying, "ingredient", ingredient)
    item_carrying.z = 5
    item_carrying.scale = 0.75
}

function add_ingredient() {
    let plate: Sprite;
    
    recipe.removeElement(sprites.readDataString(item_carrying, "ingredient"))
    info.changeScoreBy(100)
    item_carrying.destroy()
    item_carrying = null
    display_order()
    if (recipe.length < 1) {
        plate = sprites.allOfKind(SpriteKind.plate)[0]
        plate.setImage(assets.image`meal`)
        item_carrying = plate
    }
    
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function pick_up() {
    let ingredient: string;
    
    let belt_close = spriteutils.getSpritesWithin(SpriteKind.belt, 24, cook)
    let plates_close = spriteutils.getSpritesWithin(SpriteKind.plate, 24, cook)
    let ingredients_close = spriteutils.getSpritesWithin(SpriteKind.Food, 24, cook)
    let icon_close = spriteutils.getSpritesWithin(SpriteKind.icon, 24, cook)
    if (item_carrying) {
        if (item_carrying.kind() == SpriteKind.plate && belt_close.length > 0) {
            info.changeScoreBy(500)
            item_carrying.destroy()
            create_order()
        } else if (plates_close.length > 0) {
            ingredient = sprites.readDataString(item_carrying, "ingredient")
            if (recipe.indexOf(ingredient) != -1) {
                add_ingredient()
            }
            
        } else {
            item_carrying.z = -1
            item_carrying = null
        }
        
    } else if (ingredients_close.length > 0) {
        item_carrying = ingredients_close[0]
    } else if (icon_close.length > 0) {
        get_new_item(icon_close[0])
    }
    
})
controller.B.onEvent(ControllerButtonEvent.Pressed, function prepare_ingredient() {
    //  add
    
    let pan_close = spriteutils.getSpritesWithin(SpriteKind.pan, 24, cook)
    let ingredient = sprites.readDataString(item_carrying, "ingredient")
    if (pan_close.length > 0 && ingredient == "meat") {
        item_carrying.setImage(assets.image`cooked meat`)
        sprites.setDataString(item_carrying, "ingredient", "cooked meat")
    }
    
})
//  timer.after(randint(8000, 15000), rat_spawn)
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.plate, function rat_steal(rat: Sprite, plate: Sprite) {
    sprites.destroyAllSpritesOfKind(SpriteKind.plate)
    create_order()
    rat.follow(sprites.allOfKind(SpriteKind.belt)[0], 30)
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function catch_rat(player: Sprite, rat: Sprite) {
    rat.destroy()
    info.changeScoreBy(300)
})
statusbars.onZero(StatusBarKind.Energy, function on_zero(status: StatusBarSprite) {
    // 
    info.changeScoreBy(-1000)
    sprites.destroyAllSpritesOfKind(SpriteKind.plate)
    create_order()
})
game.onUpdateInterval(1000, function timer_go_down() {
    // 
    let timer_bar = statusbars.allOfKind(StatusBarKind.Energy)[0]
    timer_bar.value -= 1
    if (timer_bar.value < timer_bar.max / 3) {
        timer_bar.setColor(2, 1)
    } else if (timer_bar.value > timer_bar.max / 3 * 2) {
        timer_bar.setColor(7, 1)
    } else {
        timer_bar.setColor(5, 1)
    }
    
})
game.onUpdate(function tick() {
    if (item_carrying) {
        item_carrying.setPosition(cook.x, cook.y + 6)
        item_carrying.z = 5
    }
    
})
