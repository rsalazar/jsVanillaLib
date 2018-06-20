function VanillaLib( ) {
	let  self = Object.create({});

	self.mapFlat = ( array,func ) => array.map( x => func(x) ).reduce( (a,b) => a.concat(b) );
	self.parenth = ( elem,nth ) => traverse(elem, self.ifndef(nth, 1), 0);
	self.ifndef  = ( expr,value ) => ( self.ndef(expr) ? value : expr );
	self.ispojo  = expr => self.isobj(expr, Object);
	self.export  = ( source,target,members ) => ( Object.keys(source).filter( key => ! members || members.includes(key) )
	                                                                 .forEach( key => target[ key ] = source[ key ] ) );
	self.ifnan   = ( expr,value ) => ( isNaN(expr) ? value : expr );
	self.isobj   = ( expr,type ) => ( 'object' === typeof expr && ( ! type || self.isfn(expr.constructor)
	                                      && type === ( self.isfn(type) ? expr.constructor : expr.constructor.name ) ) );
	self.isarr   = expr => self.isobj(expr, Array);
	self.isstr   = expr => ( 'string' === typeof expr );
	self.isfn    = expr => ( 'function' === typeof expr );
	self.ndef    = expr => ( 'undefined' === typeof expr );
	self.test    = ( expr,func,other ) => ( !! expr ? func(expr) : self.isfn(other) ? other(expr) : other );
	self.fire    = ( elem,event,args ) => elem.dispatchEvent( self.isobj(event) ? even
	                                     : new Event( event, self.ifndef(args, { 'bubbles':true, 'cancelable':true }) ) );
	self.warn    = console.warn;
	self.log     = console.debug;
	self.on      = ( elem,event,func ) => elem.addEventListener(event, func);
	self.$$      = ( sel,elem ) => Array.slice((elem || document).querySelectorAll(sel));
	self.$       = ( sel,elem ) => (elem || document).querySelector(sel);

	self.aggRate = ( amount,rate,periods ) => ( ! periods ? amount : self.aggRate(amount * rate, rate, periods - 1) ),
	self.toDec   = expr => ( Math.round(parseFloat((expr +'').replace(/\$|,/g, '')) * 100) / 100 );


	self.appendTo = function( element, parent, reference ) {
		if ( !! reference ) {
			parent    = reference.parentNode;
			reference = reference.nextSibling;
		}

		if ( !! reference ) {
			return  self.prependTo(element, parent, reference);
		} else  if ( !! parent ) {
			parent.append(element);
		} else {
			self.warn('*** appendTo() could not add element: No parent or reference element provided');
		}

		return  element;
	};

	self.attr = function( elem, name, value ) {
		if ( self.isarr(elem) ) {
			return  elem.map( el => self.attr(el, name, value) );
		}

		self.keysAndValues(name, value, ( n,v ) => ( null === v ? elem.removeAttribute(n) : elem.setAttribute(n, v) ) );
		return  elem;
	};

	self.create = function( html, containerType ) {
		let  container = null,
		     result    = null,
		     attrs, style;

		if ( self.isobj(containerType) ) {
			attrs         = containerType.attrs;
			style         = containerType.style;
			containerType = containerType.container;
		}

		containerType = containerType || 'div';
		create[ containerType ] =
		container               = create[ containerType ] || document.createElement(containerType);
		container.innerHTML = html;
		result = Array.slice(container.childNodes)
		         	.map( elem => (elem.remove(), elem) );

		if ( !! attrs ) {
			self.attr(result, attrs);
		}
		if ( !! style ) {
			self.css(result, style);
		}

		if ( 1 == result.length ) {
			result = result[ 0 ];
		}
		return  result;
	};

	self.css = function( element, key, value ) {
		if ( isarr(element) ) {
			return  element.map( el => css(el, key, value) );
		}

		keysAndValues(key, value, ( k,v ) => element.style[ k ] = v );
		return  element;
	};

	self.keysAndValues = function( key, value, action ) {
		// Case 1: key is an object (and there is no value)
		if ( self.isobj(key) && ! value ) {
			return  Object.keys(key)
			        	.map( k => action(k, key[ k ]) );
		// Case 2: key is an array
		} else if ( self.isarr(key) ) {
			// Case 1.a: value is an array of the same length
			if ( self.isarr(value) && key.length === value.length ) {
				return  key.map( ( k,i ) => action(k, value[ i ]) );
			// Case 1.b: value is considered a simple, plain value
			} else {
				return  key.map( k => action(k, value) );
			}
		// Default Case: key and value considered as simple, plain values
		} else {
			return  action(key, value);
		}
	};

	self.prependTo = function( element, parent, reference ) {
		if ( ! reference && !! parent ) {
			reference = parent.childNodes[ 0 ];
		}

		if ( !! reference ) {
			reference.parentNode.insertBefore(element, reference);
		} else if ( !! parent ) {
			parent.append(element);
		} else {
			self.warn('*** prependTo() could not add element: No parent or reference element provided');
		}

		return  element;
	};

	self.toDec2 = function( amount ) {
		amount = self.toDec(amount);
		if ( isNaN(amount) ) {
			return  null;
		}
		let  segs = (amount +'').split('.');
		return  segs[ 0 ] +'.'+ ((segs[ 1 ] || 0) +'0').slice(0, 2);
	};

	self.toMoney = function( amount ) {
		let  dec2 = self.toDec2(amount);
		return  ( isNaN(dec2) ? null : dec2 < 0 ? '-$ '+ (-dec2) : '$ '+ dec2 );
	};

	self.traverse = function( elem, up, sideways, elementsOnly, lastIfNull ) {
		let  last = elem;
		while ( !! elem && up -- > 0 )  elem = (last = elem, elem.parentNode);

		let  prop = ( elementsOnly ? 'Element' : '' ) +'Sibling';
		if ( sideways < 0 ) {
			while ( !! elem && sideways ++ < 0 )  elem = (last = elem, elem[ 'previous'+ prop ]);
		} else if ( sideways > 0 ) {
			while ( !! elem && sideways -- > 0 )  elem = (last = elem, elem[ 'next'+ prop ]);
		}

		return  ( ! lastIfNull ? elem : elem || last );
	};


	self.copyMembers = function( source, target, members, preserve ) {
		//self.log('* Copying from', source, '\n\tto', target, '\n\t'+ members, preserve);
		if ( ! self.isobj(source) || ! self.isobj(target) ) {
			self.warn('=> Cannot copy from/to non-objects');
			return  false;
		}

		let  names = Object.keys(source);
		preserve = ( self.isobj(preserve) ? preserve : false );
		//self.log('- Full list of members:', names);

		if ( self.isstr(members) ) {
			members = members.split(',').map( nm => nm.trim() );
		}
		if ( self.isarr(members) ) {
			//self.log('* Member filter:', members);
			names = names.filter( nm => members.includes(nm) );
		} else if ( self.isfn(members) ) {
			names = names.filter(members);
		}
		//self.log('- Filtered list of members:', names);

		names.forEach( nm => {
			if ( !! target[ nm ] && !! preserve ) {
				preserve[ nm ] = target[ nm ];
			}
			target[ nm ] = source[ nm ];
			//self.log('- Target members', nm, target[ nm ]);
		} );
		//self.log('=>', target);
		return  (preserve || target);
	};

	self.export = function( scope, members, overwriten ) {
		if ( ! scope ) {
			return  false;
		}
		return  self.copyMembers(this, scope, members, overwriten);
	};

	// Avoid needing a 'new' operator; this is just a wrapper
	return  self;
}
