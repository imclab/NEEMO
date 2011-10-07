/* Handles the Annotation object. I just stubbed this here as a guide
* if this handled the logic of the annotation, there should be a
* neemo.ui.Annotation.Display that would handle what came to the screen
* Also, it listens for ChangeRegion event to know when to flip images
*/
Neemo.modules.Annotation = function(neemo) {
  neemo.ui.Annotation = {};
  neemo.ui.Annotation.Engine = Class.extend(
    {
    init: function(bus, api, opt) {
      this._bus = bus;
      this._api = api;
      this.x = opt.x;
      this.y = opt.y;
      this.region = opt.region;
      this.width = opt.width ? opt.width : 160;
      this.height = opt.height ? opt.height : 100;
      this.category = opt.category;
      this.transitionSpeed = 250;
    },
    empty: function(){
      this._display.getElement().remove();
      this._display = null;
    },
    _bindEvents: function(){
      var that = this
      , bus = this._bus;

      this.$el.find('.submit').click(function(){
        that._bus.fireEvent(new Neemo.env.events.SubmitData({category: that.category, x: that.x, y: that.y, width: that.$el.width(), height: that.$el.height()}));
        that.remove();
      });

      this.$el.find('.close').click(function() { that.remove(); });

      this.$el.find('.agree').click(function(){
        // TODO
      });

      this.$el.find('.disagree').click(function(){
        // TODO
      });
    },
    remove: function(){
        this.$el.draggable("destroy");
        this.$el.resizable("destroy");
        if(this._display){
            $(this._display.getElement()).fadeOut(this.transitionSpeed, function() { $(this).remove();});
        }
        this._display = null;
    },
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
    },
    start: function($region, burn) {
      this._bindDisplay(new neemo.ui.Annotation.Display());

      this.$el = $(this._display.getElement());
      this.$el.find('.submit').hide();
      this.$el.find('.close').hide();
      this.$el.find('.agree').hide();
      this.$el.find('.disagree').hide();
      this.$el.addClass("region_" + this.region);
      this.setCategory(this.category);

      this._bindEvents();
      var that = this;
      // We create the selection window and place it over the image
      $region.append(this.$el);

      // Centering of the box
      var left = this.x - (this.width / 2);
      var top  = this.y - (this.height / 2);

      this.$el.css({left:0, top:0, height:0, width:0}); // initial position

      // Now we just move the window to its place
      this.$el.animate({width:this.width, height:this.height, opacity:1, left:left, top:top}, 200);

      if (!burn){
        this.$el.addClass("draggable");
        this.$el.draggable({ handle:"controls", containment: 'parent', stop: function(e) { that.onDragEnd(); } });
        this.$el.resizable({ containment: 'parent', minWidth: 80, minHeight: 18, handles: 'nw, se', stop: function(e) { that.onDragEnd(); } });
      }
    },
    clear: function($region){
      this.$el.fadeOut(this.transitionSpeed, function() {
        $(this).clear();
      });
    },
    updateCoordinates: function(){
      this.x = this.$el.position().left + this.$el.width() / 2;
      this.y = this.$el.position().top  + this.$el.height() / 2;
    },
    onDragEnd: function(){
      this.updateCoordinates();
    },
    enableSubmit: function(){
      this.$el.find('.submit').show();
      this.$el.find('.close').show();
    },
    enableVote: function(){
      this.$el.find('.agree').show();
      this.$el.find('.disagree').show();
    },
    setCategory: function(category){
      this.$el.find('.category').text(category);
    }
  }
  );

  neemo.ui.Annotation.Display = neemo.ui.Display.extend(
    {
    init: function() {
      this._super(this._html());
    },
    _html: function() {
      return   '<div class="annotation">'+
                   '<div class="controls">'+
                     '<div class="category"></div>' +
                     '<a href="#" class="submit">Submit</a>'+
                     '<a href="#" class="close">x</a>' +
                     '<a href="#" class="agree"><div class="icon"></div></a>' +
                     '<a href="#" class="disagree"><div class="icon"></div></a>' +
                   '</div>' +
               '</div>';
    }
  }
  );
}