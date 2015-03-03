# openautomation.center

```
 _______                        _______         __                            __    __
|       |.-----..-----..-----. |   _   |.--.--.|  |_ .-----..--------..---.-.|  |_ |__|.-----..-----.
|   -   ||  _  ||  -__||     | |       ||  |  ||   _||  _  ||        ||  _  ||   _||  ||  _  ||     |
|_______||   __||_____||__|__| |___|___||_____||____||_____||__|__|__||___._||____||__||_____||__|__|
         |__|

```

Open Automation server for Intel Edison &amp; Beaglebone Black.
All documentation and tutorials are available here.

## Features

* Simple Home automation center
* Designed for Intel Edison & Beagle Bone Black, but can be easilly installed on any platform
* Touch friendly user Interface based on jQuery Mobile
* Implemented Temperature, Humidity, CO2 and Energy metering
* Up to 9 sensors support in one room
* Simple JSON Configuration
* Pure JavaScript implimentation based on Node.js
* 
* Runs without any database backend - sensors data stored in easilly readable text files
* 100% control - no Cloud services required!
* Strong Security - implemented HOTP RFC4226 token authentication
* Ciseco LLAP protocol compatible
* Easily extendable and customizable platform
* Tested on these browsews IE10+, Firefox 30+, Chrome 40+, Windows Phone, Chrome for Android
* Have some isues on Firefox for Android
* Availabe mobile App on google Play



## Installation

    $ npm install openautomation



## Command line arguents
```
   -h, --help           output usage information
   -V, --version        output the version number
   -s, --serial [port]  Set serial port for Radio communications [/dev/ttyMFD1]
   -p, --port [port]    Set TCP port for management interface, Default - 8000
   -n, --notoken        Disable HOTP RFC4226 authentication
```



## Changelog


## Credits

HTML5 Canvas gauges - https://github.com/Mikhus/canv-gauge

HOTP implementation - https://www.gitorious.org/hotp-js

Icons by Adam Whitcroft - http://adamwhitcroft.com/batch/

Charts - http://www.chartjs.org/

Digital-7 font - http://www.styleseven.com/php/get_product.php?product=Digital-7





## License

MIT License

Copyright (c) 2015 Vaidotas Gudaitis &lt;greituolis@gmail.com&gt;

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
