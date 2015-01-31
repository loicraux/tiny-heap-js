/* global require */
require([
    'jasmine',
    'jasmine-html',
    'spec/TinyHeapSpec'
    // add new specs here
    ],
function (jasmine) {
    'use strict';

    var jasmineEnv, htmlReporter;
    jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(htmlReporter);
    jasmineEnv.specFilter = function (spec) {
        return htmlReporter.specFilter(spec);
    };

    jasmineEnv.execute();
});
