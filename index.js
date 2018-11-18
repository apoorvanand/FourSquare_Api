/*eslint-env node*/
/*jshint esversion: 6 */

'use strict';

const Raven = require('raven');

Raven.config('https://b4491d3c646d4e4c92832ee0de72ec59@sentry.io/1227821').install();
const Rp = require('request-promise');
const Hapi = require('hapi');
const Boom = require('boom');


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
       client_id:id ,
       client_secret:secret,
       v: '20180616' },
            headers:
   { 'Postman-Token': 'cebd56d4-c429-41fa-8793-a2bbf2e57d3c',
       'Cache-Control': 'no-cache' } };
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
            Raven.captureException(err);
            throw Boom.internal('couldnot parse results', err);
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
           client_id:'0ILIV3AK5C4BLBT1ZGXU5CHKESDRIA52BUALLT3DTZPMK2UF' ,
           client_secret:'G5VRPTPVD3B4CHJSRQ0EKNGS5A3240TJHMZ5WAWNMIJEQHXE',
           v: '20180616' },
            headers:
       { 'Postman-Token': 'cebd56d4-c429-41fa-8793-a2bbf2e57d3c',
           'Cache-Control': 'no-cache' } };
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
