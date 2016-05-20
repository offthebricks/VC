/*
Copyright 2016 OffTheBricks - https://github.com/mircerlancerous/jsLight
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var VC = (function(){
	//private properties and methods
	var self = (function(){
		return {
			//current views and their controllers and parent elements
			ViewObject: function(){
				this.view = "";
				this.viewName = "";
				this.elm = null;
				this.controller = null;
			},
			arrViewObj: [],
			
			//registered view change listeners
			viewChangeObj: function(){
				this.elm = null;
				this.viewName;
				this.onchange = function(newViewName){};
			},
			arrViewChangeObj: [],
			
			//set the supplied html to the element in the supplied viewObj. Initialize the view's controller if applicable
			setView: function(viewObj,html){
				//get the old view in order to remove it
				var oldViewObj = VC.getViewObject(viewObj.elm);
				if(oldViewObj.elm){
					VC.deleteView(oldViewObj.elm,true);
				}
				//add the new view to the list
				self.arrViewObj[self.arrViewObj.length] = viewObj;
				viewObj.elm.innerHTML = html;
				viewObj.elm.style.opacity = "1";
				self.setViewNavEvents(viewObj);
				var noOnLoad = true;
				//initialize controller if applicable
				if(typeof(window[viewObj.viewName]) === 'function'){
					//get parameters
					var obj = {};
					var path = viewObj.view.split("?");
					if(path.length > 1){
						path = path[1];
						var parts = path.split("&");
						for(var i=0; i<parts.length; i++){
							var data = parts[i].split("=");
							obj[data[0]] = data[1];
						}
					}
					//init
					viewObj.controller = new window[viewObj.viewName](obj);
					//check if the controller implements onload
					if(typeof(viewObj.controller.onload) === 'function'){
						viewObj.controller.onload(viewObj);
						noOnLoad = false;
					}
				}
				//check if we need to manually call onviewload
				if(noOnLoad){
					VC.onviewload(viewObj);
				}
			},
			
			//removes all view change listeners for the supplied view. If viewName is undefined, then all listeners are removed
			clearViewListeners: function(viewName){
				var arrVC = self.arrViewChangeObj;
				if(typeof(viewName) === 'undefined'){
					viewName = null;
				}
				if(typeof(trigger) === 'undefined'){
					trigger = true;
				}
				//search for and remove all listeners with the same viewName
				for(var i=arrVC.length - 1; i>=0; i--){
					if(viewName === null || arrVC[i].viewName == viewName){
						arrVC.splice(i,1);
					}
				}
			},
			
			//detect all forms and anchors in the element in the supplied viewObj, and alter their behavior to use the view system
			setViewNavEvents: function(viewObj,elm){
				if(typeof(elm) === 'undefined'){
					elm = viewObj.elm;
				}
				//set all forms to post with doXHR and formData instead of normal submit
				var forms = elm.getElementsByTagName("form");
				for(var i=0; i<forms.length; i++){
					//if the form has a target set, then don't adjust it
					if(forms[i].target){
						continue;
					}
					forms[i].addEventListener("submit",function(event){
						event.preventDefault();
						var formData = new FormData(this);
						//check if a submit button triggered this call - it will not be included in the FormData so we need to add it
						var aE = document.activeElement;
						if(aE && aE.tagName.toLowerCase() == 'input' && aE.type == 'submit' && aE.name){
							formData.append(aE.name,aE.value);
						}
						var view = this.action;
						if(view.length == 0 || view == window.location.href){
							view = viewObj.view;
						}
						else{
							view = view.substring(window.location.href.lastIndexOf("/") + 1);
						}
						VC.getView(viewObj.elm,view,formData);
						return false;
					},false);
				}
				//set all anchors that have href and no target to load a view instead
				var alist = elm.getElementsByTagName("a");
				for(i=0; i<alist.length; i++){
					if(alist[i].href && !alist[i].target){
						alist[i].addEventListener("click",function(event){
							event.preventDefault();
							var view = this.href.substring(window.location.href.lastIndexOf("/") + 1);
							VC.getView(viewObj.elm,view);
							return false;
						},false);
					}
				}
			}
		};
	})();
	
	//public properties and methods
	return {
		//quick and easy xhr calls to the server with GET and or POST parameters
		doXHR: function(url,onload,formData,headers){
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function(){
				if(this.readyState == 4){
					if(typeof(onload) === 'function'){
						if(this.status == 200 || this.status === 0){
							onload(this.responseText,true);
						}
						else{
							onload(this.responseText,false);
						}
					}
				}
			};
			if(typeof(formData) === 'undefined' || !formData){
				xmlhttp.open("GET",url,true);
				if(typeof(headers) !== 'undefined'){
					for(var i=0; i<headers.length; i++){
						xmlhttp.setRequestHeader(headers[i].name,headers[i].value);
					}
				}
				xmlhttp.send();
			}
			else{
				xmlhttp.open("POST",url,true);
				if(typeof(headers) !== 'undefined'){
					for(var i=0; i<headers.length; i++){
						xmlhttp.setRequestHeader(headers[i].name,headers[i].value);
					}
				}
				xmlhttp.send(formData);
			}
		},
		
		//gets the supplied view and puts it into the supplied element. The view should be the path of the view inside the views folder
		getView: function(elm,view,formData){
			elm.style.opacity = "0.5";
			var viewObj = VC.getViewObject(elm);
			if(viewObj.elm === null){
				viewObj = new self.ViewObject();
				viewObj.elm = elm;
			}
			viewObj.view = view;
			viewObj.viewName = view;
			//strip extension from the view to get controller object name/view name
			var pos = viewObj.viewName.lastIndexOf(".");
			if(pos > -1){
				viewObj.viewName = viewObj.viewName.substring(0,pos);
			}
			pos = viewObj.viewName.lastIndexOf("/");
			if(pos > -1){
				viewObj.viewName = viewObj.viewName.substring(pos+1);
			}
			viewObj.elm = elm;
			VC.doXHR("views/"+view,function(html,success){
				if(!success){
					alert("error loading content");
					elm.style.opacity = "1";
					return;
				}
				self.setView(viewObj,html);
			},formData);
		},
		
		//get the view object for the view currently in the supplied element - if not found, return null
		getViewObject: function(elm){
			var viewObj = new self.ViewObject();
			var arrViewObj = self.arrViewObj;
			//check if there is already a view in this element
			for(var i=0; i<arrViewObj.length; i++){
				if(arrViewObj[i].elm == elm){
					viewObj = arrViewObj[i];
					break;
				}
			}
			return viewObj;
		},
		
		//deletes the controller object and all references to the view
		deleteView: function(elm,prepForNew){
			var viewObj = VC.getViewObject(elm);
			//if there is a current view with a controller
			if(viewObj.controller){
				//clean out all event listeners that this view might have
				self.clearViewListeners(viewObj.viewName);
				//if the view controller has an onclose method
				if(typeof(viewObj.controller.onclose) === 'function'){
					viewObj.controller.onclose(viewObj);
				}
				delete viewObj.controller;
			}
			//remove the viewObject from the index
			for(var i=0; i<self.arrViewObj.length; i++){
				if(elm == self.arrViewObj[i].elm){
					self.arrViewObj.splice(i,1);
					break;
				}
			}
			if(typeof(prepForNew) === 'undefined' || !prepForNew){
				elm.innerHTML = "";
				//trigger an onchange for this element with a blank view object
				viewObj = new self.ViewObject();
				viewObj.elm = elm;
				VC.onviewload(viewObj);
			}
		},
		
		//set a listener for changes to the view on the supplied element. Calls the supplied onchange when a change detected. Overwrites previous listeners on the same element for the supplied view
		setViewChangeListener: function(elm,viewName,onchange){
			var vcArr = self.arrViewChangeObj;
			//search for whether this view already has a listener registered for this element
			for(var i=0; i<vcArr.length; i++){
				if(elm == vcArr[i].elm && viewName == vcArr[i].viewName){
					//if onchange is not a function, then remove the listener
					if(typeof(onchange) !== 'function'){
						vcArr.splice(i,1);
					}
					else{
						vcArr[i].onchange = onchange;
					}
					return;
				}
			}
			vcArr[i] = new self.viewChangeObj();
			vcArr[i].elm = elm;
			vcArr[i].viewName = viewName;
			vcArr[i].onchange = onchange;
		},
		
		//detect all forms and anchors in the element in the supplied viewObj, and alter their behavior to use the view system
		setElmNavEvents: function(viewObj,elm){
			self.setViewNavEvents(viewObj,elm);
		},

		//called by a controller (usually from the controller's onstart) when the controller has finished loading
		onviewload: function(viewObj){
			var vcArr = self.arrViewChangeObj;
			for(var i=0; i<vcArr.length; i++){
				if(viewObj.elm == vcArr[i].elm){
					vcArr[i].onchange(viewObj);
				}
			}
		}
	}
})();
