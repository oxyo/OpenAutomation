/**
 * Created by Vaidas on 2015.01.20.
 * Open Automation Server for Edison and Beaglebone Black
 */


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Main parameters
//
var notokenMode = false;
var programVersion = '0.0.1';
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initial Configuration Set-Up
//
var oaSetup = {
    id: 'OpenAutomation.center',
    sensors: ['T0', 'T1', 'T2', 'T3', 'H0', 'E1', 'P1'],
    sensorsLabel: ['Vaido kambarys', 'Miegamasis', 'Virtuvė', 'Lauke', 'Miegamasis', 'Energija', 'Galia' ],
    sensorsUnit: ['°C', '°C', '°C', '°C', '%', 'kWh', 'W'],

    energyMeterApp: {
        energyMetering: true,
        energySensors: ['E1'],

        energySensor: {
            enabled: true,
            meteringInterval: 130000
        },
        powerSensor: {
            enabled: true,
            meteringInterval: 23000
        }
    },

    rooms: [
        {
            label: 'Vaido kambarys',
            sensors: ['T0', 'E1', 'P1'],
            app: 'comfortZoneApp'
        },
        {
            label: 'Miegamasis',
            sensors: ['T1','H0'],
            app: 'comfortZoneApp'
        },
        {
            label: 'Virtuvė',
            sensors: ['T2'],
            app: 'comfortZoneApp'
        },
        {
            label: 'Lauke',
            sensors: ['T3'],
            app: 'comfortZoneApp'
        }

    ]

};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Application Code
//

//var SegfaultHandler = require('segfault-handler');
//    SegfaultHandler.registerHandler();
var program = require('commander');
var fecha = require('fecha');
var crypto = require('crypto');
var speakeasy = require('speakeasy');
var hat = require('hat');
var os = require('os');
var logo = require('ascii-art');
var mraa = require('mraa');
var SerialPort = require('serialport').SerialPort;
var path = require('path');
var url = require('url');
var Datastore = require('nedb');
var colors = require('colors');
    colors.setTheme({ input: 'grey', verbose: 'cyan', prompt: 'grey', info: 'green', data: 'grey', help: 'cyan', warn: 'yellow', debug: 'blue', error: 'red' });

var platform = os.platform();
var kernel = os.release();

var nodeVersion = process.version;
var major = nodeVersion.split('.')[0];
major = major.split('v')[1];
var minor = nodeVersion.split('.')[1];
if ((major == 0) && (minor < 10)){
    console.log('Error: Please update to the latest version of node! Open Automation Center requires 0.10.x or later');
    process.exit(0);
}


var led = new mraa.Gpio(13);
led.dir(mraa.DIR_OUT); //tell pin 13 that it should act as an output pin for now
led.write(1); //turn the LED on
led.write(0); //turn the LED off


var sys = require('sys');
var exec = require('child_process').exec;
function puts(error, stdout, stderr) { sys.puts(stdout) }
console.log(' ');
console.log('Loading Open Automation...'.cyan);
//exec('ls -lh *.txt *.db', puts);

//var currentDIR = path.dirname(fs.realpathSync(__filename));
//var dbOA = new Datastore({ filename: path.join(currentDIR, 'settings.txt'), autoload: true });

var dbOA = new Datastore({ filename: 'settings.txt', autoload: true });
var dbCID = new Datastore({ filename: 'serverID.txt', autoload: true });
var dbH = new Datastore({ filename: 'sensorsH.db', autoload: true });
var dbC = new Datastore({ filename: 'sensorsC.db', autoload: true });
var dbE = new Datastore({ filename: 'sensorsE.db', autoload: true });
var dbP = new Datastore({ filename: 'sensorsP.db', autoload: true });
var dbT = new Datastore({ filename: 'sensorsT.db', autoload: true });


process.on('uncaughtException', function (err) {
    console.log('');
    console.log('------------------- Internal Exception Occurred! -----------------------'.error);
    console.log(err);
    console.log('');
    //process.kill();
    //exec("echo Internal Exception!", puts);
});


//process.stdin.resume();
process.on('SIGINT', function() {
    console.log('');
    console.log('OA > Terminating...');
    console.log('OA > For more info please visit https://openautomation.center');
    console.log('OA > Compacting database...'.cyan);

    dbT.persistence.compactDatafile();
    dbH.persistence.compactDatafile();
    dbC.persistence.compactDatafile();
    dbE.persistence.compactDatafile();
    dbP.persistence.compactDatafile();
    dbCID.persistence.compactDatafile();
    dbOA.persistence.compactDatafile();

    setTimeout(function(){
    //setImmediate(function() {
        console.log('OA > Terminated.'.cyan);
        process.kill();
    //});
    }, 2000);
});



