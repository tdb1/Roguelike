import {Messenger} from './messenger.js';
import {DATASTORE} from './datastore.js';
import {Color} from './colors.js';
import {getColor, calculateDistance, damageRoll} from './util.js';
import {TIMING, SCHEDULE} from './turnbased.js';
import ROT from 'rot-js';

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
      this.attr._TimeTracker.timeTaken += t;
    },
    setTime: function(t){
      this.attr._TimeTracker.timeTaken = t;
    },
    getTime: function(){
      return this.attr._TimeTracker.timeTaken;
    }
  },
  LISTENERS: {
    'turnTaken' :function(evtData){
      // console.log('in turnTaken LISTENER');
      // console.log(evtData);
      this.addTime(evtData.timeUsed);
    }
  }
};

export let WalkerCorporeal = {
  META:{
    mixinName: 'WalkerCorporeal',
    mixinGroupName: 'Walker',
  },
  METHODS:{
    tryWalk: function (dx, dy){
      let newX = this.attr.x*1 + dx*1;
      let newY = this.attr.y*1 + dy*1;

      if (!this.getMap().testLocationBlocked(newX, newY)){
        this.getMap().moveEntityTo(this, newX, newY);
        this.raiseMixinEvent('turnTaken', {timeUsed: 1});
        // console.log(this.getTime());
        this.setCurrentActionDuration(100);
        this.raiseMixinEvent('actionDone', {});
        return true;
      } else if(this.getMap().getEntityAtMapLocation(newX, newY)){
        // console.log('entity at desired position');
        this.raiseMixinEvent('chooseAttack', {
          wasAttackedBy: this,
          victim: DATASTORE.ENTITIES[this.getMap().getEntityAtMapLocation(newX, newY)],
          avatarID: this.getID()
        });
      } else {
        if(this.name == 'avatar'){
          this.raiseMixinEvent('walkBlocked', {reason: "there's something in the way"});
          return false;
        } else{
          return true;
        }
    } } },
  LISTENERS:{
    'walkAttempt': function (evtData){
      this.tryWalk(evtData.dx, evtData.dy);
    }
  }
};

export let PlayerMessage = {
  META:{
    mixinName: 'PlayerMessage',
    mixinGroupName: 'Messenger',
  },
  LISTENERS:{
    'walkBlocked': function(evtData){
      Messenger.send(`${this.getName()} cannot walk there because ${evtData.reason}`);
    },
    'damagedMessage': function(evtData){
      if(evtData.attackType != 'Strength'){
      Messenger.send(`${evtData.wasAttackedBy} damaged ${this.getName()} ${evtData.damageAmount} points with an ${evtData.attackType} attack`);
      } else{
      Messenger.send(`${evtData.wasAttackedBy} damaged ${this.getName()} ${evtData.damageAmount} points with a ${evtData.attackType} attack`);
      }
    },
    'healedMessage': function (evtData){
      Messenger.send(`${this.getName()} gained ${evtData.healAmount} HP`);
    },
    'expChangedMessage': function(evtData){
      if(evtData.deltaExp > 0){
        Messenger.send(`${this.getName()} gained ${evtData.deltaExp} ${Color.EXP}experience${Color.DEFAULT}.`);
      }
    },
    'gainedStatsPointMessage': function(evtData){
      Messenger.send(`${this.getName()} gained 1 ${evtData.deltaStat} point!`);
    },
    'attackedMessage': function(evtData){
      let stringColor = getColor(evtData.attackType);
      let name = ''
      if (evtData.wasAttackedBy.name == 'avatar') {
        name = 'You';
      } else {
        name = evtData.wasAttackedBy.name;
      }
      Messenger.send(name + ` hit ${evtData.victim.name} with a` + stringColor + ` ${evtData.attackType}${Color.DEFAULT} attack and dealt ${evtData.damageAmount} damage`);
    },
    'missedAttackMessage': function(evtData){
      let stringColor = getColor(evtData.attackType);
      let name = ''
      if (evtData.wasAttackedBy.name == 'avatar') {
        name = 'You';
      } else {
        name = evtData.wasAttackedBy.name;
      }
      Messenger.send(name + ` attempted to hit ${evtData.victim.name} with a` + stringColor + ` ${evtData.attackType}${Color.DEFAULT} attack but missed`);
    }
  }
}

