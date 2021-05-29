const path = require('path')
const sanitize = require("sanitize-filename");
const fs = require('fs')

const {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator.js')
const TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
const {generateNetAreaAssets} = require('./map-exporter/generateAssets.js')
const PrefabLoader = require('./prefab-processor/PrefabLoader.js')
const scrape = require('./scrape.js')
const {parseDomainName, replaceBackslashes,RNG} = require('./helpers.js')
const generateBackgroundForWebsite = require('./background-generator/main.js')
const crypto = require('crypto')
const songs = ["boundless-network.ogg","digital-strider.ogg","global-network.ogg","internet-world.ogg","life-in-the-network.ogg","network-is-spreading.ogg","network-space.ogg"]
let prefabLoader = new PrefabLoader()
let random = new RNG()


async function generate(url,isHomePage = false){
    //URL of website to scrape
    let santizedURL = crypto.createHash('sha256').update(url, 'utf8').digest('hex');
    let domainName = parseDomainName(url)

    if(isHomePage){
        santizedURL = "default"
        domainName = "Net_Square"
    }

    //Paths for temporary files
    let path_output = path.join(".","output")
    let path_temp_output = path.join(path_output,"temp")
    let path_scraped_document = path.join(path_temp_output,"scrape.json")


    //Relative paths for server
    let path_domain_assets = path.join("assets","domain",domainName)

    //Paths for final outputs
    let path_onb_server = path.join(".","onb-server")
    let path_generated_map = path.join(path_onb_server,"areas",`${santizedURL}.tmx`)
    let path_generated_tiles = path.join(path_onb_server,"assets","generated")
    let path_music = path.join("assets","shared","music")
    let path_background_output = path.join(path_onb_server,path_domain_assets)
    let relative_server_music_path = path_music.substring(path_music.indexOf('/') + 1);
    let relative_server_map_path = replaceBackslashes(path_generated_map)
    relative_server_map_path = relative_server_map_path.substring(relative_server_map_path.indexOf('/') + 1);
    fs.mkdirSync(path_background_output, { recursive: true })

    //Check if map already exists
    let map_already_exists = fs.existsSync(path_generated_map)
    if(map_already_exists){
        let result = {
            area_path:relative_server_map_path,
            area_id:santizedURL,
            fresh:false
        }
        return result
    }

    //Properties which will be included in the map.tmx
    let server_domain_asset_path = replaceBackslashes(path_domain_assets)
    let exampleSiteProperties = {
        "Name":domainName,
        "URL":url,
        "Background Animation":`/server/${server_domain_asset_path}/background.animation`,
        "Background Texture":`/server/${server_domain_asset_path}/background.png`,
    }

    exampleSiteProperties["Song"] = `/server/${replaceBackslashes(path.join(relative_server_music_path,songs[random.Integer(0,songs.length-1)]))}`

    let netAreaGenerator = new NetAreaGenerator()
    
    console.log(`scraping ${url}`)
    await scrape(url,path_scraped_document,false,true)

    if(!isHomePage){
        console.log(`generating background animation`)
        await generateBackgroundForWebsite(url,"background",path_background_output)
    }

    console.log(`loading prefabs`)
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')
    let prefabs = prefabLoader.prefabs

    console.log(`loading scraped data`)
    let exampleSiteData = JSON.parse(fs.readFileSync(path_scraped_document))
    LetChildrenKnowAboutTheirParents(exampleSiteData)

    console.log(`generating map...`)
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabs,isHomePage)

    console.log(`generating assets for map and remapping tiles`)
    let generated_tiles = await generateNetAreaAssets(netAreaGenerator,path_generated_tiles)

    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,exampleSiteProperties,generated_tiles)
    let tilesets = await mapExporter.ExportTMX(path_generated_map)

    console.log(`saved generated map as ${path_generated_map}`)


    let result = {
        area_path:relative_server_map_path,
        area_id:santizedURL,
        assets:tilesets,
        fresh:true
    }
    return result
}

function LetChildrenKnowAboutTheirParents(node){
    let children = node?.features?.children
    if(children){
        for(let child of node?.features?.children){
            child.parent = node
            LetChildrenKnowAboutTheirParents(child)
        }
    }
}

module.exports = generate