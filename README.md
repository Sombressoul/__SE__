\_\_SE\_\_ (SharedEvents)
======

JavaScript library for exchange events, data and tasks between browser tabs.

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
