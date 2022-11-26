var combo   = require('combohandler'),
    express = require('express'),
    exphbs  = require('express3-handlebars'),
    state   = require('express-state'),

    config     = require('./config'),
    helpers    = require('./lib/helpers'),
    middleware = require('./middleware'),
    routes     = require('./routes'),

    app = express();

// -- Configure ----------------------------------------------------------------


app.set('name', 'Marina-Tiago Casamento');
app.set('env', config.env);
app.set('port', config.port);
app.set('views', config.dirs.views);
app.set('view engine', 'hbs');
app.set('state namespace', 'YUI.Env.LE');
app.enable('strict routing');

app.engine('hbs', exphbs({
    defaultLayout: 'main',
    extname      : '.hbs',
    helpers      : helpers,
    layoutsDir   : config.dirs.layouts,
    partialsDir  : config.dirs.partials
}));

// -- Locals -------------------------------------------------------------------

app.expose(config.yui.config, 'window.YUI_config');

app.locals({
    title   : 'Marina & Tiago',
    appTitle: 'M&T Casamento',

    version    : config.version,
    yui_version: config.yui.version,

    nav: [
        {id: 'casamento',   url: '/casamento/',   label: 'Casamento'},
        {id: 'logistica', url: '/logistica/', label: 'Logística'},
        {id: 'lista',  url: '/lista/',  label: 'Lista de Presentes'},
        {id: 'depoimentos',  url: '/depoimentos/',  label: 'Depoimentos'}
    ],

    subnav: {
        logistics: [
            {id: 'logistica', url: '/logistica/',         label: 'Logística'},
            {id: 'hotels',    url: '/logistica/hotels/',  label: 'Hotéis'},
            {id: 'outings',   url: '/logistica/outings/', label: 'Turismo'}
        ]
    },

    yui_module: 'le-main',

    pictos : config.pictos,
    typekit: config.typekit,

    isDevelopment: config.isDevelopment,
    isProduction : config.isProduction,

    min: config.isProduction ? '-min' : ''
});

// -- Middleware ---------------------------------------------------------------

if (config.isDevelopment) {
    app.use(express.logger('tiny'));
}

app.use(express.compress());
app.use(express.favicon(config.dirs.pub + '/favicon.ico'));
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
//app.use(middleware.invitation);
app.use(middleware.pjax('bare'));
app.use(middleware.checkDate);
app.use(app.router);
app.use(middleware.slash());
app.use(express.static(config.dirs.pub));
app.use(middleware.notfound);

if (config.isDevelopment) {
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack     : true
    }));
} else {
    app.use(middleware.error);
}

// -- Routes -------------------------------------------------------------------

app.get('/', routes.render('home'));

app.get('/wedding/', routes.render('casamento'));
app.get('/casamento/', routes.render('casamento'));

app.get('/logistica/',         routes.render('logistica'));
app.get('/logistica/hotels/',  routes.render('logistica/hotels'));
app.get('/logistica/outings/', routes.render('logistica/outings'));
app.get('/logistica/turismo/', routes.render('logistica/outings'));


app.get('/registry/', routes.render('registry'));
app.get('/lista/', routes.render('lista'));
app.get('/depoimentos/', routes.render('depoimentos'));

app.get( '/rsvp/',                       routes.rsvp.pub, routes.rsvp.edit);
app.post('/rsvp/',                       routes.rsvp.resend);
app.get( '/rsvp/brunch/',                routes.rsvp.brunch);
app.post('/rsvp/brunch/',                routes.rsvp.brunch);
app.get( '/rsvp/brunch/:invitation_key', routes.rsvp.login);
app.get( '/rsvp/:invitation_key',        routes.rsvp.login);

app.all( '/invitations/:invitation/*',       middleware.auth.ensureInvitation);
app.get( '/invitations/:invitation/',        routes.invitations.read);
app.put( '/invitations/:invitation/',        routes.invitations.update);
app.get( '/invitations/:invitation/guests',  routes.invitations.readGuests);
app.post('/invitations/:invitation/confirm', routes.invitations.confirm);

app.all('/guests/:guest/', middleware.auth.ensureGuest);
app.get('/guests/:guest/', routes.guests.read);
app.put('/guests/:guest/', routes.guests.update);

app.get('/combo/:version', [
    combo.combine({rootPath: config.dirs.pub}),
    combo.respond
]);

module.exports = app;