export let Stats = {
  META:{
    mixinName: 'Stats',
    mixinGroupName: 'Stats',
    stateNamespace: '_Stats',
    stateModel: {
      agility: 0,
      strength: 0,
      intelligence: 0,
      experience: 0
    },
    initialize: function(template) {
      this.attr._Stats.agility = template.agility || 1;
      this.attr._Stats.strength = template.strength || 1;
      this.attr._Stats.intelligence = template.intelligence || 1;
      this.attr._Stats.experience = template.experience || 0;
    }
  },

  METHODS:{
    deltaIntelligence: function(deltaInt){
      this.attr._Stats.intelligence += deltaInt;
    },

    deltaStrength: function(deltaStr){
        this.attr._Stats.strength += deltaStr;
    },

    deltaAgility: function(deltaAgi){
      this.attr._Stats.agility += deltaAgi;
    },
    getStats: function(){
      // console.log('fetching stats');
      // console.dir(this.attr._Stats);
      return {agility: this.attr._Stats.agility, strength: this.attr._Stats.strength,
         intelligence: this.attr._Stats.intelligence};
    },
    getExp: function(){
      return this.attr._Stats.experience;
    },
    deltaExp: function(deltaExp){
      this.attr._Stats.experience += deltaExp;
    },
    getRequiredUpgradePoints: function(stat){
      if (stat == 'strength'){
        return this.attr._Stats.strength * 2;
      } else if(stat == 'intelligence'){
        return this.attr._Stats.intelligence * 2;
      } else if (stat == 'agility'){
        return this.attr._Stats.agility * 2;
      }
    }
  },
  LISTENERS:{
    //evtData contain -> deltaExp (exp change amount)
    'deltaExp': function(evtData){
      this.deltaExp(evtData.deltaExp);
      this.raiseMixinEvent('expChangedMessage', evtData);
    },
    //evtData contain -> deltaStat (stat changed)
    'deltaStats': function(evtData){
      if(evtData.deltaStat == 'Strength'){
        this.deltaStrength(1);
      } else if(evtData.deltaStat == 'Agility'){
        this.deltaAgility(1);
      } else if(evtData.deltaStat == 'Intelligence'){
        this.deltaIntelligence(1);
      }
      raiseMixinEvent('gainedStatsPointMessage', evtData);
    }
  }
};

export let Hitpoints = {

    META:{
      mixinName: 'Hitpoints',
      mixinGroupName: 'Hitpoints ',
      stateNamespace: '_Hitpoints',
      stateModel: {
        maxHP: 0,
        curHP: 0
      },
      initialize: function(template) {
        this.attr._Hitpoints.maxHP = template.maxHP || 10;
        this.attr._Hitpoints.curHP = template.curHP || this.attr._Hitpoints.maxHP;
      }
    },
    METHODS:{
      gainHP: function(hp){
        if(this.attr._Hitpoints.curHP > this.attr._Hitpoints.maxHP) {
          this.attr_Hitpoints.curHP += hp;
        } else{
          this.attr._Hitpoints.curHP = this.attr._Hitpoints.maxHP;
        }
        this.raiseMixinEvent('healedMessage', {'healAmount' : hp})
      },

      loseHP: function(hp) {
        this.attr._Hitpoints.curHP -= hp;
      },

      setMaxHP: function(newMax) {
        this.attr._Hitpionts.maxHP = newMax;
      },

      getCurHP: function(){
        return this.attr._Hitpoints.curHP;
      },

      getMaxHP: function(){
        return this.attr._Hitpoints.maxHP;
      }
  },

  LISTENERS:{
    'damaged': function(evtData){
      this.loseHP(evtData.damageAmount);
      // console.log('Attack Successful! ' + evtData.victim.name + " now has " + evtData.victim.getCurHP() + ' HP');
      this.raiseMixinEvent('damagedMessage', evtData);

      if (this.getCurHP() <= 0){
        this.raiseMixinEvent('killed', evtData);
      }
    },
    'killed': function(evtData){
      // console.log('entity killed mixin event');
      Messenger.send(`${evtData.wasAttackedBy.name} killed ${evtData.victim.name}!`);
      // console.dir(evtData.victim);
      evtData.deltaExp = evtData.victim.expGainedForKill;
      evtData.wasAttackedBy.raiseMixinEvent('deltaExp', evtData);
      SCHEDULE.remove(this);
      this.destroy();
    }
  }
};

