/* Handles the Slideshow object. I just stubbed this here as a guide
* if this handled the logic of the slideshow, there should be a
* neemo.ui.Slideshow.Display that would handle what came to the screen
* Also, it listens for ChangeRegion event to know when to flip images
*/
Neemo.modules.Slideshow = function(neemo) {
  neemo.ui.Slideshow = {};
  neemo.ui.Slideshow.Engine = Class.extend(
    {
    init: function(bus, api, region) {
      var that = this;
      this._bus = bus;
      this._api = api;
      this._base_image_url = '/regions/';
      this._region = 0;
      this._regions = {};
      this._forwardBuffer = 4;
      this._min = 1;
      this._max = 8;
      this._previousButton = 1; //used to enable (1) and disable (0) the nav buttons
      this._nextButton = 1;
      /* I think all elsewhere now
      this.width  = 800;
      this.height = 600;
      this.speed  = 500;
      this.i = 0;
      this.margin = -196;
      this.moving = false;
      this.easingMethod = null, // 'easeInExpo',
      this.numberOfRegions = 5;
      this._canvasid = 'region-focus-image';
      */
    },

    _bindEvents: function(){
      var that = this
      , bus = this._bus;
      bus.addHandler(
        'ChangeRegion',
        function(event){
          neemo.log.info('Change Region happened, I should flip images');
          var old_region = that._region;
          that._region = event.getRegion();

          //$("#slideshow div.selected").removeClass("selected");

          var url = that._base_image_url;
          if (old_region < that._region){
              that.scrollForward(url, event.getRegion());
          }else{
              that.scrollBack(url, event.getRegion());
          }
        }
      );
      bus.addHandler(
        'RegionOverview',
        function(data){
            data = data.getData();
            if (that._regions[data.region_id]){
                var Region = that._regions[data.region_id];
                for (i in data.categories){
                    if (data.categories[i].count > 0){
                        Region.setCategoryValue(data.categories[i].id, data.categories[i].name, data.categories[i].count);
                        //Region.incrCategoryValue(data.categories[i].id, data.categories[i].name, 1)
                    }
                }
            }
        }
      );
      bus.addHandler(
        'AddPoints',
        function(data){
            data = data.getData();
            if (that._regions[data.region_id]){
                var Region = that._regions[data.region_id];
                for (i in data.categories){
                    if (data.categories[i].count > 0){
                        //Region.setCategoryValue(data.categories[i].id, data.categories[i].name, data.categories[i].count);
                        Region.incrCategoryValue(data.categories[i].id, data.categories[i].name, data.categories[i].count);
                    }
                }
            }
        }
      );
      bus.addHandler(
        'RegionClick',
        function(event){
          neemo.log.info('Click Region happened');
        }
      );
      this._nav.getNextButton().click(function(){
          if (that._nextButton == 1){
              that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region + 1}));
          }
        }
      );
      this._nav.getPreviousButton().click(function(){
          if (that._previousButton == 1){
              that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region - 1}));
          }
        }
      );
    },
    _getClickOffset: function(event){
        var x;
        var y;
        if (event.pageX || event.pageY) {
          x = event.pageX;
          y = event.pageY;
        }
        else {
          x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
          y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        var el = this._display.getElement(this._canvasid);
        x -= el[0].offsetLeft;
        y -= el[0].offsetTop;

        return [x,y];
    },
    _canvasClick: function(event){
      var x, y, c;
      c = this._getClickOffset(event);
      x = c[0]
      y = c[1]
      var lat = 90 - (180.0 * y)/this._height;
      var lon = -180 + (360.0 * x)/this._width;
      var data = {lat: lat, lon: lon, click_x: x, click_y: y};
      ///TODO method not implemented yet
      this._bus.fireEvent(new Neemo.env.events.RegionClick(data));
      //testing here, fireEvent(new Neemo.env.events.RegionClick({region: 2}))
    },

    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
      //$('#' + this._canvasid).click(function(e){that._canvasClick(e)});
    },
    _bindNav: function(nav) {
      var that = this;
      this._nav = nav;
      nav.setEngine(this);
      //$('#' + this._canvasid).click(function(e){that._canvasClick(e)});
    },

    start: function() {
      this._bindDisplay(new neemo.ui.Slideshow.Display({
            width: this.width,
            height: this.height,
            speed: this.speed,
            i: this.i,
            margin: this.margin,
            moving: this.moving,
            easingMethod: this.easingMethod,
            numberOfRegions: this.numberOfRegions,
        }));
      this._bindNav(new neemo.ui.Slideshow.Nav());
      this._bindEvents();
    },
    addRegion: function(url, id){
      var that = this;
      if (!(id in this._regions)) {
          var Region = new neemo.ui.Slideshow.Region(url, id, this._bus);
          if (!(id in this._regions)) {
              this._display.addRegion(Region.getElement());
              if (id < this._max){
                  Region.enableNextButton();
              }
          }
          Region.start();
          this._regions[id] = Region;
      }
    },
    _toggleButtons: function(id){
      if (id == this._min){
          this._previousButton = 0;
      } else if (id == this._min + 1) {
          this._previousButton = 1;
      } else if (id == this._max){
          this._nextButton = 0;
      } else if (id == this._max - 1) {
          this._nextButton = 1;
      }
    },
    queueRegion: function(id){
      /* sets the focus on a new region*/
      this._regions[id].queue();
      this._toggleButtons(id);
    },
    selectRegion: function(id){
      /* sets the focus on a new region*/
      this._regions[id].focus();
      this._toggleButtons(id);
    },
    bufferForward: function(url, id){
      /* should buffer the images forward so they will be in place when scroll 
       * probably a step process 
       * n -> x would all be loaded and queued
       * n -> x-v would then be displayed
       */
       var i = id + 1;
       while (i < id + this._forwardBuffer & i < this._max){
           this.addRegion(url, i);
           i++;
       }
    },
    scrollForward: function(url, id){
      var that = this;
      this.addRegion(url,id);
      this.queueRegion(id);
      this.bufferForward(url, id);
      neemo.slideshowUtil.hideAside(neemo.slideshowUtil.forwardSlideEffect);
    },
    scrollBack: function(url, id){
        this.addRegion(url,id);
        this.queueRegion(id);
        neemo.slideshowUtil.hideAside(neemo.slideshowUtil.backSlideEffect);
    }, 
  }
  );
  neemo.ui.Slideshow.Region = neemo.ui.Display.extend(
    {
    init: function(url, id, bus) {
      this.id = id;
      this._bus = bus;
      this._image = new Image();
      this._image.src = [url, id, '.jpg'].join('');
      this._super(this._html());
      $(this.getElement()).find('.photo').append(this._image);
      this._categories = {};
    },
    getNextButton: function(){
        //cache here
        return $(this.getElement()[0]).find('.next');
    },
    enableNextButton: function(){
        var that = this;
        $(this.getNextButton()).click(function(){
            that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that.id + 1}));
        });
    },
    start: function(url){
      this._image.onload = function() {
      }
    },
    _getCategory: function(id){
        var x = $(this.getElement()).find('.' + id);
        if (x.length == 0){
            x = this._addCategory(id);
        }
        return x;
    },
    _addCategory: function(id){
        var newCategory = $('<li class="'+id+'"></li>');
        $(this.getElement()).find('ul').append(newCategory);
        return newCategory
    },
    setCategoryValue: function(id, name, value){
        var c = this._getCategory(id);
        c.html('<span class="count">'+value+'</span>'+name+'');
    },
    incrCategoryValue: function(id, name, value){
        var c = this._getCategory(id),
            v = c.find('.count');
        if (v.length > 0){
            var new_value = value + parseInt(v.text());
            c.html('<span class="count">'+new_value+'</span>'+name+'');
        } else {
            c.html('<span class="count">'+value+'</span>'+name+'');
        }
        /* Just a highlighting function I tossed in for now, will remove */
        v = c.find('.count');
        $(v).addClass('highlight');
        $(v).animate({
            opacity: 0.95,
        }, 2000, function() {
            $(this).removeClass('highlight');
        });
  
    },
    focus: function(){
        $("#slideshow div.selected").removeClass("selected");
        $(this.getElement()).addClass('selected');
    },
    queue: function(){
        $("#slideshow div.queued").removeClass("queued");
        $(this.getElement()).addClass('queued');
    },
    _html: function() {
      return  '<div class="image">' +
                '<div class="photo"></div>' +
                '<aside> '+
                    '<ul> '+
                    '</ul> '+
                    '<a href="#" class="next"><div class="icon"></div>Next</a> '+
               '</aside>' +
               '</div>';
    }
  }
  );

  neemo.ui.Slideshow.Nav = neemo.ui.Display.extend(
      /* Define the 'Previous' and 'Next' button UI elements */
    {
    init: function() {
      this._super($('<nav>'));
      this.getElement().html(this._html());
      $('body').append(this.getElement());
      this._next;
      this._previous;
    },
    getNextButton: function(){
        if (! this._next){
            this._next = $(this.getElement()[0]).find('.next');
        }
        return this._next;
    },
    getPreviousButton: function(){
        if(! this._previous){
            this._previous = $(this.getElement()).find('.previous');
        }
        return this._previous;
    },
    disable: function(id){
          console.log('disabled');
        $(this.getElement()).find('.'+id).attr("disabled", "disabled");
    },
    enable: function(id){
        $(this.getElement()).find('.'+id).removeAttr("disabled");
    },
    _html: function() {
      return  '<a href="#" class="previous">Previous</a>' +
                    '<a href="#" class="next">Next</a>';
    }
  }
  );

  /**
  * The slideshow display.
  */
  neemo.ui.Slideshow.Display = neemo.ui.Display.extend(
      /* Provides the slideshow wrapper, append, prepend, and remove options */
    {
    init: function(config) {
      this.config = config;
      this._super($("#slideshow"));
    },
    addRegion: function(region){
        $(this.getElement()).append($(region));
    },
  }
  );
}

