// Falling Text rotator- by JavaScript Kit (www.javascriptkit.com)
// Date created: Sept 11th, 2013
// Dependencies: jQuery 1.8+, Lettering.js http://letteringjs.com/
// Visit JavaScript Kit at http://www.javascriptkit.com/ for full source code

(function($){

	var defaults = {pause:2000, ontextchange:function(msgindex, msg, $eachchar){}, cycles:1}
	var transitionsupport = typeof $(document.documentElement).css('transition') != 'undefined'

	$.fn.fallingtextrotator = function(options){

		return this.each(function(){
			var s = $.extend({}, defaults, options)
			var $t = $(this),
					wordgroup = [], // array holding collection of either words or chars (depending on setting)
					curli = 0,
					cyclescount = {cur:0, max:0}
			var $lis = $t.find('>li').each(function(i){
				var $this = $(this)
					.data('wrapperinfo', {wrapitem:i, transduration:$(this).css('transitionDuration'), currenttransition:0, wordcount:0})
					.lettering('words').children('span').lettering().end()
				wordgroup.push( $this.find('span[class*="char"]') )
				$this.data('wrapperinfo').wordcount = wordgroup[i].length
			})
			cyclescount.max = $lis.length * s.cycles // get number of literations before rotator should stop

			$t.on('transitionend webkitTransitionEnd', function(e){
				var $target = $(e.target),
						$targetParent = $target.offsetParent()
				if (/transform/i.test(e.originalEvent.propertyName) && $targetParent.hasClass('dropdown')){
					$targetParent.data('wrapperinfo').currenttransition += 1
					if ($targetParent.data('wrapperinfo').currenttransition == $targetParent.data('wrapperinfo').wordcount){
						$targetParent.data('wrapperinfo').currenttransition = 0
						wordgroup[curli].css({transitionDelay:'0ms'})
						$targetParent.css({opacity:0, transitionDuration:'0ms'}).removeClass('dropdown')
						s.ontextchange( curli, $targetParent.text(), wordgroup[curli] )
						curli = (curli < wordgroup.length-1)? curli + 1 : 0
						setTimeout(function(){rotatetext()}, 50)
					}
				}
			})

	
			function dropword(){
				if (transitionsupport && !window.opera){
					for (var i=0; i<wordgroup[curli].length; i++){
						var delay = Math.round( Math.random() * 1000 ) +'ms'
						wordgroup[curli].eq(i).css('transitionDelay', delay )
					}
					$lis.eq(curli).addClass('dropdown')
				}
				else{
					$lis.eq(curli).css({opacity:0})
					curli = (curli < wordgroup.length-1)? curli + 1 : 0
					rotatetext()
				}
			}
	
			function rotatetext(){
				var $curli = $lis.eq(curli)
				$curli.css({opacity:1, transitionDuration:$curli.data('wrapperinfo').transduration})
				if (s.cycles==0 || cyclescount.cur++ < cyclescount.max-1){
					setTimeout(function(){
						dropword()
					}, s.pause)
				}
			}
	
			rotatetext()
		}) // end this.each()
	}

})(jQuery)