class Feature{
    static tilesetGID = null
    static tsxPath = null
    constructor(x,y,z,properties){
        this.x = x;
        this.y = y;
        this.z = z;
        this.x_spawn_offset = 0
        this.y_spawn_offset = 0
        this.width = 64
        this.height = 32
        this.tid = 0
        this.properties = {}
        Object.assign(this.properties,properties)
    }
    get locationString(){
        return `${this.x},${this.y},${this.z}`
    }
    get tilesetGID(){
        return this.constructor.tilesetGID
    }
    get tsxPath(){
        return this.constructor.tsxPath
    }
}

class LinkFeature extends Feature{
    static tsxPath = `../assets/shared/objects/link.tsx`
    static tsxTileCount = 6
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        this.type = "link"
        let newProperties = {
            "link":feature.link || "",
            "text":feature.text || ""
        }
        Object.assign(this.properties,newProperties)
    }
}
class HomeWarpFeature extends Feature{
    static tsxPath = `../assets/shared/objects/home_warp.tsx`
    static tsxTileCount = 5
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        this.type = "Home Warp"
    }
    onExport(tiledTMXExporter,x,y,z){
        //Called by tmx exporter when this feature is exported
        tiledTMXExporter.AddProperty("entryX",x)//+0.5 so that players appear in the middle of the tile
        tiledTMXExporter.AddProperty("entryY",y)
        tiledTMXExporter.AddProperty("entryZ",z)
        tiledTMXExporter.AddProperty("entryDirection",this.properties.Direction)
    }
}

class BackLinkFeature extends HomeWarpFeature{
    static tsxPath = `../assets/shared/objects/back_link.tsx`
    static tsxTileCount = 6
    constructor(x,y,z,feature,properties){
        super(x,y,z,feature,properties)
        this.type = "back_link"
    }
}

class TextFeature extends Feature{
    static tsxPath = `../assets/shared/objects/placeholder_npc.tsx`
    static tsxTileCount = 1
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        this.type = "NPC"
        this.y_spawn_offset = -16
        this.x_spawn_offset = -16
        let newProperties = {
            "default_response":feature.text.toUpperCase(),
        }
        Object.assign(this.properties,newProperties)
    }
}

class ImageFeature extends Feature{
    static tsxPath = `../assets/shared/objects/wall_feature.tsx`
    static tsxTileCount = 1
    constructor(x,y,z,feature,properties){
        super(x,y,z,properties)
        //TODO download the image
        this.type = "image"
        this.height = 64
        let newProperties = {
            "src":feature.link || "",
            "text":feature.text || ""
        }
        Object.assign(this.properties,newProperties)
    }
}

let featureCategories = {
    unplaced:{
        "connections":{
            scrapedName:"children",
            extraRequirements:1,
            className:null
        }
    },
    groundFeatures:{
        "links":{
            scrapedName:"links",
            extraRequirements:0,
            className:LinkFeature
        },
        "home_warps":{
            scrapedName:"home_warps",//Does not exist really
            extraRequirements:0,
            className:HomeWarpFeature
        },
        "back_links":{
            scrapedName:"back_links",//Does not exist really
            extraRequirements:0,
            className:BackLinkFeature
        },
        "text":{
            scrapedName:"text",
            extraRequirements:0,
            className:TextFeature
        }
    },
    wallFeatures:{
        "images":{
            scrapedName:"images",
            extraRequirements:0,
            className:ImageFeature
        }
    }
}

module.exports = {featureCategories,Feature,LinkFeature,TextFeature,ImageFeature,HomeWarpFeature}