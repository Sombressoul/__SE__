/*
*
* Options:
*   __SE__.Name             - This tab name.
*   __SE__.SelfExecution    - Self-emitting by not _Global events.
*   __SE__.Sync             - Background worker interval in ms.
*   __SE__.TabTimeoutMult   - Ctrl+F: "Inner relative values".
*   __SE__.SLockTimeoutMult - Ctrl+F: "Inner relative values".
* 
* Methods:
*   __SE__.clear( void );
*   __SE__.getActiveTabs( void );
* 
*   __SE__.addEventListener     ( Type , Listener [, TabName ] );
*   __SE__.hasEventListener     ( Type [, Listener , TabName , Callback ] );
*   __SE__.removeEventListener  ( Type [, Listener , TabName , Callback ] );
*   __SE__.dispatchEvent        ( Type [, Data , TabName ] );
* 
* Constants:
*   __SE__.GID              - global events and listeners target ("TabName") identifier.
* 
* Default global events:
*   tabOpened               - { Name , ID }             as GlobalEvent tabName: __SE__.GID
*   tabClosed               - { Name , ID }             as GlobalEvent tabName: __SE__.GID
*   tabNameChanged          - { Name , ID , OldName }   as GlobalEvent tabName: __SE__.GID
* 
* Inner relative values:
*   1) Tab ping timeout expression      :   __SE__.Sync * __SE__.ActiveTabsCount * __SE__.TabTimeoutMult
*   2) Storage lock timeout expression  :   __SE__.Sync * __SE__.SLockTimeoutMult
* 
*/
(function(){
    
    var ROOT                            = this;
    
    // constants
    var SE_REVISION                     = 1;
    var DEFAULT_TAB_NAME                = 'Default';
    var GLOBAL_IDENTIFIER               = '__Global__';
    var LOCAL_STORAGE_SEDATA_KEY        = '__SE__';
    
    var DEFAULT_WORKER_INTERVAL         = 100;
    var DEFAULT_TAB_TIMEOUT_MULTIPLIER  = 2;
    var DEFAULT_STORAGE_LOCK_MULTIPLIER = 2;
    
    // do some initial checks...
    var checksFailed                    = false;
    
    if ( ROOT.__SE__ !== undefined )                                                            checksFailed = true;
    if ( !( 'localStorage' in window && window['localStorage'] !== null ) )                     checksFailed = true;
    if ( !ROOT.URL && !ROOT.webkitURL )                                                         checksFailed = true;
    if ( !ROOT.Blob && !ROOT.BlobBuilder && !ROOT.WebKitBlobBuilder && !ROOT.MozBlobBuilder )   checksFailed = true;
    if ( !ROOT.Worker )                                                                         checksFailed = true;
    
    if ( checksFailed ) return false;
    
    // After checks init...
    ROOT.URL        = ROOT.URL || ROOT.webkitURL;
    
    var Blob        = ROOT.Blob || false;
    var BlobBuilder = ROOT.BlobBuilder || ROOT.WebKitBlobBuilder || ROOT.MozBlobBuilder || false;
    
    // Prevention of data loss by localStorage.clear().
    (function( ROOT ){
        
        var origin = ROOT.clear;
        
        ROOT.clear = function(){
            
            var tmp = ROOT.getItem( LOCAL_STORAGE_SEDATA_KEY );
            
            origin.apply( ROOT , arguments );
            ROOT.setItem( LOCAL_STORAGE_SEDATA_KEY , tmp );
            
        };
        
    })( ROOT.localStorage );
    
    // define some helper functions...
    var CheckType = function( Type ){
        
        if ( Type === undefined || !/^[a-zA-Z]*$/i.test( Type.toString() ) ){
            
            throw new Error( '__SE__: event type should contains [a-zA-Z]. Type was sent: ' + Type );
            
        } else {
            
            return true;
            
        }
        
    };
    
    var CheckTabName = function( TabName ){
        
        if ( TabName === undefined || !/^[a-zA-Z\_\-\d]*$/i.test( TabName.toString() ) ){
            
            throw new Error( '__SE__: tab name should contains [a-zA-Z\_\-\d]. Name was sent: ' + TabName );
            
        } else {
            
            return true;
            
        }
        
    };
    
    var CheckListener = function( Listener ){
        
        if ( Listener === undefined || typeof( Listener ) !== 'function' ){
            
            throw new Error( '__SE__: listener should be a function. Type of listener was sent: ' + typeof( Listener ) );
            
        } else {
            
            return true;
            
        }
        
    };
    
    var CheckCallback = function( Callback ){
        
        if ( Callback === undefined || typeof( Callback ) !== 'function' ){
            
            throw new Error( '__SE__: callback should be a function. Type of callback was sent: ' + typeof( Callback ) );
            
        } else {
            
            return true;
            
        }
        
    };
    
    var GenerateID  = function(){
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(){ return (Math.random()*16|0).toString(16); } );
    };
    
    var CreateEvent = function( Type , Data , TabName ){
        
        var Data    =
            {
                Data        : Data ,
                Sender      :
                    {
                        Name    : __SE__.Name ,
                        ID      : __SE__.ID 
                    } ,
                Timestamp   : new Date().getTime()
            }
        
        var Event   =
            {
                Type        : Type ,
                Target      : TabName ,
                Data        : Data ,
                Sender      :
                    {
                        Name    : __SE__.Name ,
                        ID      : __SE__.ID 
                    } ,
                CheckedBy   : ( __SE__.SelfExecution || TabName === __SE__.GID )
                                ? [] 
                                : [ __SE__.ID ]
            }
        
        return Event;
        
    };
    
    var CreateTabData   = function( Checked ){
        
        var Checked     = Checked || false;
        
        var NewTab      =
            {
                Name        : __SE__.Name ,
                ID          : __SE__.ID ,
                Ping        : new Date().getTime() ,
                Checked     : Checked ,
                ConfigCache :
                    {
                        Sync                : __SE__.Sync ,
                        TabTimeoutMult      : __SE__.TabTimeoutMult ,
                        SLockTimeoutMult    : __SE__.SLockTimeoutMult
                    }
            }
        return NewTab;
    };
    
    var UnpackSEData    = function( IgnoreStorageLock ){
        
        var IgnoreStorageLock   = IgnoreStorageLock || false;
        var SEData              = localStorage.getItem( LOCAL_STORAGE_SEDATA_KEY );
        
        if ( SEData === null && IgnoreStorageLock ){
            
            return false;
            
        }
        
        if ( SEData !== null ){
            
            var SEData      = JSON.parse( SEData );
            
            if ( IgnoreStorageLock ) return SEData;
            
            if ( SEData.Lock !== 0 && SEData.Lock + __SE__.Sync * __SE__.SLockTimeoutMult > new Date().getTime() ){
                
                return false;
                
            } else {
                
                SEData.Lock = new Date().getTime();
                PackSEData( SEData );
                
            }
            
            return SEData;
            
        } else { // create default SEData object...
            
            SEData =
                {
                    SE_Revision             : SE_REVISION ,
                    Config                  :
                        {
                            Sync                : __SE__.Sync ,
                            TabTimeoutMult      : __SE__.TabTimeoutMult ,
                            SLockTimeoutMult    : __SE__.SLockTimeoutMult
                        } ,
                    Lock                    : new Date().getTime() ,
                    Tabs                    : [ CreateTabData() ] ,
                    EventsEmitted_Local     : [] ,
                    EventsEmitted_Global    : [] ,
                    SharedEventListeners    : []
                };
            
            PackSEData( SEData );
            return SEData;
            
        }
        
    };
    
    var PackSEData  = function( SEData ){
        
        localStorage.setItem( LOCAL_STORAGE_SEDATA_KEY , JSON.stringify( SEData ) );
        
    };
    
    var GetConfig   = function(){
        
        var SEData  = UnpackSEData( true );
        
        return ( ( SEData !== false ) ? SEData.Config : false );
        
    };
    
    /*
    * SEWorker functions...the core
    */
    // Main loop.
    var CreateWebWorker = function(){
        
        // Creating WebWorker to prevent inactive tab setTimeout/setInterval suspending...
        var WorkerScript        =
            [
                'var pingSEProcess = function(){'
                , 'postMessage( "ping" );'
                , '};'
                , 'setInterval( pingSEProcess , ' + __SE__.Sync + ' );'
                , 'onmessage = function(){ postMessage( "dead" ); close(); };'
            ].join( ' ' );
        
        if ( Blob ){
            
            var WorkerBlob      = new Blob( [ WorkerScript ] , { type: 'text/javascript' } );
            
        } else {
            
            var WorkerBlob      = new BlobBuilder();
                WorkerBlob.append( WorkerScript );
                WorkerBlob      = WorkerBlob.getBlob();
            
        }
        
        __SE__.Worker           = new ROOT.Worker( ROOT.URL.createObjectURL( WorkerBlob ) );
        
        __SE__.Worker.onmessage = function( msg ){
            
            if ( msg.data === 'ping' ){
                SEWorker();
            }
            
            if ( msg.data === 'dead' ){
                CreateWebWorker();
            }
            
        };        

    };
    
    // Check active tabs.
    var CheckTabs       = function( SEData ){
        
        var IsCurrentTabDefined = false;
        var ActiveTabs          = [];
        var CheckedTabs         = 0;
        var AllDefinedTabs      = SEData.Tabs;
        
        // preventing false tab timeout, because on startup this var equals 0
        __SE__.ActiveTabsCount  = ( __SE__.ActiveTabsCount )
                                    ? __SE__.ActiveTabsCount 
                                    : AllDefinedTabs.length ;
        
        for ( var i = 0, l = AllDefinedTabs.length; i < l; i++ ){
            
            // Ping timeout is specific to each tab through config synchronization delay.
            // So we should to calculate it using tab configuration cache.
            var TabTimeout = AllDefinedTabs[ i ].ConfigCache.Sync * __SE__.ActiveTabsCount * AllDefinedTabs[ i ].ConfigCache.TabTimeoutMult;
            
            if ( AllDefinedTabs[ i ].ID === __SE__.ID ){
                
                AllDefinedTabs[ i ].Ping    = new Date().getTime();
                AllDefinedTabs[ i ].Name    = __SE__.Name;
                
                IsCurrentTabDefined = true;
                
            }
            
            if ( AllDefinedTabs[ i ].Ping + TabTimeout > new Date().getTime() ){
                
                ActiveTabs.push( AllDefinedTabs[ i ] );
                
            } else {
                
                // sending tabClosed global event to other tabs
                __SE__.dispatchEvent( 'tabClosed' , { Name: AllDefinedTabs[ i ].Name , ID: AllDefinedTabs[ i ].ID } , __SE__.GID );
                
            }
            
            if ( AllDefinedTabs[ i ].Checked === true ){
                CheckedTabs++;
            }
            
        }
        
        if ( !IsCurrentTabDefined ){
            var NewTab = CreateTabData();
            
            // sending tabOpened global event to other tabs
            __SE__.dispatchEvent( 'tabOpened' , { Name: NewTab.Name , ID: NewTab.ID } , __SE__.GID );
            
            ActiveTabs.push( NewTab );
        }
        
        // if all tabs checked - drop all checks to start new checks cycle
        if ( ActiveTabs.length === CheckedTabs ){
            for ( var i = 0, l = ActiveTabs.length; i < l; i++ ){
                ActiveTabs[ i ].Checked = false;
            }
        }
        
        __SE__.ActiveTabsCount  = ActiveTabs.length;
        SEData.Tabs             = ActiveTabs;
        return SEData;
        
    };
    
    // Check current turn.
    var CheckTurn       = function( SEData ){
        
        var IsCurrentTabTurn    = false;
        
        var ActiveTabs          = SEData.Tabs;
        var PreviousTabsChecked = true;
        var NotChecked          = 0;
        var IsCurrentTabChecked = false;
        
        for ( var i = 0, l = ActiveTabs.length; i < l; i++ ){
            
            if ( ActiveTabs[ i ].ID !== __SE__.ID ){
                
                NotChecked          = ( ActiveTabs[ i ].Checked !== true ) 
                                        ? NotChecked + 1 
                                        : NotChecked ;
                PreviousTabsChecked = PreviousTabsChecked && ActiveTabs[ i ].Checked;
                
            } else {
                
                IsCurrentTabChecked = ActiveTabs[ i ].Checked;
                __SE__.CallsToPass  = NotChecked;
                break;
                
            }
            
        }
        
        if ( NotChecked === 0 && PreviousTabsChecked === true && IsCurrentTabChecked === false ){
            IsCurrentTabTurn = true;
        }
        
        return IsCurrentTabTurn;
        
    }
    
    // Mark current tab as checked.
    var SetTabChecked   = function( SEData ){
        
        for ( var i = 0, l = SEData.Tabs.length; i < l; i++ ){
            if ( SEData.Tabs[ i ].ID === __SE__.ID ){
                
                SEData.Tabs[ i ].Checked = true;
                break;
                
            }
        }
        
        return SEData;
        
    }
    
    // pushing new events to storage...
    var Listeners_Add      = function( SEData ){
        
        while( __SE__.ListenersStack_ToAdd.length ){
            
            var NewSharedListener           = __SE__.ListenersStack_ToAdd.pop();
            var IsNewListenerAlreadyExists  = false;
            
            for( var i = 0, l = SEData.SharedEventListeners.length; i < l; i++ ){
                
                var ExistingListener    = SEData.SharedEventListeners[ i ];
                
                if ( JSON.stringify( NewSharedListener ) === JSON.stringify( ExistingListener ) ){
                    IsNewListenerAlreadyExists = true;
                    break;
                }
                
            }
            
            if ( !IsNewListenerAlreadyExists ){
                SEData.SharedEventListeners.push( NewSharedListener );
            }
            
        }
        
        return SEData;
        
    };
    
    // check events: hasEventListener task
    var Listeners_Check = function( SEData ){
        
        while( __SE__.ListenersStack_ToCheck.length ){
            
            var ListenerToCheck     = __SE__.ListenersStack_ToCheck.pop();
            var IsListenerExists    = false;
            
            for( var i = 0, l = SEData.SharedEventListeners.length; i < l; i++ ){
                
                var ExistingListener    = SEData.SharedEventListeners[ i ];
                var Checks              = false;
                
                // initial checks
                var CheckType           = ( ExistingListener.Type === ListenerToCheck.SharedListener.Type );
                var CheckListener       = ( JSON.stringify( ExistingListener.Listener ) === JSON.stringify( ListenerToCheck.SharedListener.Listener ) );
                var CheckTarget         = ( ExistingListener.Target === ListenerToCheck.SharedListener.Target );
                
                // main checks
                // if checks only by type
                if ( !ListenerToCheck.SharedListener.Target && !ListenerToCheck.SharedListener.Listener ) {
                    
                    if ( CheckType ) {
                        Checks  = true;
                    }
                    
                // if checks only by type+listener
                } else if ( !ListenerToCheck.SharedListener.Target ) {
                    
                    if ( CheckType && CheckListener ) {
                        Checks = true;
                    }
                    
                // if checks only by type+target
                } else if ( !ListenerToCheck.SharedListener.Listener ) {
                    
                    if ( CheckType && CheckTarget ) {
                        Checks = true;
                    }
                
                // if full check
                } else if ( ListenerToCheck.SharedListener.Target && ListenerToCheck.SharedListener.Listener ) {
                    
                    if ( CheckType && CheckListener && CheckTarget ) {
                        Checks = true;
                    }
                    
                }
                
                // checks result
                if ( Checks ){
                    IsListenerExists = true;
                    break;
                }
                
            }
            
            if ( IsListenerExists ){
                
                ListenerToCheck.Callback.call( __SE__ , true );
                
            } else {
                
                ListenerToCheck.Callback.call( __SE__ , false );
                
            }
            
        }
        
        return SEData;
        
    };
    
    // remove events: removeEventListener task
    var Listeners_Remove   = function( SEData ){
        
        if ( !__SE__.ListenersStack_ToRemove.length ) return SEData;
        
        var ActualListeners     = [];
        
        while( __SE__.ListenersStack_ToRemove.length ){
            
            var ListenerToRemove    = __SE__.ListenersStack_ToRemove.pop();
            
            var RemoveByType        = ListenerToRemove.SharedListener.Type;
            var RemoveByTarget      = ListenerToRemove.SharedListener.Target;
            var RemoveByListener    = ListenerToRemove.SharedListener.Listener;
            
            for ( var i = 0, l = SEData.SharedEventListeners.length; i < l; i++ ){
                
                var ListenerToCheck = SEData.SharedEventListeners[ i ];
                var ShouldBeRemoved = false;
                
                // initial checks
                var CheckType       = ( RemoveByType        === ListenerToCheck.Type                ) ? true : false ;
                var CheckTarget     = ( RemoveByTarget      === ListenerToCheck.Target              ) ? true : false ;
                var CheckListener   = ( RemoveByListener    === ListenerToCheck.Listener.toString() ) ? true : false ;
                
                // check by type && target && listener
                if ( RemoveByType && RemoveByTarget && RemoveByListener ){
                    
                    ShouldBeRemoved = ( CheckType && CheckTarget && CheckListener ) ? true : false ;
                    
                // check by type && target
                } else if ( RemoveByType && RemoveByTarget ) {
                    
                    ShouldBeRemoved = ( CheckType && CheckTarget ) ? true : false ;
                    
                // check by type && listener
                } else if ( RemoveByType && RemoveByListener ) {
                    
                    ShouldBeRemoved = ( CheckType && CheckListener ) ? true : false ;
                    
                // check only by type
                } else if ( RemoveByType ) {
                    
                    ShouldBeRemoved = ( CheckType ) ? true : false ;
                    
                }
                
                // checks result
                if ( !ShouldBeRemoved ){
                    
                    ActualListeners.push( ListenerToCheck );
                    
                }
                
            }
            
            ListenerToRemove.Callback.call( ROOT , true );
            
        }
        
        SEData.SharedEventListeners = ActualListeners;
        
        return SEData;
        
    };
    
    // emitt new events to storage...
    var Events_Emit     = function( SEData ){
        
        while( __SE__.EventsStack_ToEmit.length ){
            
            var Event       = __SE__.EventsStack_ToEmit.pop();
            var EventScope  = ( Event.Target === __SE__.GID )
                                ? 'Global' 
                                : 'Local' ;
            
            SEData[ 'EventsEmitted_' + EventScope ].push( Event );
            
        }
        
        return SEData;
        
    };
    
    // check and run events on this tab...
    var Listeners_Run      = function( SEData ){

        var CurrentTabName      = __SE__.Name;
        
        // Collecting both events listeners: shared and this tab local listeners.
        var CurrentListeners    = {};
        
        // collecting local listeners
        for ( var Key in __SE__.EventListeners ){
            
            if ( Object.prototype.hasOwnProperty.call( __SE__.EventListeners , Key ) ){
                CurrentListeners[ Key ] = __SE__.EventListeners[ Key ].slice( 0 );
            }
            
        }
        
        // collecting SharedEventListeners
        var SharedEventListeners    = SEData.SharedEventListeners;
        
        for ( var i = 0, l = SharedEventListeners.length; i < l; i++ ){
            
            var SharedListener = SharedEventListeners[ i ];
            
            if ( SharedListener.Target === CurrentTabName || SharedListener.Target === __SE__.GID || SharedListener.Target === __SE__.ID ){
                
                if ( CurrentListeners[ SharedListener.Type ] === undefined ){
                    CurrentListeners[ SharedListener.Type ] = [];
                }
                
                CurrentListeners[ SharedListener.Type ].push( SharedListener );
                
            }
            
        }
        
        // ...now we got an object, which contains all actual listeners...
        // Collecting both events: global and specified for this tab name.
        var CurrentEvents       = [];
        
        // collecting global events first
        for ( var i = 0, l = SEData.EventsEmitted_Global.length; i < l; i++ ){
            
            // if event is not FIRED on this tab
            if ( SEData.EventsEmitted_Global[ i ].CheckedBy.indexOf( __SE__.ID ) === -1 ){
                
                CurrentEvents.push( SEData.EventsEmitted_Global[ i ] ); // send to run
                SEData.EventsEmitted_Global[ i ].CheckedBy.push( __SE__.ID ); // mark as checked
                
            }
            
        }
        
        // now collecting local events, specified for this tab name
        for ( var i = 0, l = SEData.EventsEmitted_Local.length; i < l; i++ ){
            
            // if event is not CHECKED on this tab
            if ( SEData.EventsEmitted_Local[ i ].CheckedBy.indexOf( __SE__.ID ) === -1 ){
                
                SEData.EventsEmitted_Local[ i ].CheckedBy.push( __SE__.ID ); // mark as checked
                
                if ( SEData.EventsEmitted_Local[ i ].Target === CurrentTabName ){
                    CurrentEvents.push( SEData.EventsEmitted_Local[ i ] ); // send to run, if event sent for current tabName
                }
                
            }
            
        }
        
        // Here we got an object, which contains all actual listeners ...
        // ... and all events, which we should run on this tab.
        // ... so run them!
        for ( var i = 0, l = CurrentEvents.length; i < l; i++ ){
            
            var CurrentEventListeners   = ( CurrentListeners[ CurrentEvents[ i ].Type ] !== undefined ) 
                                            ? CurrentListeners[ CurrentEvents[ i ].Type ] 
                                            : false ;
            
            if ( CurrentEventListeners && CurrentEventListeners instanceof Array ){
                
                for ( var L_i = 0, L_l = CurrentEventListeners.length; L_i < L_l ; L_i++ ){
                    
                    var Listener = CurrentEventListeners[ L_i ];
                    
                    if ( typeof( Listener ) === 'function' ){ // local listeners stored as functions
                        
                        Listener.call( ROOT , CurrentEvents[ i ].Data );
                        
                    } else if ( typeof( Listener ) === 'object' ){ // shared listeners stored as objects with string functions
                        
                        eval( '(' + Listener.Listener + ')' ).call( ROOT , CurrentEvents[ i ].Data );
                        
                    }
                    
                }
                
            }
            
        }
        
        return SEData;
        
    };
    
    // Remove all checked/runned/timeouted events.
    var Events_Clear    = function( SEData ){
        
        var ActiveTabsIDs   = [];
        
        for( var i = 0, l = SEData.Tabs.length; i < l; i++ ){
            ActiveTabsIDs.push( SEData.Tabs[ i ].ID );
        }
        
        // Prevention of code duplication: events validator.
        var GetValidEvents = function( EventsEmitted , ActiveTabsIDs ){
            
            var ValidEvents = [];
            
            for ( var i = 0, l = EventsEmitted.length; i < l; i++ ){
                
                // check for tabs emitting
                var IsEventCheckedByAllTabs = true;
                for( var AT_i = 0, AT_l = ActiveTabsIDs.length; AT_i < AT_l; AT_i++ ){
                    
                    if ( EventsEmitted[ i ].CheckedBy.indexOf( ActiveTabsIDs[ AT_i ] ) === -1 ){
                        IsEventCheckedByAllTabs = false;
                        break;
                    }
                    
                }
                
                if ( !IsEventCheckedByAllTabs ){
                    ValidEvents.push( EventsEmitted[ i ] );
                    continue;
                }
                
            }
            
            return ValidEvents;
            
        };
        
        // update storage data
        SEData.EventsEmitted_Global = GetValidEvents( SEData.EventsEmitted_Global   , ActiveTabsIDs );
        SEData.EventsEmitted_Local  = GetValidEvents( SEData.EventsEmitted_Local    , ActiveTabsIDs );
        
        return SEData;
        
    };
    
    var Listeners_Clear = function( SEData ){
        
        var ActiveTabsIDs   = [];
        
        for( var i = 0, l = SEData.Tabs.length; i < l; i++ ){
            ActiveTabsIDs.push( SEData.Tabs[ i ].ID );
        }
        
        var ActiveListeners = [];
        for ( var i = 0, l = SEData.SharedEventListeners.length; i < l; i++ ) {
            if ( ActiveTabsIDs.indexOf( SEData.SharedEventListeners[ i ].Sender.ID ) !== -1 ){
                ActiveListeners.push( SEData.SharedEventListeners[ i ] );
            }
            
        }
        
        SEData.SharedEventListeners = ActiveListeners;
        
        return SEData;
        
    };
    
    var CheckRevision   = function( SEData ){
        
        if ( SEData.SE_Revision === undefined || SEData.SE_Revision !== SE_REVISION ){
            
            // Clear all __SE__ stored data if current data revision checks failed.
            __SE__.clear();
            SEData = UnpackSEData();
            
        }
        
        return SEData;
        
    };
    
    // Some creepy spells...
    var UpdateConfig    = function( SEData ){
        
        // All checks for inner configuration actuality are implemented in getters of configuration vars.
        // So, we just should ask them about their values.
        var TempValue;
            TempValue   = __SE__.Sync;
            TempValue   = __SE__.TabTimeoutMult;
            TempValue   = __SE__.SLockTimeoutMult;
            delete      TempValue;
        
        if ( PrivateVars.SharedConfigDeprecated === false ) {
            return SEData;
        }
        
        if ( PrivateVars.Sync_buffer ){
            __SE__.Sync                         = PrivateVars.Sync_buffer;
            PrivateVars.Sync_buffer             = false;
        }
        
        if ( PrivateVars.TabTimeoutMult_buffer ){
            __SE__.TabTimeoutMult               = PrivateVars.TabTimeoutMult_buffer;
            PrivateVars.TabTimeoutMult_buffer   = false;
        }
        
        if ( PrivateVars.SLockTimeoutMult_buffer ){
            __SE__.SLockTimeoutMult             = PrivateVars.SLockTimeoutMult_buffer;
            PrivateVars.SLockTimeoutMult_buffer = false;
        }
        
        SEData.Config.Sync              = __SE__.Sync;
        SEData.Config.TabTimeoutMult    = __SE__.TabTimeoutMult;
        SEData.Config.SLockTimeoutMult  = __SE__.SLockTimeoutMult;
        
        for ( var i = 0, l = SEData.Tabs.length; i < l; i++ ) {
            
            if ( SEData.Tabs[ i ].ID === __SE__.ID ){
                
                SEData.Tabs[ i ].ConfigCache.Sync               = __SE__.Sync;
                SEData.Tabs[ i ].ConfigCache.TabTimeoutMult     = __SE__.TabTimeoutMult;
                SEData.Tabs[ i ].ConfigCache.SLockTimeoutMult   = __SE__.SLockTimeoutMult;
                
            }
            
        }
        
        PrivateVars.SharedConfigDeprecated  = false;
        
        return SEData;
        
    };
    
    // Main worker.
    var SEWorker        = function(){
        
        // Prevention of unneeded locking of storage.
        // __SE__.CallsToPass value is defined in "CheckTurn" function.
        if ( --__SE__.CallsToPass > 0 ){
            return;
        }
        
        var SEData              = UnpackSEData();
        
        if ( SEData === false ) return;
        
            SEData              = CheckRevision ( SEData );
            SEData              = CheckTabs     ( SEData );
        var IsCurrentTabTurn    = CheckTurn     ( SEData );
        
        if ( IsCurrentTabTurn ){
            
            PrivateVars.RunningNow      = true;
            
            SEData  = Listeners_Clear   ( SEData );
            
            SEData  = Listeners_Add     ( SEData );
            SEData  = Listeners_Check   ( SEData );
            SEData  = Listeners_Remove  ( SEData );
            SEData  = Events_Emit       ( SEData );
            
            SEData  = Listeners_Run     ( SEData );
            SEData  = Events_Clear      ( SEData );
            
            SEData  = SetTabChecked     ( SEData );
            
            // Here we cast a black magic spell to summon the Demons of Configuration Synchronization.
            SEData  = UpdateConfig      ( SEData );
            
            PrivateVars.RunningNow      = false;
            
        }
        
        SEData.Lock                     = 0;
        PackSEData                      ( SEData );
        
    };
    
    /*
    * __SE__ events module.
    * 
    * Partially based on fork of old version of EventDispatcher.js:
    *   https://github.com/Sombressoul/eventdispatcher.js/blob/master/src/EventDispatcher.js
    * 
    * Originally written by Mr.doob: https://github.com/mrdoob/eventdispatcher.js
    */
    var __SE__                          = {};
        __SE__.ID                       = GenerateID();
        __SE__.GID                      = undefined;    // Will be initialized by its setter/getter on startup.
        __SE__.Name                     = undefined;    // Will be initialized by its setter/getter on startup.
        __SE__.SelfExecution            = undefined;    // Will be initialized by its setter/getter on startup.
        __SE__.Sync                     = undefined;    // Will be initialized by its setter/getter on startup.
        __SE__.TabTimeoutMult           = undefined;    // Will be initialized by its setter/getter on startup.
        __SE__.SLockTimeoutMult         = undefined;    // Will be initialized by its setter/getter on startup.
        __SE__.EventListeners           = {};
        __SE__.EventsStack_ToEmit       = [];
        __SE__.ListenersStack_ToAdd     = [];
        __SE__.ListenersStack_ToCheck   = [];
        __SE__.ListenersStack_ToRemove  = [];
        __SE__.ActiveTabsCount          = 0;
        __SE__.CallsToPass              = 0;
        __SE__.Revision                 = SE_REVISION;
    
    // Private variables.
    var PrivateVars                         = {};
        PrivateVars.ID                      = undefined;
        PrivateVars.Name                    = undefined;
        PrivateVars.RunningNow              = true;
        PrivateVars.SelfExecution           = undefined;
        PrivateVars.SharedConfigDeprecated  = false;
        PrivateVars.Sync                    = undefined;
        PrivateVars.Sync_buffer             = undefined;
        PrivateVars.TabTimeoutMult          = undefined;
        PrivateVars.TabTimeoutMult_buffer   = undefined;
        PrivateVars.SLockTimeoutMult        = undefined;
        PrivateVars.SLockTimeoutMult_buffer = undefined;
    
    __SE__.clear            = function(){
        
        localStorage.removeItem( LOCAL_STORAGE_SEDATA_KEY );
        
    };
    
    __SE__.getActiveTabs    = function(){
        
        return UnpackSEData( true ).Tabs;
        
    };
    
    __SE__.addEventListener = function( Type , Listener , TabName ){
        
        CheckType           ( Type );
        CheckListener       ( Listener );
        
        if ( arguments.length > 2 ){ // as shared listener
            
            // if target tab name is FALSE - use this listener as global
            var TabName         = ( TabName === false ) ? __SE__.GID : TabName ;
            
            CheckTabName        ( TabName );
            
            var SharedListener  =
                {
                    Type        : Type ,
                    Target      : TabName ,
                    Listener    : Listener.toString() ,
                    Sender      :
                        {
                            Name    : __SE__.Name ,
                            ID      : __SE__.ID
                        }
                }
            
            __SE__.ListenersStack_ToAdd.push( SharedListener );
            
        } else { // as local listener
            
            if ( __SE__.EventListeners[ Type ] === undefined ){
                
                __SE__.EventListeners[ Type ] = [];
                
            }
            
            if ( __SE__.EventListeners[ Type ].indexOf( Listener ) === -1 ){
                
                __SE__.EventListeners[ Type ].push( Listener );
                return true;
                
            } else {
                
                return false;
                
            }
            
            
        }
        
        
    };
    
    __SE__.hasEventListener = function( Type , Listener , TabName , Callback ){
        
        var TabName         = TabName   || false;
        var Callback        = Callback  || false;
        var Listener        = Listener  || false;
        
        CheckType           ( Type );
        
        if ( arguments.length > 2 ){ // check shared events
        
            CheckCallback   ( Callback );
            
            var SharedListener  =
                {
                    Type        : Type ,
                    Target      : TabName ,
                    Listener    : ( Listener )
                                    ? Listener.toString() 
                                    : false
                }
            
            var ToCheck =
                {
                    SharedListener  : SharedListener ,
                    Callback        : Callback
                }
            
            __SE__.ListenersStack_ToCheck.push( ToCheck );
            
        } else { // check local events
            
            if ( __SE__.EventListeners[ Type ] === undefined ){
                
                return false;
                
            } else if ( __SE__.EventListeners[ Type ] !== undefined && !Listener ){ // if checks only by type
                
                return ( ( __SE__.EventListeners[ Type ].length > 0 ) ? true : false );
                
            } else {
                
                if ( __SE__.EventListeners[ Type ].indexOf( Listener ) !== -1 ){ // if checks by type and listener
                    
                    return true;
                    
                } else {
                    
                    return false;
                    
                }
                
            }
            
        }
        
    };
    
    __SE__.removeEventListener = function( Type , Listener , TabName , Callback ){
        
        var Listener        = Listener  || false;
        var TabName         = TabName   || false;
        
        CheckType           ( Type );
        
        if ( arguments.length > 2 ){ // remove shared
            
            CheckCallback   ( Callback );
            
            var SharedListener  =
                {
                    Type        : Type ,
                    Target      : TabName ,
                    Listener    : ( Listener )
                                    ? Listener.toString() 
                                    : false
                }
            
            var ToRemove =
                {
                    SharedListener  : SharedListener ,
                    Callback        : Callback
                }
            
            __SE__.ListenersStack_ToRemove.push( ToRemove );
                
        } else { // remove local
            
            if ( __SE__.EventListeners[ Type ] === undefined ){ // no listeners === listener is removed
                
                return true;
                
            // if we need to remove all listeners of specified type
            } else if ( __SE__.EventListeners[ Type ] !== undefined && !Listener ) {
                
                __SE__.EventListeners[ Type ].length = 0;
                return true;
                
            // if we need to remove specified listener of specified type    
            } else {
                
                var ListenerIndex = __SE__.EventListeners[ Type ].indexOf( Listener );
                
                if ( ListenerIndex !== -1 ){
                    
                    __SE__.EventListeners[ Type ].splice( ListenerIndex , 1 );
                    
                }
                
                // In anyway, did listener been removed or it just didn't exists - it's not exists NOW...
                // ...so, return TRUE.
                return true;
                
            }
            
        }
        
    };
    
    __SE__.dispatchEvent = function( Type , Data , TabName ){
        
        var TabName         = TabName   || __SE__.GID; // If tab name is not sent - emit event as global.
        var Data            = Data      || false;
        
        CheckType           ( Type );
        CheckTabName        ( TabName );
        
        var Event           = CreateEvent( Type , Data , TabName );
        
        __SE__.EventsStack_ToEmit.push( Event );
        
    };
    
    // Defining config setters/getters.
    var SelfExecution_Setter    = function( v ){
        
        PrivateVars.SelfExecution   = ( v ) ? true : false ; 
        
    };
    
    var SelfExecution_Getter    = function(){
        
        PrivateVars.SelfExecution   = ( PrivateVars.SelfExecution === undefined ) 
                                        ? false 
                                        : PrivateVars.SelfExecution ; 
        return PrivateVars.SelfExecution;
        
    };
    
    var Name_Setter             = function( v ){
        
        CheckTabName( v ); 
        
        var OldName         = PrivateVars.Name; 
        
        PrivateVars.Name    = v;
        
        if ( v !== DEFAULT_TAB_NAME ){
            __SE__.dispatchEvent( 'tabNameChanged' , { Name: v , ID: __SE__.ID , OldName: OldName } , __SE__.GID );
        }
        
    };
    
    var Name_Getter             = function(){
        
        PrivateVars.Name    = ( PrivateVars.Name === undefined )
                                ? DEFAULT_TAB_NAME
                                : PrivateVars.Name ;
        return PrivateVars.Name;
        
    };
    
    var GID_Setter              = function( v ){
        return false;
    };
    
    var GID_Getter              = function(){
        return GLOBAL_IDENTIFIER;
    };
    
    var Sync_Setter             = function( v ){
        
        if ( v===+v && v===(v|0) ){
            
            if ( PrivateVars.RunningNow ){
                
                PrivateVars.Sync = parseInt( v , 10 );
                
            } else {
                
                PrivateVars.Sync_buffer             = parseInt( v , 10 );
                PrivateVars.SharedConfigDeprecated  = true;
                return;
                
            }
            
        } else {
            throw new Error( '__SE__: sync value should be an integer. Value was sent: ' + v );
        }
        
        if ( __SE__.Worker !== undefined ){
            
            __SE__.Worker.postMessage( 'suicide' );
            
        } else {
            
            CreateWebWorker();
            
        }
        
        PrivateVars.SharedConfigDeprecated = true;
        
    };
    
    var Sync_Getter             = function(){
        
        if ( PrivateVars.Sync === undefined ){
            PrivateVars.Sync = DEFAULT_WORKER_INTERVAL;
        }
        
        var SharedConfig = GetConfig();
        if ( SharedConfig !== false && SharedConfig.Sync !== PrivateVars.Sync && !PrivateVars.SharedConfigDeprecated ){
            
            __SE__.Sync = SharedConfig.Sync;
            
        }
        
        return PrivateVars.Sync;
        
    };
    
    var TabTimeoutMult_Setter   = function( v ){
        
        if ( v===+v && v===(v|0) ){
            
            if ( PrivateVars.RunningNow ){
                
                PrivateVars.TabTimeoutMult = parseInt( v , 10 );
                
            } else {
                
                PrivateVars.TabTimeoutMult_buffer   = parseInt( v , 10 );
                PrivateVars.SharedConfigDeprecated  = true;
                return;
                
            }
            
        } else {
            throw new Error( '__SE__: tab timeout multiplier should be an integer. Multiplier was sent: ' + v );
        }
        
        PrivateVars.SharedConfigDeprecated = true;
        
    };
    
    var TabTimeoutMult_Getter   = function(){
        
        if ( PrivateVars.TabTimeoutMult === undefined ){
            PrivateVars.TabTimeoutMult = DEFAULT_TAB_TIMEOUT_MULTIPLIER;
        }
        
        var SharedConfig = GetConfig();
        if ( SharedConfig !== false && SharedConfig.TabTimeoutMult !== PrivateVars.TabTimeoutMult && !PrivateVars.SharedConfigDeprecated ){
            
            __SE__.TabTimeoutMult = SharedConfig.TabTimeoutMult;
            
        }
        
        return PrivateVars.TabTimeoutMult;
        
    };
    
    var SLockTimeoutMult_Setter = function( v ){
        
        if ( v===+v && v===(v|0) ){
            
            if ( PrivateVars.RunningNow ){
                
                PrivateVars.SLockTimeoutMult = parseInt( v , 10 );
                
            } else {
                
                PrivateVars.SLockTimeoutMult_buffer = parseInt( v , 10 );
                PrivateVars.SharedConfigDeprecated  = true;
                return;
                
            }
            
        } else {
            throw new Error( '__SE__: storage lock timeout multiplier should be an integer. Multiplier was sent: ' + v );
        }
        
        PrivateVars.SharedConfigDeprecated = true;
        
    };
    
    var SLockTimeoutMult_Getter = function(){
        
        if ( PrivateVars.SLockTimeoutMult === undefined ){
            PrivateVars.SLockTimeoutMult = DEFAULT_STORAGE_LOCK_MULTIPLIER;
        }
        
        var SharedConfig = GetConfig();
        if ( SharedConfig !== false && SharedConfig.SLockTimeoutMult !== PrivateVars.SLockTimeoutMult && !PrivateVars.SharedConfigDeprecated ){
            
            __SE__.SLockTimeoutMult = SharedConfig.SLockTimeoutMult;
            
        }
        
        return PrivateVars.SLockTimeoutMult;
        
    };
    
    var ID_Setter               = function( v ){
        
        if ( PrivateVars.ID === undefined ){
            
            PrivateVars.ID = v;
            
        }           
        
        return ( PrivateVars.ID ? PrivateVars.ID : __SE__.ID );
        
    };
    
    var ID_Getter               = function(){
        
        if ( PrivateVars.ID === undefined ){
            PrivateVars.ID = GenerateID();
        }
        
        return PrivateVars.ID;
    };
    
    Object.defineProperty( __SE__ , 'GID'               , { set: GID_Setter                 , get: GID_Getter               } );
    Object.defineProperty( __SE__ , 'ID'                , { set: ID_Setter                  , get: ID_Getter                } );
    Object.defineProperty( __SE__ , 'Name'              , { set: Name_Setter                , get: Name_Getter              } );
    Object.defineProperty( __SE__ , 'SelfExecution'     , { set: SelfExecution_Setter       , get: SelfExecution_Getter     } );
    Object.defineProperty( __SE__ , 'SLockTimeoutMult'  , { set: SLockTimeoutMult_Setter    , get: SLockTimeoutMult_Getter  } );
    Object.defineProperty( __SE__ , 'Sync'              , { set: Sync_Setter                , get: Sync_Getter              } );
    Object.defineProperty( __SE__ , 'TabTimeoutMult'    , { set: TabTimeoutMult_Setter      , get: TabTimeoutMult_Getter    } );
    
    // It is not obvious, but the next line it is a point, where the application execution starts... :-)
    __SE__.Sync = __SE__.Sync;
    
    // ...and sends its instance into the root object.
    ROOT.__SE__ = __SE__;
    
}).call( window );