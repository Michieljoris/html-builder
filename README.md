html-builder
-----------

Completeyly hacked together as requirements came up, but it works!

Added websocket client. When finished building it will send a reload msg to the
server to instruct the server to send a reload msg to the browser.

Use nodejs modules in the browser! No browserify!

It now concatenates your css and js files in production mode and adds a cache
stamp to all static resources, to work together with
[bb-server](github.com/michieljoris/bb-server).

The main file html-builder.js exports one function: 'build'. This
function takes a dataFileName. If it is not given it will look for
build/recipe.js in the current working directory.


If the function build is called it will build a site using the info
given in the recipe.

buildMonitor.js is a command line utility that monitors and builds a
site using html-builder whenever there are changes in the directory
given as its first argument. If no argument is given it monitors the
./build directory. It looks for recipe.js in the monitored directory
to pass on to html-builder.

The recipe.js file needs to export an object describing the site.

	var exports = {
		[...]
	}
	
What follows is a list of properties that can be defined on the
exported object:

* verbose: boolean   
Verbose output to the console
* prettyPrintHtml: boolean    
Whether to generate pretty formatted html (buggy)
* paths: object    
  * root: string    
	base directory
  * partials: string    
  where to find partials relative to root, can be overridden per
  template
  * out: string   
  where to save produced files
  * js: string    
	where to save produced js files
* routes: array    
 list of route descriptions for angular.js each of the format:
 [ path, file, controller]
* partials: object    
  See below 
  
The html-builder builds one or more html files by nested insertion of
other html fragments or files. Every html fragment/file apart from
toplevel html files need to be given an id. By referring to these ids
inside the fragments/files the html-builder can build the toplevel
html files, using mappings listed in partials.

A fragment is called a partial, and the listing of partials is the
main part of the recipe.js file. There is no dependency management so
partials need to be defined before they can be used in other
partials. 

The main types of partials are:

* ids
  Plain string literals. These get inserted as is.
* metaBlock    
  An easy way to build a metablock
* linkBlock    
  Listing of css files
* scriptBlock    
Definition of one or more script blocks
* slideShow    
  listing of definition of slide shows
* menu    
Definition of one or more menus
* template    

Every template can have its own **id**, and needs a **src**. The src
can be a file on disk or an id of a previously defined partial. A
template can write its result to disk under the name given to the
**out** property. Finally the **mapping** property of a template maps
ids found in the source to partials defined earlier and inserts them.

Partials can be referred to by their id or by giving the name of
a file on a disk. The ids in the source need to be postfixed with the
**tagIdPostfix** (by default --). This can be set site wide or overridden
per template. The location of **partials** on disk is also set site wide,
but can be also overridden per template. A mapping from an id can
refer to one partial or an array of partials. When an array they will
be inserted one after the other.

For an example of a complete recipe.js see my repo [js-project](http://github.com/Michieljoris/js-project)

Or checkout the [documentation](http://rawgithub.com/Michieljoris/html-builder/master/docs/example-recipe.html)

I wrote this thing because I don't want to write html if I can help
it. Especially not repetitive html, such as listings of source or css
files. Html is unreadable, especially if the page gets large because
of its verbosity, so I wanted to keep it manageable by breaking it
up. I can now work on a part of a site, or a little corner of it and
every time I save the fragment the site gets rebuilt and reloaded in
the browser using live page or moz-reload in emacs or similar. The
only thing is it gets a bit confusing which partial contains which
other partial(s). Maybe I should draw a map of it. That should help.

The resulting html doesn't look too pretty though. You could achieve
the similar result by using a templating library such as handlebars
etc but these build the result in the browser, not necessary
always. Plus I don't like the magic. With this builder I am in control
of what happens.

What does appeal is the new html5 custom elements and html
imports. Combined with ractive.js and possibly postal.js, both easily
understood libraries, it might be possible to put something together I
can use in the future instead of this html-builder, dropping angular
(way too much magic..).
  

