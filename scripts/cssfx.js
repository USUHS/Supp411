/*
 * @preamble
 * @description Singleton class that provides for the methods to remove and apply css effects within the player
 * @author Ketih Chadwick
 * @version 1.0
 * @dependencies reflections.js, jquery
 */
var cssFX = {
	
	/*
	 * Called from base.js onDocumentReady function. Checks to see if the the effects are allowed under the current browser and
	 * if not removes all of the cssFX classes from any DOM elements that contain them then removes the cssFX.css stylesheet
	 */
	init : function(){
		
		// always run the effects regardless if effects are allowed
		cssFX.applyRunTimeEffects();		
		
		if (!cssFX.allowed()) {
			var classes = 'cssFX cssFX-Thin cssFX-Thick cssFX-Polaroid cssFX-Bevel cssFX-Shadow cssFX-Rounded cssFX-Reflect',
				elements = $('.cssFX');
			for(var element=0; element<elements.length;element++){
				$(elements[element]).removeClass(classes);	
			};
			$('link[href*="claro.cssFx.css"]').remove();
		};
		
		return null;
	},
	
	/*
	 * Returns true if effects are allowed under the present browser.
	 */
	allowed: function(){
		return (($.browser.msie && Number($.browser.version.substr(0,1))>6) || !$.browser.msie);
	},
	
	/*
	 * Applies any effects that are required at start up such as refelection 
	 */
	applyRunTimeEffects : function(){
		
		var reflections=$('.cssFX-slctr-Reflect img');
		var polaroids=$('.cssFX-Polaroid');
		
		// if allowed then all we need do is apply reflections to the reflectsions array.
		if(cssFX.allowed()){
			// apply reflections
			try{
				for(var r=0;r < reflections.length; r++){
					$(reflections[r]).reflect();
				}
			}catch(e){}
		}else{
			// in the future we may need to mod the heights for the polaroid and reflect
			// css effects as the heights in ie6 may look a little off.			
		}
		return null;		
	}
}; // end cssFX
