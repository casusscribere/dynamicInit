var Tracker = Tracker || {
	ALL_STATUSES: ["red", "blue", "green", "brown", "purple", "pink", "yellow",
		"dead", "skull", "sleepy", "half-heart", "half-haze", "interdiction", "snail", "lightning-helix", "spanner",
		"chained-heart", "chemical-bolt", "death-zone", "drink-me", "edge-crack", "ninja-mask", "stopwatch",
		"fishing-net", "overdrive", "strong", "fist", "padlock", "three-leaves", "fluffy-wing", "pummeled", "tread",
		"arrowed", "aura", "back-pain", "black-flag", "bleeding-eye", "bolt-shield", "broken-heart", "cobweb",
		"broken-shield", "flying-flag", "radioactive", "trophy", "broken-skull", "frozen-orb", "rolling-bomb",
		"white-tower", "grab", "screaming", "grenade", "sentry-gun", "all-for-one", "angel-outfit", "archery-target"
	],

	STATUS_ALIASES: {
		'crippled': "arrowed",
		'helpless': "cobweb",
		'pinned': "flying-flag",
		'prone': "back-pain",
		'frenzied': "strong",
		'stunned': "pummeled",
		'unaware': "half-haze",
		'hidden': "ninja-mask",
		'aiming': "archery-target",
		'braced': "sentry gun",
		'defensive': "white-tower",
		'guarded': "bolt-shield",
		'overwatch': "all-for-one",
		'inspired': "trophy",
		'hallucinating': "aura",
		'haywire': "spanner",
		'bloodloss': "half-haze",
		'blinded': "bleeding-eye",
		'deafened': "lightning-helix",
		'fire': "three-leaves",
		'engaged': "fist",
		'grabbed': "grab",
		'feared': "screaming",
		'unconscious': "sleepy",
		'uselesslimb': "broken-skull",
		'criticallywounded': "broken-heart",
		'heavilywounded': "half-heart",
		'lightlywounded': "chained-heart",
		'prone': "tread",
		'fullaim': "frozen-orb",
		'alloutatk': "overdrive",
		'majinitpenalty': "yellow",
		'lginitpenalty': "half-haze",
		'initpenalty': "pink",
		'mininitpenalty': "purple",
		'mininitbonus': "green",
		'initbonus': "blue",
		'lginitbonus': "brown",
		'majinitbonus': "red"
	},
	//TODO: fix so it searches status list and aliases, not just aliases
	INITIATIVE_MOD: {
		'unconscious': -100,
		'helpless': -20,
		'stunned': -20,
		'majinitpenalty': -20,
		'feared': -15,
		'pinned': -15,
		'fire': -15,
		'lrginitpenalty': -15,
		'grabbed': -10,
		'alloutatk': -10,
		'initpenalty': -10,
		'crippled': -5,
		'prone': -5,
		'blinded': -5,
		'deafened': -5,
		'heavilywounded': -5,
		'mininitpenalty': -5,
		'aiming': 5,
		'mininitbonus': 5,
		'guarded': 10,
		'fullaim': 10,
		'initbonus': 10,
		'lginitbonus': 15,
		'defensive': 20,
		'majinitbonus': 20
	},

	//for use with the complex status handler; sets status aliases to either persistent, rounds, or round
	STATUS_TYPES: {
		'crippled': "persistent",
		'helpless': "persistent",
		'pinned': "persistent",
		'prone': "persistent",
		'frenzied': "persistent",
		'stunned': "rounds",
		'unaware': "round",
		'hidden': "persistent",
		'aiming': "round",
		'braced': "persistent",
		'defensive': "round",
		'guarded': "round",
		'overwatch': "round",
		'inspired': "round",
		'hallucinating': "rounds",
		'haywire': "rounds",
		'bloodloss': "persistent",
		'blinded': "rounds",
		'deafened': "rounds",
		'fire': "rounds",
		'engaged': "persistent",
		'grabbed': "persistent",
		'feared': "round",
		'unconscious': "persistent",
		'uselesslimb': "rounds",
		'criticallywounded': "persistent",
		'heavilywounded': "persistent",
		'lightlywounded': "persistent",
		'prone': "persistent",
		'fullaim': "round",
		'alloutatk': "round",
		'majinitpenalty': "round",
		'lginitpenalty': "round",
		'initpenalty': "round",
		'mininitpenalty': "round",
		'mininitbonus': "round",
		'initbonus': "round",
		'lginitbonus': "round",
		'majinitbonus': "round"
	},


	//TODO: Build the code for the wh40ksheet, wh40krollscripts, and statusRound parameters
	CONFIG_PARAMS: [
		['announceRounds', "Announce Each Round"],
		['announceTurns', "Announce Each Player's Turn"],
		['announceExpiration', "Announce Status Expirations"],
		['highToLow', "High-to-Low Initiative Order"],
		['pooledInit', "Pooled Mook Initiative Rolls"],
		['dynamicInit', "Dynamic Initiative"],
		['statusRound', "Status Updated on Round"],
		['wh40ksheet', "using Args WH40k sheet"],
		['wh40krollscripts', "using Args WH40k scripts"],
		['autoremovedead', "automatically remove dead tokens"],
		['complexstatushandler', "handles status markers differently"]
	],


	initConfig: function () {
		if (!state.hasOwnProperty('InitiativeTracker')) {
			state.InitiativeTracker = {
				'highToLow': true,
				'announceRounds': true,
				'announceTurns': true,
				'announceExpiration': true,
				'pooledInit': true,
				'dynamicInit': true,
				'statusRound': true,
				'wh40ksheet': true,
				'wh40krollscripts': true,
				'autoremovedead': true,
				'complexstatushandler': true,
			};
		}
		if (!state.InitiativeTracker.hasOwnProperty('round')) {
			sendChat('', "the initiative tracker needs a token:" + state.InitiativeTracker.toString());
			state.InitiativeTracker.round = null;
		}
		if (!state.InitiativeTracker.hasOwnProperty('count')) {
			sendChat('', "the initiative tracker needs a token:" + state.InitiativeTracker.toString());
			state.InitiativeTracker.count = null;
		}
		if (!state.InitiativeTracker.hasOwnProperty('token')) {
			sendChat('', "the initiative tracker needs a token:" + state.InitiativeTracker.toString());
			state.InitiativeTracker.token = {};
		}
	},

	write: function (s, who, style, from) {
		if (who) {
			who = "/w " + who.split(" ", 1)[0] + " ";
		}
		sendChat(from, who + s.replace(/</g, "<").replace(/>/g, ">").replace(/\n/g, "<br>"));
	},

	reset: function () {
		state.InitiativeTracker.round = null;
		state.InitiativeTracker.count = null;
		state.InitiativeTracker.token = {};
	},

	dataSync: function () {
		var oldTurnOrderStr = Campaign().get('turnorder') || "[]";
		var turnOrder = JSON.parse(oldTurnOrderStr);
		var tokenid;
		var turn;
		var expires;
		var tokenInit;
		var nextInitiative;
		var statusname;
		var tokenStatusStr = '';
		var tokenStatusArr = [];
		var statusArr = [];
		var currentPageGraphics = findObjs({
			_pageid: Campaign().get("playerpageid"),
			_type: "graphic",
			_subtype: "token",
		});

		state.InitiativeTracker.token = {};

		_.each(currentPageGraphics, function (selToken) {
			if (selToken.get('bar3_value') != '' && (state.InitiativeTracker['autoremovedead'] === false || !selToken.get('statusmarkers').includes('dead'))) {
				//get a qualifying token and find a matching entry in the initiative order to get its init
				tokenid = selToken.get('id');
				turn = turnOrder.find(function (o) {
					return o.id === tokenid;
				});
				if (false) tokenInit = turnOrder[turn.id]; //TODO: fix
				else tokenInit = 0;
				nextInitiative = 0;
				statusArr = [];

				//get token's status markers and build the status array
				tokenStatusStr = selToken.get('statusmarkers');
				tokenStatusArr = tokenStatusStr.split(',');
				if (tokenStatusArr[0] != '' && tokenStatusArr[0] != undefined) {
					_.each(tokenStatusArr, function (selStatus) {
						statusname = selStatus.split('@')[0];
						if (statusname != '' && statusname != undefined) {
							if (selStatus.split('@')[1]) expires = selStatus.split('@')[1];
							else expires = 999;
							alias = _.invert(Tracker.STATUS_ALIASES)[statusname];
							//alias = Tracker.STATUS_ALIASES[statusname];
							if (!alias) alias = '';
							if (Tracker.INITIATIVE_MOD[alias]) nextInitiative += Tracker.INITIATIVE_MOD[alias];
							else if (Tracker.INITIATIVE_MOD[statusname]) nextInitiative += Tracker.INITIATIVE_MOD[statusname];
							statusArr.push({
								'duration': expires,
								'count': state.InitiativeTracker.count,
								'name': statusname,
								'alias': alias,
								'severity': 0
							});
						}
					});
				}
				//fully set the entry for the token
				state.InitiativeTracker.token[tokenid] = {
					initiative: tokenInit,
					nextInitiative: nextInitiative,
					name: selToken.get('name'),
					statuses: statusArr
				};
			}
		});
	},

	getInitModFromAliasOrStatus: function (name) {
		var output;
		if (Tracker.INITIATIVE_MOD[name]) {
			output = Tracker.INITIATIVE_MOD[name];
			return output;
		}
		//if we don't get a name match, try looking for a paired status or alias and try again
		if (Tracker.STATUS_ALIASES[name]) name = Tracker.STATUS_ALIASES[name];
		else if (_.invert(Tracker.STATUS_ALIASES)[name]) name = _.invert(Tracker.STATUS_ALIASES)[name];

		if (Tracker.INITIATIVE_MOD[name]) output = Tracker.INITIATIVE_MOD[name];
		else output = 0;

		return output;
	},

	getAliasOrName: function (status) {
		var output;
		if(status.alias) output=status.alias;
		else if (status.name) output=status.name;
		else output = 'unknown';
		return output;
	},

	stackTokenSync: function (id) {
		if (!state.InitiativeTracker.token[id]) {
			var name = getObj("graphic", id).get('name');
			if(!name) name = 'unknown';
			state.InitiativeTracker.token[id] = {
				initiative: 0,
				nextInitiative: 0,
				name: name,
				statuses: []
			};
		}
	},
	
	announceRound: function (round) {
		if (!state.InitiativeTracker.announceRounds) {
			return;
		}
		sendChat("", "/desc Start of Round " + round);
	},

	announceTurn: function (count, tokenName, tokenId) {
		if (!state.InitiativeTracker.announceTurns) {
			return;
		}
		if (!tokenName) {
			var token = getObj("graphic", tokenId);
			if (token) {
				tokenName = token.get('name');
			}
		}
		sendChat("", "/desc Start of Turn " + state.InitiativeTracker.round + " for " + tokenName + " (" + count + ")");
	},

	announceStatusExpiration: function (status, tokenName) {
		if (!state.InitiativeTracker.announceExpiration) {
			return;
		}
		sendChat("", "/desc Status " + status + " expired on " + tokenName);
	},

	handleTurnChange: function (newTurnOrder, oldTurnOrder) {
		var newTurns = JSON.parse((typeof (newTurnOrder) == typeof ("") ? newTurnOrder : newTurnOrder.get('turnorder') || "[]"));
		var oldTurns = JSON.parse((typeof (oldTurnOrder) == typeof ("") ? oldTurnOrder : oldTurnOrder.turnorder || "[]"));

		//log(newTurns);
		//log(oldTurns);
		if ((!newTurns) || (!oldTurns)) {
			return;
		}

		if ((newTurns.length == 0) && (oldTurns.length > 0)) {
			return Tracker.reset();
		} // turn order was cleared; reset

		if ((!newTurns.length) || (newTurns.length != oldTurns.length)) {
			return;
		} // something was added or removed; ignore

		if ((state.InitiativeTracker.round == null) || (state.InitiativeTracker.count == null)) {
			// first change: see if it's time to start tracking
			var startTracking = false;
			for (var i = 0; i < newTurns.length; i++) {
				if (newTurns[i].id != oldTurns[i].id) {
					// turn order was sorted; start tracking
					startTracking = true;
					break;
				}
				if (newTurns[i].pr != oldTurns[i].pr) {
					break;
				} // a token's initiative count was changed; don't start tracking yet
			}
			if (!startTracking) {
				return;
			}
			state.InitiativeTracker.round = 1;
			state.InitiativeTracker.count = newTurns[0].pr;
			Tracker.announceRound(state.InitiativeTracker.round);
			Tracker.announceTurn(newTurns[0].pr, newTurns[0].custom, newTurns[0].id);
			return;
		}

		if (newTurns[0].id == oldTurns[0].id) {
			return;
		} // turn didn't change

		var newCount = newTurns[0].pr;
		var oldCount = state.InitiativeTracker.count;
		if (!state.InitiativeTracker.highToLow) {
			// use negatives for low-to-high initiative so inequalities work out the same as high-to-low
			newCount = -newCount;
			oldCount = -oldCount;
		}

		var roundChanged = newCount > oldCount;

		//Adjust statuses for the token whose turn just ended (the previous token)
		if (newTurns[newTurns.length - 1].id != -1) {
			var currentToken = getObj("graphic", newTurns[newTurns.length - 1].id);
			//create a new token entry if necessary
			Tracker.stackTokenSync(newTurns[newTurns.length - 1].id);
			var currentStackToken = state.InitiativeTracker.token[newTurns[newTurns.length - 1].id];
			var characterName = currentToken.get('name');
			matchingTokens = findObjs({
				_pageid: Campaign().get("playerpageid"),
				_type: "graphic",
				_subtype: "token",
				name: characterName
			});

			//find all tokens that match a given character name
			_.each(matchingTokens, function (selToken) {
				var selStackToken = state.InitiativeTracker.token[selToken.id];
				if (selStackToken.initiative == currentStackToken.initiative) {
					_.each(selStackToken.statuses, function (selStatus, index) {
						selStatus.duration--;
						if (selStatus.duration <= 0) {
							selToken.set("status_" + selStatus.name, false);
							selStackToken.nextInitiative -= Tracker.getInitModFromAliasOrStatus(Tracker.getAliasOrName(selStatus));
							Tracker.announceStatusExpiration(Tracker.getAliasOrName(selStatus), selToken.get('name'));
							selStackToken.statuses.splice(index, 1);
						} else if (selStatus.duration < 10) {
							// status has nine or fewer rounds left; update marker to reflect remaining rounds
							selToken.set("status_" + selStatus.name, selStatus.duration);
						}
					});
				}
			});




			/*
			//sync the stack with extant tokens
			if (!state.InitiativeTracker.token[newTurns[newTurns.length-1].id]) {
				state.InitiativeTracker.token[tokenid] = {
					initiative: 0,
					name: currentToken.get('name'),
					status: []
				};
			}
			var currentStackToken = state.InitiativeTracker.token[newTurns[newTurns.length-1].id];
			if(currentStackToken){
				var curAlias='';
				_.each(currentStackToken.statuses,function(status, index){
					status.expires--;
					if(status.expires==0){
						currentToken.set("status_" + status.status, false);
						currentStackToken.statuses.splice(index, 1);
						curAlias = (_.invert(Tracker.STATUS_ALIASES))[status.status];
						currentStackToken.initiative -=Tracker.INITIATIVE_MOD[curAlias];
						log("found an alias of: "+curAlias+", modified the initiative by: "+ -Tracker.INITIATIVE_MOD[curAlias]+", with a new total of: "+currentStackToken.initiative);
						Tracker.announceStatusExpiration(status.name, currentToken.get('name'));
					}else if (status.expires < 10) {
						// status has nine or fewer rounds left; update marker to reflect remaining rounds
						currentToken.set("status_" + status.status, status.expires);
					}
				});
			}*/
		}





		///////////////////////////////////////////////////////////
		//
		//HOOK: This is the start of the dynamic initiative modifications
		//
		///////////////////////////////////////////////////////////
		if (roundChanged) {
			// made it back to the top of the initiative order
			state.InitiativeTracker.round += 1;
			Tracker.announceRound(state.InitiativeTracker.round);

			//Dynamic Init hook: find all the tokens on the map and reroll their initiative
			if (state.InitiativeTracker['dynamicInit'] === true) {
				var charid = '';
				var tokenid = '';
				var matchingCharacters = {}; //tracks character sheets with the same character name as a token's name
				var initBonus = 0;
				var roll = 0;
				var usedCharArray = []; //tracks the charids that have already been rolled for
				var turnorder = [];
				var oldstack = [];
				var newEntry = {};
				var rollArray = {};
				var duplicateInit = false;
				var page_id = '';
				var exists = false;
				var stackToken = {};
				var adjRollArray = [];
				var stackTokenInit = 0;
				var currentPageGraphics = findObjs({
					_pageid: Campaign().get("playerpageid"),
					_type: "graphic",
					_subtype: "token",
				});
				if (currentPageGraphics.length != 0) {
					page_id = currentPageGraphics[0].get('pageid');
				}

				//Set up the Round Start entry
				turnorder.push({
					id: "-1",
					pr: 100,
					custom: "Round Start",
					_pageid: page_id
				});

				_.each(currentPageGraphics, function (graphic) {
					tokenid = graphic.get('id');
					//only check tokens which have bar3 values and--if autoremove is enabled-- are not dead (are character tokens of some kind)
					if (graphic.get('bar3_value') != '' && (state.InitiativeTracker['autoremovedead'] === false || !graphic.get('statusmarkers').includes('dead'))) {
						exists = false;

						//synchronize the init tracker stucture with the extant tokens
						Tracker.stackTokenSync(tokenid);
						stackToken = state.InitiativeTracker.token[tokenid];
						stackToken.initiative = stackToken.nextInitiative;
						stackTokenInit = stackToken.initiative;

						//check to see if the token is linked to a character
						charid = graphic.get('represents');
						if (charid != undefined && charid != '') {

							//if the token represents a character we handle it uniquely
							initBonus = getAttrByName(charid, "AgilityMod", "current");

							//TODO: eventually, we want linked characters to have their initiative modifier reflected in the character sheet
							roll = randomInteger(10) + parseInt(initBonus);
							log("INIT: [UNIQUE] " + graphic.get('name') + " with token id " + graphic.get('id') + " and character id of " + charid + " has a premodified init roll of " + roll);
						} else {

							//if there's no linked char, see if we can find any characters with the exact same name as the token
							characterName = graphic.get('name');
							matchingCharacters = findObjs({
								_type: "character",
								name: characterName,
							});
							if (matchingCharacters.length == 0) {
								//generic tokens with no matching character get a generic roll
								initBonus = 0;
								roll = randomInteger(10);
							} else {

								//if there's a matching character but the token isn't directly linked then the character is a mook
								charid = matchingCharacters[0].get('id');
								if (state.InitiativeTracker['pooledInit'] === true) {
									exists = !usedCharArray.every(function (used) {
										return used !== charid;
									});
								}
								if (exists === false) {

									//handles first instance of a mook
									initBonus = getAttrByName(charid, "AgilityMod", "current");
									roll = randomInteger(10) + parseInt(initBonus);

									rollArray[charid] = roll;
									usedCharArray.push(charid);
								} else {

									//handles subsequent instances of a mook
									initBonus = getAttrByName(charid, "AgilityMod", "current");
									roll = rollArray[charid];
								}
							}
						}

						//add any status-based initiative modifications
						roll += parseInt(stackTokenInit);
						if (charid) {
							duplicateInit = _.some(adjRollArray[charid], function (value) {
								return value === roll;
							});
							if (exists === false) adjRollArray[charid] = [];
							if (duplicateInit === false) adjRollArray[charid].push(roll);
						}

						//place in ordered turnorder array IF the character hasn't already been added OR the character is a mook with an adjusted initiative value
						if (exists === false || (exists === true && duplicateInit === false)) {

							//place the new entry in an ordered position on the stack
							newEntry = {
								id: tokenid,
								pr: roll,
								custom: graphic.get('name'),
								_pageid: page_id
							};

							//remove items from the stack until we encounter a roll entry equal to or less than the top of the stack
							while (newEntry.pr > turnorder[turnorder.length - 1].pr) {
								oldstack.push(turnorder.pop());
							}

							//check the tiebreaker if tied or just add it to the stack
							if (newEntry.pr === turnorder[turnorder.length - 1].pr) {
								//get the initiative bonuses for the requisite tokens' characters
								var newTokenInitBonus, oldTokenInitBonus;
								if(charid) newTokenInitBonus=getAttrByName(charid, "AgilityMod", "current");
								else newTokenInitBonus=0;
								oldTokenInitBonus = getObj("graphic",turnorder[turnorder.length - 1].id).get('represents');
								if(oldTokenInitBonus) oldTokenInitBonus=getAttrByName(oldTokenInitBonus, "AgilityMod", "current");
								else {
									matchingCharacters = findObjs({
										_type: "character",
										name: characterName,
									});
									if(matchingCharacters.length===0) oldTokenInitBonus=0;
									else oldTokenInitBonus=getAttrByName(matchingCharacters[0].id, "AgilityMod", "current");
								}

								if (newTokenInitBonus > oldTokenInitBonus) oldstack.push(turnorder.pop());
								turnorder.push(newEntry);
							} else if (newEntry.pr < turnorder[turnorder.length - 1].pr) {
								turnorder.push(newEntry);
							} else {
								log("something fucked up");
							}

							//restore the bottom of the stack
							while (oldstack.length > 0) {
								turnorder.push(oldstack.pop());
							}
						}
					}
				});

				//Push turnorder to roll20
				log("Turn Order Str: " + JSON.stringify(turnorder));
				Campaign().set("turnorder", JSON.stringify(turnorder));
			}
		}
		/*
		if (newTurns[0].pr != state.InitiativeTracker.count && state.InitiativeTracker['statusRound'] === true) {
			// update statuses that update between the last count and this count
			for (var i = 0; i < state.InitiativeTracker.token.length; i++) {
				var token = getObj("graphic", state.InitiativeTracker.token[i]);
				if (!token) {
					// token associated with this status doesn't exist anymore; remove it
					state.InitiativeTracker.token.splice(i, 1);
					i -= 1;
					continue;
				}
				for(var j=0;j<state.InitiativeTracker.token[i].status.length; j++){
					var status = state.InitiativeTracker.token[i].status[j];
					var statusCount = status.count;
					if (!state.InitiativeTracker.highToLow) {
						statusCount = -statusCount;
					}
					if ((roundChanged) && (statusCount >= oldCount) && (statusCount < newCount)) {
						continue;
					} // status not between last count and this count
					if ((!roundChanged) && ((statusCount >= oldCount) || (statusCount < newCount))) {
						continue;
					}
					if (status.expires <= state.InitiativeTracker.round) {
						// status expired; remove marker and announce expiration
						token.set("status_" + status.status, false);
						state.InitiativeTracker.token[i].status.splice(i, 1);
						i -= 1;
						Tracker.announceStatusExpiration(status.name, token.get('name'));
					} else if (status.expires - state.InitiativeTracker.round < 10) {
						// status has nine or fewer rounds left; update marker to reflect remaining rounds
						token.set("status_" + status.status, status.expires - state.InitiativeTracker.round);
					}

				}

			}
		}*/

		state.InitiativeTracker.count = newTurns[0].pr;
		Tracker.announceTurn(newTurns[0].pr, newTurns[0].custom, newTurns[0].id);
	},

	getConfigParam: function (who, param) {
		if (param == null) {
			for (var i = 0; i < Tracker.CONFIG_PARAMS.length; i++) {
				var head = Tracker.CONFIG_PARAMS[i][1] + " (" + Tracker.CONFIG_PARAMS[i][0] + "): ";
				Tracker.write(head + state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]], who, "", "Tracker");
			}
		} else {
			var err = true;
			for (var i = 0; i < Tracker.CONFIG_PARAMS.length; i++) {
				if (Tracker.CONFIG_PARAMS[i][0] == param) {
					var head = Tracker.CONFIG_PARAMS[i][1] + " (" + Tracker.CONFIG_PARAMS[i][0] + "): ";
					Tracker.write(head + state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]], who, "", "Tracker");
					err = false;
					break;
				}
			}
			if (err) {
				Tracker.write("Error: Config parameter '" + param + "' not found", who, "", "Tracker");
			}
		}
	},

	setConfigParam: function (who, param, value) {
		var err = true;
		for (var i = 0; i < Tracker.CONFIG_PARAMS.length; i++) {
			if (Tracker.CONFIG_PARAMS[i][0] == param) {
				state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]] = (value == null ? !state.InitiativeTracker[Tracker.CONFIG_PARAMS[i][0]] : value);
				err = false;
				break;
			}
		}
		if (err) {
			Tracker.write("Error: Config parameter '" + param + "' not found", who, "", "Tracker");
		}
	},

	showTrackerHelp: function (who, cmd) {
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

	handleTrackerMessage: function (tokens, msg) {
		var who = msg.who;
		msg = msg.content;
		if ((tokens.length > 1) && (tokens[1] == "public")) {
			who = "";
			tokens.splice(1, 1);
		}
		if (tokens.length < 2) {
			return Tracker.showTrackerHelp(who, tokens[0]);
		}
		switch (tokens[1]) {
			//TODO: fix all of this shit
			case "sync":
				Tracker.dataSync();
				Tracker.write("Backend sync finished", "", "Tracker");
				break;
			case "back":
				var oldTurnOrderStr = Campaign().get('turnorder') || "[]";
				var turnOrder = JSON.parse(oldTurnOrderStr);
				if (turnOrder.length > 0) {
					// as far as handleTurnChange is concerned, we're going forward until one count back in the next round;
					// decrement round counter so that handleTurnChange will do the right thing
					state.InitiativeTracker.round -= 1;
					turnOrder.unshift(turnOrder.pop());
					var newTurnOrderStr = JSON.stringify(turnOrder);
					Campaign().set('turnorder', newTurnOrderStr);
					Tracker.handleTurnChange(newTurnOrderStr, oldTurnOrderStr);
				}
				break;
			case "restart":
				var turnOrder = JSON.parse(Campaign().get('turnorder') || "[]");
				if (turnOrder.length > 0) {
					turnOrder.sort(function (x, y) {
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
				if (tokens.length <= 2) {
					Tracker.getConfigParam(who, null);
				} else {
					Tracker.getConfigParam(who, tokens[2]);
				}
				break;
			case "set":
				if (tokens.length <= 2) {
					Tracker.write("Error: The 'set' command requires at least one argument (the parameter to set)", who, "", "Tracker");
					break;
				}
				var value = true;
				if (tokens.length > 3) {
					if ((tokens[3] != "true") && (tokens[3] != "yes") && (tokens[3] != "1")) {
						value = false;
					}
				}
				Tracker.setConfigParam(who, tokens[2], value);
				break;
			case "enable":
				if (tokens.length != 3) {
					Tracker.write("Error: The 'enable' command requires exactly one argument (the parameter to enable)", who, "", "Tracker");
					break;
				}
				Tracker.setConfigParam(who, tokens[2], true);
				break;
			case "disable":
				if (tokens.length != 3) {
					Tracker.write("Error: The 'disable' command requires exactly one argument (the parameter to disble)", who, "", "Tracker");
					break;
				}
				Tracker.setConfigParam(who, tokens[2], false);
				break;
			case "toggle":
				if (tokens.length != 3) {
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

	addStatus: function (tokenId, duration, status, name) {
		var token = getObj("graphic", tokenId);
		if (!token) {
			return;
		}

		if (state.InitiativeTracker['complexstatushandler'] === true) {
			if (Tracker.STATUS_TYPES[status] == "persistent") {
				duration = 300;
			} else if (Tracker.STATUS_TYPES[status] == "round") {
				duration = 1;
			} else if (Tracker.STATUS_TYPES[status] == "rounds") {}
		}

		//determine the alias and status
		if (Tracker.STATUS_ALIASES[status]) {
			alias=status;
			status=Tracker.STATUS_ALIASES[status];
		}else if(_.invert(Tracker.STATUS_ALIASES)[status]) {
			alias=_.invert(Tracker.STATUS_ALIASES)[status];
		}else {
			alias='';
			status='';
		}

		//sync stack with extant tokens
		Tracker.stackTokenSync(tokenId);
		selectedToken = state.InitiativeTracker.token[tokenId];
		selectedToken.nextInitiative += Tracker.getInitModFromAliasOrStatus(status);
		state.InitiativeTracker.token[tokenId].statuses.push({
			'duration': duration,
			'count': state.InitiativeTracker.count,
			'name': status,
			'alias': alias,
			'severity': 0
		});
		if (duration > 10) {
			duration = true;
		}
		token.set("status_" + status, duration);
	},

	showStatusHelp: function (who, cmd) {
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

	handleStatusMessage: function (tokens, msg) {
		var who = msg.who;
		var selected = msg.selected;
		msg = msg.content;
		if ((tokens.length > 1) && (tokens[1] == "public")) {
			who = "";
			tokens.splice(1, 1);
		}
		if (tokens.length < 2) {
			return Tracker.showStatusHelp(who, tokens[0]);
		}
		switch (tokens[1]) {
			case "add":
				if ((!selected) || (selected.length <= 0)) {
					Tracker.write("Error: The 'add' command requires at least one selected token", who, "", "Tracker");
					break;
				}
				if (tokens.length < 5) {
					Tracker.write("Error: The 'add' command requires three arguments (duration, icon, description)", who, "", "Tracker");
					break;
				}
				if (state.InitiativeTracker.round <= 0) {
					Tracker.write("Error: Initiative not being tracked", who, "", "Tracker");
					break;
				}
				for (var i = 0; i < selected.length; i++) {
					if (selected[i]._type != "graphic") {
						continue;
					}
					var token = getObj(selected[i]._type, selected[i]._id);
					if (!token) {
						continue;
					}
					Tracker.addStatus(token.get('id'), parseInt(tokens[2]), tokens[3], tokens.slice(4).join(" "));
					//Tracker.addStatus(selected[i]._id, parseInt(tokens[2]), tokens[3], tokens.slice(4).join(" "));
				}
				break;
			case "list":
			case "show":
				if ((!selected) || (selected.length <= 0)) {
					Tracker.write("Error: The '" + tokens[1] + "' command requires at least one selected token", who, "", "Tracker");
					break;
				}

				var tokenIds = [];
				var tokenNames = {};
				for (var i = 0; i < selected.length; i++) {
					if (selected[i]._type != "graphic") {
						continue;
					}
					var token = getObj(selected[i]._type, selected[i]._id);
					if (!token) {
						continue;
					}
					tokenIds.push(selected[i]._id);
					tokenNames[selected[i]._id] = token.get('name');
				}
				var output = '';
				_.each(tokenIds, function (id, index) {
					var selStackToken = state.InitiativeTracker.token[id];
					if (!selStackToken.statuses) {
						output += "No status effects for token: " + tokenNames[id];
					} else {
						output += "Initiative Modifiers: " + selStackToken.initiative + " " + selStackToken.nextInitiative + "\n";
						_.each(selStackToken.statuses, function (selStatus, index) {
							/*var duration = selStatus.expires - state.InitiativeTracker.round;
							if ((state.InitiativeTracker.highToLow) && (selStatus.count < state.InitiativeTracker.count)) {
								duration += 1;
							}
							if ((!state.InitiativeTracker.highToLow) && (selStatus.count > state.InitiativeTracker.count)) {
								duration += 1;
							}*/
							output += index + ": " + tokenNames[id] + ": " + selStatus.alias + " " + selStatus.duration + "\n";
						});
					}
				});
				var from = (who ? "Tracker" : "");
				if (who) {
					Tracker.write(output, who, "", from);
				} else {
					sendChat(from, "/desc " + output);
				}

				break;
			case "remove":
			case "rem":
			case "delete":
			case "del":
				if ((tokens.length == 2) && (selected) && (selected.length > 0)) {
					// some tokens selected and no ID specified; remove all status effects from selected tokens
					for (var k = 0; k < selected.length; k++) {
						if (selected[k]._type != "graphic") {
							continue;
						}
						var token = getObj(selected[k]._type, selected[k]._id);
						if (!token) {
							continue;
						}
						var stackToken = state.InitiativeTracker.token[selected[k]._id];
						for (var i = 0; i < stackToken.statuses.length; i++) {
							var status = stackToken.statuses[i].name;
							token.set("status_" + status, false);
							var curAlias = (_.invert(Tracker.STATUS_ALIASES))[status];
							stackToken.nextInitiative -= Tracker.INITIATIVE_MOD[curAlias];
							log(token.get('name') + " with id: " + token.id + "found an alias of: " + curAlias + ", set the next init to: " + stackToken.nextInitiative + ", and has a current init of: " + stackToken.initiative);
							Tracker.announceStatusExpiration(status.name, token.get('name'));
							stackToken.statuses.splice(i, 1);
							i -= 1;
						}
					}
					break;
				}
				// ID specified or nothing selected; require ID and remove specified status effect
				if (tokens.length != 3) {
					Tracker.write("Error: The '" + tokens[1] + "' command requires an argument (status effect ID)", who, "", "Tracker");
					break;
				}
				var idx = parseInt(tokens[2]);
				if (idx < 0) {
					Tracker.write("Error: Invalid status effect ID: " + tokens[2], who, "", "Tracker");
					break;
				}
				for (var i = 0; i < selected.length; i++) {
					if (selected[i]._type != "graphic") {
						continue;
					}
					var token = getObj(selected[i]._type, selected[i]._id);
					if (!token) {
						continue;
					}
					var stackToken = state.InitiativeTracker.token[selected[i]._id];
					var status = stackToken.statuses[idx].name;
					token.set("status_" + status, false);
					var curAlias = (_.invert(Tracker.STATUS_ALIASES))[status];
					stackToken.nextInitiative -= Tracker.INITIATIVE_MOD[curAlias];
					Tracker.announceStatusExpiration(status.name, token.get('name'));
					stackToken.statuses.splice(idx, 1);
				}
				break;
			case "icons":
				Tracker.write("Status Icons: " + Tracker.ALL_STATUSES.join(", "), who, "", "Tracker");
				Tracker.write("Status Aliases:", who, "", "Tracker");
				var output = "";
				for (var k in Tracker.STATUS_ALIASES) {
					if (output) {
						output += "\n";
					}
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

	handleChatMessage: function (msg) {
		if (msg.type != "api") {
			return;
		}

		if ((msg.content == "!tracker") || (msg.content.indexOf("!tracker ") == 0)) {
			return Tracker.handleTrackerMessage(msg.content.split(" "), msg);
		}
		if ((msg.content == "!status") || (msg.content.indexOf("!status ") == 0)) {
			return Tracker.handleStatusMessage(msg.content.split(" "), msg);
		}
	},

	registerTracker: function () {
		Tracker.initConfig();
		on("change:campaign:turnorder", Tracker.handleTurnChange);
		if ((typeof (Shell) != "undefined") && (Shell) && (Shell.registerCommand)) {
			Shell.registerCommand("!tracker", "!tracker <subcommand> [args]", "Configure the initiative tracker", Tracker.handleTrackerMessage);
			Shell.registerCommand("!status", "!status <subcommand> [args]", "Track status effects on tokens", Tracker.handleStatusMessage);
			if (Shell.write) {
				Tracker.write = Shell.write;
			}
		} else {
			on("chat:message", Tracker.handleChatMessage);
		}
	}
};

on("ready", function () {
	Tracker.registerTracker();
})