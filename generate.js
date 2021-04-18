let path = require('path')
let sanitize = require("sanitize-filename");
let fs = require('fs')

let {NetAreaGenerator} = require('./new-map-generator/NetAreaGenerator.js')
let TiledTMXExporter = require('./map-exporter/TiledTMXExporter.js')
let PrefabLoader = require('./prefab-processor/PrefabLoader.js')
let scrape = require('./scrape.js')
let {parseDomainName, replaceBackslashes} = require('./helpers.js')
let generateBackgroundForWebsite = require('./background-generator/main.js')
let prefabLoader = new PrefabLoader()


async function generate(url){
    //URL of website to scrape
    let santizedURL = sanitize(url)
    let domainName = parseDomainName(url)

    //Paths for temporary files
    let path_output = path.join(".","output")
    let path_temp_output = path.join(path_output,"temp")
    let path_scraped_document = path.join(path_temp_output,"scrape.json")


    //Relative paths for server
    let path_domain_assets = path.join("assets","domain",domainName)

    //Paths for final outputs
    let path_onb_server = path.join(".","onb-server")
    let path_generated_map = path.join(path_onb_server,"areas",`${santizedURL}.tmx`)
    let path_background_output = path.join(path_onb_server,path_domain_assets)
    fs.mkdirSync(path_background_output, { recursive: true })

    //Properties which will be included in the map.tmx
    let server_domain_asset_path = replaceBackslashes(path_domain_assets)
    let exampleSiteProperties = {
        "Name":domainName,
        "Background Animation":`/server/${server_domain_asset_path}/background.animation`,
        "Background Texture":`/server/${server_domain_asset_path}/background.png`,
    }

    let netAreaGenerator = new NetAreaGenerator()
    
    console.log(`scraping ${url}`)
    await scrape(url,path_scraped_document,false,true)

    console.log(`generating background animation`)
    await generateBackgroundForWebsite(url,"background",path_background_output)

    console.log(`loading prefabs`)
    await prefabLoader.LoadPrefabs('./prefab-processor/prefabs')
    let prefabs = prefabLoader.prefabs

    console.log(`loading scraped data`)
    let exampleSiteData = JSON.parse(fs.readFileSync(path_scraped_document))
    LetChildrenKnowAboutTheirParents(exampleSiteData)

    console.log(`generating map...`)
    await netAreaGenerator.generateNetArea(exampleSiteData,prefabs)

    console.log('exporting map TMX...')
    let mapExporter = new TiledTMXExporter(netAreaGenerator,exampleSiteProperties)
    await mapExporter.ExportTMX(path_generated_map)

    console.log(`saved generated map as ${path_generated_map}`)

    let relativeServerMapPath = replaceBackslashes(path_generated_map)
    relativeServerMapPath = relativeServerMapPath.substring(relativeServerMapPath.indexOf('/') + 1);


    let result = {
        area_path:relativeServerMapPath,
        area_id:santizedURL
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