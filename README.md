# JavaScript BugSense Notifier

A front-end implementation of the BugSense API to track errors.
You can find the license in the LICENSE file at the root of this project.

## Running

We don't recommend you to implement this code as-is because it is designed for our specific needs and relies on top of different frameworks that we use across our site: jQuery, underscore.js, JSON.js, Backbone.js,…
But it is easily adaptable to any other context as described bellow.

## API Structure

The BugSense API is designed in 4 different parts:

- application_environment (describes the environment the script runs in).
- client (defines the client name, protocol,…)
- exception (logs the "Class", message, backtrace,…)
- request (logs the URL and any other custom data (like xhr responses or requests))

You will easily recognize these different parts in our source besides required parameters like api key, bugsense url, etc…

## Calling the notifier

If you use jQuery you are good to go:

    $(document).ajaxError(function(event, xhr, settings, error) {
      SC.Bugsense.notify({
        request: xhr,
        settings: settings,
        error: error
      });
    });

As we use it we stick to the jQuery XHR structure to pass the different objects.

## Tackle limitations

### Class

There are no proper Classes in JS, but this doesn't mean you can't have an equivalent structure.
As we are using Backbone, we extended their model and name them, this permits us to integrate it in the `exception.klass` object of BugSense.

### TraceStack

This is a little more tricky, looking into console.trace might be a good alternative to our code.