// STEP-00 Getting Command line parameters
program
    .version(programVersion)
    .option('-s, --serial [port]', 'Set serial port for Radio communications [/dev/ttyMFD1]', '/dev/ttyMFD1')
    .option('-p, --port [port]', 'Set TCP port for management interface, Default - 8000', '8000')
    .option('-n, --notoken', 'Disable HOTP RFC4226 authentication')
    .parse(process.argv);

if (program.notoken) notokenMode = true;

// STEP-00 Configure Radio communication port
var port = "/dev/ttyMFD1";
if (program.serial) port = program.serial;


var oaPort = new SerialPort(port, {
    baudrate: 9600
}, false);


//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
};

//WEB Server Set-Up
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var favicon = require('serve-favicon');
var compression = require('compression');
var app = express();


if (program.port){
    app.set('port', process.env.PORT || program.port);
} else {
    app.set('port', process.env.PORT || 8000);
}

app.set('x-powered-by', false);
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');

app.use(allowCrossDomain);
app.use(logger('dev'));
var oneDay = 86400000;
app.use(express.static(__dirname + '/public', { maxAge: oneDay }));
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(compression());



var allSensors = { // Sensors values real time store
    T0 : '', T1 : '', T2 : '',  T3 : '',  T4 : '',  T5 : '',  T6 : '',  T7 : '',  T8 : '',  T9 : '', //Temperature C
    H0 : '', H1 : '', H2 : '',  H3 : '',  H4 : '',  H5 : '',  H6 : '',  H7 : '',  H8 : '',  H9 : '', //Humidity %
    C0 : '', C1 : '', C2 : '',  C3 : '',  C4 : '',  C5 : '',  C6 : '',  C7 : '',  C8 : '',  C9 : '', //CO2 ppm
    E0: '', E1: '', E2: '', E3: '',                                                                  //Energy kWh
    P0: '', P1: '', P2: '', P3: ''                                                                   //Power W
};

var allSensorsDates = { // Sensors dates  real time store
    T0 : '', T1 : '', T2 : '',  T3 : '',  T4 : '',  T5 : '',  T6 : '',  T7 : '',  T8 : '',  T9 : '', //Temperature C
    H0 : '', H1 : '', H2 : '',  H3 : '',  H4 : '',  H5 : '',  H6 : '',  H7 : '',  H8 : '',  H9 : '', //Humidity %
    C0 : '', C1 : '', C2 : '',  C3 : '',  C4 : '',  C5 : '',  C6 : '',  C7 : '',  C8 : '',  C9 : '', //CO2 ppm
    E0: '', E1: '', E2: '', E3: '',                                                                  //Energy kWh
    P0: '', P1: '', P2: '', P3: ''                                                                   //Power W
};

var oa = {}; //config store from config.txt
var hotp = { count: 0, falseCount: 0, tokenCount: 0 }; //crypto store

// STEP-00 Getting config from settings.txt
getOA();



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Functions                                                                                                          //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Getting Configuration Settings from settings.txt
function getOA(){
    //setImmediate(function() {
        dbOA.findOne({id: 'OpenAutomation.center'}, {_id: 0}, function (err, oaConfig) {
            if (oaConfig) {
                oa = oaConfig;
                console.log('OA > Config loaded successfully from settings.txt'.green);
            } else {
                console.log('OA > ERROR: Config not loaded from settings.txt'.red);
            }
        });
    //});
}

// Update Configuration in settings.txt
function updateOA(newOA){
    dbOA.update({id: 'OpenAutomation.center'}, newOA, {}, function(err, numReplaced) {
        if (err) {
            console.log('OA > ERROR: settings.txt update failed '.red + err);
        } else {
            console.log('OA > Main Settings updated:'.green + numReplaced);
        }
    });
}


// Configure commands transmiter intervals
function activateTimers() {

    //Initialise Communication with Energy Meters
    if (oa.energyMeterApp.energyMetering) {

        if (oa.energyMeterApp.energySensor.enabled) {
            var sensorE = oa.energyMeterApp.energySensors[0];
            var intervalE = oa.energyMeterApp.energySensor.meteringInterval;
            setInterval(requestSensor.bind(null, sensorE, 'GETE'), intervalE);
        }

        if (oa.energyMeterApp.powerSensor.enabled) {
            var sensorP = oa.energyMeterApp.energySensors[0];
            var intervalP = oa.energyMeterApp.powerSensor.meteringInterval;
            setInterval(requestSensor.bind(null, sensorP, 'GETP'), intervalP);
        }
    }
}


