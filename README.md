# jsLight
Ultra light-weight JavaScript Model View Controller (MVC) framework.

Designed to get your project up and running fast while not getting in your way. Super simple, highly extendable, easy to use to create single-page applications, and great for enhancing web pages or old designs. Works with any server-side technology. Create views just by telling the framework which element to put it in, and which url to get it from.
```
//loads the content of views/main.php into an element with id 'main'
VC.getView(document.getElementById("main"),"main.php");
```
No special markup language is required, making this possibly the easiest framework to learn. Write in natural HTML! The framework automatically detects forms and anchors and adjusts their behavior to match the framework. Just write your HTML the way you always have, use a server-side language (PHP, ASP, etc), or build it dynamically with JavaScript in your controller.
```
<!--Loads the content in views/main.php into the element defined in VC.getView-->
<a href="main.php">Goto Main</a>
```
```
<!--Performs an XHR POST to views/account/create.php and loads the response to the element defined in VC.getView-->
<form href="account/create.php">
  Name<input type="text" name="name"/>
</form>
```
If you want the framework to leave your links and forms alone, just define a target
```
<a href="https://github.com/mircerlancerous/jsLight" target="_blank">jsLight</a>
```
```
<!--Does a full page reload with a POST to search.php-->
<form href="search.php" method="POST" target="_self">
  Search<input type="text" name="search"/>
</form>
```
Create and remove view change listeners, so that other views can keep an eye on each other and respond when necessary. Just tell the framework which element to watch, who wants to know, and what to do when there's a change.
```
//set a listener for changes to the view on the supplied element.
//Calls the supplied onchange when a change detected. Overwrites previous listeners on the same element for the supplied view
setViewChangeListener: function(elm,viewName,onchange)

//removes all view change listeners for the supplied view. If viewName is undefined, then all listeners are removed
clearViewChangeListeners: function(viewName)
```
Like most MVC frameworks, you are not forced to use a Data Model system (although it's recommended). Setup your view controllers to access your js or server based data models. Set and trigger view change listeners at anytime to trigger actions without view reloads. Setup your controllers to manage view data, and data between views, however you want.

Views can exist with or without controllers. To define a controller just name a function after the file name (minus the extension). Parameters and view references are passed and onload and onclose methods are executed if they exist.
```
//controller for the main view in the main element
//viewObj is an object describing the view and is described below
function main(viewObj){
  var self = this;
  
  this.onload = function(){
    
    //perform view initialization here
    
    VC.onviewload(viewObj);   //tell the framework that we're done loading and it can trigger any applicable listeners
  };
  
  this.onclose = function(viewObj){
    
    //clean up any loose ends here (listeners, timers, etc)
    
  };
}
```
A versatile XHR function provides powerful access to web APIs while taking care of some of the more tedious syntax.
```
doXHR: function(url,onload,formData,options)
```
Anchors and forms can control other views by assigning a dataset value. This is especially useful for menu items controlling the main window.
```
<!-- This anchor is in an element with id 'menu' and is targeting the content of the element with id 'main'
<a href="account/signup.htm" data-vcelm="main">Sign Up</a>
```
Define a custom root views folder location if you don't like the default of 'views/'.
```
setViewsURL: function(url)
```
Define custom http headers to be sent with every XHR request. Useful for authentication or differentiating server-side between regular requests, and XHR requests.
```
//adds to the default headers to be sent with each xhr request. Param format is {name: xx, value: yy}
addXHRHeader: function (headerObj)

//removes a specific default header, or all of them if name is null or undefined
removeXHRHeader: function(name)
```
If the response from the server is able to be parsed as JSON, the view element is not populated but the controller is still activated. This prevents code from being displayed to the user, and gives the developer more control. A simple use for this would be a redirect or reload command from the server.

The view object (viewObj) passed to the controllers contains important data about the view which the controller can use.
```
ViewObject: function(){
    this.view = "";             //the full path of the view loaded (account/signup.htm)
    this.viewName = "";         //just the name of the view (signup)
    this.elm = null;            //a reference to the DOM element the view was loaded into
    this.controller = null;     //a reference to the controller object assigned to the view
    this.html = null;           //an unaltered copy of the text/code/html loaded into the element
    this.obj = null;            //if the response was in JSON format, this contains the parse result
    this.initObj = null;	//contains any parameters or passed objects
    this.loaded = false;
}
```
