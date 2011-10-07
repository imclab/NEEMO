/* Handles the UserProfile object. I just stubbed this here as a guide
* if this handled the logic of the userprofile, there should be a
* neemo.ui.UserProfile.Display that would handle what came to the screen
* Also, it listens for ChangeRegion event to know when to flip images
*/
Neemo.modules.UserProfile = function(neemo) {
  neemo.ui.UserProfile = {};
  neemo.ui.UserProfile.Engine = Class.extend(
    {
    init: function(bus, api) {
      var that = this;
      this._bus = bus;
      this._api = api;
      this._profile = {};
    },

    _bindEvents: function(){
      var that = this
      , bus = this._bus;
      bus.addHandler(
        'UpdateUserProfile',
        function(event){
          neemo.log.info('User update recieved');
          data = event.getData();
          that._profile = data;
          that._display.getName().text(data.user_id.toUpperCase());
          that._display.getLevel().text(" Lvl. "+data.user_lvl);
          var s = ''+data.user_rank;
          while (s.length < 4) s = '0'+s;
          that._display.getRank().text("#"+s);
        }
      );
    },
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
    },
    start: function() {
      this._bindDisplay(new neemo.ui.UserProfile.Display());
      this._bindEvents();
    },
  }
  );
  /**
  * The userprofile display.
  */
  neemo.ui.UserProfile.Display = neemo.ui.Display.extend(
      /* UserProfile UI elements */
    {
    init: function() {
      this._super($('.info'));
      $(this.getElement()).append(this._html());
    },
    getName: function(){
      return $(this.getElement()).find('.user-name');
    },
    getLevel: function(){
      return $(this.getElement()).find('.level');
    },
    getActivity: function(){
      return $(this.getElement()).find('ul');
    },
    getRank: function(){
      return $(this.getElement()).find('.score');
    },
    _html: function() {
      return  '<div class="line-through">'+
              '  <h2 class="user-name">n/a</h2>'+
              '  <div class="line"></div>'+
              '</div>'+
              '<div class="progress-bar">'+
              '  <div class="progress"></div>'+
              '</div>'+
              '<span class="level"></span>'+
              '<ul>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '  <li><div class="point">+1</div> <p>you have confirmed a  coral occurence<p></li>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '  <li><div class="point">+5</div> <p>you have found a new coral occurence</p></li>'+
              '</ul>'+
              '<div id="rank-box">'+
              '  <div class="header">'+
              '    <div class="icon trophee"></div>'+
              '    <span class="title">Your rank</span>'+
              '    <div class="line-through">'+
              '      <div class="score">#0000</div>'+
              '      <div class="line"></div>'+
              '    </div>'+
              '  </div>'+
              '</div>';
    }
  }
  );
}
