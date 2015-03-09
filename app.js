/*
 Open Automation Center for Intel Edison and Beaglebone Black

 Copyright (c) 2015 Vaidotas Gudaitis http://openautomation.center

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.

 */


// Main parameters - can be set from command shell
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var programVersion = '0.0.2';
var notokenMode = false;                    // disable HOTP authentication
var debugMode = false;                      // enable debug mode
var saveSensorsToDisk = false;              // enable persistent sensors datastore with automatic loading
var checkSensorsActivityInterval = 120000;  // set sensors activity check on serial port, if no data received in time
                                            // interval - application process killed
var isEdison = true;                        // set platform type to Intel Edison



// Initial Configuration for first Sart-Up
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var oaSetup = {
    id: 'OpenAutomation.center', //do not change this!
    //Change these values for your needs:
    //Full documentation available http://openautomation.center
    sensors: ['T0', 'T1', 'T2', 'T3', 'H0', 'E1', 'P1'], //put your sensors here
    sensorsLabel: ['Vaidas Room', 'Bedroom', 'Kitchen', 'Outdoors', 'Bedroom', 'Energy', 'Power' ], //sensors labels are optional
    sensorsUnit: ['°C', '°C', '°C', '°C', '%', 'kWh', 'W'], //put sensors units here

    //Energy monitoring App
    energyMeterApp: {
        energyMetering: true,  //set false if you do not need energy monitoring functionality
        energyMeters: ['E1'],  //only one Energy Meter supported in this version!

        //Only two sensors - P Power (W) and E Energy (kWh) supported in this version
        energySensor: {
            enabled: true,
            meteringInterval: 130000 //metering interval for energy sensor in ms.
        },
        powerSensor: {               //metering interval for power sensor in ms.
            enabled: true,
            meteringInterval: 23000
        }
    },
    //Premises and rooms configuration section. Up to 3 sensors can be placed in one room
    rooms: [
        {//Room Config start
            label: 'Work studio',           //Room label
            sensors: ['T0', 'E1', 'P1'],    //Sensors placed in this room
            app: 'Comfort-Zone'             //Control application
        },//Room config end
        {
            label: 'Bedroom',
            sensors: ['T1','H0'],
            app: 'Comfort-Zone'
        },
        {
            label: 'Kitchen',
            sensors: ['T2'],
            app: 'CO2'
        },
        {
            label: 'Outdoors',
            sensors: ['T3'],
            app: 'Switch-Box'
        }

    ]

};





// Application Code
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    var program = require('commander');
    var crypto = require('crypto');
    var speakeasy = require('speakeasy');
    var hat = require('hat');
    var os = require('os');
    var SerialPort = require('serialport').SerialPort;
    var path = require('path');
    var url = require('url');
    var sys = require('sys');
    var exec = require('child_process').exec;
    var Datastore = require('nedb');
    var colors = require('colors');
        colors.setTheme({ input: 'grey', verbose: 'cyan', prompt: 'grey', info: 'green', data: 'grey', help: 'cyan',
                            warn: 'yellow', debug: 'blue', error: 'red' });
    var platform = os.platform();
    var kernel = os.release();
    var nodeVersion = process.version;
    var major = nodeVersion.split('.')[0];
        major = major.split('v')[1];
    var minor = nodeVersion.split('.')[1];
    var hardwareType = 'Linux board';



// STEP-00 Check Environment requirements (Only Node v.0.10+ supported)
    if ((major == 0) && (minor < 10)){
        console.log('Error: Please update to the latest version of node! Open Automation Center requires 0.10.x or later');
        process.exit(0);
    }


// STEP-01 Getting Command line parameters
    program
        .version(programVersion)
        .option('-s, --serial [port]', 'set serial port for sensors communications [/dev/ttyMFD1]', '/dev/ttyMFD1')
        .option('-p, --port [port]', 'set TCP port for management interface, Default - 8000', '8000')
        .option('-n, --notoken', 'disable HOTP RFC4226 authentication')
        .option('-S, --savetodisk', 'enable persistent sensors datastore')
        .option('-d, --debug', 'activate Debug mode')
        .parse(process.argv);

    if (program.notoken) notokenMode = true;
    if (program.debug) debugMode = true;
    if (program.savetodisk) saveSensorsToDisk = true;


