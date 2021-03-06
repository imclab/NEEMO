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
      this._base_image_url = window.location.protocol + '//neemo.zooniverse.org/srcimages/';
      this._region_key = -1;
      this._track = -1;
      this._region = -1;
      this._regions = {};
      this._forwardBuffer = 3;
      this._min = 0;
      this._max = 10;
      this._previousButton = 1; //used to enable (1) and disable (0) the nav buttons
      this._nextButton = 1; //used to enable (1) and disable (0) the nav buttons
    },

    _bindKeyboard: function() {
      var that = this;

      $(document).keydown(function(e) {
        if (e.keyCode == 40 || e.keyCode == 39 || e.keyCode == 37){
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      });

      $(document).keyup(function(e) {
        if (e.keyCode == 40) { // down arrow
           window.location = "ranking.html";
        } else if (e.keyCode == 39) { // right arrow
          if (that._nextButton == 1){
              //update use region_key to increment the url in the tracks track object
            that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region + 1}));
            that._bus.fireEvent(new Neemo.env.events.HideSelector());
          }
        } else if (e.keyCode == 37) { // left arrow
          if (that._previousButton == 1){
              //update use region_key to increment the url in the tracks track object
            that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region - 1}));
            that._bus.fireEvent(new Neemo.env.events.HideSelector());
          }
        }
      });
    },
    _bindEvents: function(){
      var that = this
      , bus = this._bus;
      bus.addHandler(
        'ChangeRegion',
        function(event){
          neemo.log.info('Change Region happened, I should flip images');
          //update use region_key to increment the url in the tracks track object
          var old_region = that._region;
          that._region = event.getRegion();
          if (that._track == -1){
              that._track = event.getTrack();
              that._max = window.tracks[that._track].length;
          }

          var url = that._base_image_url;
          if (old_region < that._region || old_region == -1){
              that.scrollForward(url, event.getRegion());
          } else{
              that.scrollBack(url, event.getRegion());
          }
        }
      );
      bus.addHandler(
        'RegionOverview',
        function(data){
            data = data.getData();

            var t = '' + (4*(window.tracks[that._track].length - (data.region+1) ));
            var t1 = '' + (t - 1);
            var t2 = '' + (t - 2);
            var t3 = '' + (t - 3);
            if (t < 0) t = '00000';
            while (t.length < 5)   t = '0'+t;
            while (t1.length < 5) t1 = '0'+t1;
            while (t2.length < 5) t2 = '0'+t2;
            while (t3.length < 5) t3 = '0'+t3;

            $('.depth h2').text(t);

            $("#slideshow .image#region_" + data.region + " .depth-line .depth3").html(t3);
            $("#slideshow .image#region_" + data.region + " .depth-line .depth2").html(t2);
            $("#slideshow .image#region_" + data.region + " .depth-line .depth1").html(t1);

            //update use region_key to increment the url in the tracks track object
            if (that._regions[data.region]){
                var Region = that._regions[data.region];
                //Region.resetCounts();
                for (i in data.annotations){
                    Region.setCategoryValue(data.annotations[i].name, data.annotations[i].name, data.annotations[i].total);
                }
            }
        }
      );
      bus.addHandler(
        'RepositionPanels',
        function(data){
          if ($("#slideshow .selected").length > 0) {
           // var left  = $("#slideshow .selected").offset().left - ($(".info").width() + 20 );

            var depthLeft = $("#slideshow div.selected").offset().left + ($("#slideshow .selected").width() + 20 );
            var depthTop = $("#slideshow div.selected").offset().top + 20 ;
            $(".depth").css({top:depthTop, left:depthLeft });

            //if (left > 0) $(".info").stop().animate({left:left }, 500);
            $(".depth").stop().animate({opacity:1}, 500);
          }
        }
      );
      bus.addHandler(
        'AddPoints',
        function(data){
            data = data.getData();
              //update use region_key to increment the url in the tracks track object
            if (that._regions[data.region]){
                var Region = that._regions[data.region];
                if (! data.stored){
                    Region.incrCategoryValue(data.category, data.category, 1);
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
              //update use region_key to increment the url in the tracks track object
              that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region + 1}));
              that._bus.fireEvent(new Neemo.env.events.HideSelector());

          }
        }
      );
      this._nav.getPreviousButton().click(function(){
          if (that._previousButton == 1){
              //update use region_key to increment the url in the tracks track object
              that._bus.fireEvent(new Neemo.env.events.ChangeRegion({region: that._region - 1}));
              that._bus.fireEvent(new Neemo.env.events.HideSelector());
          }
        }
      );


    },
    _bindDisplay: function(display, text) {
      var that = this;
      this._display = display;
      display.setEngine(this);
    },
    _bindNav: function(nav) {
      var that = this;
      this._nav = nav;
      nav.setEngine(this);
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
            numberOfRegions: this.numberOfRegions
        }));
      this._bindNav(new neemo.ui.Slideshow.Nav());
      this._bindEvents();
      this._bindKeyboard();

      var that = this;

      $(window).resize(function() {
       that._bus.fireEvent(new Neemo.env.events.RepositionPanels());
      });

    },
    addRegion: function(url, id, prepend, end){
      var that = this;
      if (!(id in this._regions)) {
          var Region = new neemo.ui.Slideshow.Region(url, id, this._bus, this._track, end);

          this._display.addRegion(Region.getElement(), prepend);

              //update use region_key to increment the url in the tracks track object
          if (id < this._max){
              Region.enableNextButton();
              $(Region.getImage()).click(function(e) {
                that._bus.fireEvent(new Neemo.env.events.ImageClick(e));
                //}
              });
          } else if (id == this._max){
              Region.endTrack();
              $(Region.getImage()).click(function(e) {
                $(Region.getImage()).fadeOut('slow');
                that._bus.fireEvent(new Neemo.env.events.ChangeTrack());
                //}
              });
          }

          Region.start();
          this._regions[id] = Region;
          /*
          if (!prepend){
              var getKey = function(data) {
                  for (var prop in data)
                    return prop;
                };
              var len = 0;
              for (key in this._regions) len++;
              console.log(len);
              while (len > (4*this._forwardBuffer)){
                  console.log('remove');
                 var k = getKey(this._regions);
                 var r = this._regions[k];
                 $(r.getElement()).remove();
                 delete this._regions[k];
                 len--;
              }
          }
          */
      }
    },
    _toggleButtons: function(id){
      //update use region_key to increment the url in the tracks track object
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
       while (i < id + this._forwardBuffer && i <= this._max){
           if (i == this._max){
               this.addRegion(url,i, false, true);
           } else {
               this.addRegion(url, i);
           }
           i++;
       }
    },
    bufferBack: function(url, id){
      /* should buffer the images forward so they will be in place when scroll
       * probably a step process
       * n -> x would all be loaded and queued
       * n -> x-v would then be displayed
       */
       var i = id - 1;
       if (i >= 0){
           this.addRegion(url, i, true);
       }
    },
    scrollForward: function(url, id){
      var that = this;
      this.addRegion(url,id);
      this.queueRegion(id);
      this.bufferForward(url, id);
      this.bufferBack(url, id);

      neemo.slideshowUtil.hideDepthLine(function() {
        neemo.slideshowUtil.hideAside(neemo.slideshowUtil.forwardSlideEffect);
      });
    },
    scrollBack: function(url, id){
        //this.addRegion(url,id);
        this.queueRegion(id);
        neemo.slideshowUtil.hideDepthLine(function() {
          neemo.slideshowUtil.hideAside(neemo.slideshowUtil.backSlideEffect);
        });
        //this.bufferBack(url, id);
    }
  }
  );

  neemo.ui.Slideshow.Region = neemo.ui.Display.extend(
    {
    init: function(url, id, bus, track, end) {
      this.id = id;
      this._bus = bus;
      this._image = new Image();
      this._track = track;
      this._end = end;
      //this._image.src = [url, id, '.jpg'].join('');

      //update use region_key to increment the url in the tracks track object
      if (end){
          this._image.src = '/images/end_of_track.png';
      } else {
          this._image.src = [url, window.tracks[this._track][id]].join('');
      }

      this._super(this._html());

      // Adds region_id to the element
      var $el = $(this.getElement());
      $el.find('.photo').append(this._image);
      $el.attr("id", "region_" + this.id);

      this._categories = {};
      this._bus.fireEvent(new Neemo.env.events.RepositionPanels());

      setTimeout(function() {
       that._bus.fireEvent(new Neemo.env.events.RepositionPanels());
      }, 5000);
    },
    getImage: function(){
      //cache here
      return $(this.getElement()[0]).find('img');
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
    _getCategoryCount: function(id){
      var x = $(this.getElement()).find('.' + id +' .count');
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
      var c = this._getCategoryCount(id);
      c.text(value);
    },
    incrCategoryValue: function(id, name, value){
        var c = this._getCategoryCount(id);
        c.text(value + parseInt(c.text()));
        /* Just a highlighting function I tossed in for now, will remove */
        //v = c.find('.count');
        $(c).addClass('highlight');
        $(c).animate({ opacity: 0.95}, 2000, function() {
            $(this).removeClass('highlight');
        });

    },
    focus: function(){
      $("#slideshow div.selected").removeClass("selected");
      $(this.getElement()).addClass('selected');
      this.resetCounts();
    },
    resetCounts: function(){
        console.log('reset');
        $(this.getElement()).find('.count').each().text(0);
    },
    queue: function(){
        $("#slideshow div.queued").removeClass("queued");
        $(this.getElement()).addClass('queued');
    },
    endTrack: function() {
        var t = $(this.getElement());
        t.find('aside').remove();
        t.find('.depth-line').remove();
    },
    _html: function() {
      return  '<div class="image">' +
                '<div class="photo"></div>' +
                '<div class="depth-line">'+
                   '<div class="depth3"></div>'+
                   '<div class="depth2"></div>'+
                   '<div class="depth1"></div>'+
                '</div>' +
                '<aside> '+
                    '<ul> '+
                    '  <li class="coral"><span class="count">0</span>coral</li> '+
                    '  <li class="barrel"><span class="count">0</span>barrel</li> '+
                    '  <li class="gorgonian"><span class="count">0</span>gorg.</li> '+
                    '  <li class="other"><span class="count">0</span>other</li> '+
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
      this._super($('<div class="temp_nav">'));
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
        $(this.getElement()).find('.'+id).attr("disabled", "disabled");
    },
    enable: function(id){
        $(this.getElement()).find('.'+id).removeAttr("disabled");
    },
    _html: function() {
      return  false;
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
    addRegion: function(region, prepend){
        if (prepend){
            $(this.getElement()).prepend($(region));
        } else {
            $(this.getElement()).append($(region));
        }
    }
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
        margin: -200,
        easingMethod: null,  // 'easeInExpo'
        moving: false
    };

    neemo.slideshowUtil.adjustMargin = function() {
      $("#slideshow").css("margin-left", "600px");
    },
    neemo.slideshowUtil.forwardSlideEffect = function() {
        var that = neemo.slideshowUtil.config;
        $("#slideshow div.selected").removeClass("selected");
        $("#slideshow div.queued").addClass('selected');
        $("#slideshow div.selected").removeClass("queued");

        $("#container").scrollTo("+="+(that.width/2 + that.margin) +"px", {duration:250, easing: that.easingMethod, onAfter: function() {
            moving = false;
            neemo.slideshowUtil.showAside(function() {
              neemo.slideshowUtil.showDepthLine();
            });
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
                neemo.slideshowUtil.showAside(function() {
                  neemo.slideshowUtil.showDepthLine();
                });
            }});
        }
    };
    neemo.slideshowUtil.showAside = function(callback) {
        $("#slideshow div.selected aside").css({height:"400px", right:"59px"});
        $("#slideshow div.selected aside").show(0, function() {
            $(this).delay(200).animate({opacity:1, right:"-59px"}, 250, callback);
        });
    };

    neemo.slideshowUtil.showDepthLine = function() {
      $("#slideshow div.selected .depth-line").animate({opacity:1}, 200);
    };

    neemo.slideshowUtil.hideDepthLine = function(callback) {
      if ($("#slideshow div.selected .depth-line").length > 0){
        $("#slideshow div.selected .depth-line").animate({opacity:0}, 200, callback);
      }   else {
        callback();
      }
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
