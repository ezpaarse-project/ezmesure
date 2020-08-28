var __kbnBundles__=typeof __kbnBundles__==="object"?__kbnBundles__:{};__kbnBundles__["plugin/ezreporting"]=function(modules){function webpackJsonpCallback(data){var chunkIds=data[0];var moreModules=data[1];var moduleId,chunkId,i=0,resolves=[];for(;i<chunkIds.length;i++){chunkId=chunkIds[i];if(Object.prototype.hasOwnProperty.call(installedChunks,chunkId)&&installedChunks[chunkId]){resolves.push(installedChunks[chunkId][0])}installedChunks[chunkId]=0}for(moduleId in moreModules){if(Object.prototype.hasOwnProperty.call(moreModules,moduleId)){modules[moduleId]=moreModules[moduleId]}}if(parentJsonpFunction)parentJsonpFunction(data);while(resolves.length){resolves.shift()()}}var installedModules={};var installedChunks={0:0};function jsonpScriptSrc(chunkId){return __webpack_require__.p+""+({}[chunkId]||chunkId)+".plugin.js"}function __webpack_require__(moduleId){if(installedModules[moduleId]){return installedModules[moduleId].exports}var module=installedModules[moduleId]={i:moduleId,l:false,exports:{}};modules[moduleId].call(module.exports,module,module.exports,__webpack_require__);module.l=true;return module.exports}__webpack_require__.e=function requireEnsure(chunkId){var promises=[];var installedChunkData=installedChunks[chunkId];if(installedChunkData!==0){if(installedChunkData){promises.push(installedChunkData[2])}else{var promise=new Promise((function(resolve,reject){installedChunkData=installedChunks[chunkId]=[resolve,reject]}));promises.push(installedChunkData[2]=promise);var script=document.createElement("script");var onScriptComplete;script.charset="utf-8";script.timeout=120;if(__webpack_require__.nc){script.setAttribute("nonce",__webpack_require__.nc)}script.src=jsonpScriptSrc(chunkId);var error=new Error;onScriptComplete=function(event){script.onerror=script.onload=null;clearTimeout(timeout);var chunk=installedChunks[chunkId];if(chunk!==0){if(chunk){var errorType=event&&(event.type==="load"?"missing":event.type);var realSrc=event&&event.target&&event.target.src;error.message="Loading chunk "+chunkId+" failed.\n("+errorType+": "+realSrc+")";error.name="ChunkLoadError";error.type=errorType;error.request=realSrc;chunk[1](error)}installedChunks[chunkId]=undefined}};var timeout=setTimeout((function(){onScriptComplete({type:"timeout",target:script})}),12e4);script.onerror=script.onload=onScriptComplete;document.head.appendChild(script)}}return Promise.all(promises)};__webpack_require__.m=modules;__webpack_require__.c=installedModules;__webpack_require__.d=function(exports,name,getter){if(!__webpack_require__.o(exports,name)){Object.defineProperty(exports,name,{enumerable:true,get:getter})}};__webpack_require__.r=function(exports){if(typeof Symbol!=="undefined"&&Symbol.toStringTag){Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"})}Object.defineProperty(exports,"__esModule",{value:true})};__webpack_require__.t=function(value,mode){if(mode&1)value=__webpack_require__(value);if(mode&8)return value;if(mode&4&&typeof value==="object"&&value&&value.__esModule)return value;var ns=Object.create(null);__webpack_require__.r(ns);Object.defineProperty(ns,"default",{enumerable:true,value:value});if(mode&2&&typeof value!="string")for(var key in value)__webpack_require__.d(ns,key,function(key){return value[key]}.bind(null,key));return ns};__webpack_require__.n=function(module){var getter=module&&module.__esModule?function getDefault(){return module["default"]}:function getModuleExports(){return module};__webpack_require__.d(getter,"a",getter);return getter};__webpack_require__.o=function(object,property){return Object.prototype.hasOwnProperty.call(object,property)};__webpack_require__.p="";__webpack_require__.oe=function(err){console.error(err);throw err};var jsonpArray=window["ezreporting_bundle_jsonpfunction"]=window["ezreporting_bundle_jsonpfunction"]||[];var oldJsonpFunction=jsonpArray.push.bind(jsonpArray);jsonpArray.push=webpackJsonpCallback;jsonpArray=jsonpArray.slice();for(var i=0;i<jsonpArray.length;i++)webpackJsonpCallback(jsonpArray[i]);var parentJsonpFunction=oldJsonpFunction;return __webpack_require__(__webpack_require__.s=3)}([function(module,exports,__webpack_require__){"use strict";var isOldIE=function isOldIE(){var memo;return function memorize(){if(typeof memo==="undefined"){memo=Boolean(window&&document&&document.all&&!window.atob)}return memo}}();var getTarget=function getTarget(){var memo={};return function memorize(target){if(typeof memo[target]==="undefined"){var styleTarget=document.querySelector(target);if(window.HTMLIFrameElement&&styleTarget instanceof window.HTMLIFrameElement){try{styleTarget=styleTarget.contentDocument.head}catch(e){styleTarget=null}}memo[target]=styleTarget}return memo[target]}}();var stylesInDom=[];function getIndexByIdentifier(identifier){var result=-1;for(var i=0;i<stylesInDom.length;i++){if(stylesInDom[i].identifier===identifier){result=i;break}}return result}function modulesToDom(list,options){var idCountMap={};var identifiers=[];for(var i=0;i<list.length;i++){var item=list[i];var id=options.base?item[0]+options.base:item[0];var count=idCountMap[id]||0;var identifier="".concat(id," ").concat(count);idCountMap[id]=count+1;var index=getIndexByIdentifier(identifier);var obj={css:item[1],media:item[2],sourceMap:item[3]};if(index!==-1){stylesInDom[index].references++;stylesInDom[index].updater(obj)}else{stylesInDom.push({identifier:identifier,updater:addStyle(obj,options),references:1})}identifiers.push(identifier)}return identifiers}function insertStyleElement(options){var style=document.createElement("style");var attributes=options.attributes||{};if(typeof attributes.nonce==="undefined"){var nonce=true?__webpack_require__.nc:undefined;if(nonce){attributes.nonce=nonce}}Object.keys(attributes).forEach((function(key){style.setAttribute(key,attributes[key])}));if(typeof options.insert==="function"){options.insert(style)}else{var target=getTarget(options.insert||"head");if(!target){throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.")}target.appendChild(style)}return style}function removeStyleElement(style){if(style.parentNode===null){return false}style.parentNode.removeChild(style)}var replaceText=function replaceText(){var textStore=[];return function replace(index,replacement){textStore[index]=replacement;return textStore.filter(Boolean).join("\n")}}();function applyToSingletonTag(style,index,remove,obj){var css=remove?"":obj.media?"@media ".concat(obj.media," {").concat(obj.css,"}"):obj.css;if(style.styleSheet){style.styleSheet.cssText=replaceText(index,css)}else{var cssNode=document.createTextNode(css);var childNodes=style.childNodes;if(childNodes[index]){style.removeChild(childNodes[index])}if(childNodes.length){style.insertBefore(cssNode,childNodes[index])}else{style.appendChild(cssNode)}}}function applyToTag(style,options,obj){var css=obj.css;var media=obj.media;var sourceMap=obj.sourceMap;if(media){style.setAttribute("media",media)}else{style.removeAttribute("media")}if(sourceMap&&btoa){css+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))))," */")}if(style.styleSheet){style.styleSheet.cssText=css}else{while(style.firstChild){style.removeChild(style.firstChild)}style.appendChild(document.createTextNode(css))}}var singleton=null;var singletonCounter=0;function addStyle(obj,options){var style;var update;var remove;if(options.singleton){var styleIndex=singletonCounter++;style=singleton||(singleton=insertStyleElement(options));update=applyToSingletonTag.bind(null,style,styleIndex,false);remove=applyToSingletonTag.bind(null,style,styleIndex,true)}else{style=insertStyleElement(options);update=applyToTag.bind(null,style,options);remove=function remove(){removeStyleElement(style)}}update(obj);return function updateStyle(newObj){if(newObj){if(newObj.css===obj.css&&newObj.media===obj.media&&newObj.sourceMap===obj.sourceMap){return}update(obj=newObj)}else{remove()}}}module.exports=function(list,options){options=options||{};if(!options.singleton&&typeof options.singleton!=="boolean"){options.singleton=isOldIE()}list=list||[];var lastIdentifiers=modulesToDom(list,options);return function update(newList){newList=newList||[];if(Object.prototype.toString.call(newList)!=="[object Array]"){return}for(var i=0;i<lastIdentifiers.length;i++){var identifier=lastIdentifiers[i];var index=getIndexByIdentifier(identifier);stylesInDom[index].references--}var newLastIdentifiers=modulesToDom(newList,options);for(var _i=0;_i<lastIdentifiers.length;_i++){var _identifier=lastIdentifiers[_i];var _index=getIndexByIdentifier(_identifier);if(stylesInDom[_index].references===0){stylesInDom[_index].updater();stylesInDom.splice(_index,1)}}lastIdentifiers=newLastIdentifiers}}},function(module,exports,__webpack_require__){"use strict";module.exports=function(useSourceMap){var list=[];list.toString=function toString(){return this.map((function(item){var content=cssWithMappingToString(item,useSourceMap);if(item[2]){return"@media ".concat(item[2]," {").concat(content,"}")}return content})).join("")};list.i=function(modules,mediaQuery,dedupe){if(typeof modules==="string"){modules=[[null,modules,""]]}var alreadyImportedModules={};if(dedupe){for(var i=0;i<this.length;i++){var id=this[i][0];if(id!=null){alreadyImportedModules[id]=true}}}for(var _i=0;_i<modules.length;_i++){var item=[].concat(modules[_i]);if(dedupe&&alreadyImportedModules[item[0]]){continue}if(mediaQuery){if(!item[2]){item[2]=mediaQuery}else{item[2]="".concat(mediaQuery," and ").concat(item[2])}}list.push(item)}};return list};function cssWithMappingToString(item,useSourceMap){var content=item[1]||"";var cssMapping=item[3];if(!cssMapping){return content}if(useSourceMap&&typeof btoa==="function"){var sourceMapping=toComment(cssMapping);var sourceURLs=cssMapping.sources.map((function(source){return"/*# sourceURL=".concat(cssMapping.sourceRoot||"").concat(source," */")}));return[content].concat(sourceURLs).concat([sourceMapping]).join("\n")}return[content].join("\n")}function toComment(sourceMap){var base64=btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));var data="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);return"/*# ".concat(data," */")}},function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.EZMESURE_CATEGORY=exports.API_URL=exports.PLUGIN_ICON=exports.PLUGIN_DESCRIPTION=exports.PLUGIN_NAME=exports.PLUGIN_ID=exports.PLUGIN_APP_NAME=void 0;var PLUGIN_APP_NAME="ezMESURE";exports.PLUGIN_APP_NAME=PLUGIN_APP_NAME;var PLUGIN_ID="".concat(PLUGIN_APP_NAME.toLowerCase(),"_reporting");exports.PLUGIN_ID=PLUGIN_ID;var PLUGIN_NAME="Reporting";exports.PLUGIN_NAME=PLUGIN_NAME;var PLUGIN_DESCRIPTION="Manage your reports generated from ".concat(PLUGIN_APP_NAME,".");exports.PLUGIN_DESCRIPTION=PLUGIN_DESCRIPTION;var PLUGIN_ICON="reportingApp";exports.PLUGIN_ICON=PLUGIN_ICON;var API_URL="http://localhost:4000";exports.API_URL=API_URL;var EZMESURE_CATEGORY={id:"".concat(PLUGIN_APP_NAME.toLowerCase(),"_category"),label:PLUGIN_APP_NAME,euiIconType:"",order:1001};exports.EZMESURE_CATEGORY=EZMESURE_CATEGORY},function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.plugin=plugin;Object.defineProperty(exports,"EzreportingPluginSetup",{enumerable:true,get:function get(){return _types.EzreportingPluginSetup}});Object.defineProperty(exports,"EzreportingPluginStart",{enumerable:true,get:function get(){return _types.EzreportingPluginStart}});__webpack_require__(4);__webpack_require__(5);var _plugin=__webpack_require__(10);var _types=__webpack_require__(13);function plugin(initializerContext){return new _plugin.EzreportingPlugin(initializerContext)}},function(module,exports,__webpack_require__){__webpack_require__.p=window.__kbnPublicPath__["ezreporting"]},function(module,exports,__webpack_require__){if(window.__kbnDarkMode__){__webpack_require__(6)}else{__webpack_require__(8)}},function(module,exports,__webpack_require__){var api=__webpack_require__(0);var content=__webpack_require__(7);content=content.__esModule?content.default:content;if(typeof content==="string"){content=[[module.i,content,""]]}var options={};options.insert="head";options.singleton=false;var update=api(content,options);var exported=content.locals?content.locals:{};module.exports=exported},function(module,exports,__webpack_require__){var ___CSS_LOADER_API_IMPORT___=__webpack_require__(1);exports=___CSS_LOADER_API_IMPORT___(false);exports.push([module.i,"",""]);module.exports=exports},function(module,exports,__webpack_require__){var api=__webpack_require__(0);var content=__webpack_require__(9);content=content.__esModule?content.default:content;if(typeof content==="string"){content=[[module.i,content,""]]}var options={};options.insert="head";options.singleton=false;var update=api(content,options);var exported=content.locals?content.locals:{};module.exports=exported},function(module,exports,__webpack_require__){var ___CSS_LOADER_API_IMPORT___=__webpack_require__(1);exports=___CSS_LOADER_API_IMPORT___(false);exports.push([module.i,"",""]);module.exports=exports},function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.EzreportingPlugin=void 0;var _common=__webpack_require__(2);var _feature_catalogue=__webpack_require__(11);function _slicedToArray(arr,i){return _arrayWithHoles(arr)||_iterableToArrayLimit(arr,i)||_unsupportedIterableToArray(arr,i)||_nonIterableRest()}function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(n);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen)}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++){arr2[i]=arr[i]}return arr2}function _iterableToArrayLimit(arr,i){if(typeof Symbol==="undefined"||!(Symbol.iterator in Object(arr)))return;var _arr=[];var _n=true;var _d=false;var _e=undefined;try{for(var _i=arr[Symbol.iterator](),_s;!(_n=(_s=_i.next()).done);_n=true){_arr.push(_s.value);if(i&&_arr.length===i)break}}catch(err){_d=true;_e=err}finally{try{if(!_n&&_i["return"]!=null)_i["return"]()}finally{if(_d)throw _e}}return _arr}function _arrayWithHoles(arr){if(Array.isArray(arr))return arr}function asyncGeneratorStep(gen,resolve,reject,_next,_throw,key,arg){try{var info=gen[key](arg);var value=info.value}catch(error){reject(error);return}if(info.done){resolve(value)}else{Promise.resolve(value).then(_next,_throw)}}function _asyncToGenerator(fn){return function(){var self=this,args=arguments;return new Promise((function(resolve,reject){var gen=fn.apply(self,args);function _next(value){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"next",value)}function _throw(err){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"throw",err)}_next(undefined)}))}}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function")}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}function _defineProperty(obj,key,value){if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true})}else{obj[key]=value}return obj}var EzreportingPlugin=function(){function EzreportingPlugin(initializerContext){_classCallCheck(this,EzreportingPlugin);_defineProperty(this,"initializerContext",void 0);this.initializerContext=initializerContext}_createClass(EzreportingPlugin,[{key:"setup",value:function setup(core,_ref){var home=_ref.home;var config=this.initializerContext.config.get();var applicationName=config.applicationName;_common.EZMESURE_CATEGORY.label=applicationName;var _window$location=window.location,protocol=_window$location.protocol,hostname=_window$location.hostname,port=_window$location.port;var ezmesureLink="".concat(protocol,"//").concat(hostname).concat(port?":".concat(port):"","/");core.application.register({id:"".concat(applicationName.toLocaleLowerCase(),"_back"),title:"Back to ".concat(applicationName),euiIconType:"editorUndo",category:_common.EZMESURE_CATEGORY,mount:function mount(){return window.location.href=ezmesureLink}});core.application.register({id:_common.PLUGIN_ID,title:_common.PLUGIN_NAME,euiIconType:_common.PLUGIN_ICON,category:_common.EZMESURE_CATEGORY,mount:function mount(params){return _asyncToGenerator(regeneratorRuntime.mark((function _callee(){var _yield$import,renderApp,_yield$core$getStartS,_yield$core$getStartS2,coreStart,depsStart,render;return regeneratorRuntime.wrap((function _callee$(_context){while(1){switch(_context.prev=_context.next){case 0:_context.next=2;return Promise.all([__webpack_require__.e(2),__webpack_require__.e(1)]).then(__webpack_require__.t.bind(null,18,7));case 2:_yield$import=_context.sent;renderApp=_yield$import.renderApp;_context.next=6;return core.getStartServices();case 6:_yield$core$getStartS=_context.sent;_yield$core$getStartS2=_slicedToArray(_yield$core$getStartS,2);coreStart=_yield$core$getStartS2[0];depsStart=_yield$core$getStartS2[1];coreStart.chrome.docTitle.change("".concat(_common.PLUGIN_NAME," ").concat(applicationName));render=renderApp(coreStart,depsStart,params,applicationName);return _context.abrupt("return",(function(){coreStart.chrome.docTitle.reset();render()}));case 13:case"end":return _context.stop()}}}),_callee)})))()}});home.featureCatalogue.register({id:_common.PLUGIN_ID,title:"".concat(_common.PLUGIN_NAME," ").concat(applicationName),icon:_common.PLUGIN_ICON,description:_common.PLUGIN_DESCRIPTION,path:"/app/".concat(_common.PLUGIN_ID),category:_feature_catalogue.FeatureCatalogueCategory.OTHER,showOnHomePage:true});return{}}},{key:"start",value:function start(core){return{}}},{key:"stop",value:function stop(){}}]);return EzreportingPlugin}();exports.EzreportingPlugin=EzreportingPlugin},function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});Object.defineProperty(exports,"FeatureCatalogueCategory",{enumerable:true,get:function get(){return _feature_catalogue_registry.FeatureCatalogueCategory}});Object.defineProperty(exports,"FeatureCatalogueEntry",{enumerable:true,get:function get(){return _feature_catalogue_registry.FeatureCatalogueEntry}});Object.defineProperty(exports,"FeatureCatalogueRegistry",{enumerable:true,get:function get(){return _feature_catalogue_registry.FeatureCatalogueRegistry}});Object.defineProperty(exports,"FeatureCatalogueRegistrySetup",{enumerable:true,get:function get(){return _feature_catalogue_registry.FeatureCatalogueRegistrySetup}});var _feature_catalogue_registry=__webpack_require__(12)},function(module,exports,__webpack_require__){"use strict";Object.defineProperty(exports,"__esModule",{value:true});exports.FeatureCatalogueRegistry=exports.FeatureCatalogueCategory=void 0;function _toConsumableArray(arr){return _arrayWithoutHoles(arr)||_iterableToArray(arr)||_unsupportedIterableToArray(arr)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function _unsupportedIterableToArray(o,minLen){if(!o)return;if(typeof o==="string")return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);if(n==="Object"&&o.constructor)n=o.constructor.name;if(n==="Map"||n==="Set")return Array.from(n);if(n==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen)}function _iterableToArray(iter){if(typeof Symbol!=="undefined"&&Symbol.iterator in Object(iter))return Array.from(iter)}function _arrayWithoutHoles(arr){if(Array.isArray(arr))return _arrayLikeToArray(arr)}function _arrayLikeToArray(arr,len){if(len==null||len>arr.length)len=arr.length;for(var i=0,arr2=new Array(len);i<len;i++){arr2[i]=arr[i]}return arr2}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function")}}function _defineProperties(target,props){for(var i=0;i<props.length;i++){var descriptor=props[i];descriptor.enumerable=descriptor.enumerable||false;descriptor.configurable=true;if("value"in descriptor)descriptor.writable=true;Object.defineProperty(target,descriptor.key,descriptor)}}function _createClass(Constructor,protoProps,staticProps){if(protoProps)_defineProperties(Constructor.prototype,protoProps);if(staticProps)_defineProperties(Constructor,staticProps);return Constructor}function _defineProperty(obj,key,value){if(key in obj){Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true})}else{obj[key]=value}return obj}var FeatureCatalogueCategory;exports.FeatureCatalogueCategory=FeatureCatalogueCategory;(function(FeatureCatalogueCategory){FeatureCatalogueCategory["ADMIN"]="admin";FeatureCatalogueCategory["DATA"]="data";FeatureCatalogueCategory["OTHER"]="other"})(FeatureCatalogueCategory||(exports.FeatureCatalogueCategory=FeatureCatalogueCategory={}));var FeatureCatalogueRegistry=function(){function FeatureCatalogueRegistry(){_classCallCheck(this,FeatureCatalogueRegistry);_defineProperty(this,"capabilities",null);_defineProperty(this,"features",new Map)}_createClass(FeatureCatalogueRegistry,[{key:"setup",value:function setup(){var _this=this;return{register:function register(feature){if(_this.features.has(feature.id)){throw new Error("Feature with id [".concat(feature.id,"] has already been registered. Use a unique id."))}_this.features.set(feature.id,feature)}}}},{key:"start",value:function start(_ref){var capabilities=_ref.capabilities;this.capabilities=capabilities}},{key:"get",value:function get(){if(this.capabilities===null){throw new Error("Catalogue entries are only available after start phase")}var capabilities=this.capabilities;return _toConsumableArray(this.features.values()).filter((function(entry){return capabilities.catalogue[entry.id]!==false})).sort(compareByKey("title"))}}]);return FeatureCatalogueRegistry}();exports.FeatureCatalogueRegistry=FeatureCatalogueRegistry;var compareByKey=function compareByKey(key){return function(left,right){if(left[key]<right[key]){return-1}else if(left[key]>right[key]){return 1}else{return 0}}}},function(module,exports,__webpack_require__){"use strict"},function(module,exports){module.exports=__kbnSharedDeps__.React},function(module,exports){module.exports=__kbnSharedDeps__.KbnI18nReact},function(module,exports){module.exports=__kbnSharedDeps__.ElasticEui},function(module,exports){module.exports=__kbnSharedDeps__.KbnI18n},,function(module,exports){module.exports=__kbnSharedDeps__.ReactDom},function(module,exports){module.exports=__kbnSharedDeps__.ReactRouterDom},function(module,exports){module.exports=__kbnSharedDeps__.Moment}]);