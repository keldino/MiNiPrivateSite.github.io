// we don't add `vjs-playlist-now-playing` in addSelectedClass
// so it won't conflict with `vjs-icon-play
// since it'll get added when we mouse out
const addSelectedClass = function(el) {
  el.addClass('vjs-selected');
};
const removeSelectedClass = function(el) {
  el.removeClass('vjs-selected');

  if (el.thumbnail) {
    videojs.dom.removeClass(el.thumbnail, 'vjs-playlist-now-playing');
  }
};

const upNext = function(el) {
  el.addClass('vjs-up-next');
};

const notUpNext = function(el) {
  el.removeClass('vjs-up-next');
};

const Component = videojs.getComponent('Component');

class PlaylistMenu extends Component {

  constructor(player, options) {
    super(player, options);
    this.items = [];

    if (options.horizontal) {
      this.addClass('vjs-playlist-horizontal');
    } else {
      this.addClass('vjs-playlist-vertical');
    }

    // If CSS pointer events aren't supported, we have to prevent
    // clicking on playlist items during ads with slightly more
    // invasive techniques. Details in the stylesheet.
    if (options.supportsCssPointerEvents) {
      this.addClass('vjs-csspointerevents');
    }

    this.createPlaylist_();

    if (!videojs.browser.TOUCH_ENABLED) {
      this.addClass('vjs-mouse');
    }

    this.on(player, ['loadstart', 'playlistchange', 'playlistsorted'], (e) => {
      this.update();
    });

    // Keep track of whether an ad is playing so that the menu
    // appearance can be adapted appropriately
    this.on(player, 'adstart', () => {
      this.addClass('vjs-ad-playing');
    });

    this.on(player, 'adend', () => {
      this.removeClass('vjs-ad-playing');
    });

    this.on('dispose', () => {
      this.empty_();
      player.playlistMenu = null;
    });

    this.on(player, 'dispose', () => {
      this.dispose();
    });
  }

  createEl() {
    return videojs.dom.createEl('div', {className: this.options_.className});
  }

  empty_() {
    if (this.items && this.items.length) {
      this.items.forEach(i => i.dispose());
      this.items.length = 0;
    }
  }

  createPlaylist_() {
    const playlist = this.player_.playlist() || [];
    let list = this.el_.querySelector('.vjs-playlist-item-list');
    let overlay = this.el_.querySelector('.vjs-playlist-ad-overlay');

    if (!list) {
      list = document.createElement('ol');
      list.className = 'vjs-playlist-item-list';
      this.el_.appendChild(list);
    }

    this.empty_();

    // create new items
    for (let i = 0; i < playlist.length; i++) {
      const item = new PlaylistMenuItem(this.player_, {
        item: playlist[i]
      }, this.options_);

      this.items.push(item);
      list.appendChild(item.el_);
    }

    // Inject the ad overlay. We use this element to block clicks during ad
    // playback and darken the menu to indicate inactivity
    if (!overlay) {
      overlay = document.createElement('li');
      overlay.className = 'vjs-playlist-ad-overlay';
      list.appendChild(overlay);
    } else {
      // Move overlay to end of list
      list.appendChild(overlay);
    }

    // select the current playlist item
    const selectedIndex = this.player_.playlist.currentItem();

    if (this.items.length && selectedIndex >= 0) {
      addSelectedClass(this.items[selectedIndex]);

      const thumbnail = this.items[selectedIndex].$('.vjs-playlist-thumbnail');

      if (thumbnail) {
        videojs.dom.addClass(thumbnail, 'vjs-playlist-now-playing');
      }
    }
  }

  update() {
    // replace the playlist items being displayed, if necessary
    const playlist = this.player_.playlist();

    if (this.items.length !== playlist.length) {
      // if the menu is currently empty or the state is obviously out
      // of date, rebuild everything.
      this.createPlaylist_();
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].item !== playlist[i]) {
        // if any of the playlist items have changed, rebuild the
        // entire playlist
        this.createPlaylist_();
        return;
      }
    }

    // the playlist itself is unchanged so just update the selection
    const currentItem = this.player_.playlist.currentItem();

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      if (i === currentItem) {
        addSelectedClass(item);
        if (document.activeElement !== item.el()) {
          videojs.dom.addClass(item.thumbnail, 'vjs-playlist-now-playing');
        }
        notUpNext(item);
      } else if (i === currentItem + 1) {
        removeSelectedClass(item);
        upNext(item);
      } else {
        removeSelectedClass(item);
        notUpNext(item);
      }
    }
  }
}

videojs.registerComponent('PlaylistMenu', PlaylistMenu);
