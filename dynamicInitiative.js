var Tracker = Tracker || {
    ALL_STATUSES:  ["red", "blue", "green", "brown", "purple", "pink", "yellow",
		    "dead", "skull", "sleepy", "half-heart", "half-haze", "interdiction", "snail", "lightning-helix", "spanner",
		    "chained-heart", "chemical-bolt", "death-zone", "drink-me", "edge-crack", "ninja-mask", "stopwatch",
		    "fishing-net", "overdrive", "strong", "fist", "padlock", "three-leaves", "fluffy-wing", "pummeled", "tread",
		    "arrowed", "aura", "back-pain", "black-flag", "bleeding-eye", "bolt-shield", "broken-heart", "cobweb",
		    "broken-shield", "flying-flag", "radioactive", "trophy", "broken-skull", "frozen-orb", "rolling-bomb",
		    "white-tower", "grab", "screaming", "grenade", "sentry-gun", "all-for-one", "angel-outfit", "archery-target"],

    STATUS_ALIASES: {'crippled': "arrowed", 'helpless': "cobweb", 'pinned': "flying-flag", 'prone': "back-pain",
			'frenzied': "strong", 'stunned': "pummeled", 'unaware': "half-haze", 'hidden':"ninja-mask",
			'aiming':"archery-target", 'braced':"sentry gun", 'defensive':"white-tower", 'guarded':"bolt-shield",
			'overwatch':"all-for-one",'inspired':"trophy", 'hallucinating':"aura", 'haywire':"spanner", 'bloodloss':"half-haze",
			'blinded':"bleeding-eye", 'deafened':"lightning-helix", 'fire':"three-leaves", 'engaged':"fist", 'grabbed':"grab",
			'feared':"screaming", 'unconscious':"sleepy", 'uselesslimb':"broken-skull", 'criticallywounded':"broken-heart",
			'heavilywounded':"half-heart", 'lightlywounded':"chained-heart", 'prone':"tread", 'fullaim':"frozen-orb",
			'alloutatk':"overdrive", 'majinitpenalty':"yellow",'lginitpenalty':"half-haze", 'initpenalty':"pink",'mininitpenalty':"purple",
			'mininitbonus':"green",'initbonus':"blue",'lginitbonus':"brown",'majinitbonus':"red"},

	INITIATIVE_MOD: {'unconscious':-100, 
			'helpless':-20, 'stunned':-20, 'majinitpenalty': -20,
			'feared':-15, 'pinned':-15, 'fire':-15, 'lrginitpenalty':-15,
			'grabbed':-10, 'alloutatk':-10, 'initpenalty':-10,
			'crippled':-5, 'prone':-5, 'blinded':-5, 'deafened':-5, 'heavilywounded': -5, 'mininitpenalty':-5,
			'aiming':5, 'mininitbonus': 5,
			'guarded':10, 'fullaim':10, 'initbonus': 10,
			'lginitbonus':15,
			'defensive':20, 'majinitbonus':20
	},



    CONFIG_PARAMS: [['announceRounds',		"Announce Each Round"],
		    ['announceTurns',		"Announce Each Player's Turn"],
		    ['announceExpiration',	"Announce Status Expirations"],
			['highToLow',		   "High-to-Low Initiative Order"],
			['pooledInit',		     "Pooled Mook Iniative Rolls"],
			['dynamicInit',					 "Dynamic Initiative"],
			['statusRound',				"Status Updated on Round"],
			['wh40ksheet',				 "using Args WH40k sheet"],
			['wh40krollscripts',	   "using Args WH40k scripts"]
		],


    initConfig: function(){
	if (!state.hasOwnProperty('InitiativeTracker')){
	    state.InitiativeTracker = {
					'highToLow':		true,
					'announceRounds':	true,
					'announceTurns':	true,
					'announceExpiration':	true,
					'pooledInit':		true,
					'dynamicInit':		true,
					'statusRound':		true,
					'wh40ksheet':		true,
					'wh40krollscripts': true,
	    };
	}
	if (!state.InitiativeTracker.hasOwnProperty('round')){
	    state.InitiativeTracker.round = null;
	}
	if (!state.InitiativeTracker.hasOwnProperty('count')){
	    state.InitiativeTracker.count = null;
	}
	if (!state.InitiativeTracker.hasOwnProperty('status')){
	    state.InitiativeTracker.status = [];
	}
    },

    write: function(s, who, style, from){
	if (who){
	    who = "/w " + who.split(" ", 1)[0] + " ";
	}
	sendChat(from, who + s.replace(/</g, "<").replace(/>/g, ">").replace(/\n/g, "<br>"));
    },

    reset: function(){
	state.InitiativeTracker.round = null;
	state.InitiativeTracker.count = null;
	state.InitiativeTracker.status = [];
    },

    announceRound: function(round){
	if (!state.InitiativeTracker.announceRounds){ return; }
	sendChat("", "/desc Start of Round " + round);
    },

    announceTurn: function(count, tokenName, tokenId){
	if (!state.InitiativeTracker.announceTurns){ return; }
	if (!tokenName){
	    var token = getObj("graphic", tokenId);
	    if (token){ tokenName = token.get('name'); }
	}
	sendChat("", "/desc Start of Turn " + state.InitiativeTracker.round + " for " + tokenName + " (" + count + ")");
    },

    announceStatusExpiration: function(status, tokenName){
	if (!state.InitiativeTracker.announceExpiration){ return; }
	sendChat("", "/desc Status " + status + " expired on " + tokenName);
    },

    handleTurnChange: function(newTurnOrder, oldTurnOrder){
	var newTurns = JSON.parse((typeof(newTurnOrder) == typeof("") ? newTurnOrder : newTurnOrder.get('turnorder') || "[]"));
	var oldTurns = JSON.parse((typeof(oldTurnOrder) == typeof("") ? oldTurnOrder : oldTurnOrder.turnorder || "[]"));

	//log(newTurns);
	//log(oldTurns);
	if ((!newTurns) || (!oldTurns)){ return; }

	if ((newTurns.length == 0) && (oldTurns.length > 0)){ return Tracker.reset(); } // turn order was cleared; reset

	if ((!newTurns.length) || (newTurns.length != oldTurns.length)){ return; } // something was added or removed; ignore

	if ((state.InitiativeTracker.round == null) || (state.InitiativeTracker.count == null)){
	    // first change: see if it's time to start tracking
	    var startTracking = false;
	    for (var i = 0; i < newTurns.length; i++){
		if (newTurns[i].id != oldTurns[i].id){
		    // turn order was sorted; start tracking
		    startTracking = true;
		    break;
		}
		if (newTurns[i].pr != oldTurns[i].pr){ break; } // a token's initiative count was changed; don't start tracking yet
	    }
	    if (!startTracking){ return; }
	    state.InitiativeTracker.round = 1;
	    state.InitiativeTracker.count = newTurns[0].pr;
	    Tracker.announceRound(state.InitiativeTracker.round);
	    Tracker.announceTurn(newTurns[0].pr, newTurns[0].custom, newTurns[0].id);
	    return;
	}

	if (newTurns[0].id == oldTurns[0].id){ return; } // turn didn't change

	var newCount = newTurns[0].pr;
	var oldCount = state.InitiativeTracker.count;
	if (!state.InitiativeTracker.highToLow){
	    // use negatives for low-to-high initiative so inequalities work out the same as high-to-low
	    newCount = -newCount;
	    oldCount = -oldCount;
	}

	var roundChanged = newCount > oldCount;

	///////////////////////////////////////////////////////////
	//
	//HOOK: This is where I do the dynamic initiative rerolls!
	//
	///////////////////////////////////////////////////////////
	if (roundChanged){
	    // made it back to the top of the initiative order
	    state.InitiativeTracker.round += 1;
		Tracker.announceRound(state.InitiativeTracker.round);
		
		//Dynamic Init hook: find all the tokens on the map and reroll their initiative
		if(state.InitiativeTracker['dynamicInit']===true){
			var charid;
			var tokenid;
			var matchingCharacters;
			var initBonus;
			var roll;
			var usedCharArray = [];
			var turnorder=[];
			var oldstack=[];
			var newEntry={};
			var tokenStatuses={};
			var initModArray={};
			var initDupeArray={};
			var rollArray={};
			var duplicateInit=false;
			var page_id;
			var exists;
			var currentPageGraphics = findObjs({                              
				_pageid: Campaign().get("playerpageid"),                              
				_type: "graphic",    
				_subtype: "token",              
			});
			if(currentPageGraphics.length != 0){page_id=currentPageGraphics[0].get('pageid');}

			//Set up the Round Start entry
			turnorder.push({
				id: "-1",
				pr: 100,
				custom: "Round Start",
				_pageid: page_id
			});

			//calculate the initiative modifiers for each token
			for(var i = 0; i <state.InitiativeTracker.status.length; i++){
				var curStatus=state.InitiativeTracker.status[i];
				/*if(!Tracker.INITIATIVE_MOD[curStatus.status]){continue;}
				tokenStatuses[curStatus.token]=curStatus.status;
				if(!initModArray[curStatus.token]){
					initModArray[curStatus.token]=parseInt(Tracker.INITIATIVE_MOD[curStatus.status]);
				}else{
					initModArray[curStatus.token]+=parseInt(Tracker.INITIATIVE_MOD[curStatus.status]);
				}*/
				var temp = (_.invert(Tracker.STATUS_ALIASES))[curStatus.status];
				if(!Tracker.INITIATIVE_MOD[temp]){continue;}
				tokenStatuses[curStatus.token]=temp;
				if(!initModArray[curStatus.token]){
					initModArray[curStatus.token]=parseInt(Tracker.INITIATIVE_MOD[temp]);
				}else{
					initModArray[curStatus.token]+=parseInt(Tracker.INITIATIVE_MOD[temp]);
				}
			}
			
			_.each(currentPageGraphics, function(graphic) {
				tokenid=graphic.get('id');    
				//only check tokens which have bar values (are character tokens of some kind)
				if(graphic.get('bar3_value')!=''){
					exists=false;
					//check to see if the token is linked to a character
					charid=graphic.get('represents');
					if(charid != undefined && charid != ''){
						//if the token represents a character we handle it uniquely
						initBonus=getAttrByName(charid,"AgilityMod","current");
						roll=randomInteger(10)+parseInt(initBonus);
					}else{
						//if there's no linked char, see if we can find any characters with the exact same name as the token
						characterName = graphic.get('name');
						matchingCharacters = findObjs({                                                            
							_type: "character",    
							name: characterName,              
						});
						if(matchingCharacters.length == 0){
							//generic tokens with no matching character get a generic roll
							roll=randomInteger(10);
						} else{
							//if there's a matching character but the token isn't directly linked then the character is a mook
							charid=matchingCharacters[0].get('id');
							if(state.InitiativeTracker['pooledInit']===true){
								_.each(usedCharArray, function(used) {
									if(used===charid){exists=true;}
								});
							}
							if(exists==false){
								//handles first instance of a mook
								initBonus=getAttrByName(charid,"AgilityMod","current");
								roll=randomInteger(10)+parseInt(initBonus);
								rollArray[charid]=roll;
								usedCharArray.push(charid);
								initDupeArray[charid]=initModArray[tokenid];
							}else{
								//handles subsequent instances of a mook
								initBonus=getAttrByName(charid,"AgilityMod","current");
								if(initModArray[tokenid]==initDupeArray[charid]){duplicateInit=true;}
								else{duplicateInit=false;}
							}
						}
					}
					//place in ordered turnorder array IF the character hasn't already been added OR the character is a mook with an adjusted initiative value
					log("Logging a Token with ID: "+tokenid+", a roll of: "+roll+", an init bonus of: "+initBonus+", and a initiative modifier of: "+initModArray[tokenid]);
					if(exists==false){
						if(initModArray[tokenid]){roll=roll+parseInt(initModArray[tokenid]);}
						//graphic.set('name',graphic.get('name')+"--"+graphic.get('statusmarkers').split(',')[0]);
						//graphic.set('name',graphic.get('name').split('--')[0]);
						//if(initModArray[tokenid]){graphic.set('name',graphic.get('name')+"--"+initModArray[tokenid]);}
						//else{graphic.set('name',graphic.get('name')+"--"+0);}
						newEntry={id: tokenid, pr: roll, custom: initBonus, _pageid: page_id};
						while(newEntry.pr > turnorder[turnorder.length-1].pr){oldstack.push(turnorder.pop());}
						if(newEntry.pr === turnorder[turnorder.length-1].pr){
							if(newEntry.custom > turnorder[turnorder.length-1].custom){oldstack.push(turnorder.pop());}
							else{turnorder.push(newEntry);}
						}
						if(newEntry.pr < turnorder[turnorder.length-1].pr){turnorder.push(newEntry);}
						while(oldstack.length >0){turnorder.push(oldstack.pop());}
					} else if (exists==true && duplicateInit==false){
						if(initModArray[tokenid]){roll=parseInt(rollArray[charid])+parseInt(initModArray[tokenid]);}
						//graphic.set('name',graphic.get('name')+"--"+graphic.get('statusmarkers').split(',')[0]);
						//graphic.set('name',graphic.get('name').split('--')[0]);
						//if(initModArray[tokenid]){graphic.set('name',graphic.get('name')+"--"+initModArray[tokenid]);}
						//else{graphic.set('name',graphic.get('name')+"--"+0);}
						newEntry={id: tokenid, pr: roll, custom: initBonus, _pageid: page_id};
						while(newEntry.pr > turnorder[turnorder.length-1].pr){oldstack.push(turnorder.pop());}
						if(newEntry.pr === turnorder[turnorder.length-1].pr){
							if(newEntry.custom > turnorder[turnorder.length-1].custom){oldstack.push(turnorder.pop());}
							else{turnorder.push(newEntry);}
						}
						if(newEntry.pr < turnorder[turnorder.length-1].pr){turnorder.push(newEntry);}
						while(oldstack.length >0){turnorder.push(oldstack.pop());}
					}
				}
			});
			//Push turnorder to roll20
			//log("Turn Order Str: " + JSON.stringify(turnorder));
			Campaign().set("turnorder", JSON.stringify(turnorder));
		}
	}



	if (newTurns[0].pr != state.InitiativeTracker.count && state.InitiativeTracker['statusRound']===true){
	    // update statuses that update between the last count and this count
	    for (var i = 0; i < state.InitiativeTracker.status.length; i++){
		var status = state.InitiativeTracker.status[i];
		var token = getObj("graphic", status.token);
		if (!token){
		    // token associated with this status doesn't exist anymore; remove it
		    state.InitiativeTracker.status.splice(i, 1);
		    i -= 1;
		    continue;
		}
		var statusCount = status.count;
		if (!state.InitiativeTracker.highToLow){ statusCount = -statusCount; }
		if ((roundChanged) && (statusCount >= oldCount) && (statusCount < newCount)){ continue; } // status not between last count and this count
		if ((!roundChanged) && ((statusCount >= oldCount) || (statusCount < newCount))){ continue; }
		if (status.expires <= state.InitiativeTracker.round){
		    // status expired; remove marker and announce expiration
		    token.set("status_" + status.status, false);
		    state.InitiativeTracker.status.splice(i, 1);
		    i -= 1;
		    Tracker.announceStatusExpiration(status.name, token.get('name'));
		}
		else if (status.expires - state.InitiativeTracker.round < 10){
		    // status has nine or fewer rounds left; update marker to reflect remaining rounds
		    token.set("status_" + status.status, status.expires - state.InitiativeTracker.round);
		}
	    }
	}

	state.InitiativeTracker.count = newTurns[0].pr;
	Tracker.announceTurn(newTurns[0].pr, newTurns[0].custom, newTurns[0].id);
    },

    getConfigParam: function(who, param){
	if (param == null){
	    for (var i = 0; i < Tracker.CONFIG_PARAMS.length; i++){
		var head = Tracker.CONFIG_PARAMS[i][1] + " (" + Tracker.CONFIG_PARAMS[i][0] + "): ";
		Tracker.write(head + state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]], who, "", "Tracker");
	    }
	}
	else {
	    var err = true;
	    for (var i = 0; i < Tracker.CONFIG_PARAMS.length; i++){
		if (Tracker.CONFIG_PARAMS[i][0] == param){
		    var head = Tracker.CONFIG_PARAMS[i][1] + " (" + Tracker.CONFIG_PARAMS[i][0] + "): ";
		    Tracker.write(head + state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]], who, "", "Tracker");
		    err = false;
		    break;
		}
	    }
	    if (err){
		Tracker.write("Error: Config parameter '" + param + "' not found", who, "", "Tracker");
	    }
	}
    },

    setConfigParam: function(who, param, value){
	var err = true;
	for (var i = 0; i < Tracker.CONFIG_PARAMS.length; i++){
	    if (Tracker.CONFIG_PARAMS[i][0] == param){
		state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]] = (value == null ? !state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]] : value);
		err = false;
		break;
	    }
	}
	if (err){
	    Tracker.write("Error: Config parameter '" + param + "' not found", who, "", "Tracker");
	}
    },

    showTrackerHelp: function(who, cmd){
	Tracker.write(cmd + " commands:", who, "", "Tracker");
	var helpMsg = "";
	helpMsg += "help:               display this help message\n";
	helpMsg += "round [NUM]:        display the current round number, or set round number to NUM\n";
	helpMsg += "forward:            advance the initiative counter to the next token\n";
	helpMsg += "fwd:                synonym for forward\n";
	helpMsg += "back:               rewind the initiative counter to the previous token\n";
	helpMsg += "start:              sort the tokens in the initiative counter and begin tracking\n";
	helpMsg += "get [PARAM]:        display the value of the specified config parameter, or all config parameters\n";
	helpMsg += "set PARAM [VALUE]:  set the specified config parameter to the specified value (defaults to true)\n";
	helpMsg += "enable PARAM:       set the specified config parameter to true\n";
	helpMsg += "disable PARAM:      set the specified config parameter to false\n";
	helpMsg += "toggle PARAM:       toggle the specified config parameter between true and false";
	Tracker.write(helpMsg, who, "font-size: small; font-family: monospace", "Tracker");
    },

    handleTrackerMessage: function(tokens, msg){
	var who = msg.who;
	msg = msg.content;
	if ((tokens.length > 1) && (tokens[1] == "public")){
	    who = "";
	    tokens.splice(1, 1);
	}
	if (tokens.length < 2){ return Tracker.showTrackerHelp(who, tokens[0]); }
	switch (tokens[1]){
	case "round":
	    if (tokens.length <= 2){ Tracker.write("Current Round: " + state.InitiativeTracker.round, who, "", "Tracker"); }
	    else{
		var round = parseInt(tokens[2]);
		if (round != state.InitiativeTracker.round){
		    state.InitiativeTracker.round = round;
		    if (state.InitiativeTracker.announceRounds){ sendChat("", "/desc Moved to Round " + round); }
		    // update all statuses
		    var curCount = state.InitiativeTracker.count;
		    if (!state.InitiativeTracker.highToLow){ curCount = -curCount; }
		    for (var i = 0; i < state.InitiativeTracker.status.length; i++){
			var status = state.InitiativeTracker.status[i];
			var token = getObj("graphic", status.token);
			if (!token){
			    // token associated with this status doesn't exist anymore; remove it
			    state.InitiativeTracker.status.splice(i, 1);
			    i -= 1;
			    continue;
			}
			var statusCount = status.count;
			if (!state.InitiativeTracker.highToLow){ statusCount = -statusCount; }
			var statusDuration = status.expires - round;
			if (statusCount > curCount){
			    // haven't yet come to this status' initiative count; increment remaining duration
			    statusDuration += 1;
			}
			if (statusDuration < 0){
			    // status expired; remove marker and announce expiration
			    token.set("status_" + status.status, false);
			    state.InitiativeTracker.status.splice(i, 1);
			    i -= 1;
			    Tracker.announceStatusExpiration(status.name, token.get('name'));
			}
			else if (statusDuration < 10){
			    // status has nine or fewer rounds left; update marker to reflect remaining rounds
			    token.set("status_" + status.status, statusDuration);
			}
		    }
		}
	    }
	    break;
	case "forward":
	case "fwd":
	    var oldTurnOrderStr = Campaign().get('turnorder') || "[]";
	    var turnOrder = JSON.parse(oldTurnOrderStr);
	    if (turnOrder.length > 0){
		turnOrder.push(turnOrder.shift());
		var newTurnOrderStr = JSON.stringify(turnOrder);
		Campaign().set('turnorder', newTurnOrderStr);
		Tracker.handleTurnChange(newTurnOrderStr, oldTurnOrderStr);
	    }
	    break;
	case "back":
	    var oldTurnOrderStr = Campaign().get('turnorder') || "[]";
	    var turnOrder = JSON.parse(oldTurnOrderStr);
	    if (turnOrder.length > 0){
		// as far as handleTurnChange is concerned, we're going forward until one count back in the next round;
		// decrement round counter so that handleTurnChange will do the right thing
		state.InitiativeTracker.round -= 1;
		turnOrder.unshift(turnOrder.pop());
		var newTurnOrderStr = JSON.stringify(turnOrder);
		Campaign().set('turnorder', newTurnOrderStr);
		Tracker.handleTurnChange(newTurnOrderStr, oldTurnOrderStr);
	    }
	    break;
	case "start":
	    var turnOrder = JSON.parse(Campaign().get('turnorder') || "[]");
	    if (turnOrder.length > 0){
		turnOrder.sort(function(x, y){
				    return (state.InitiativeTracker.highToLow ? y.pr - x.pr : x.pr - y.pr);
				});
		Campaign().set('turnorder', JSON.stringify(turnOrder));
		state.InitiativeTracker.round = 1;
		state.InitiativeTracker.count = turnOrder[0].pr;
		Tracker.announceRound(state.InitiativeTracker.round);
		Tracker.announceTurn(turnOrder[0].pr, turnOrder[0].custom, turnOrder[0].id);
	    }
	    break;
	case "get":
	    if (tokens.length <= 2){ Tracker.getConfigParam(who, null); }
	    else { Tracker.getConfigParam(who, tokens[2]); }
	    break;
	case "set":
	    if (tokens.length <= 2){
		Tracker.write("Error: The 'set' command requires at least one argument (the parameter to set)", who, "", "Tracker");
		break;
	    }
	    var value = true;
	    if (tokens.length > 3){
		if ((tokens[3] != "true") && (tokens[3] != "yes") && (tokens[3] != "1")){ value = false; }
	    }
	    Tracker.setConfigParam(who, tokens[2], value);
	    break;
	case "enable":
	    if (tokens.length != 3){
		Tracker.write("Error: The 'enable' command requires exactly one argument (the parameter to enable)", who, "", "Tracker");
		break;
	    }
	    Tracker.setConfigParam(who, tokens[2], true);
	    break;
	case "disable":
	    if (tokens.length != 3){
		Tracker.write("Error: The 'disable' command requires exactly one argument (the parameter to disble)", who, "", "Tracker");
		break;
	    }
	    Tracker.setConfigParam(who, tokens[2], false);
	    break;
	case "toggle":
	    if (tokens.length != 3){
		Tracker.write("Error: The 'toggle' command requires exactly one argument (the parameter to toggle)", who, "", "Tracker");
		break;
	    }
	    Tracker.setConfigParam(who, tokens[2], null);
	    break;
	case "help":
	    Tracker.showTrackerHelp(who, tokens[0]);
	    break;
	default:
	    Tracker.write("Error: Unrecognized command: " + tokens[0], who, "", "Tracker");
	    Tracker.showTrackerHelp(who, tokens[0]);
	}
    },

    addStatus: function(tokenId, duration, status, name){
	var token = getObj("graphic", tokenId);
	if (!token){ return; }
	if (Tracker.STATUS_ALIASES[status]){ status = Tracker.STATUS_ALIASES[status]; }
	state.InitiativeTracker.status.push({'token':	tokenId,
					    'expires':	state.InitiativeTracker.round + duration,
					    'count':	state.InitiativeTracker.count,
					    'status':	status,
					    'name':	name});
	if (duration > 10){ duration = true; }
	token.set("status_" + status, duration);
    },

    showStatusHelp: function(who, cmd){
	Tracker.write(cmd + " commands:", who, "", "Tracker");
	var helpMsg = "";
	helpMsg += "help:               display this help message\n";
	helpMsg += "add DUR ICON DESC:  add DUR rounds of status effect with specified icon and description to selected tokens\n";
	helpMsg += "list:               list all status effects for selected tokens\n";
	helpMsg += "show:               synonym for list\n";
	helpMsg += "remove [ID]:        remove specified status effect, or all status effects from selected tokens\n";
	helpMsg += "rem, delete, del:   synonyms for remove\n";
	helpMsg += "icons:              list available status icons and aliases";
	Tracker.write(helpMsg, who, "font-size: small; font-family: monospace", "Tracker");
    },

    handleStatusMessage: function(tokens, msg){
	var who = msg.who;
	var selected = msg.selected;
	msg = msg.content;
	if ((tokens.length > 1) && (tokens[1] == "public")){
	    who = "";
	    tokens.splice(1, 1);
	}
	if (tokens.length < 2){ return Tracker.showStatusHelp(who, tokens[0]); }
	switch (tokens[1]){
	case "add":
	    if ((!selected) || (selected.length <= 0)){
		Tracker.write("Error: The 'add' command requires at least one selected token", who, "", "Tracker");
		break;
	    }
	    if (tokens.length < 5){
		Tracker.write("Error: The 'add' command requires three arguments (duration, icon, description)", who, "", "Tracker");
		break;
	    }
	    if (state.InitiativeTracker.round <= 0){
		Tracker.write("Error: Initiative not being tracked", who, "", "Tracker");
		break;
	    }
	    for (var i = 0; i < selected.length; i++){
		if (selected[i]._type != "graphic"){ continue; }
		var token = getObj(selected[i]._type, selected[i]._id);
		if (!token){ continue; }
		Tracker.addStatus(token.get('id'), parseInt(tokens[2]), tokens[3], tokens.slice(4).join(" "));
		//Tracker.addStatus(selected[i]._id, parseInt(tokens[2]), tokens[3], tokens.slice(4).join(" "));
		}
	    break;
	case "list":
	case "show":
	    if ((!selected) || (selected.length <= 0)){
		Tracker.write("Error: The '" + tokens[1] + "' command requires at least one selected token", who, "", "Tracker");
		break;
	    }
	    var tokenIds = [];
	    var byToken = {};
	    var tokenNames = {};
	    for (var i = 0; i < selected.length; i++){
		if (selected[i]._type != "graphic"){ continue; }
		var token = getObj(selected[i]._type, selected[i]._id);
		if (!token){ continue; }
		tokenIds.push(selected[i]._id);
		byToken[selected[i]._id] = [];
		tokenNames[selected[i]._id] = token.get('name');
	    }
	    tokenIds.sort(function(x, y){
				if (tokenNames[x] == tokenNames[y]){ return 0; }
				if (tokenNames[x] > tokenNames[y]){ return 1; }
				return -1;
			    });
	    for (var i = 0; i < state.InitiativeTracker.status.length; i++){
		var status = state.InitiativeTracker.status[i];
		if (!byToken[status.token]){ continue; }
		var duration = status.expires - state.InitiativeTracker.round;
		if ((state.InitiativeTracker.highToLow) && (status.count < state.InitiativeTracker.count)){
		    duration += 1;
		}
		if ((!state.InitiativeTracker.highToLow) && (status.count > state.InitiativeTracker.count)){
		    duration += 1;
		}
		byToken[status.token].push("" + i + ": " + status.name + " (" + duration + ")");
	    }
	    for (var i = 0; i < tokenIds.length; i++){
		var from = (who ? "Tracker" : "");
		if (byToken[tokenIds[i]].length <= 0){
		    var output = "No status effects for token " + tokenNames[tokenIds[i]];
		    if (who){
			Tracker.write(output, who, "", from);
		    }
		    else{
			sendChat(from, "/desc " + output);
		    }
		    continue;
		}
		var output = "Status effects for token " + tokenNames[tokenIds[i]] + ":";
		if (who){
		    Tracker.write(output, who, "", from);
		}
		else{
		    sendChat(from, "/desc " + output);
		}
		for (var j = 0; j < byToken[tokenIds[i]].length; j++){
		    Tracker.write(byToken[tokenIds[i]][j], who, "", "Tracker");
		}
	    }
	    break;
	case "remove":
	case "rem":
	case "delete":
	case "del":
	    if ((tokens.length == 2) && (selected) && (selected.length > 0)){
		// some tokens selected and no ID specified; remove all status effects from selected tokens
		for (var i = 0; i < state.InitiativeTracker.status.length; i++){
		    var status = state.InitiativeTracker.status[i];
		    for (var j = 0; j < selected.length; j++){
			if ((selected[j]._type != "graphic") || (selected[j]._id != status.token)){ continue; }
			var token = getObj(selected[j]._type, selected[j]._id);
			if (!token){ continue; }
			token.set("status_" + status.status, false);
			state.InitiativeTracker.status.splice(i, 1);
			i -= 1;
			break;
		    }
		}
		break;
	    }
	    // ID specified or nothing selected; require ID and remove specified status effect
	    if (tokens.length != 3){
		Tracker.write("Error: The '" + tokens[1] + "' command requires an argument (status effect ID)", who, "", "Tracker");
		break;
	    }
	    var idx = parseInt(tokens[2]);
	    if ((idx < 0) || (idx >= state.InitiativeTracker.status.length)){
		Tracker.write("Error: Invalid status effect ID: " + tokens[2], who, "", "Tracker");
		break;
	    }
	    var status = state.InitiativeTracker.status[idx];
	    var token = getObj("graphic", status.token);
	    token.set("status_" + status.status, false);
	    state.InitiativeTracker.status.splice(idx, 1);
	    break;
	case "icons":
	    Tracker.write("Status Icons: " + Tracker.ALL_STATUSES.join(", "), who, "", "Tracker");
	    Tracker.write("Status Aliases:", who, "", "Tracker");
	    var output = "";
	    for (var k in Tracker.STATUS_ALIASES){
		if (output){ output += "\n"; }
		output += k + ": " + Tracker.STATUS_ALIASES[k];
	    }
	    Tracker.write(output, who, "", "Tracker");
	    break;
	case "help":
	    Tracker.showStatusHelp(who, tokens[0]);
	    break;
	default:
	    Tracker.write("Error: Unrecognized command: " + tokens[0], who, "", "Tracker");
	    Tracker.showStatusHelp(who, tokens[0]);
	}
    },

    handleChatMessage: function(msg){
	if (msg.type != "api"){ return; }

	if ((msg.content == "!tracker") || (msg.content.indexOf("!tracker ") == 0)){ return Tracker.handleTrackerMessage(msg.content.split(" "), msg); }
	if ((msg.content == "!status") || (msg.content.indexOf("!status ") == 0)){ return Tracker.handleStatusMessage(msg.content.split(" "), msg); }
    },

    registerTracker: function(){
	Tracker.initConfig();
	on("change:campaign:turnorder", Tracker.handleTurnChange);
	if ((typeof(Shell) != "undefined") && (Shell) && (Shell.registerCommand)){
	    Shell.registerCommand("!tracker", "!tracker <subcommand> [args]", "Configure the initiative tracker", Tracker.handleTrackerMessage);
	    Shell.registerCommand("!status", "!status <subcommand> [args]", "Track status effects on tokens", Tracker.handleStatusMessage);
	    if (Shell.write){
		Tracker.write = Shell.write;
	    }
	}
	else{
	    on("chat:message", Tracker.handleChatMessage);
	}
    }
};

on("ready", function(){ Tracker.registerTracker(); })