// STEP-02 Platform check

  if (platform != 'win32') {

    var mraa;
    try {
        mraa = require('mraa');
    }
    catch( e ) {
        if ( e.code === 'MODULE_NOT_FOUND' ) {
            isEdison = false;
        }
    }

    if (isEdison){
      if (mraa.getPlatformType() == 2){
        hardwareType = 'Intel Edison';
        var led = new mraa.Gpio(13);
        led.dir(mraa.DIR_OUT); //tell pin 13 that it should act as an output pin for now
        led.write(1); //turn the LED on
        led.write(0); //turn the LED off
      }
    }

  } else {

    hardwareType = 'Windows PC';

  }


// STEP-03 Configure sensors communication port
    var port = "/dev/ttyMFD1";
    if (program.serial) port = program.serial;
    var oaPort = new SerialPort(port, {
            baudrate: 9600
        }, false);



// CORS middleware
    var allowCrossDomain = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    };

// WEB Server Set-Up
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



// Global variables
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

    var serverID = { id: 'oaConfig', cid: ''};
    var oa = {}; //config store from config.txt
    var hotp = { count: 0, falseCount: 0, tokenCount: 0 }; //crypto store

    var communicationProblem = false;
        setTimeout(function(){
            communicationProblem = true;
    }, 10000);


// uncaughtException handler for Debugging startup
    process.on('uncaughtException', function (err) {
        if (debugMode) {
            console.log('');
            console.log('--------------------- DEBUG WARNING ---------------------'.cyan);
            console.log(err.stack);
            console.log('');
        }
        //process.kill();
        //exec("echo Internal Exception!", puts);
    });
    // process.stdin.resume();
    process.on('SIGINT', function() {
        console.log('');
        console.log('OA > Terminating...'.cyan);
        console.log('OA > For more info please visit https://openautomation.center'.cyan);
        console.log('');
        compactDB(terminateOA);
    });



// STEP-04 Main Program entry point
    console.log(' ');
    console.log('Loading Open Automation...'.cyan);
    handleDataStore(oaListening);





// Functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Run shell command
function runInShell(command) {
    function puts(error, stdout, stderr) {
        sys.puts(stdout)
    }
    exec(command, puts);
}


// String to Hex converter for authentication routine
function stringToHex (tmp) {
    function d2h(d) {
        return d.toString(16);
    }
    var str = '', i = 0, l = tmp.length, c;
    for (; i < l; i += 1) {
        c = tmp.charCodeAt(i);
        str += d2h(c);
    }
    return str;
}


// No sensors data handler to handle Serial port faults
function checkSensorsActivity(){
    if (communicationProblem) {
        console.log("OA > No sensors signal detected. Service terminated. Please restart Open Automation Center".cyan);
        compactDB(terminateOA);
    } else{
        if(debugMode) console.log("OA > sensors communication check completed successfully".cyan);
    }
}


// Save Nedb Datastore to disk - synchronous code
function compactDB(cb){
    dbT.persistence.compactDatafile();
    dbH.persistence.compactDatafile();
    dbC.persistence.compactDatafile();
    dbE.persistence.compactDatafile();
    dbP.persistence.compactDatafile();
    dbCID.persistence.compactDatafile();
    dbOA.persistence.compactDatafile();
    cb();
}


// Terminate Application
function terminateOA(){
    console.log('OA > Terminated.'.cyan);
    //process.kill();
    process.exit(0);
}


// Datastore initialization
function handleDataStore(cb){

    dbOA = new Datastore({ filename: 'settings.txt', autoload: true });
    dbCID = new Datastore({ filename: 'serverID.txt', autoload: true });

    if (saveSensorsToDisk){
        dbH = new Datastore({ filename: 'sensorsH.db', autoload: true });
        dbC = new Datastore({ filename: 'sensorsC.db', autoload: true });
        dbE = new Datastore({ filename: 'sensorsE.db', autoload: true });
        dbP = new Datastore({ filename: 'sensorsP.db', autoload: true });
        dbT = new Datastore({ filename: 'sensorsT.db', autoload: true });
    } else {
        dbH = new Datastore();
        dbC = new Datastore();
        dbE = new Datastore();
        dbP = new Datastore();
        dbT = new Datastore();
    }

    cb();
}


// Update Server configuration in settings.txt
function updateOA(newOA){
    dbOA.update({id: 'OpenAutomation.center'}, newOA, {}, function(err, numReplaced) {
        if (err) {
            console.log('OA > ERROR: settings.txt update failed '.red + err);
        } else {
            console.log('OA > Main Settings updated:'.green + numReplaced);
        }
    });
}


