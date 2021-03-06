import {Color} from './colors.js';

let randCharSource = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');
export function randomString(len = 8) {
  var res='';
    for (var i=0; i<len; i++) {
        res += randCharSource.random();
    }
    //res =  `${DATASTORE.ID_SEQ} - ${res}`
    return res;
}

export function init2DArray(x=1,y=1,initVal='') {
  // console.log('initializing 2D Array');
  var a = [];
  for (var xdim=0; xdim < x; xdim++) {
    a.push([]);
    for (var ydim=0; ydim < y; ydim++) {
      a[xdim].push(initVal);
    }
  }
  // console.log(a);
  return a;
}

export function getColor(attackType){
  if (attackType == 'Strength'){
    return Color.STRENGTH;
  } else if (attackType == 'Intelligence'){
    return Color.INTELLIGENCE
  } else if (attackType == 'Agility'){
    return Color.AGILITY;
  }
  return;
}

let ID_SEQ = 0;
export function uniqueID() {
  ID_SEQ++;
  return `${ID_SEQ}-${randomString()}`;
}

export function calculateDistance(data){
  return (Math.abs(Math.sqrt(Math.pow(data.enemyX - data.myX, 2) + Math.pow(data.enemyY - data.myY, 2))));
}

export function damageRoll(data){
  console.log(data);
  let getRandomInt = function(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }
  return getRandomInt(1, 101) <= (50 + data);
}