export let StrengthAttack = {
  META:{
    mixinName: 'StrengthAttack',
    mixinGroupName: 'Combat',
    stateNamespace: '_StrengthAttack',
    stateModel: {
      strengthAttackDamage: 1
    },
    initialize: function(template) {
      this.attr._StrengthAttack.strengthAttackDamage =
       template.strengthAttackDamage || 1;
    }
  },
  METHODS:{
    getStrengthAttackDamage: function(){
      return this.getStats().strength * 2;
    },
    getStrengthAttackSpeed: function(){
      return 100 / this.getStats().agility
    }
  },
  LISTENERS:{
    //evtData contains -> wasAttackedBy(attacker), attackType(Strenth), victim(victim of attack), damageAmount(amount of damage dealt)
    'strAttack': function(evtData){
      let hitMiss = damageRoll(this.getStats().strength);
      if(!hitMiss){
        this.raiseMixinEvent('missedAttackMessage', evtData);
      } else{
        evtData.damageAmount = this.getStrengthAttackDamage();
        this.raiseMixinEvent('attackedMessage', evtData);
        evtData.victim.raiseMixinEvent('damaged', evtData);
      }
    }
  }
};

export let IntelligenceAttack = {
  META:{
    mixinName: 'IntelligenceAttack',
    mixinGroupName: 'Combat',
    stateNamespace: '_IntelligenceAttack',
    stateModel: {
      IntelligenceAttackDamage: 1
    },
    initialize: function(template) {
      this.attr._IntelligenceAttack.IntelligenceAttackDamage =
       template.IntelligenceAttackDamage || 1;
    }
  },
  METHODS:{
    getIntelligenceAttackDamage: function(){
      return this.getStats().intelligence;
    },
    getIntelligenceAttackSpeed: function(){

    }
  },
  LISTENERS:{
    //evtData contains -> wasAttackedBy(attacker), attackType(Ingelligence), victim(victim of attack), damageAmount(amount of damage dealt)
    'intelAttack': function(evtData){
      let hitMiss = damageRoll(this.getStats().intelligence);
      if(!hitMiss){
        this.raiseMixinEvent('missedAttackMessage', evtData);
      } else{
        evtData.damageAmount = this.getIntelligenceAttackDamage();
        this.raiseMixinEvent('attackedMessage', evtData);
        evtData.victim.raiseMixinEvent('damaged', evtData);
      }
    }
  }
};

export let AgilityAttack = {
  META:{
    mixinName: 'AgilityAttack',
    mixinGroupName: 'Combat',
    stateNamespace: '_AgilityAttack',
    stateModel: {
      AgilityAttackDamage: 1
    },
    initialize: function(template) {
      this.attr._AgilityAttack.AgilityAttackDamage =
       template.AgilityAttackDamage || 1;
    }
  },
  METHODS:{
    getAgilityAttackDamage: function(){
      return Math.ceil(this.getStats().agility/2);
    },
    getAgilityAttackSpeed: function(){

    }
  },
  LISTENERS:{
    //evtData contains -> wasAttackedBy(attacker), attackType(Agility), victim(victim of attack), damageAmount(amount of damage dealt)
      'agilAttack': function(evtData){
        let hitMiss = damageRoll(this.getStats().agility);
        if(!hitMiss){
          this.raiseMixinEvent('missedAttackMessage', evtData);
        } else{
        evtData.damageAmount = this.getAgilityAttackDamage();
        this.raiseMixinEvent('attackedMessage', evtData);
        evtData.victim.raiseMixinEvent('damaged', evtData);
      }
    }
  }
};

export let PlayerAttack = {
  META:{
    mixinName: 'PlayerAttack',
    mixinGroupName: 'Combat',
    stateNamespace: '_PlayerAttack'
  },
  LISTENERS:{
    'chooseAttack': function(evtData){
      // console.log('choosing attack');
      DATASTORE.GAME.enterAttackMode(evtData);
    }
  }
};

