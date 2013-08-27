/*
	overthrow responsive sidescroller extension
	(c) 2013: Scott Jehl, Filament Group, Inc.
	MIT License
*/

(function( w, o ){


	if( !o || !"querySelector" in w.document ){
		return;
	}

	function sendEvent( elem, evt, args, ieID ){
		// TODO needs IE8 support
		if( document.createEvent ){
			var event = document.createEvent( "Event" );
			event.initEvent( evt, true, true );
			event.overthrow = args;
			elem.dispatchEvent( event );
		}
		else {
			w.document.documentElement[ieID][ evt ] = {
				e: evt,
				overthrow: args
			};
			w.document.documentElement[ evt ]++;
		}
	}

	// NOTE not a general purpose add class, whitespace accounting done externally
	function addClass( element, classStr ) {
		element.setAttribute( "class", element.getAttribute( "class" ).replace( classStr, "" ));
		element.setAttribute( "class", element.getAttribute( "class" ) + classStr );
	}

	// NOTE not a general purpose remove class, whitespace accounting done externally
	function removeClass( element, classStr ) {
		element.setAttribute( "class", element.getAttribute( "class" ).replace( classStr, "" ));
	}

	o.sidescroller = function( elems, options ){

		var scrolls = elems,
			evtPrefix = "overthrow",
			evtNext = evtPrefix + "-next",
			evtPrev = evtPrefix + "-prev",
			disabledClassStr = " disabled",
			snapScroll = options && options.snapScroll,
			rewind = options && options.rewind,
			snapTolerance = options && options.snapTolerance !== undefined ? options.snapTolerance : 30;

		for( var i = 0; i < scrolls.length; i++ ){

			(function(){

				var thisSideScroll = scrolls[ i ],
					thisScroll = scrolls[ i ].querySelector( ".overthrow" ),
					nextPrev = w.document.createElement( "div" ),
					slideNum = 0,
					ieID = "overthrow" + (new Date().getTime()),
					handled = false,
					nextAnchor, prevAnchor;

				// prevent re-init
				if( thisSideScroll.initialized ){
					return;
				}
				thisSideScroll.initialized = true;

				thisSideScroll.setAttribute( "tabindex", "0" );

				// oldIE will need some expando event props
				if( w.document.attachEvent ){
					// these are iterators to trigger a property mutate event in IE8
					w.document.documentElement[ evtPrev ] = 0;
					w.document.documentElement[ evtNext ] = 0;
					// these for for the event data when that property iterates
					w.document.documentElement[ ieID ] = {};
					w.document.documentElement[ ieID ][ evtPrev ] = {};
					w.document.documentElement[ ieID ][ evtNext ] = {};
					thisSideScroll.ieID = ieID;
				}

				nextPrev.className = "sidescroll-nextprev-links";

				nextPrev.innerHTML = "<a href='#' class='sidescroll-prev" + (rewind ? "" : disabledClassStr) + "'>Previous</a>" +
					"<a href='#' class='sidescroll-next'>Next</a>";

				nextAnchor = nextPrev.querySelector( "a.sidescroll-next" );
				prevAnchor = nextPrev.querySelector( "a.sidescroll-prev" );


				function setSlideWidths(){
					var slides = thisScroll.querySelectorAll( "li" ),
						percent = 100 / slides.length + "%";
					for( var i = 0; i < slides.length; i++ ){
						slides[ i ].style.width = percent;
					}
				}

				function toggleNavigation( event ) {
					if( rewind ) {
						return;
					}

					var disablePrev = false, disableNext = false,
						active, slides, slidesWidth, currScroll, scrollWidth;

					// if this comes from a click or a snap use the active pages
					// calculation provided as an event property, otherwise use
					// the scroll calculation
					// NOTE the assignment is deliberate
					if( active = (event && event.overthrow.active) ) {
						slides = thisScroll.querySelectorAll( "li" );

						disablePrev = (active[0] == 0);
						disableNext = (active[active.length - 1] >= slides.length - 1);
					} else {
						slidesWidth = thisScroll.offsetWidth,
						currScroll = thisScroll.scrollLeft,
						scrollWidth = thisScroll.scrollWidth - slidesWidth;

						disablePrev = currScroll < 5;
						disableNext = currScroll > scrollWidth - 5;
					}

					removeClass( nextAnchor, disabledClassStr );
					removeClass( prevAnchor, disabledClassStr );

					if( disablePrev ) {
						addClass( prevAnchor, disabledClassStr );
					}

					if( disableNext ) {
						addClass( nextAnchor, disabledClassStr );
					}
				}

				function getActiveSlides( left ){
					var slides = thisScroll.querySelectorAll( "li" ),
						numSlides = slides.length,
						slidesWidth = thisScroll.offsetWidth,
						slideWidth = slides[ 0 ].offsetWidth,
						scrollLeft = left !== undefined ? left : thisScroll.scrollLeft,
						startSlide = Math.round( scrollLeft / slideWidth ),
						valid = true,
						ret = [];

					startSlide = Math.max( 0, startSlide );
					startSlide = Math.min( numSlides, startSlide );

					ret[ 0 ] = startSlide;
					for( var i = 1; i < numSlides; i++ ){
						if( startSlide + (i * slideWidth) < slidesWidth){
							ret.push( startSlide + i);
						}
						else{
							valid = false;
						}
					}
					slideNum = startSlide;
					return ret;
				}

				// expose the getactiveslides function on the overthrow element
				thisSideScroll.getActiveSlides = getActiveSlides;

				function handleClick( evt ){

					var e = evt || w.event;

					if( e.preventDefault ){
						e.preventDefault();
					}
					else{
						e.returnValue = false;
					}

					if( e.type === "keydown" || ( handled === false || handled === e.type ) ){
						handled = e.type;

						o.intercept();
						var slides = thisScroll.querySelectorAll( "li" ),
							target = e.target || e.srcElement,
							slidesWidth = thisScroll.offsetWidth,
							slideWidth = slides[ 0 ].offsetWidth,
							currScroll = thisScroll.scrollLeft,
							slideNum = Math.round( currScroll / slideWidth ),
							next = (e.type !== "keydown" && target.className.indexOf( "next" ) > -1) || e.keyCode === 39,
							newSlide = slideNum + ( next ? 1 : -1 ),
							newScroll = slideWidth * newSlide,
							scrollWidth = thisScroll.scrollWidth - slidesWidth;

						// if can't go left, go to end
						if( rewind ){

							if( newScroll < 0 ){
								newScroll = scrollWidth;
							}
							else if( newScroll > scrollWidth ){
								newScroll = 0;
							}
						}
						else {
							if( newScroll < 0 ){
								newScroll = 0;
							}
							else if( newScroll > scrollWidth ){
								newScroll = scrollWidth;
							}
						}

						var newActive = getActiveSlides( newScroll );

						if( newActive[ 0 ] !== slideNum ){

							o.toss( thisScroll, { left: newScroll } );

							sendEvent(
								thisSideScroll, // elem to receive event
								next ? evtNext : evtPrev, // evt name
								{
									active: newActive, // active slides
									originalEvent: e
								},
								ieID
							);
						}

						setTimeout( function(){ handled = false; }, 900 );
					}
				}

				var scrollStart = false;
				function handleSnap( e ){
					o.intercept();
					var slideWidth = thisScroll.querySelector( "li" ).offsetWidth,
						currScroll = thisScroll.scrollLeft,
						newSlide = Math.round( currScroll / slideWidth );

					if( scrollStart !== false ){
						var distScrolled = currScroll - scrollStart;
						if( Math.abs( distScrolled ) > snapTolerance ){
							newSlide = slideNum + ( distScrolled > 0 ? 1 : -1 );
						}

					}

					var newScroll = slideWidth * newSlide;

					o.toss( thisScroll, { left: newScroll, duration: 20 } );

					if( slideNum !== newSlide ){
						sendEvent(
							thisSideScroll, // elem to receive event
							newSlide > slideNum ? evtNext : evtPrev, // evt name
							{
								active: getActiveSlides( newScroll ), // active slides
								originalEvent: e
							},
							ieID
						);
						slideNum = newSlide;
					}
				}

				var debounce;
				function handleResize( e ){
					clearTimeout(debounce);
					debounce = setTimeout(function(){
						handleSnap( e );
					}, 100);
				}

				var debouncedos;
				function handleScroll( e ){
					if( overthrow.tossing ){
						return;
					}
					if( scrollStart === false ){
						scrollStart = thisScroll.scrollLeft;
					}
					clearTimeout( debouncedos );
					debouncedos = setTimeout(function(){
						if( snapScroll ){
							handleSnap( e );
						} else {
							// NOTE handleSnap triggers the nav events
							toggleNavigation();
						}

						scrollStart = false;
					}, 200);
				}

				function handleKey( e ){
					if( e.keyCode === 39 || e.keyCode === 37 ){
						handleClick( e );
					}
				}

				if( w.document.addEventListener ){
					nextPrev.addEventListener( "click", handleClick, false );
					nextPrev.addEventListener( "touchend", handleClick, false );
					w.addEventListener( "resize", handleResize, false );
					scrolls[ i ].addEventListener( "keydown", handleKey, false );

					thisScroll.addEventListener( "scroll", handleScroll, false );
					thisSideScroll.addEventListener( evtNext, toggleNavigation, false );
					thisSideScroll.addEventListener( evtPrev, toggleNavigation, false );
				}
		 		else if( w.document.attachEvent ){
		 			nextPrev.attachEvent( "onclick", handleClick, false );
					w.attachEvent( "onresize", handleResize, false );
					scrolls[ i ].attachEvent( "onkeydown", handleKey, false );

					thisScroll.attachEvent( "onscroll", handleScroll, false );
					thisSideScroll.attachEvent( evtNext, toggleNavigation, false );
					thisSideScroll.attachEvent( evtPrev, toggleNavigation, false );
		 		}

				thisSideScroll.insertBefore( nextPrev, thisScroll );

				setSlideWidths();

			}());

		}

	};

	o.sidescroller.onEvent = function( evt, elem, callback ){
		function cb( args ){
			var e = {
				type: evt,
				target: elem,
				overthrow: args.overthrow
			};
			callback( e );
		}
		if( w.document.addEventListener ){
			elem.addEventListener( evt, cb );
		}
		else if( w.document.attachEvent ){
			w.document.documentElement.attachEvent( "onpropertychange", function( event ) {
				if( event.propertyName === evt ){
					cb( w.document.documentElement[ elem.ieID ][ evt ] );
				}
			});
		}
	};



}( this, this.overthrow ));