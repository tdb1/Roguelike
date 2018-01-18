import {Messenger} from './messenger.js';
import {DATASTORE} from './datastore.js';
//defines the various mixins that can be added to an Entity


let _exampleMixin = {
  META:{
    mixinName: 'ExampleMixin',
    mixinGroupName: 'ExampleMixinGroup',
    stateNamespace: '_ExampleMixin',
    stateModel: {
      foo: 10
    },
    initialize: function() {
      // do any initialization

    }
  },
  METHODS:{
    method1: function(p){

    }
  }
};


export let TimeTracker = {
  META:{
    mixinName: 'TimeTracker',
    mixinGroupName: 'Tracker',
    stateNamespace: '_TimeTracker',
    stateModel: {
      timeTaken: 0
    }
  },

  METHODS:{
    addTime: function(t){
      this.state._TimeTracker.timeTaken += t;
    },
    setTime: function(t){
      this.state._TimeTracker.timeTaken = t;
    },
    getTime: function(){
      return this.attr._TimeTracker.timeTaken;
    }
  },
  LISTENERS: {
    'turntaken':function(evtData){
      this.addTime(evt.Data.timeUsed);
    }
  }
};

export let WalkerCorporeal = {
  META:{
    mixinName: 'WalkerCorporeal',
    mixinGroupName: 'Walker',
  },
  METHODS:{

    //tryWalk from class
    tryWalk: function (dx, dy){

      let newX = this.attr.x*1 + dx*1;
      let newY = this.attr.y*1 + dy*1;

      if (this.getMap().testLocationBlocked(newX, newY)){
        this.attr.x = newX;
        this.attr.y - newY;
        this.getMap().moveEntityTo(this,this.attr.x, this.attr.y);
        this.raiseMixinEvent('turntaken', {timeUsed: 1});
        return true;
      } else {
      this.raiseMixinEvent('walkBlocked', {reason: "there's something in the way"});
      return false;
      } } }
};

let PlayerMessage = {
  META:{
    mixinName: 'PlayerMessage',
    mixinGroupName: 'Messenger',
  },
  // METHODS:{
  //   method1: function(p){
  //
  //   }
  // }
  LISTENERS:{
    'walkBlocked': function(evtData){
      Messenger.sent("You cannot walk there " + evtData.reason);
    }
  }
};