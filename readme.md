# openautomation.center

Full featured home automation system with wireless control functionality based on Open source hardware. Can be installed on any computer, but specially designed for Intel Edison. Pure JavaScript implimentation based on Node.js.   
[Documentation and tutorials are available here](http://openautomation.center).

### Features 
* Monitoring solution without wires 
* Easy installation and configuration
* 100% in house control - no cloud services required!
* Implemented Temperature, Humidity, CO2, Energy metering applications with all modern house control functions
* Up to 9 sensors support in one room
* Touch friendly user interface based on jQuery Mobile
* Simple JSON configuration
* Runs without any database backend - sensors data stored in easilly readable text files
* Strong security - implemented HOTP RFC4226 token authentication
* Ciseco LLAP protocol compatible


### Installation

    $ npm install openautomation



### Command line arguents
```
   -h, --help           output usage information
   -V, --version        output the version number
   -s, --serial [port]  Set serial port for Radio communications [/dev/ttyMFD1]
   -p, --port [port]    Set TCP port for management interface, Default - 8000
   -n, --notoken        Disable HOTP RFC4226 authentication
```

### How it works

Open Automation system main hardware elements are Wireless Sensors, Controllers and Control Center. For wireless data transfer between devices there are used [Ciseco XRF radio modules](http://shop.ciseco.co.uk/xrf-wireless-rf-radio-uart-serial-data-module-xbee-shaped/).

###### Wireless Sensors
Wireless sensors measure environment values such as temperature, CO2, humidity and sends data to Control Center device over serial radio channel in simple LLAP text message like `aT0TMPA20.21`. This means: `a` - message begin, sensor `T0` sends temperature value `20.21`. 

For this purpose can be used any open hardware - Arduino, Mbed, Espruino, Raspberry Pi, Beaglebone or there provided Arduino compatible boards with Open Automation firmware - [oa-t-sensor](https://github.com/oxyo/oa-t-sensor), [oa-h-sensor](https://github.com/oxyo/oa-h-sensor), [oa-co2-sensor](https://github.com/oxyo/oa-co2-sensor). 

###### End-Point Controller
This [End-Point device](https://github.com/oxyo/oa-controller) gets wireless sensors data and use it for control functions, such as enable relays to control heating, cooling, light, humidity or CO2. It also gets commands from Open Automation Center to set-up control parameters.  

###### Open Automation Center
This device can manage unlimited number of [End-Point Controllers](https://github.com/oxyo/oa-controller) and up to 30 wireless sensors. It runs node.js web server on a small board computer such as Intel Edison, Beagle Bone Black or any other. It can be accessed trough browser or mobile app. This computer should have serial port to communicate with sensors and controllers over wireless radio channel.  
  
  

### How to start
* Get minimum 2 or 3 units [Ciseco XRF wireless RF radio modules](http://shop.ciseco.co.uk/xrf-wireless-rf-radio-uart-serial-data-module-xbee-shaped/) One for sensor, one for controller and one for OA Center.
* Build or get your wireless sensors boards - temperature, humidity and CO2. 
* Connect XRF radio module to your OA Center computer trough [USB-TTL adapter](http://imall.iteadstudio.com/im120525005.html). No adapter required for Intel Edison, BeagleBone or Raspberry Pi.  
* Install Open Automation Center on your computer, best suited for this `Intel Edison`, `BeagleBone Black`, `Raspberry Pi2`.
* Start Open Automation Center


  
  

### Credits

HTML5 Canvas gauges - https://github.com/Mikhus/canv-gauge

HOTP implementation - https://www.gitorious.org/hotp-js

Icons by Adam Whitcroft - http://adamwhitcroft.com/batch/

Charts - http://www.chartjs.org/

Digital-7 font - http://www.styleseven.com/php/get_product.php?product=Digital-7




  
  
### License

MIT License

Copyright (c) 2015 Vaidotas Gudaitis (greituolis@gmail.com)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