// Initialise Communication with Energy Meters
function requestMetersPeriodically() {

    if (oa.energyMeterApp.energyMetering) {

        if (oa.energyMeterApp.energySensor.enabled) {
            var sensorE = oa.energyMeterApp.energyMeters[0];
            var intervalE = oa.energyMeterApp.energySensor.meteringInterval;
            setInterval(requestSensor.bind(null, sensorE, 'GETE'), intervalE);
        }

        if (oa.energyMeterApp.powerSensor.enabled) {
            var sensorP = oa.energyMeterApp.energyMeters[0];
            var intervalP = oa.energyMeterApp.powerSensor.meteringInterval;
            setInterval(requestSensor.bind(null, sensorP, 'GETP'), intervalP);
        }
    }
}


// Get OA server IP address on LAN
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


// Send commands to Energy Meters and controllers
function requestSensor(sensorID, command){
    var sensorRequest = '\na' + sensorID + command + '\n';
    oaPort.write(sensorRequest, function(err) {
        if(err) {
            console.log('OA > Sensor Request ERROR: '.error + err);
            compactDB(terminateOA);
        }else{
            console.log(colors.cyan('OA > Requesting ' + sensorID + command));
        }
    });
}


// Send commands to Controllers
function controllerCommandSend(command){
    var controllerCommand = '\na' + command + '\n';
    oaPort.write(controllerCommand, function(err) {
        if(err) {
            console.log('OA > broadcasting command ERROR: '.error + err);
            compactDB(terminateOA);
        }else{
            console.log(colors.cyan('OA > broadcasting command: ' + 'a'+command));
        }
    });
}


// Save sensors value and time received to Real time store
function realtimeSensorValueSet(sensorID, sensorValue){
    allSensors[sensorID] = sensorValue;
    allSensorsDates[sensorID] = new Date().toISOString();
    allSensors.date = new Date().toISOString();
}


