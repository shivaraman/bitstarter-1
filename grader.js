#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var validateCommandOptions = function(htmlPath, htmlUrl, checksPath) {
	if (htmlPath && htmlUrl) {
		console.log('Only one html file can be specified. Exiting.');
		process.exit(1);
	}
	if (!htmlPath && !htmlUrl) {
		console.log('An html file must be specified. Exiting.');
		process.exit(1);
	}
	if (!checksPath) {
		console.log('A checks file must be specified. Exiting.');
		process.exit(1);
	}
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioHtmlString = function(htmlString) {
    return cheerio.load(htmlString);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkHtmlString = function(htmlString, checksfile) {
    $ = cheerioHtmlString(htmlString);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists))
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists))
		.option('-u, --url <html_file_url>', 'URL to index.html')
        .parse(process.argv);

	validateCommandOptions(program.file, program.url, program.checks);

	if (program.url) {
		//download html file with restler library
		rest.get(program.url).on('complete', function(result) {
			if (result instanceof Error) {
				console.log('The url cannot be reached. Exiting');
				process.exit(1);
			}

			var checkJson = checkHtmlString(result, program.checks);
			var outJson = JSON.stringify(checkJson, null, 4);
			console.log(outJson);
		});

	}
	else if (program.file) {
		var checkJson = checkHtmlFile(program.file, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
	}
}
else {
    exports.checkHtmlFile = checkHtmlFile;
}
