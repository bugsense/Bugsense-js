SC.Bugsense = {
  notify: function(notice) {

    var that    = this;
    this.notice = notice;
    this.status = ( this.notice && this.notice.request && this.notice.request.status ).toString();
    this.errors = ( this.notice && this.notice.request && this.notice.request.errors );
    var res     = this.notice.request || { message: 'Unknown Error' };
    var stack   = ( this.notice.response && this.notice.response.stack );

    // filter out some errors (e.g. 404, 422,…)
    if (this.errorFilters()) {
      return;
    }

    // bugsense parameters (required)
    this.defaults = {
      apiKey: 'FOOBAR', // modify me
      url: 'https://bugsense.appspot.com/api/errors?api_key=' // SSL
      // url: 'http://www.bugsense.com/api/js/errors?api_key=' // NON-SSL
    };

    this.data = {

      // basic data (required)
      application_environment: {
        environment: 'development', // modify me if you like
        // TODO: find a way to detect the mobile device, maybe with WURFL or so…?
        appver: window.navigator.userAgent || 'unknown',
        osver: window.navigator.oscpu || 'unknown'
      },

      // bugsense client
      client: {
        name : 'SC Mobile Bugsense Notifier',
        protocol_version: 1,
        version: '0.1'
      },

      // basics about the exception
      exception: {
        klass: ( that.notice.settings && that.notice.settings.modelType ) || 'Unknown Component',
        message: that.notice.error || res.message,
        backtrace: that.generateBackTrace(stack),
        where:"n/a:0" // can't take this out or the API breaks.
      },

      // details & custom data about the exception including url, request, response,…
      request: (function() {
        var request = {
          // Collecting IPs is illegal in some countries that's why we don't do it, if you'd like to, just remove this ligne
          remote_ip: '0.0.0.0',
          url: window.location.href,
          custom_data: {
            // You can remove & add custom data here from session/localStorage, cookies, geolocation, language, mimetypes,…
            document_referrer    : that.escapeText(document.referrer),
            http_status          : that.escapeText(this.status),
            navigator_user_agent : that.escapeText(navigator.userAgent),
            navigator_platform   : that.escapeText(navigator.platform),
            navigator_vendor     : that.escapeText(navigator.vendor),
            navigator_language   : that.escapeText(navigator.language),
            screen_width         : that.escapeText(screen.width),
            screen_height        : that.escapeText(screen.height),
            response             : that.escapeText(that.notice.request.responseText),
            request              : {}
          }
        };
        if (that.notice.settings) {
          var req = that.notice.settings;
          _.each(req, function(value, key) {
            // whitelist to avoid functions
            if (/boolean|number|string/.test($.type(value))) {
              request.custom_data.request[key] = value;
            }
          });
        }
        // stringify it
        request.custom_data.request = JSON.stringify(request.custom_data.request);
        return request;
      }())

    };

    // all ready? lets make a get request with the data
    if (this.data && this.defaults.url && this.defaults.apiKey) {
      var url = this.defaults.url + this.defaults.apiKey + '&data=' + escape( JSON.stringify(this.data) );
      if ($('#bugsense-iframe')[0]) {
        $('#bugsense-iframe').attr('src', url);
      } else {
        $('body').append('<iframe id="bugsense-iframe" src="' + url + '" width="1" height="1">');
      }
    }
  },
  errorFilters: function() {
    return _.any([
      // not found
      this.status === '404',
      // add whatever you want in here
    ]);
  },
  escapeText: function(text) {
    text = text.toString() || '';
    return text.replace(/&/g, '&#38;')
               .replace(/</g, '&#60;')
               .replace(/>/g, '&#62;')
               .replace(/'/g, '&#39;')
               .replace(/"/g, '&#34;');
  },
  generateBackTrace: function(stack) {
    if (stack) {
      return stack.file + ':' + stack.line;
    }
    try {
      throw new Error();
    } catch (e) {
      if (e.stack) {
        var matcher = /\s+at\s(.+)\s\((.+?):(\d+)(:\d+)?\)/;
        return $.map(e.stack.split("\n").slice(4), _.bind(function(line) {
          var match  = line.match(matcher);
          var method = escapeText(match[1]);
          var file   = escapeText(match[2]);
          var number = match[3];
          return file + ':' + number + 'in' + method;
        }, this)).join("\n");
      } else if (e.sourceURL) {
        // note: this is completely useless, as it just points back at itself but is needed on Safari
        // keeping it around in case they ever end up providing actual stacktraces
        return e.sourceURL + ':' + e.line;
      }
    }
    return 'n/a:0';
  }
};