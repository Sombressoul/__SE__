__SE__ (SharedEvents)
======

JavaScript library for exchange events, data and tasks between browser tabs.

API:
======
Options:
  __SE__.Name             - This tab name.
  __SE__.SelfExecution    - Self-emitting by not _Global events.
  __SE__.Sync             - Background worker interval in ms.
  __SE__.TabTimeoutMult   - Ctrl+F: "Inner relative values".
  __SE__.SLockTimeoutMult - Ctrl+F: "Inner relative values".

Methods:
  __SE__.clear( void );
  __SE__.getActiveTabs( void );

  __SE__.addEventListener     ( Type , Listener [, TabName ] );
  __SE__.hasEventListener     ( Type [, Listener , TabName , Callback ] );
  __SE__.removeEventListener  ( Type [, Listener , TabName , Callback ] );
  __SE__.dispatchEvent        ( Type [, Data , TabName ] );

Constants:
  __SE__.GID              - global events and listeners target ("TabName") identifier.

Default global events:
  tabOpened               - { Name , ID }             as GlobalEvent tabName: __SE__.GID
  tabClosed               - { Name , ID }             as GlobalEvent tabName: __SE__.GID
  tabNameChanged          - { Name , ID , OldName }   as GlobalEvent tabName: __SE__.GID

Inner relative values:
  1) Tab ping timeout expression      :   __SE__.Sync __SE__.ActiveTabsCount __SE__.TabTimeoutMult
  2) Storage lock timeout expression  :   __SE__.Sync __SE__.SLockTimeoutMult
