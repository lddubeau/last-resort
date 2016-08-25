Last Resort aims to help your application catch unhandled exceptions and
unhandled rejected promises in the browser.

Platforms Supported
===================

[![Browser Stack](https://www.browserstack.com/images/mail/browserstack-logo-footer.png)](https://www.browserstack.com)

Last Resort is tested using
[BrowserStack](https://www.browserstack.com). BrowserStack provides this service
for free under their program for supporting open-source software.

Last Resort is supported on:

* Desktop: Chrome, Firefox, Edge, IE11, IE10, IE9, Opera, and Safari (on El
Capitan, Yosemite, Mavericks).

* Mobile: iOS 9.3 down to 6. Android 4.4. Presumably later versions of Android
  are also fine, although we've not been able to test them.

We test against the latest versions offered by the vendors of these browsers on
their respective platforms.

Borderline cases:

* The suite runs on IE9 but it does not perform a thorough check of the values
  obtained from the events generated by the browser. There are a few quirks
  there.

If you see a platform you think should be tested but isn't, then chances are
that Browser Stack is not providing support for it, or is not providing stable
support for it. You should inspect the ``karma.conf.js`` file to see platforms
that have been commented out. If you can get these platforms to work, you are
welcome to put in a pull request.

Not supported, and unlikely to be supported, ever:

* Android versions less than 4.4.

* iOS versions less than 6.

**IMPORTANT IMPORTANT IMPORTANT: Last Resort depends on
``<global>.addEventListener("unhandledrejection", ...)`` being supported in your
environment in order to trap unhandled rejections.** If your platform does not
support this, then Last Resort will not be able to trap unhandled
rejections. [This
page](https://developer.mozilla.org/en-US/docs/Web/API/PromiseRejectionEvent)
suggests that only Chrome 49 and over supports it natively. On browsers that do
not support it natively, you must use a promise library that provides support
for ``unhandledrejection``
events. [Bluebird](https://github.com/petkaantonov/bluebird/) is one such
library. It is actually the library used for testing Last Resort's handling of
unhandled rejections.

**Note on using Last Resort in workers**. Last Resort, when used with Bluebird,
is able to trap unhandledrejection in workers. However, it has to use
`self.onunhandledrejection`` rather than ``self.addEventListener``. This is
because a lot of platforms (including **all** Microsoft browsers) do not
actually allow using ``self.addEventListener`` to listen for custom
exceptions. See [this
comment](https://github.com/petkaantonov/bluebird/pull/1213#issuecomment-243168274)
for details.

Loading Last Resort
===================

Last Resort can be loaded in the following ways:

1. In a `script` element. In this case it will be available as `LastResort` on
   the `window` object in which it has been loaded.

2. As an AMD module. It will export the same thing as what `LastResort` contains
   in the scenario above. You may name the module whatever you want, so long as
   you define a path for it in your `paths` configuration.

3. As a CommonJS module. It will export the same as the thing as the earlier
   options.

4. In a `script` element and then as an AMD or CommonJS module. This is not a
   common way to load scripts but Last Resort supports it. When it is loaded by
   `script`, it creates `LastResort` like in the first scenario above. When it
   is then loaded again as a module, it checks whether `LastResort` already
   exists in the global space, and returns *that* if it exists, rather than
   create a new module. If `LastResort` does not exist, then it will initialize
   itself from scratch. Note that, when loaded first through `script` and then
   as a module, `LastResort` will still be present in the global space if it had
   only been loaded through `script`.

Why this 4th method? This is supported in order to allow loading Last Resort as
early as possible, while still allowing it to be referenced as a module, and not
forcing modules that need to use it to refer to a global. Ideally, Last Resort
should be loaded before any other code so that it can report errors as early as
possible. In one project in which it is used, it is loaded with a `script`
element, then we register an absolutely bare error handler that uses `alert` to
report to the user, then more substantial scripts are loaded, including an AMD
module that provides a Bootstrap-based dialog in case of error. This module
loads Last Resort as an AMD module and replaces the initial barebones error
handler with its more sophisticated one.

Using Last Resort
=================

Last Resort listens to these two events:

* ``error``, which is emitted when a thrown exception is not caught by any code.

* ``unhandledrejection``, which is emitted when a rejected promise is not
  handled by any code.

In the following when we say "the events" we are referring to these two events.

Last Resort exports these items:

* ``install(context, options)`` installs Last Resort to intercept the events on
  ``context``. The parameter ``context`` is often ``window`` but could be the
  global context of a worker too (``self``). It returns an instance of
  ``OnError`` this instance is what is now handling the events.

  The ``options`` parameter is a plain object holding possible options:

  + ``force`` when set to ``true`` will force the installation of Last Resort on
     the ``context`` even if it was already installed previously. Otherwise an
     exception is raised. If ``force`` is used and Last Resort was previously
     installed, the previous installation will be automatically uninstalled.

  + ``noUnhandledRejection`` when set to ``true`` will **NOT** install a handler
     to catch unhandled rejections.

* The ``OnError`` class, which has the following methods:

  + ``register(fn)`` registers the function ``fn`` to handle the events. ``fn``
     will be called with the event objects generated for the ``error`` and
     ``unhandledrejection`` events. It should be prepared to examine the event
     to determine what happened exactly. **Until ``register(fn)`` is called, the
     ``OnError`` instance does not do anything when an event is emitted.**

  + ``uninstall()`` uninstalls the ``OnError``

* ``isInstalled(context)`` returns ``true`` if ``install(context)`` was
  ever called. ``false`` otherwise.

* ``wasTriggered()`` returns ``true`` if any event was raised in any context.

By default, the registered function is called both when an uncaught exception
happens and when an unhandled Promise rejection happens. So it has to be ready
to examine its arguments and determine how to process that information depending
on the types and number of the arguments passed.

When the registered function is called, Last Resort calls ``uninstall`` on the
``OnError` object that bears the registered function. This prevents infinite
recursion if it happens that the registered function causes new errors. It is up
to the developer of the registered function to ensure that this function does
not screw things up while it is running. It *could* call ``LastResort.install``
anew if desired and register its own specialized handler. Or it could do its own
error handling.

Some old browsers bypass ``onerror`` handlers attached to ``iframe`` elements
and instead go straight for the one on the root window. It is up to your
application to decide whether it needs to support these old browsers and use
Last Resort appropriately (e.g. detect the issue and install on the root window
instead of installing on an ``iframe``).

Example
=======

Here is a super simple example:

    import * as lr from "last-resort";

    const onerror: lr.OnError = lr.install(window);

    function handle(ev: Event): void {
        // tslint:disable-next-line:no-console
        console.log(ev);
    }

    onerror.register(handle);

This example just dumps the error to the console.

Developing Last Resort
======================

If you produce a pull request run ``gulp test`` first to make sure it is
clean. If you add features, do add tests for them.

<!--
#  LocalWords:  BrowserStack El Capitan iOS addEventListener issuecomment fn
#  LocalWords:  unhandledrejection onunhandledrejection LastResort CommonJS
#  LocalWords:  barebones OnError noUnhandledRejection isInstalled onerror
#  LocalWords:  wasTriggered iframe
-->