// Get server IP address on LAN
function getIPAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
                return alias.address;
        }
    }
    return '0.0.0.0';
}


// Send commands to Energy Meter
function requestSensor(sensorID, command){

    var sensorRequest = '\na' + sensorID + command + '\n';
    //"\naE1GETE\n"
    oaPort.write(sensorRequest, function(err) {
        if(err) {
            console.log('OA > Sensor Request ERROR: '.error + err);
        }else{
            console.log(colors.green('OA > Requesting ' + sensorID + command));
        }
    });
}


// Save sensors value and time received to Real time store
function realtimeSensorValueSet(sensorID, sensorValue, newID){
    if (sensorID == newID){
        allSensors[sensorID] = sensorValue;
        allSensorsDates[sensorID] = new Date().toISOString();
    } else{
        allSensors[newID] = sensorValue;
        allSensorsDates[sensorID] = new Date().toISOString();
    }
    allSensors.date = new Date().toISOString();
}


// Save CO2 sensor value
function getSensorC(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    var configC = {C0 : '', C1 : '', C2 : '',  C3 : '',  C4 : '',  C5 : '',  C6 : '',  C7 : '',  C8 : '',  C9 : '', C10 : ''}; // CO2 sensors DB
    configC[sensorID] = sensorValue;
    configC._id = new Date().toISOString();
    dbC.insert(configC);
    console.log('OA > CO2 Level '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
    cb(sensorID, sensorValue, sensorID);
}


// Save Temperature sensor value
function getSensorT(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    var configT = {T0 : '', T1 : '', T2 : '',  T3 : '',  T4 : '',  T5 : '',  T6 : '',  T7 : '',  T8 : '',  T9 : '', T10 : ''}; // Temp sensors DB
    configT[sensorID] = sensorValue;
    configT._id = new Date().toISOString();


    dbT.insert(configT);
    //dbT.insert( configT, function (err) { if (err) console.log('OA > ERROR:' + JSON.stringify(err) +' Can\'t write to Temperature Sensors DB'.error); });
    console.log('OA > Temperature '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
    cb(sensorID, sensorValue, sensorID);
}


// Save Humidity sensor value
function getSensorH(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    var configH = {H0 : '', H1 : '', H2 : '',  H3 : '',  H4 : '',  H5 : '',  H6 : '',  H7 : '',  H8 : '',  H9 : '', H10 : ''}; // Humidity sensors DB
    configH[sensorID] = sensorValue;
    configH._id = new Date().toISOString();
    dbH.insert( configH, function (err) { if (err) console.log('OA > ERROR:' + JSON.stringify(err) + ' Can\'t write to Humidity Sensors DB'.error); });
    console.log('OA > Humidity '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
    cb(sensorID, sensorValue, sensorID);
}


// Save Energy sensor value
function getSensorE(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    if (sensorValue*1 > 0) {
        var configE = {E0: '', E1: '', E2: '', E3: ''}; // Energy sensors DB
        configE[sensorID] = sensorValue;
        configE._id = new Date().toISOString();
        dbE.insert(configE, function (err) {
            if (err) console.log('OA > ERROR:' + JSON.stringify(err) + ' Can\'t write to Energy DB'.error);
        });
        console.log('OA > Energy consumed '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
        cb(sensorID, sensorValue, sensorID);
    }
}

// Save Power sensor value
function getSensorP(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    if (sensorValue*1 > 0) {
        var configP = {P0: '', P1: '', P2: '', P3: ''}; // Power sensors DB
        var newID = 'P' + sensorID.substring(1, 2);
        configP[newID] = sensorValue;
        configP._id = new Date().toISOString();
        dbP.insert(configP);
        console.log('OA > Power usage '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + 'W');
        cb(sensorID, sensorValue, newID);
    }
}

//set-up server ID
var serverID = { id: 'oaConfig', cid: ''};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// main program start                                                                                                 //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


setTimeout(function() {

    console.log('OA > started listening sensors'.green);

    // Check Server configuration from settings.txt
    dbCID.findOne({id: 'oaConfig'}, { _id:0}, function(err, existingCID) {
        dbOA.findOne({id: 'OpenAutomation.center'}, { _id:0}, function(err, oaConfig) {

                if (existingCID && oaConfig) {

                    hotp.serverID = existingCID.cid;
                    hotp.secret = parseInt(hotp.serverID, '36');
                    console.log("OA > Server ID: ".green + hotp.serverID + ' Secret:' + hotp.secret);

                    activateTimers();

                    // Open Serial port for wireless communication with sensors
                    oaPort.open(function (error) {
                        if (error) {
                            console.log('OA > Error: Failed to open Serial Port: '.error + error);
                        } else {
                            console.log("OA > Radio Communication port: ".green + port + "\n");
                            oaPort.on('data', function (data) {
                                console.log(colors.green.underline('OA < ' + data));

                                var inStr = data.toString();
                                var inType = inStr.substring(0, 2);
                                var inSensor = inStr.substring(1, 3);
                                var inContent = inStr.substring(3, 5);

                                //console.log('OA > inType: ' + inType + ' inSensor: ' + inSensor + ' inContent: ' + inContent);

                                if (inType == 'aT' && inContent == 'TM') { //Getting temperature sensors responses
                                    for (var i = 0; i < oa.sensors.length; i++) {
                                        if (inSensor == oa.sensors[i]) getSensorT(oa.sensors[i], oa.sensorsLabel[i], inStr.substring(7, 12), oa.sensorsUnit[i], realtimeSensorValueSet);
                                    }
                                }
                                if (inType == 'aH' && inContent == 'CR') { //Getting humidity sensors responses
                                    for (var i = 0; i < oa.sensors.length; i++) {
                                        if (inSensor == oa.sensors[i]) getSensorH(oa.sensors[i], oa.sensorsLabel[i], inStr.substring(7, 12), oa.sensorsUnit[i], realtimeSensorValueSet);
                                    }
                                }
                                if (inType == 'aE' && inContent == 'E:') { // Getting Energy Meters Energy sensor responses
                                    for (var i = 0; i < oa.sensors.length; i++) {
                                        if (inSensor == oa.sensors[i]) getSensorE(oa.sensors[i], oa.sensorsLabel[i], inStr.substring(5, 10), oa.sensorsUnit[i], realtimeSensorValueSet);
                                    }
                                }
                                if (inType == 'aE' && inContent == 'P:') { // Getting Energy Meters Power sensor responses
                                    for (var i = 0; i < oa.sensors.length; i++) {
                                        if (inSensor == oa.sensors[i]) getSensorP(oa.sensors[i], oa.sensorsLabel[i], inStr.substring(5, 10), oa.sensorsUnit[i], realtimeSensorValueSet);
                                    }
                                }

                            });
                        }
                    });

                } else {

                    // Creating Sever ID when starting first time
                    serverID.cid = hat(bits=40, base=36);
                    serverID.ver = programVersion;
                    serverID.date = new Date().toISOString();

                    dbOA.insert(oaSetup, function () {

                        console.log("OA Set-UP: New Server Config created: ".cyan + JSON.stringify(oaSetup));

                        dbCID.insert(serverID, function () {
                            console.log("OA Set-UP: New Server ID created: ".cyan + serverID.cid + " Please restart Open Automation Server".cyan);
                            process.exit(0);
                        });
                    });

                }

        });
    });
}, 3000);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  WEB Service part                                                                                                  //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Send index.html
app.get('/', function(req, res){
    console.log("OA > www > Main Page created".green);
    res.send('index');
});



app.get('/db', function(req, res){

    var yesterdayStr = new Date((new Date()).valueOf() - 1000*60*60*24).toISOString();
        yesterdayStr = yesterdayStr.substring(0, 9);

    dbT.remove({ _id: { $lt: '2015-02-22' }}, { multi: true }, function (err, numRemoved) {

        console.log("OA > www > DBT Check" + new Date().toISOString());

        dbT.persistence.compactDatafile();

        res.send(JSON.stringify('yesterdayStr'));

    });

});



app.get('/token', function(req, res){
        hotp.tokenCount += 1;
        hotp.token = hat(bits=28, base=10);
        hotp.id = speakeasy.hotp({key: hotp.secret, counter: hotp.token, encoding: 'hex'});
        hotp.session = crypto.createHash('sha1').update(hotp.id).digest('hex');

        console.warn("OA > www > token request #".green + hotp.tokenCount + ' for session:' + hotp.id);
        res.end(JSON.stringify(hotp)); //{token:hotp.token}

});


app.get('/sensor/:sid/:id', function(req, res){

    var sessionID = req.params.sid;
    var sensorID = req.params.id;

    if (notokenMode) { //Disable HOTP authentication
        hotp.session = sessionID = '5874458cf661722a0bc6a922902a09cc9b5233c9';
        console.warn("OA > www > TOKEN CHECK DISABLED".red);
    }

    function sensorsChart(sensorID, sensors, label){

        var sValues = [], sDates = [], rValues = [], rDates = [], fDates = [];
        var count = sensors.length;

        function dateFix(isoDateString){

            return isoDateString.substring(11, 16);
        }


        for (var i = 0; i < count; i++) {

            if(!!sensors[i][sensorID]) {

                if (sensors[i][sensorID].length > 0) {
                    sValues.push(sensors[i][sensorID]);
                    sDates.push(sensors[i]['_id']);
                }
            }
        }

        var sCount = sValues.length;
        var step = Math.floor(sCount/12);
        for (var k = 0; k < sCount; k++) {
            if (step < 3){
                rValues.push(sValues[k]);
                rDates.push(sDates[k]);
                fDates.push(dateFix(sDates[k]));
            } else {
                if (k*step < sCount){
                    rValues.push(sValues[k*step]);
                    rDates.push(sDates[k*step]);
                    fDates.push(dateFix(sDates[k*step]));
                }
            }
        }

        var chartData = {
            labels: fDates,
            datasets: [
                {
                    label: label,
                    data: rValues
                }
            ],
            count: count,
            sCount: sCount,
            step: step,
            sensorID: sensorID
        };

        return chartData;
    }


    if (sensorID.length == 2 && sessionID.length == 40 && sessionID == hotp.session) {

        if (!notokenMode) hotp.session = '';
        hotp.count +=1;

        var sType = sensorID.substring(0, 1);

        if( sType == 'T') {
            dbT.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Temperature');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.id);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else  if(sType == 'H') {
            dbH.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Humidity');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.id);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else  if(sType == 'C') {
            dbC.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'CO2 level');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.id);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else if(sType == 'E') {
            dbE.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Energy');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.id);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else  if(sType == 'P') {
            dbP.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Power');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.id);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else {

            var answer = {};
            answer.status = "ERROR: Sensor not available";

            hotp.session = '';
            hotp.falseCount +=1;

            console.warn('OA > www > ERROR: ' + sensorID + ' sensorChart failed locate sensor #'.error + hotp.count + ' for session:' + hotp.id);
            res.end(JSON.stringify(answer));

        }

    } else{

        var answer = {};
        answer.status = "ERROR: Access Denied";

        hotp.session = '';
        hotp.falseCount +=1;

        console.warn('OA > www > ERROR: ' + sensorID + ' sensorChart Access Denied #'.error + hotp.count + ' for session:' + hotp.id);
        res.end(JSON.stringify(answer));
    }

});



app.get('/info/:sid', function(req, res){

    var sessionID = req.params.sid;

    if (notokenMode) { //Disable HOTP authentication
        hotp.session = sessionID = '5874458cf661722a0bc6a922902a09cc9b5233c9';
        console.warn("OA > www > TOKEN CHECK DISABLED".red);
    }

    if (sessionID.length == 40 && sessionID == hotp.session){

        console.warn("OA > www > info request #".green + hotp.count + ' for session:' + hotp.id);
        if (!notokenMode) hotp.session = '';
        hotp.count +=1;

        var sensorsList = {
            oa: oa,
            allSensors: allSensors,
            allSensorsDates: allSensorsDates
        };

        res.end(JSON.stringify(sensorsList));

    } else {

        var answer = {};
        answer.status = "ERROR: Access Denied";

        hotp.session = '';
        hotp.falseCount +=1;

        console.warn("OA > www > info failed request #".error + hotp.falseCount + ' for session:' + hotp.id);
        res.end(JSON.stringify(answer));

    }
});

// Update settings
app.get('/update-settings', function(req, res) {
    console.warn("OA > www > Update Settings request".warn);

    //appID = req.query.appID;
    //apirequest = req.query.apirequest;

    var answer = {};
    answer.status = "Settings Updated";

    oa.comment = "Kuku123";
    updateOA(oa);

    res.send(JSON.stringify(answer));

});



app.listen(app.get('port'), function(){
    //logo.font('Open Automation', 'chunky', function(rendered){ console.log(logo.style(rendered, 'blue')); });
    console.log("Open Automation Center ".green + programVersion.warn + " listening on port: ".green + app.get('port'));
    console.log('Running on '.green + platform + ' ' + kernel);
    console.log('MRAA Version: '.green + mraa.getVersion());
    console.log('HOTP RFC4226 Authentication: '.green + !notokenMode);
    console.log('IP address on LAN: '.green + getIPAddress() + '\n');
});







