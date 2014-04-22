\_\_SE\_\_ (SharedEvents)
======

JavaScript library for exchange events, data and tasks between browser tabs.

Подробный мануал на русском на <a href="http://habrahabr.ru/post/220297/">Хабрахабре</a> - если кто-нибудь переведёт всю эту лабуду на английский, буду очень признателен. :)

Requirements
======
1. <a href="http://caniuse.com/#search=blob">Blob</a> 
2. <a href="http://caniuse.com/#feat=bloburls">Blob.URL</a>
3. <a href="http://caniuse.com/#search=worker">Worker</a>
4. <a href="http://caniuse.com/#search=localstorage">localStorage</a>

API:
======
Options:<br>
  <b>\_\_SE\_\_.Name</b>             - This tab name.<br>
  <b>\_\_SE\_\_.SelfExecution</b>    - Self-emitting by not \_Global events.<br>
  <b>\_\_SE\_\_.Sync</b>             - Background worker interval in ms.<br>
  <b>\_\_SE\_\_.TabTimeoutMult</b>   - Ctrl+F: "Inner relative values".<br>
  <b>\_\_SE\_\_.SLockTimeoutMult</b> - Ctrl+F: "Inner relative values".<br>
<br>
Methods:<br>
  <b>\_\_SE\_\_.clear( void );</b><br>
  <b>\_\_SE\_\_.getActiveTabs( void );</b><br>
<br>
  <b>\_\_SE\_\_.addEventListener</b>     ( Type , Listener <i>[, TabName ]</i> );<br>
  <b>\_\_SE\_\_.hasEventListener</b>     ( Type <i>[, Listener , TabName , Callback ]</i> );<br>
  <b>\_\_SE\_\_.removeEventListener</b>  ( Type <i>[, Listener , TabName , Callback ]</i> );<br>
  <b>\_\_SE\_\_.dispatchEvent</b>        ( Type <i>[, Data , TabName ]</i> );<br>
<br>
Constants:<br>
  <b>\_\_SE\_\_.GID</b>              - global events and listeners target ("TabName") identifier.<br>
<br>
Default global events:<br>
  <b>tabOpened</b>               - { Name , ID }             as GlobalEvent tabName: \_\_SE\_\_.GID<br>
  <b>tabClosed</b>               - { Name , ID }             as GlobalEvent tabName: \_\_SE\_\_.GID<br>
  <b>tabNameChanged</b>          - { Name , ID , OldName }   as GlobalEvent tabName: \_\_SE\_\_.GID<br>
<br>
Inner relative values:<br>
  1) Tab ping timeout expression:   \_\_SE\_\_.Sync \* \_\_SE\_\_.ActiveTabsCount \* \_\_SE\_\_.TabTimeoutMult<br>
  2) Storage lock timeout expression:   \_\_SE\_\_.Sync \* \_\_SE\_\_.SLockTimeoutMult<br>

Examples:
======
<i>Set local event listeners to default global events:</i>
<pre>
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
</pre>
<br>
<i>Local add/has/remove listeners:</i>
<pre>
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
</pre>
<br>
<i>Set local event listeners to tab-specified events:</i>
<pre>
    // part 1 (tab 1)
    var testFunction = function( data ){
        console.log( 'Local __SE__ event called on TestEvent.' );
        console.dir( data );
    };
    __SE__.addEventListener( 'TestEvent' , testFunction );
    __SE__.setName( 'Reciever' );

    // part 2 (tab 2-3-4-n)
    __SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'UndefinedTab' ); // false, because send to 'UndefinedTab'
    __SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } ); // true, because '_Global'
    __SE__.dispatchEvent( 'TestEvent' , { Data: 'some data' } , 'Reciever' ); // true, because tab-specified
</pre>
<br>
<i>Set shared event listeners to tab-specified events:</i>
<pre>
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
</pre>
<br>
<i>Shared events hasEventListener:</i>
<pre>
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
</pre>
