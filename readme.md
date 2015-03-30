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

For more info how to start please read in [Project Wiki](https://github.com/oxyo/OpenAutomation/wiki/).  
  
  
  
  
 
  
  

### Credits

HTML5 Canvas gauges - https://github.com/Mikhus/canv-gauge

HOTP implementation - https://www.gitorious.org/hotp-js

Icons by Adam Whitcroft - http://adamwhitcroft.com/batch/

Charts - http://www.chartjs.org/

Digital-7 font - http://www.styleseven.com/php/get_product.php?product=Digital-7




  
  
### License

```
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
```
