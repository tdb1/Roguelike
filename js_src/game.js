import ROT from 'rot-js';
import * as U from './util.js';
import {StartupMode, PlayMode, LoseMode, WinMode,
  PersistenceMode, AttackMode, LevelUpMode} from './ui_mode.js';
import {Messenger} from './messenger.js';
import {DATASTORE, initializeDatastore} from './datastore.js';

export let Game = {

  SPACING: 1.1,

  messageHandler : Messenger,

  display: {
    main: {
      w: 80,
      h: 24,
      o: null
    },
    avatar: {
      w: 20,
      h: 24,
      o: null
    },
    message: {
      w: 100,
      h: 6,
      o: null
    }
  },

  modes: {
    startup: '',
    play: '',
    lose: '',
    win: '',
    persistence : '',
    attack: '',
    levelup: ''
  },
  curMode: '',

  _PERSISTANCE_NAMESPACE: 'CaveCrawler',

  isPlaying: false,
  hasSaved: false,

  init: function() {

    this.setupDisplays();
    this.messageHandler.init(this.getDisplay('message'));

    this.setupModes(this);
    this.switchMode('startup');

    console.log('GAME object');
    console.dir(this);
    console.log('DATASTORE object');
    console.dir(this);
  },

  getDisplay: function(display){
    if (this.display.hasOwnProperty(display)) {
      return this.display[display].o;
    } else{
      return null;
    }
  },

  setupModes: function(){
    this.modes.startup = new StartupMode(this);
    this.modes.play = new PlayMode(this);
    this.modes.lose = new LoseMode(this);
    this.modes.win = new WinMode(this);
    this.modes.persistence = new PersistenceMode(this);
    this.modes.attack = new AttackMode(this);
    this.modes.levelup = new LevelUpMode(this);
    console.log("Modes initialized");
  },

  setupDisplays: function() {
    for (var display_key in this.display) {
      this.display[display_key].o = new ROT.Display({
        width: this.display[display_key].w,
        height: this.display[display_key].h,
        spacing: this.SPACING});
    }
    console.log("Displays set up");
  },

  switchMode: function(newModeName){
    if (this.curMode){
      this.curMode.exit();
    }
    this.curMode = this.modes[newModeName];
    if (this.curMode){
      this.curMode.enter();
    }
    this.render();
  },

  enterAttackMode: function(evtData){
    console.log('entering attack mode');
    if(this.curMode != this.modes['play']) { return; }
    this.curMode = this.modes['attack'];
    this.curMode.enter(evtData);
  },

  setupNewGame(){

    console.log("starting new game");
    initializeDatastore();
    DATASTORE.GAME = this;
    console.log("datastore:");
    console.dir(DATASTORE);
    this._randomSeed = 5 + Math.floor(Math.random()*100000);
    //this._randomSeed = 76250;
    console.log("using random seed "+this._randomSeed);
    ROT.RNG.setSeed(this._randomSeed);
    this.modes.play.newGame();
  },

  render: function() {
    this.renderMain();
  },

  renderDisplayAvatar: function() {
    // console.log("rendering avatar display");
    let d = this.display.avatar.o;
    d.clear();
    this.curMode.renderAvatar(d);
  },

  renderDisplayMain: function() {
    // console.log("rendering main display");
    this.display.main.o.clear();
    if (this.curMode === null || this.curMode == '') {
      return;
    } else {
      this.curMode.render();
    }
  },

  renderDisplayMessage: function() {
    // console.log("rendering message display");
    this.messageHandler.render();
  },

  renderMain: function() {
    // console.log("renderMain function");
    this.renderDisplayMain();
  },

  bindEvent: function(eventType){
    window.addEventListener(eventType, (evt) => {
      this.eventHandler(eventType, evt);
    });
  },

  eventHandler: function (eventType, evt) {
    if (this.curMode !== null && this.curMode != ''){
      if (this.curMode.handleInput(eventType, evt)){
        this.render();
      }
    }
  },

  toJSON: function(){
    return this.modes.play.toJSON();
  },

  fromJSON: function(json){
    this.modes.play.fromJSON(json);
  }

};
