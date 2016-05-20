# jsLight
Ultra light-weight JavaScript Model View Controller (MVC) framework.

Designed to get your project up and running fast while not getting in your way. Super simple, highly extendable, easy to use to create single-page applications, and great for enhancing web pages or old designs. Works with any server-side technology. Create views just by telling the framework which element to put it in, and which url to get it from.
```
//loads the content of views/main.php into an element with id 'main'
VC.getView(document.getElementById("main","main.php");
```
No special markup language is used in this project. The framework automatically detects forms and anchors and adjusts their behavior to match the framework. Just write your HTML the way you always have, or build it dynamically with JavaScript in your controller.
```
<!--Loads the content in views/main.php into the element defined in VC.getView-->
<a href="main.php">Goto Main</a>
```
```
<!--Performs a POST to views/account/create.php and loads the response to the element defined in VC.getView-->
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
Create view change listeners so that other views can keep an eye on each other and respond when necessary. Just tell the framework which element to watch, who wants to know, and what to do when there's a change.
```
VC.setViewChangeListener(elm,viewName,onchange);
```
Compatible with and data model system. Setup your view controllers to access your js or server based data models. Set and trigger view change listeners at anytime to trigger actions without view reloads. Setup your controllers to manage view data, and data between views, however you want.

Views can exist with or without controllers. To define a controller just name a function after the file name (minus the extension). Parameters and view references are passed and onload and onclose methods are executed if they exist.
```
function main(initObj){
  var self = this;
  this.initObj = initObj;   //contains any url parameters
  this.viewObj = null;
  
  this.onload = function(viewObj){
    this.viewObj = viewObj;
    
    //perform view initialization here
    
    VC.onviewload(viewObj);   //tell the framework that we're done loading and it can trigger any applicable listeners
  };
  
  this.onclose = function(viewObj){
    
    //clean up any loose ends here (listeners, timers, etc)
    
  };
}
```
