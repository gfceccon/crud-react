const request = require('request-promise-native');
const sprintf = require('sprintf-js').sprintf;
const fs = require('fs');


var baseUrl = 'https://yugipedia.com/api.php?action=ask&query=[[Class 1::Official]] '
.concat('[[English name::~%1$s*]]|?Lore|?Passcode|?Card_image|?Card_type')
.concat('|limit=%2$s|offset=%3$s|sort=English name&format=json');
var baseLimit = 2500;

const alphanumeric = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
var locks = { count: 0, length: alphanumeric.length, total: 0, files: {} };

const mapPrintouts = function(printouts, printKey, resultKey) {
    let prints = printouts[printKey];
    let ob = new Object();

    if(typeof prints != "undefined"
    && prints != null
    && prints.length != null
    && prints.length > 0) {
        let print = prints[0];
        printKey = printKey.toLocaleLowerCase().replace(/\ /g, '');
        
        if(typeof print == "undefined"
        || print == null) {
            console.log(sprintf("%1$s printout %2$s empty", resultKey, printKey));
            return ob;
        }

        if(typeof prints[0] == "object"
        && prints[0] != null) {
            if(typeof prints[0].fulltext == "undefined"
            || prints[0].fulltext == null) {
                console.log(sprintf("%1$s fulltext printout %2$s empty", resultKey, printKey));
                return ob;
            }
            print = prints[0].fulltext;
        }

        print = print.replace(/\'/g, "");
        print = print.replace(/\[\[([^\]]*)\|([^\]]*)\]\]/g, "$2");
        print = print.replace(/\[/g, "");
        print = print.replace(/\]/g, "");
        ob[printKey] = print;
    }
    else
        console.log(sprintf("%1$s printout array %2$s empty", resultKey, printKey));
    return ob;
}

const writeCards = function(fileName, cards, first) {
    if(first)
        fs.writeFileSync(fileName, "");
    
    str = "";
    for (let index = 0; index < cards.length; index++) {
        const element = cards[index];
        
        if(!first)
            str = str.concat(",");
        else
            first = false;
        str = str.concat(JSON.stringify(element));
    }

    fs.appendFileSync(fileName, str);
}

const getCard = function(char, limit, offset) {
    let url = sprintf(baseUrl, char, limit, offset).replace(/\ /g, "%20");
    let opt = {
        url: url,
        method: 'GET',
        json: true,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    };
    request(opt)
        .then((body) => {
            let results = body.query.results;
            let data =
                Object.keys(results).map(function(resultKey) {
                    let printouts = results[resultKey].printouts;
                    return Object.assign({'name': resultKey}, Object.keys(printouts).map(function(printKey) {
                        return mapPrintouts(printouts, printKey, resultKey);
                    }).reduce(function(final, current) {
                        return Object.assign(final, current);
                    }));
                });
            last = true;
            if(typeof body['query-continue-offset'] != "undefined"
            && body['query-continue-offset'] != null)
                last = false;
            
            locks.files[char].total = locks.files[char].total + data.length;
            writeCards(char.concat(".json"), data, offset == 0);
            
            if(!last)
                getCard(char, limit, body['query-continue-offset']);
            else
                locks.files[char].completed = true;
        });
}



for (let index = 0; index < alphanumeric.length; index++) {
    let element = alphanumeric[index];
    locks.files[element] = {
        complete: false,
        write: false,
        total: 0
    }
    getCard(element, baseLimit, 0);
}
const fileName = "ygo.json";
var id = setInterval(mergeFiles, 1000);
function mergeFiles() {
    let keys = Object.keys(locks.files);
    for (let index = 0; index < keys.length; index++) {
        const element = locks.files[keys[index]];
        if(element.completed == true && element.write == false) {
            if(locks.count == 0)
                fs.writeFileSync(fileName, "[");
            else
                fs.appendFileSync(fileName, ",");
            
            let data = fs.readFileSync(keys[index].concat(".json"));
            fs.appendFileSync(fileName, data);
            fs.unlinkSync(keys[index].concat(".json"));

            element.write = true;
            locks.count = locks.count + 1;
            locks.total = locks.total + element.total;
            console.log(sprintf("%1$s completed with %2$s cards", keys[index], element.total));
        }
    }
    if(locks.count == locks.length) {
        fs.appendFileSync(fileName, "]");
        console.log(sprintf("All completed with %1$s cards", locks.total));
        clearInterval(id);
    }
}