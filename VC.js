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
			//the full url to the views folder to use when relative paths are not reliable
			viewsURL: "views/",
			
			//default http headers to send with every xml http request - format is [{name: xx, value: yy}]
			xhrHeaders: [],
			
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
				//check the html for a redirect command
				try{
					var obj = JSON.parse(html);
					//only redirect if obj has only one property named 'view' with an optional elmid property
					if(Object.getOwnPropertyNames(obj).length <= 2 && typeof(obj.view) === 'string'){
						var elm = viewObj.elm;
						if(typeof(obj.elmid) === 'string'){
							elm = document.getElementById(obj.elmid);
						}
						VC.getView(elm,obj.view);
						return;
					}
				}
				catch(e){}
				//get the old view in order to remove it
				var oldViewObj = VC.getViewObject(viewObj.elm);
				if(oldViewObj.elm){
					VC.deleteView(oldViewObj.elm,true);
				}
				//add the new view to the list
				self.arrViewObj[self.arrViewObj.length] = viewObj;
				if(typeof(html) === 'string'){
					viewObj.elm.innerHTML = html;
				}
				viewObj.elm.style.opacity = "";
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
							if(typeof(this.dataset.link) !== 'undefined'){
								view = this.dataset.link;
							}
							VC.getView(viewObj.elm,view);
							return false;
						},false);
					}
				}
			}
		};
	})();

/*********************************************************************************/
	
	//public properties and methods
	return {
		//quick and easy xhr calls to the server with GET and or POST parameters
		doXHR: function(url,onload,formData,method,headers){
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function(){
				if(this.readyState == 4){
					if(typeof(onload) === 'function'){
						onload(this.responseText,this.status);
					}
				}
			};
			//set http method
			if(typeof(method) === 'undefined' || !method){
				if(typeof(formData) === 'undefined' || !formData){
					method = "GET";
				}
				else{
					method = "POST";
				}
			}
			xmlhttp.open(method,url,true);
			//check for custom headers
			if(typeof(headers) !== 'undefined'){
				for(var i=0; i<headers.length; i++){
					xmlhttp.setRequestHeader(headers[i].name,headers[i].value);
				}
			}
            else{
                headers = [];
            }
			//check for default headers
			for(var i=0; i<self.xhrHeaders.length; i++){
                //skip if found in passed headers
                var found = false;
                for(var v=0; v<headers.length; v++){
                    if(headers[v].name == self.xhrHeaders[i].name){
                        found = true;
                        break;
                    }
                }
                if(found){
                    continue;
                }
                //set default header
				xmlhttp.setRequestHeader(self.xhrHeaders[i].name,self.xhrHeaders[i].value);
			}
			xmlhttp.send(formData);
		},
		
		//gets the supplied view and puts it into the supplied element. The view should be the path of the view inside the views folder
		getView: function(elm,view,formData,headers,alreadyLoaded){
			elm.style.opacity = "0.5";
			var viewObj = new self.ViewObject();
			viewObj.elm = elm;
			viewObj.view = view;
			viewObj.viewName = view;
			//strip extension from the view to get controller object name/view name
			var pos = viewObj.viewName.lastIndexOf(".");
			var poscheck = viewObj.viewName.lastIndexOf("/");
			if(pos > -1 && pos > poscheck){
				viewObj.viewName = viewObj.viewName.substring(0,pos);
			}
			else{
				pos = viewObj.viewName.lastIndexOf("?");
				if(pos > -1){
					viewObj.viewName = viewObj.viewName.substring(0,pos);
				}
			}
			//look for an appropriate controller and set the viewName to it
			pos = viewObj.viewName.split("/");
			for(var i=0; i<pos.length; i++){
				if(pos[i] && typeof(window[pos[i]]) === 'function'){
					viewObj.viewName = pos[i];
				}
			}
			
			//if the html for the view was loaded with the previous view or page load then we don't need to fetch it
			if(typeof(alreadyLoaded) !== 'undefined' && alreadyLoaded){
				elm.style.opacity = "";
				self.setView(viewObj);
				return;
			}
			var url = self.viewsURL+view;
			if(view.search("http") > -1){
				url = view;
			}
			VC.doXHR(url,function(html,success){
				if(!success){
					alert("error loading content");
					elm.style.opacity = "";
					return;
				}
				self.setView(viewObj,html);
			},formData,headers);
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
			var objArr = [];
			if(elm){
				//delete just the view for this element
				objArr[0] = VC.getViewObject(elm);
			}
			else{
				//delete all views
				objArr = self.arrViewObj;
			}
			for(var v=0; v<objArr.length; v++){
				var viewObj = objArr[v];
				//if there is a current view with a controller
				if(viewObj.controller){
					//clean out all event listeners that this view might have
					VC.clearViewChangeListeners(viewObj.viewName);
					//if the view controller has an onclose method
					if(typeof(viewObj.controller.onclose) === 'function'){
						viewObj.controller.onclose(viewObj);
					}
					delete viewObj.controller;
				}
				if(!elm){
					continue;
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

		//removes all view change listeners for the supplied view. If viewName is undefined, then all listeners are removed
		clearViewChangeListeners: function(viewName){
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
		
		//set the views url so that relative urls can be used in links and forms where they might not otherwise have been reliable
		setViewsURL: function(url){
			//ensure the last character is a /
			var last = url.substring(url.length-1);
			if(last != '/'){
				url += "/";
			}
			self.viewsURL = url;
		},
        
        //sets the default headers to be sent with each xhr request. Param format is [{name: xx, value: yy}]
        setXHRHeaders: function(headerArr){
            self.xhrHeaders = headerArr;
        },
		
		//detect all forms and anchors in the element in the supplied viewObj, and alter their behavior to use the view system
		setElmNavEvents: function(viewObj,elm){
			self.setViewNavEvents(viewObj,elm);
		},

		//called by a controller (usually from the controller's onstart) when the controller has finished loading
		onviewload: function(viewObj){
			var retArr = [];
			var vcArr = self.arrViewChangeObj;
			for(var i=0; i<vcArr.length; i++){
				if(viewObj.elm == vcArr[i].elm){
					var ret = vcArr[i].onchange(viewObj);
					//check if the onchange wants to return something to the view
					if(typeof(ret) !== 'undefined'){
						retArr[retArr.length] = ret;
					}
				}
			}
			return retArr;
		}
	}
})();
