This is a very simple [Meteor][]-based localization editor for
[requirejs i18n bundles][requirejs-i18n]. It's intended as a
quick-and-dirty solution to bootstrap localization, but is not
currently secure because it features **no authentication**.

## Starting the server

Just go into the root directory of the repository and run
`meteor`. Then visit the server's root in your web browser.

## REST API

### **POST** `/sources`

This endpoint is used to send information about "sources", or
strings that need localization, to the server. The request body
is expected to be JSON; each key is the name of a module, such
as `my/nls/colors`; values are objects containing the following
keys:

* `root` - An object containing the root i18n bundle for the module.
  See the requirejs i18n bundle documentation for information on
  the structure of this object.
  
* `description` - The HTML description of what the module is.
  Optional.

* `metadata` - Metadata providing additional information on
  i18n keys. Each key corresponds to a key in `root`; values
  are objects with the following keys:
  
    * `help` - HTML-formatted help text describing the purpose
      of the key.

  This key is optional, as is everything inside its value.

Example payload:

```javascript
{
  "my/nls/colors": {
    "description": "Names of colors used in my app.",
    "root": {
      "red": "red",
      "blue": "blue",
      "green": "green"
    },
    "metadata": {
      "red": {
        "help": "This is used <em>everywhere</em>, please translate it!"
      }
    }
  }
}
```

Note that there is currently no way to remove a module for localization
via the REST interface; you'll have to do this manually through a
MongoDB admin interface by removing a document from the `sources`
collection, e.g.:

```javascript
db.sources.remove({id: "my/nls/colors"});
```

### **GET** `/l10n/{{nls-path}}`

This endpoint returns the requirejs i18n bundle JavaScript code for
`{{nls-path}}`. Just set up your app's requirejs config to point
here for any `nls` subdirectory, and it will automatically get the latest
localizations contributed through ghetto-l10n's user interface for
any modules starting with `{{nls-path}}`.

For instance, here's a requirejs config that would load the
localizations for `my/nls/colors` from the ghetto-l10n instance at 
http://foo.org:

```javascript
require.config({
  paths: {
    "my/nls": "http://foo.org/l10n/my/nls"
  }
});
```

  [Meteor]: http://meteor.com/
  [requirejs-i18n]: http://requirejs.org/docs/api.html#i18n
