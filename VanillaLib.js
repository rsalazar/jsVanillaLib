function VanillaLib( ) {
	'use strict';
	let  self = { version:'1.1.180624.2105' };

	self.mapFlat = ( array,func ) => array.map( x => func(x) ).reduce( (a,b) => a.concat(b) );
	self.parenth = ( elem,nth ) => traverse(elem, self.ifndef(nth, 1), 0);
	self.ifndef  = ( expr,value ) => ( self.ndef(expr) ? value : expr );
	self.ispojo  = expr => self.isobj(expr, Object);
	self.ifnan   = ( expr,value ) => ( isNaN(expr) ? value : expr );
	self.isarr   = expr => self.isobj(expr, Array);
	self.isstr   = expr => ( 'string' === typeof expr );
	self.isfn    = expr => ( 'function' === typeof expr );
	self.ndef    = expr => ( 'undefined' === typeof expr );
	self.test    = ( expr,func,other ) => ( !! expr ? func(expr) : self.isfn(other) ? other(expr) : other );
	self.warn    = console.warn;
	self.log     = console.debug;
	self.$$      = ( sel,elem ) => Array.slice((elem || document).querySelectorAll(sel));
	self.$       = ( sel,elem ) => (elem || document).querySelector(sel);

	self.aggRate = ( amount,rate,periods ) => ( ! periods ? amount : self.aggRate(amount * rate, rate, periods - 1) );
	self.toDec   = expr => ( Math.round(parseFloat((expr +'').replace(/\$|,/g, '')) * 100) / 100 );

	self.secondsIn    = ( from,to,other ) => self.ifnan((to - from) /     1000, self.ifndef(other, NaN));
	self.minutesIn    = ( from,to,other ) => self.ifnan((to - from) /    60000, self.ifndef(other, NaN));
	self.hoursIn      = ( from,to,other ) => self.ifnan((to - from) /  3600000, self.ifndef(other, NaN));
	self.daysIn       = ( from,to,other ) => self.ifnan((to - from) / 86400000, self.ifndef(other, NaN));
	self.secondsSince = ( from,other ) => self.secondsIn(from, Date.now(), other);
	self.minutesSince = ( from,other ) => self.minutesIn(from, Date.now(), other);
	self.hoursSince   = ( from,other ) => self.hoursIn(from,   Date.now(), other);
	self.daysSince    = ( from,other ) => self.daysIn(from,    Date.now(), other);


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

	self.createXHR = function( ) {
		let  xhr = new XMLHttpRequest( );
		xhr.onabort = function( ev, xhr ) { self.log('XHR Abort:', ev, xhr, this); };
		xhr.onerror = function( ev, xhr ) { self.log('XHR Error:', ev, xhr, this); };
		xhr.onload  = function( ev, xhr ) { self.log('XHR Load:',  ev, xhr, this); };
		self.on(xhr, {
			'abort': function( ev ) { self.isfn(this.onabort) && this.onabort(ev, this); },
			'error': function( ev ) { self.isfn(this.onerror) && this.onerror(ev, this); },
			'load':  function( ev ) { self.isfn(this.onload)  && this.onload(ev, this); },
		});
		return  xhr;
	};

	self.css = function( element, key, value ) {
		if ( isarr(element) ) {
			return  element.map( el => css(el, key, value) );
		}

		keysAndValues(key, value, ( k,v ) => element.style[ k ] = v );
		return  element;
	};

	self.fire = function( elem, event, args ) {
		if ( self.isstr(event) ) {
			args  = self.ifndef(args, { 'bubbles':true, 'cancelable':true });
			event = new Event( event, args );
		}
		return  elem.dispatchEvent(event);
	};

	self.isobj = function( expr, type ) {
		type = type || 'object';
		if ( self.isfn(type) ) {
			return  ( 'object' === typeof expr && null !== expr && type === expr.constructor );
			// return  ( ! self.ndef(expr) && null !== expr && type === expr.constructor );
		}
		return  ( type === typeof expr );
	}

	self.keysAndValues = function( key, value, action ) {
		if ( self.ndef(action) && self.isfn(value) ) {
			action = value;
			value  = undefined;
		}

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

	self.localJson = function( key, value ) {
		if ( !! key && self.isstr(key) ) {
			try {
				if ( self.ndef(value) ) {
					return  JSON.parse(localStorage.getItem(key));
				} else if ( null === value ) {
					return  localStorage.removeItem(key);
				} else {
					return  localStorage.setItem(key, JSON.stringify(value));
				}
			} catch ( error ) {
				self.warn('* localJson() error:', error, '\n\tfor:', key, value);
			}
		}
		return  null;
	};

	self.off = function( element, event, callback ) {
		if ( self.ndef(callback) && self.isobj(event) ) {
			return  self.keysAndValues(event, ( k,v ) => self.off(element, k, v) );
		} else if ( self.isarr(element) ) {
			return  element.map( elem => self.off(elem, event, callback) );
		}
		return  element.removeEventListener(event, callback);
	};

	self.on = function( element, event, callback ) {
		if ( self.ndef(callback) && self.isobj(event) ) {
			return  self.keysAndValues(event, ( k,v ) => self.on(element, k, v) );
		} else if ( self.isarr(element) ) {
			return  element.map( elem => self.on(elem, event, callback) );
		}
		return  element.addEventListener(event, callback);
	};

	self.onmutate = function( element, callback, config ) {
		if ( !! element && self.isfn(callback) ) {
			config = config || { 'attributes':false, 'childList':true, 'subtree':false };

			if ( self.isarr(element) ) {
				return  element.map( elem => self.onmutate(elem, callback, config) );
			}

			let  observer = new MutationObserver( callback );
			observer.initialConfig = ( ) => config;
			observer.reconnect = function( newConfig ) {
				this.observe(element, newConfig || this.initialConfig());
				return  this;
			};
			return  observer.reconnect();
		}
		return  null;
	};

	self.pojo2query = function( pojo ) {
		if ( self.isobj(pojo) && !! pojo ) {
			let  query = Object.keys(pojo)
			             	.map( key => escape(key) +'='+ escape(pojo[ key ]) )
			             	.join('&');
			return  '?'+ query;
		}
		return  null;
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

	self.query2pojo = function( query ) {
		query = (self.ifndef(query, location.search) +'')
		        	.replace(/^[?&]+|$&+/g, '');
		if ( !! query ) {
			let  segs, key, val, pojo = { };
			query.split('&')
				.forEach( item => {
					[ key, val ] =
					segs         = item.split('=');
					val = ( self.ndef(val) ? null : segs.slice(1).join('=') );
					pojo[ unescape(key) ] = val;
				} );
			return  pojo;
		}
		return  null;
	};

	self.request = function( url, verb, data, callback ) {
		self.log('* request of:', verb, url, data, callback);

		// "Validate" HTTP Verb, to an extent
		verb = (verb || 'GET').toUpperCase();
		switch ( verb ) {
			case  'P':  verb = 'POST';  break;
			case  'G':  verb = 'GET';   break;
			case  'H':  verb = 'HEAD';  break;
		}

		// Switch callback and data when ther is no data
		if ( self.ndef(callback) && self.isfn(data) ) {
			callback = data;
			data     = null;
		}

		// Set the data to a string or null
		data = self.ifndef(data, null);
		data = ( !! data && self.isobj(data) ? self.pojo2query(data).replace('?', '') : data.toString() );
		self.log('- request data:', data);

		// Add data to the URL for GET requests
		if ( 'GET' === verb && !! data ) {
			url += ( url.includes('?') ? '&' : '?' ) + data;
			data = null;
		}

		// Create & open XHR object...
		let  xhr = self.createXHR();
		self.log('-> opening request:', verb, url);
		xhr.open(verb, url);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

		// Set the internal event handler, which removes itself on execution
		xhr.onabort =
		xhr.onerror =
		xhr.onload  = callback;

		// Send the actual request
		self.log('-> sending request:', data, xhr.readyState, xhr);
		return  xhr.send(data);
	};

	self.table2json = function( table, headers, filter ) {
		if ( !! table && !! table.rows ) {
			let  obj = { head:[ ], data:[ ] };

			obj.head = ( self.isfn(headers) ? headers(table) : table.rows[ 0 ] );
			if ( self.isobj(obj.head) && !! obj.head.cells ) {
				obj.head = Array.map(obj.head.cells, th => th.innerText.trim() );
			}

			if ( obj.head.length ) {
				filter = filter || (( row,i ) => ( i && 'TBODY' === row.parentNode.nodeName ));

				for ( let  r = 0, nr = table.rows.length;  r < nr;  r ++ ) {
					let  row = table.rows[ r ];

					if ( filter(row, r) ) {
						let   item = { };
						obj.head.forEach( ( col,i ) => {
							col[ 0 ] && (item[ col ] = row.cells[ i ].innerText.trim());
						} );
						obj.data.push(item);
					}
				}
			}
			return  obj.data;
		}
		return  null;
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

	// ----------------------------------------------------
	// Intended for Internal Use

	self.copyMembers = function( source, target, members, preserve ) {
		//self.log('* Copying from', source, '\n\tto', target, '\n\t'+ members, preserve);
		if ( ! self.isobj(source) || ! self.isobj(target) ) {
			self.warn('=> Cannot copy from/to non-objects');
			return  false;
		}

		let  names = Object.keys(source);
		preserve = ( self.isobj(preserve) ? preserve : false );
		//self.log('- Full list of members:', names, '\n\t', source);

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
		if ( '*' === (members +'').trim() ) {
			members = null;
		}
		return  self.copyMembers(self, scope, members, overwriten);
	};

	// Avoid needing a 'new' operator; this is just a wrapper
	return  self;
}
