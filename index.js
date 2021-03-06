/*eslint-env node*/
/*jshint esversion: 6 */

'use strict';
var metrics = require('datadog-metrics');
metrics.init({ host: 'myhost', prefix: 'myapp.' });
 
function collectMemoryStats() {
    var memUsage = process.memoryUsage();
    metrics.gauge('memory.rss', memUsage.rss);
    metrics.gauge('memory.heapTotal', memUsage.heapTotal);
    metrics.gauge('memory.heapUsed', memUsage.heapUsed);
};
 
setInterval(collectMemoryStats, 2000);
const tracer = require('dd-trace').init()

const Raven = require('raven');

Raven.config('https://b4491d3c646d4e4c92832ee0de72ec59@sentry.io/1227821').install();
const Rp = require('request-promise');
const Hapi = require('hapi');
const Boom = require('boom');
var StatsD = require('node-dogstatsd').StatsD;
var dogstatsd = new StatsD();
dogstatsd.increment('page.views')


const server = Hapi.server({
    port: 8080,
    host: '0.0.0.0',
    routes: { cors: true }

});

server.route({
    method: 'GET',
    path: '/',
    config: {
        cors: {
            origin: ['*'],
            additionalHeaders: ['cache-control', 'x-requested-with']
        } },
    handler: () => {

        return ('routes are /search/{any place name},routes are /explore/{category}/{any place name} Created by Apoorv Anand');
    }
});
server.route({
    method: 'GET',
    path: '/search/{places}',
    config: {
        cors: {
            origin: ['*'],
            additionalHeaders: ['cache-control', 'x-requested-with']
        }

    },
    handler:async (request) => {
        const options = { method: 'GET',
            url: 'https://api.foursquare.com/v2/venues/search',
            qs:
   { near: `${encodeURIComponent(request.params.places)}`,
       limit:49,
       client_id:'JHG2Y3TXWWET4OWPKYWWI0M1THDNSD3ZK4XBNMR3XCQOZZFY',
       client_secret:'G0SZYBEFF0R2TAFE3Z5XYWOTQIEZAFZ4WOBUYDTYHFJ2U2XA',
       v: '20180616' },
      };
        Rp(options, (error, body) => {
            if (error)  {
                throw Boom.internal('couldnot parse results', error);
            }

            console.log(body);
        });

        try {
            const body = await Rp(options);
            //console.log(body);
            return ({ results:JSON.parse(body) });


        }
        catch (err) {
               throw Boom.internal('couldnot parse results', err);
            Raven.captureException(err);
         }


    }
}  );
server.route({
    method: 'GET',
    path: '/explore/{section}/{places}',
    config: {
        cors: {
            origin: ['*'],
            additionalHeaders: ['cache-control', 'x-requested-with']
        }
    },
    handler:async (request) => {
        const options = { method: 'GET',
            url: 'https://api.foursquare.com/v2/venues/explore',
            qs:
       { near: `${encodeURIComponent(request.params.places)}`,
           section:`${encodeURIComponent(request.params.section)}`,
           limit:50,
           client_id:'JHG2Y3TXWWET4OWPKYWWI0M1THDNSD3ZK4XBNMR3XCQOZZFY' ,
           client_secret:'G0SZYBEFF0R2TAFE3Z5XYWOTQIEZAFZ4WOBUYDTYHFJ2U2XA',
           v: '20180616' },
                        };
        Rp(options, (body) => {
            try {
                console.log(body);
            }
            catch (error) {
                Raven.captureException(error);

                throw Boom.internal('couldnot parse results', error);
            }
        });

        try {
            const body = await Rp(options);
            //console.log(body);
            return ({ results:JSON.parse(body) });


        }
        catch (err) {
            Raven.captureException(err);

            throw Boom.internal('couldnot parse results', err);
        }


    }
}  );

const init = async () => {

    await server.register({
        plugin: require('hapi-pino'),
        options: {
            prettyPrint: true,
            logEvents: ['response']
        }
    });

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
    Raven.captureException(err);
    Boom.internal('Something gone wrong please reload', err);
    console.log(err);
});

init();
