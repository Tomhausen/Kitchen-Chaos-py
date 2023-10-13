@namespace
class SpriteKind:
    icon = SpriteKind.create()
    recipe_items = SpriteKind.create()
    plate = SpriteKind.create()
    belt = SpriteKind.create()
    pan = SpriteKind.create() # add

# vars
item_carrying: Sprite = None
recipe: List[string] = []

# sprites
cook = sprites.create(assets.image("cook"), SpriteKind.player)
controller.move_sprite(cook)
pan = sprites.create(assets.image("pan"), SpriteKind.pan) # add

# setup
scene.center_camera_at(80, 68)
info.start_countdown(60)
ingredients = ["meat", "bread", "lettuce", "tomato"]
prepared_ingredients = ["cooked meat", "bread", "lettuce", "tomato"] # add

def setup():
    scene.set_tile_map_level(assets.tilemap("kitchen"))
    for i in range(len(ingredients)):
        icon = sprites.create(images.get_image(ingredients[i]), SpriteKind.icon)
        sprites.set_data_string(icon, "ingredient", ingredients[i])
        tiles.place_on_tile(icon, tiles.get_tiles_by_type(assets.tile("crate"))[i])
    for tile in tiles.get_tiles_by_type(assets.tile("conveyor spawn")):
        belt = sprites.create(image.create(16, 16), SpriteKind.belt)
        tiles.place_on_tile(belt, tile)
        animation.run_image_animation(belt, assets.animation("conveyor belt"), 200, True)
    tiles.place_on_random_tile(pan, assets.tile("counter")) # add
    tiles.set_tile_at(pan.tilemap_location(), assets.tile("corner counter")) # add
setup()

def create_order():
    global recipe
    recipe = [prepared_ingredients[0], prepared_ingredients[1]] # edit
    if randint(1, 2) == 1:
        recipe.append(prepared_ingredients[2]) # edit
    if randint(1, 2) == 1:
        recipe.append(prepared_ingredients[3]) # edit
    plate = sprites.create(assets.image("plate"), SpriteKind.plate)
    plate.scale = 1/3
    tiles.place_on_random_tile(plate, assets.tile("counter"))
    display_order()
create_order()

def display_order():
    sprites.destroy_all_sprites_of_kind(SpriteKind.recipe_items)
    for i in range(len(recipe)):
        recipe_item = sprites.create(images.get_image(recipe[i]), SpriteKind.recipe_items)
        recipe_item.set_position((i * 16) + 16, 20)

def get_new_item(crate: Sprite):
    global item_carrying
    item_carrying = sprites.create(crate.image, SpriteKind.food)
    ingredient = sprites.read_data_string(crate, "ingredient")
    sprites.set_data_string(item_carrying, "ingredient", ingredient)
    item_carrying.z = 5
    item_carrying.scale = 0.75

def add_ingredient():
    global item_carrying
    recipe.remove_element(sprites.read_data_string(item_carrying, "ingredient"))
    info.change_score_by(100)
    item_carrying.destroy()
    item_carrying = None
    display_order()
    if len(recipe) < 1:
        plate = sprites.all_of_kind(SpriteKind.plate)[0]
        plate.set_image(assets.image("meal"))
        item_carrying = plate

def pick_up():
    global item_carrying
    belt_close = spriteutils.get_sprites_within(SpriteKind.belt, 24, cook)
    plates_close = spriteutils.get_sprites_within(SpriteKind.plate, 24, cook)
    ingredients_close = spriteutils.get_sprites_within(SpriteKind.food, 24, cook)
    icon_close = spriteutils.get_sprites_within(SpriteKind.icon, 24, cook)
    if item_carrying:
        if item_carrying.kind() == SpriteKind.plate and len(belt_close) > 0:
            info.change_score_by(500)
            item_carrying.destroy()
            create_order()
        elif len(plates_close) > 0:
            ingredient = sprites.read_data_string(item_carrying, "ingredient")
            if recipe.index(ingredient) != -1:
                add_ingredient()
        else:
            item_carrying.z = -1
            item_carrying = None
    else:
        if len(ingredients_close) > 0:
            item_carrying = ingredients_close[0]
        elif len(icon_close) > 0:
            get_new_item(icon_close[0])
controller.A.on_event(ControllerButtonEvent.PRESSED, pick_up)

def prepare_ingredient(): # add
    global item_carrying
    pan_close = spriteutils.get_sprites_within(SpriteKind.pan, 24, cook)
    ingredient = sprites.read_data_string(item_carrying, "ingredient")
    if len(pan_close) > 0 and ingredient == "meat":
        item_carrying.set_image(assets.image("cooked meat"))
        sprites.set_data_string(item_carrying, "ingredient", "cooked meat")
controller.B.on_event(ControllerButtonEvent.PRESSED, prepare_ingredient)

def tick():
    if item_carrying:
        item_carrying.set_position(cook.x, cook.y + 6)
        item_carrying.z = 5
game.on_update(tick)