// export let Debuff = {
//   META:{
//     mixinName: 'Debuff',
//     mixinGroupName: 'Buffs',
//     stateNamespace: '_Debuff',
//     stateModel: {
//
//     },
//     initialize: function() {
//       // do any initialization
//
//     }
//   },
//   METHODS:{
//     method1: function(p){
//
//     }
//   }
// };

export let PlayerActor = {
  META:{
    mixinName: 'PlayerActor',
    mixinGroupName: 'Player',
    stateNamespace: '_PlayerActor',
    stateModel: {
      defaultActionDuration: 100,
      currentActionDuration: 100,
      actingState: false
    },
    initialize: function(template) {
      SCHEDULE.add(this, true);
    }
  },
  METHODS:{

    getDefaultActionDuration: function(){
      return this.attr._PlayerActor.defaultActionDuration;
    },
    setDefaultActionDuration: function(duration){
      this.attr._PlayerActor.defaultActionDuration = duration;
    },
    getCurrentActionDuration: function(){
      return this.attr._PlayerActor.currentActionDuration;
    },
    setCurrentActionDuration: function(duration){
      this.attr._PlayerActor.currentActionDuration = duration;
    },
    isActing: function(state){
      if(state !== undefined){
        this.attr._PlayerActor.actingState = state;
      }
      return this.attr._PlayerActor.actingState;
    },
    act: function(){
      if(this.isActing()){
        return;
      }
      this.isActing(true);
      TIMING.lock();
      DATASTORE.GAME.render();
      //console.log("player is acting");
    }
  },
  LISTENERS: {
    actionDone: function(evtData){
      this.isActing(false);
      // console.dir(SCHEDULE);
      if(this.getCurrentActionDuration() != null){
        SCHEDULE.setDuration(this.getCurrentActionDuration());
      } else {
        SCHEDULE.setDuration(this.getDefaultActionDuration());
      }
      this.setCurrentActionDuration(null);
      setTimeout(function(){
        TIMING.unlock();
      }, 1);
      //console.log("end player acting");
    }
  }
};

export let AggressiveAIActor = {
  META:{
    mixinName: 'AggressiveAIActor',
    mixinGroupName: 'AI',
    stateNamespace: '_AIActor',
    stateModel: {
      defaultActionDuration: 100,
      currentActionDuration: 100,
      isActing: false
    },
    initialize: function() {
      SCHEDULE.add(this, true);
    }
  },
  METHODS:{
    getDefaultActionDuration: function(){
      return this.attr._AIActor.defaultActionDuration;
    },
    setDefaultActionDuration: function(duration){
      this.attr._AIActor.defaultActionDuration = duration;
    },
    getCurrentActionDuration: function(){
      return this.attr._AIActor.currentActionDuration;
    },
    setCurrentActionDuration: function(duration){
      this.attr._AIActor.currentActionDuration = duration;
    },
    isActing: function(state){
      if(state !== undefined){
        this.attr._AIActor.actingState = state;
      }
      return this.attr._AIActor.actingState;
    },
    act: function(){
      console.log('AI is acting');
      if(this.isActing()){
        return false;
      }
      this.isActing(true);
      this.raiseMixinEvent('getAgressiveWalk');
      SCHEDULE.setDuration(this.getDefaultActionDuration());
      this.isActing(false);
    },
  }
};

export let PassiveAIActor = {
  META:{
    mixinName: 'PassiveAIActor',
    mixinGroupName: 'AI',
    stateNamespace: '_AIActor',
    stateModel: {
      defaultActionDuration: 100,
      currentActionDuration: 100,
      actingState: false
    },
    initialize: function(template) {
      SCHEDULE.add(this, true);
    }
  },
  METHODS:{
    getDefaultActionDuration: function(){
      return this.attr._AIActor.defaultActionDuration;
    },
    setDefaultActionDuration: function(duration){
      this.attr._AIActor.defaultActionDuration = duration;
    },
    getCurrentActionDuration: function(){
      return this.attr._AIActor.currentActionDuration;
    },
    setCurrentActionDuration: function(duration){
      this.attr._AIActor.currentActionDuration = duration;
    },
    isActing: function(state){
      if(state !== undefined){
        this.attr._AIActor.actingState = state;
      }
      return this.attr._AIActor.actingState;
    },
    act: function(){
      console.log('AI is acting');
      if(this.isActing()){
        return false;
      }
      this.isActing(true);
      this.raiseMixinEvent('getRandomWalk');
      SCHEDULE.setDuration(this.getDefaultActionDuration());
      this.isActing(false);
    },
  }
};