// Save CO2 sensor value
function getSensorC(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    var configC = {C0 : '', C1 : '', C2 : '',  C3 : '',  C4 : '',  C5 : '',  C6 : '',  C7 : '',  C8 : '',  C9 : ''}; // CO2 sensors DB
    configC[sensorID] = sensorValue;
    configC._id = new Date().toISOString();
    dbC.insert(configC);
    console.log('OA > CO2 Level '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
    cb(sensorID, sensorValue);
}


// Save Temperature sensor value
function getSensorT(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    var configT = {T0 : '', T1 : '', T2 : '',  T3 : '',  T4 : '',  T5 : '',  T6 : '',  T7 : '',  T8 : '',  T9 : ''}; // Temp sensors DB
    configT[sensorID] = sensorValue;
    configT._id = new Date().toISOString();
    dbT.insert(configT);
    //dbT.insert( configT, function (err) { if (err) console.log('OA > ERROR:' + JSON.stringify(err) +' Can\'t write to Temperature Sensors DB'.error); });
    console.log('OA > Temperature '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
    cb(sensorID, sensorValue);
}


// Save Humidity sensor value
function getSensorH(sensorID, sensorLabel, sensorValue, sensorUnit, cb) {
    var configH = {H0 : '', H1 : '', H2 : '',  H3 : '',  H4 : '',  H5 : '',  H6 : '',  H7 : '',  H8 : '',  H9 : ''}; // Humidity sensors DB
    configH[sensorID] = sensorValue;
    configH._id = new Date().toISOString();
    dbH.insert( configH, function (err) { if (err) console.log('OA > ERROR:' + JSON.stringify(err) + ' Can\'t write to Humidity Sensors DB'.error); });
    console.log('OA > Humidity '.warn + sensorID + ' - ' + sensorLabel + ' ' + sensorValue + sensorUnit);
    cb(sensorID, sensorValue);
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
        cb(sensorID, sensorValue);
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
        cb(newID, sensorValue);
    }
}


// Main program
function oaListening() {

    if (saveSensorsToDisk) console.log('OA Datastore loaded'.green);

    // Check Server configuration from settings.txt
    dbCID.findOne({id: 'oaConfig'}, { _id:0}, function(err, existingCID) {
        dbOA.findOne({id: 'OpenAutomation.center'}, { _id:0}, function(err, oaConfig) {

                if (existingCID && oaConfig) {

                    oa = oaConfig;
                    hotp.serverID = existingCID.cid;
                    hotp.secret = stringToHex(hotp.serverID);
                    console.log("OA > Server ID: ".green + hotp.serverID);

                    requestMetersPeriodically();

                    //Periodically check serial port activity
                    setInterval(function(){
                        checkSensorsActivity();
                    }, checkSensorsActivityInterval);

                    // Open Serial port for wireless communication with sensors
                    oaPort.open(function (error) {
                        if (error) {
                            console.log('OA > Error: Failed to open Serial Port: '.error + error);
                            compactDB(terminateOA);
                        } else {
                            console.log("OA > Communication port: ".green + port + "\n");
                            oaPort.on('data', function (data) {

                                communicationProblem = false;
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

                        if (debugMode) console.log("OA Set-UP: New Server Config created: ".cyan + JSON.stringify(oaSetup));

                        dbCID.insert(serverID, function () {
                            console.log("OA Set-UP: New Server ID created: ".cyan + serverID.cid + " Please restart Open Automation Center".cyan);
                            console.log('');
                            process.exit(0);
                        });
                    });

                }

        });
    });
}


//  WEB Service
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Send index.html
app.get('/', function(req, res){
    console.log("OA > www > Main Page created".green);
    res.send('index');
});


// Send HOTP token
app.get('/token', function(req, res){
    hotp.tokenCount += 1;
    hotp.token = hat(bits=16, base=10);
    hotp.id = speakeasy.hotp({key: hotp.secret, counter: hotp.token, encoding: 'hex'});
    hotp.session = crypto.createHash('sha1').update(hotp.id).digest('hex');
    console.warn("OA > www > /token #".green + hotp.tokenCount + ' session:' + hotp.session);
    res.end(JSON.stringify(hotp.token));
});


// Send OA config
app.get('/info/:sID', function(req, res){

    var sessionID = req.params.sID;

    if (notokenMode) { //Disable HOTP authentication
        hotp.session = sessionID = '5874458cf661722a0bc6a922902a09cc9b5233c9';
        console.warn("OA > www > /info TOKEN CHECK DISABLED".cyan);
    }

    if (sessionID.length == 40 && sessionID == hotp.session){

        console.warn("OA > www > /info #".green + hotp.count + ' session:' + hotp.session + ':' + sessionID);
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

        hotp.falseCount +=1;
        console.warn("OA > www > /info failed #".error + hotp.falseCount + ' session: '.error + hotp.session + ':' + sessionID);
        hotp.session = '';

        res.end(JSON.stringify(answer));

    }
});


// Send sensors history data
app.get('/sensor/:sid/:id', function(req, res){

    var sessionID = req.params.sid;
    var sensorID = req.params.id;

    if (notokenMode) { //Disable HOTP authentication
        hotp.session = sessionID = '5874458cf661722a0bc6a922902a09cc9b5233c9';
        console.warn("OA > www > /sensor TOKEN CHECK DISABLED".cyan);
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
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.session);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else  if(sType == 'H') {
            dbH.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Humidity');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.session);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else  if(sType == 'C') {
            dbC.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'CO2 level');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.session);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else if(sType == 'E') {
            dbE.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Energy');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.session);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else  if(sType == 'P') {
            dbP.find({}, function (err, sensors) {
                if (sensors) {
                    var sensorsData = sensorsChart(sensorID, sensors, 'Power');
                    console.warn('OA > www > ' + sensorID + ' sensorChart request #'.green + hotp.count + ' for session:' + hotp.session);
                    res.end(JSON.stringify(sensorsData));
                }
            });

        } else {

            var answer = {};
            answer.status = "ERROR: Sensor not available";

            hotp.session = '';
            hotp.falseCount +=1;

            console.warn('OA > www > ERROR: ' + sensorID + ' sensorChart failed locate sensor! '.error);
            res.end(JSON.stringify(answer));

        }

    } else{

        var answer = {};
        answer.status = "ERROR: Access Denied";
        hotp.session = '';
        hotp.falseCount +=1;

        console.warn('OA > www > ERROR: ' + sensorID + ' sensorChart Access Denied #' + hotp.falseCount + ' for session:' + hotp.session + ':' + sessionID);
        res.end(JSON.stringify(answer));
    }

});


// Getting controll command
app.post('/control/:sid',  function(req, res){

    var sessionID = req.params.sid;

    if (notokenMode) { //Disable HOTP authentication
        hotp.session = sessionID = '5874458cf661722a0bc6a922902a09cc9b5233c9';
        console.warn("OA > www > /control TOKEN CHECK DISABLED".cyan);
    }

    if (sessionID.length == 40 && sessionID == hotp.session) {

        console.warn("OA > www > /control #".green + hotp.count + ' session:' + hotp.session + ':' + sessionID);
        if (!notokenMode) hotp.session = '';
        hotp.count +=1;

        var controllerSettings = req.body;
        var decision = JSON.parse(JSON.stringify(controllerSettings.decision));
        var answer = {};
        answer.status = "welcome";

        if (debugMode) console.warn('OA > /control > decision: '.green + decision);

        if (decision == 'setCommand') {
            if (debugMode) console.log('OA > /control > new command:\n'.green + JSON.stringify(controllerSettings));

            if (!!controllerSettings.command) {

                controllerCommandSend(controllerSettings.command);
                res.send(JSON.stringify(answer));

            } else {

                answer.status = "invalidSettings";
                res.send(JSON.stringify(answer));
                console.log('OA > /control > command set ERROR:'.error + JSON.stringify(controllerSettings));

            }

        } else {

            answer.status = "good day isn\'t?";
            res.send(JSON.stringify(answer));
            console.log('OA > /control > ERROR: BAD Form data!'.error + JSON.stringify(controllerSettings));

        }

    } else {

        var answer = {};
        answer.status = "ERROR: Access Denied";

        hotp.falseCount +=1;
        console.warn("OA > www > /control failed #".error + hotp.falseCount + ' session: '.error + hotp.session + ':' + sessionID);
        hotp.session = '';

        res.end(JSON.stringify(answer));

    }

});


// Compact sensors databases
app.get('/dbreset/:sid', function(req, res){

    var answer = {};
    answer.status = "OK";
    var sessionID = req.params.sid;

    if (notokenMode) { //Disable HOTP authentication
        hotp.session = sessionID = '5874458cf661722a0bc6a922902a09cc9b5233c9';
        console.warn("OA > www > /dbreset TOKEN CHECK DISABLED".cyan);
    }

    if (sessionID.length == 40 && sessionID == hotp.session) {
        hotp.count += 1;
        console.warn("OA > www > /dbreset #".green + hotp.count + ' session:' + hotp.session + ':' + sessionID);
        if (!notokenMode) hotp.session = '';

        var yesterdayStr = new Date((new Date()).valueOf() - 1000 * 60 * 60 * 24).toISOString();
        yesterdayStr = yesterdayStr.substring(0, 10);

        dbT.remove({_id: {$lt: yesterdayStr}}, {multi: true}, function (errT, numRemovedT) {
            dbH.remove({_id: {$lt: yesterdayStr}}, {multi: true}, function (errH, numRemovedH) {
                dbC.remove({_id: {$lt: yesterdayStr}}, {multi: true}, function (errC, numRemovedC) {
                    dbE.remove({_id: {$lt: yesterdayStr}}, {multi: true}, function (errE, numRemovedE) {
                        dbP.remove({_id: {$lt: yesterdayStr}}, {multi: true}, function (errP, numRemovedP) {

                            dbT.persistence.compactDatafile();
                            dbH.persistence.compactDatafile();
                            dbC.persistence.compactDatafile();
                            dbE.persistence.compactDatafile();
                            dbP.persistence.compactDatafile();

                            console.log("OA > DBT successfully removed " + numRemovedT + ' records from ' + yesterdayStr);
                            console.log("OA > DBH successfully removed " + numRemovedH + ' records from ' + yesterdayStr);
                            console.log("OA > DBC successfully removed " + numRemovedC + ' records from ' + yesterdayStr);
                            console.log("OA > DBE successfully removed " + numRemovedE + ' records from ' + yesterdayStr);
                            console.log("OA > DBP successfully removed " + numRemovedP + ' records from ' + yesterdayStr);

                            res.send(JSON.stringify(answer));

                        });
                    });
                });
            });
        });

    } else {

        answer.status = "ERROR: Access Denied";
        hotp.falseCount +=1;
        console.warn("OA > www > /dbreset failed #".error + hotp.falseCount + ' session: '.error + hotp.session + ':' + sessionID);
        hotp.session = '';
        res.end(JSON.stringify(answer));
    }

});


app.listen(app.get('port'), function(){

    console.log('Open Automation Center v.'.green + programVersion.warn + ' listening on port: '.green + app.get('port'));
    console.log('Running on '.green + platform + ' ' + kernel);
    console.log('Hardware board: '.green + hardwareType);
    console.log('HOTP RFC4226 Authentication: '.green + !notokenMode);
    console.log('Debug Mode: '.green + debugMode);
    console.log('Persistent datastore: '.green + saveSensorsToDisk);
    console.log('IP address on LAN: '.green + getIPAddress() + '\n');

});
