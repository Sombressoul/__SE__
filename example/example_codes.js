localStorage.clear();
JSON.parse( localStorage[ '__SE__' ] );
delete localStorage[ '__SE__' ];

__SE__.Worker.terminate();
__SE__.clear();
delete localStorage[ '__SE__' ];
window.location.reload();

__SE__.SLockTimeoutMult = 5;

__SE__.Worker.terminate();

/*
*
* Set local event listeners to default global events
* 
*/
var testFunction = function( data ){
    console.log( 'Local __SE__ event called on tabOpened.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabOpened' , testFunction );

var testFunctionB = function( data ){
    console.log( 'Local __SE__ event called on tabClosed.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabClosed' , testFunctionB );

console.clear();

/*
*
* Local add/has/remove listeners test.
* 
*/
var testFunction = function( data ){
    console.log( 'Local __SE__ event called on TestEvent.' );
    console.dir( data );
};
var testResult = __SE__.addEventListener( 'TestEvent' , testFunction );
console.log( 'Listener attachment result: ' + testResult );

console.log( 'Tests:' );

console.log( 'hasEventListener():' );
console.log( 'Expected "false", recieved: ' + __SE__.hasEventListener( 'Empty'      , testFunction ) );
console.log( 'Expected "false", recieved: ' + __SE__.hasEventListener( 'Empty'      , false ) );
console.log( 'Expected "true", recieved: '  + __SE__.hasEventListener( 'TestEvent'  , testFunction ) );
console.log( 'Expected "true", recieved: '  + __SE__.hasEventListener( 'TestEvent'  , false ) );

console.log( 'removeEventListener():' );
console.log( 'Expected "true", recieved: '  + __SE__.removeEventListener( 'Empty'       , testFunction ) );
console.log( 'Expected "true", recieved: '  + __SE__.removeEventListener( 'TestEvent'   , testFunction ) );
console.log( 'Expected "true", recieved: '  + __SE__.removeEventListener( 'TestEvent'   , testFunction ) );

/*
*
* Set local event listeners to tab-specified events.
* 
*/
// part 1
var testFunction = function( data ){
    console.log( 'Local __SE__ event called on TestEvent.' );
    console.dir( data );
};
__SE__.addEventListener( 'TestEvent' , testFunction );
__SE__.setName( 'Reciever' );

// part 2
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'UndefinedTab' ); // false, because send to 'UndefinedTab'
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } ); // true, because '_Global'
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'Reciever' ); // true, because specified

/*
*
* Set shared event listeners to tab-specified events.
* 
*/
// part 1 (tab 1)
var testFunction = function( data ){
    console.log( 'Shared __SE__ listener called on TestEvent.' );
    console.dir( data );
};
__SE__.addEventListener( 'TestEvent' , testFunction , 'Reciever' );
__SE__.addEventListener( 'TestEvent' , testFunction , 'Tester' );

// part 2 (tab 2)
__SE__.setName( 'Reciever' );

// part 3 (tab 3)
__SE__.setName( 'Tester' );

// part 4 (tab 4)
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'UndefinedTab' ); // TAB2 && TAB3: false, because send to 'UndefinedTab'
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } ); // TAB2 && TAB3: true, because '_Global'
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'Reciever' ); // TAB2: true, because specified; TAB3: false
__SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'Tester' ); // TAB3: true, because specified; TAB2: false

/*
*
* Shared events hasEventListener test.
* 
*/
// part 1 (tab 1)
var testFunction = function( data ){
    console.log( 'Shared __SE__ listener called on TestEvent.' );
    console.dir( data );
};
__SE__.addEventListener( 'TestEvent' , testFunction , 'Reciever' );

// part 2 (tab 1)
var Callback = function( result ){
    if ( result ){
        console.log( 'TRUE! Listener exists.' );
    } else {
        console.log( 'FALSE! Listener not exists.' );
    }
}

__SE__.hasEventListener( 'TestEvent' , testFunction , 'Reciever' , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , testFunction , 'Reciever' , Callback ); // false
__SE__.hasEventListener( 'TestEvent' , testFunction , false , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , testFunction , false , Callback ); // false
__SE__.hasEventListener( 'TestEvent' , false , 'Reciever' , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , false , 'Reciever' , Callback ); // false
__SE__.hasEventListener( 'TestEvent' , false , false , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , false , false , Callback ); // false

// part 3 (tab 2)
var testFunction = function( data ){
    console.log( 'Shared __SE__ listener called on TestEvent.' );
    console.dir( data );
};

var Callback = function( result ){
    if ( result ){
        console.log( 'TRUE! Listener exists.' );
    } else {
        console.log( 'FALSE! Listener not exists.' );
    }
}

__SE__.hasEventListener( 'TestEvent' , testFunction , 'Reciever' , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , testFunction , 'Reciever' , Callback ); // false
__SE__.hasEventListener( 'TestEvent' , testFunction , false , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , testFunction , false , Callback ); // false
__SE__.hasEventListener( 'TestEvent' , false , 'Reciever' , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , false , 'Reciever' , Callback ); // false
__SE__.hasEventListener( 'TestEvent' , false , false , Callback ); // true
__SE__.hasEventListener( 'TestEventB' , false , false , Callback ); // false


/*
*
* For add/remove tests.
*
*/
localStorage.clear();
JSON.parse( localStorage[ '__SE__' ] );

///////
var testFunction = function( data ){
    console.log( 'Local __SE__ event called on tabOpened.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabOpened' , testFunction );

var testFunctionB = function( data ){
    console.log( 'Local __SE__ event called on tabClosed.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabClosed' , testFunctionB );

var testFunction = function( data ){
    console.log( 'Global __SE__ event called on tabOpened.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabOpened' , testFunction , __SE__.GID );

var testFunctionB = function( data ){
    console.log( 'Global __SE__ event called on tabClosed.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabClosed' , testFunctionB , __SE__.GID );

var testFunction = function( data ){
    console.log( 'Tab-specified __SE__ event called on tabOpened.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabOpened' , testFunction , 'Tester' );

var testFunctionB = function( data ){
    console.log( 'Tab-specified __SE__ event called on tabClosed.' );
    console.dir( data );
};
__SE__.addEventListener( 'tabClosed' , testFunctionB , 'Tester' );

__SE__.Name = 'Tester';

var Callback = function( result ){
    console.log( 'Result: ' + result );
}

// tests
__SE__.removeEventListener( 'tabOpened' , testFunction , false , Callback );
__SE__.removeEventListener( 'tabClosed' , testFunctionB , 'Tester' , Callback );

__SE__.removeEventListener( 'tabOpened' , false , false , Callback );

__SE__.removeEventListener( 'tabOpened' , false , __SE__.GID , Callback );

__SE__.removeEventListener( 'tabOpened' , false );

__SE__.removeEventListener( 'tabClosed' , false );