Neemo.modules.slideshowUtil = function(neemo) {
    /* contain DOM specific functions that don't effect the JS organization of the Display.
     * All used by globally directing functions
     */
    neemo.slideshowUtil = {}
    
    neemo.slideshowUtil.config = {
        width: 800,
        margin: -196,
        easingMethod: null,  // 'easeInExpo'
        moving: false
    };
    neemo.slideshowUtil.forwardSlideEffect = function() {
        var that = neemo.slideshowUtil.config;
        $("#slideshow div.selected").removeClass("selected");
        $("#slideshow div.queued").addClass('selected');
        $("#slideshow div.selected").removeClass("queued");
        
        $("#container").scrollTo("+="+(that.width/2 + that.margin) +"px", {duration:250, easing: that.easingMethod, onAfter: function() {
            moving = false;
            neemo.slideshowUtil.showAside();
            //showAside();
        }});
    };
    neemo.slideshowUtil.backSlideEffect = function(){
        var that = neemo.slideshowUtil.config;
        $("#slideshow div.selected").removeClass("selected");
        $("#slideshow div.queued").addClass('selected');
        $("#slideshow div.selected").removeClass("queued");
        if (neemo.slideshowUtil.config.moving === false) {
            neemo.slideshowUtil.config.moving = true;
            $("#container").scrollTo("-="+(that.width/2 + that.margin) +"px", {duration:250, easing: that.easingMethod, onAfter: function() {
                neemo.slideshowUtil.config.moving = false;
                neemo.slideshowUtil.showAside();
            }});
        }
    };
    neemo.slideshowUtil.showAside = function() {
        $("#slideshow div.selected aside").css({height:"400px", right:"59px"});
        $("#slideshow div.selected aside").show(0, function() {
            $(this).delay(200).animate({opacity:1, right:"-59px"}, 250);
        });
    };
    neemo.slideshowUtil.hideAside = function(callback) {
        /* Slideshow inits without a selected div, so add the check here to just fire callback in that case */
        if ($("#slideshow div.selected aside").length > 0){
            $("#slideshow div.selected aside").animate({opactiy:0, right:"100px"}, 250, function() {
                $(this).animate({height:300}, 0, callback);
                $(this).hide();
            });
        } else {
            callback();
        }
    };

};