export let PlayerEnergy = {
  META:{
    mixinName: 'PlayerEnergy',
    mixinGroupName: 'PlayerEnergy',
    stateNamespace: '_PlayerEnergy',
    stateModel: {
      baseEnergy: 100,
      curEnergy: 100
    },
    initialize: function(template) {
      // do any initialization
      this.attr._PlayerEnergy.baseEnergy = template.baseEnergy || 100;
      this.attr._PlayerEnergy.curEnergy = template.curEnergy || this.attr._PlayerEnergy.baseEnergy
    }
  },
  METHODS:{
    getCurrentEnergy: function(){
      return this.attr._PlayerEnergy.curEnergy;
    },
    deltaCurrentEnergy: function(delta){
      this.attr._PlayerEnergy.curEnergy += delta;
    },
    setCurrentEnergy: function(set){
      this.attr._PlayerEnergy.curEnergy = set;
    },
    getBaseEnergy: function(){
      return this.attr._PlayerEnergy.baseEnergy;
    },
    setBaseEnergy: function(set){
      this.attr._PlayerEnergy.baseEnergy = set;
    }
  }
};

export let AIWalk = {
  META:{
    mixinName: 'AIWalk',
    mixinGroupName: 'AIWalk',
    stateNamespace: '_RandomWalk',
    stateModel: {
      baseDuration: 100
    },
    initialize: function(template) {
      this.attr._RandomWalk.baseDuration = template.baseDuration || 100;
    }
  },
  METHODS:{
    getWalkDuration: function(){
      return this.attr._RandomWalk.baseDuration;
    },
    setWalkDuration: function(duration){
      this.attr._RandomWalk.baseDuration = duration;
    },
    getShortestPath: function(avatar){
      let bestPos = {};
      let bestDist = Infinity;
      for(let myX = -1; myX < 2; myX++){
        for (let myY = -1; myY < 2; myY++){
          // console.log('testing: ' + myX + ',' + myY);
          let currDistance = calculateDistance({
            enemyX: avatar.getX(), enemyY: avatar.getY(), myX: myX + this.getX(), myY: myY + this.getY()})
          if(currDistance<bestDist && !this.getMap().testLocationBlocked(this.getX() + myX, this.getY() + myY)){
              // console.log(currDistance + ' is less than ' + bestDist);
              bestPos.x = myX;
              bestPos.y = myY;
              bestDist = currDistance;
          } } }
      // this.raiseMixinEvent('walkAttempt', {dx: bestPos.x, dy: bestPos.y});
      // console.log('Best move is: ' + bestPos.x + ',' + bestPos.y);
      return {dx: bestPos.x, dy: bestPos.y};
    }
  },
  LISTENERS: {
    'getRandomWalk': function(evtData){
      let dx = Math.trunc(ROT.RNG.getUniform() * 3) - 1;
      let dy = Math.trunc(ROT.RNG.getUniform() * 3) - 1;
      this.raiseMixinEvent('walkAttempt', {dx, dy});
    },
    'getAgressiveWalk': function(evtData){
      // console.log('getting agressive walk');
      // console.dir(this.getMap().attr.visibleTiles);
      // console.log('my pos is: ');
      // console.log(this.getxcy());
      if (this.getMap().attr.visibleTiles[this.getxcy()]){
        // console.log('avatar in sight');
        let avatar = DATASTORE.GAME.modes.play.getAvatar();
        let distFromAvatar = calculateDistance({enemyX: avatar.getX(), enemyY: avatar.getY(), myX: this.getX(), myY: this.getY()});
        // console.log('avatar within range');
        // console.log(distFromAvatar);
        if(distFromAvatar <= 10){
          // let walkData = this.getShortestPath(avatar);
          this.raiseMixinEvent('walkAttempt', this.getShortestPath(avatar));
        }
        this.raiseMixinEvent('getRandomWalk', {});
      }
    }
  }
};
