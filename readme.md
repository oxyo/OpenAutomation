# openautomation.center
Open Automation server for Intel Edison &amp; Beaglebone Black.
All documentation and tutorials are awailable here.

## Features

* Wireless Home automation solution
* Designed for Intel Edison & Beagle Bone Black, but can be eassily installed on any computer
* Touch friendly user Interface
* Simple JSON Configuration
* Pure JavaScript implimentation based on Node.js
* Implemented Temperature, Humidity, CO2 and Energy metering
* Runs without any database backend
* 100% control - no Cloud services required!
* Strong Security - implemented HOTP RFC4226 token authentication
* Ciseco LLAP protocol compatible
* Easily extendable and customizable platform



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



## Credits

HTML5 Canvas gauges - https://github.com/Mikhus/canv-gauge

HOTP implementation - https://www.gitorious.org/hotp-js

Icons by Adam Whitcroft - http://adamwhitcroft.com/batch/

Charts - http://www.chartjs.org/





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
