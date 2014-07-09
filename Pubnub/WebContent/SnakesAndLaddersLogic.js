var checkTurn = true;
var playPosition=0;
var playerDiceRoll=0;
var currentPlayerId;
var lastDiceRoll;
var winnerId ;
var game = new function(){
	var gameSelf = this;
	var START = 0;
	var VICTORY = 100;
	var players = [];
	var playerTurn;
	var pubnub;
	// array for snakes and ladders
	var snakesAndLadders = [new SnakeOrLadder( 1,38), new SnakeOrLadder( 4,14), new SnakeOrLadder( 9,31), new SnakeOrLadder(17,7 ), new SnakeOrLadder(21,42), new SnakeOrLadder(28,84), 
							new SnakeOrLadder(51,67), new SnakeOrLadder(54,34), new SnakeOrLadder(62,19), new SnakeOrLadder(64,60), new SnakeOrLadder(71,91), new SnakeOrLadder(80,100), 
							new SnakeOrLadder(87,24), new SnakeOrLadder(93,73), new SnakeOrLadder(95,75), new SnakeOrLadder(98,79)];


	gameSelf.defaultSetup = function(){
		players = [];
		gameSelf.addPlayer();
		gameSelf.addPlayer();
		playerTurn = 0;
		InvokeCB(currentPlayerChangedCallback, game.getPlayerTurn());
		InvokeCB(gameStateChangedCallback, false);
	}
	
	gameSelf.newGame = function(){
		for(var i = 0; i < players.length; i++){
			players[i].resetPosition();
		}
		InvokeCB(gameStateChangedCallback, false);
		playerTurn =0;
		InvokeCB(currentPlayerChangedCallback, game.getPlayerTurn());
	}
	
	gameSelf.getPlayers = function(){
		return players;
	}

	gameSelf.getPlayerTurn = function(){
		return players[ playerTurn ];
	}
	
	gameSelf.addPlayer = function(){
		var aPlayer = new Player("Player" + players.length);
		players.push(aPlayer)
		InvokeCB(playerAddedCallback,aPlayer);
	}
	
	gameSelf.getPlayersNames = function(){
		var i = 0;
		var result = new Array(players.length);
		for (i=0;i<players.length;i++){
			result[i] = players[i].name;
		}
		return result;
	}

	function updateTurn(id){
		playerTurn =id;
		InvokeCB(currentPlayerChangedCallback, game.getPlayerTurn());
	}

	// dice roll and move player
	gameSelf.nextTurn = function(id){
	currentPlayerId = id;
				
			if(id==playerTurn){
				
					game.getPlayerTurn().move(snakesAndLadders);
					game.play();
			}else {
				alert("Another Player Turn");
			}
	

	}
	// set Position of players 
	gameSelf.setPosition = function(message){
		var playerPosition1 = message.split(",")[0];
		var playerPosition2 = message.split(",")[1];
		var lastDice = message.split(",")[2];
		var currentDice = message.split(",")[3];
		var id = message.split(",")[4];
		
		
		if(playerTurn==1){
			document.getElementById('diceRoll1').innerHTML = currentDice;
			document.getElementById('position1').innerHTML = playerPosition2;
			animation.animateToken('Player1', playerPosition2);
		}else if(playerTurn==0){
			document.getElementById('diceRoll0').innerHTML = currentDice ;
			document.getElementById('position0').innerHTML =playerPosition1;
			animation.animateToken('Player0', playerPosition1);

			}
			var player1 = document.getElementById('position1').innerHTML;
			var player0 = document.getElementById('position0').innerHTML;

			if(player1==100){
				alert("Player2 won the game ");
				document.getElementById("Turn").disabled=true;
				location.reload(true);
			}
			if(player0==100){
				alert("Player1 won the game ");
				document.getElementById("Turn").disabled=true;
				location.reload(true);
			}


		updateTurn(id);
	
		
			
		
		

	}
	//method  
	gameSelf.isGameOver = function(){
		var result = false;
		for(var i = 0; i < players.length; i++){
			if (players[i].getPosition() >= VICTORY) {
				result = true;
				winnerId = i+1;
			}
		}
		if (result == true) {
			InvokeCB(gameStateChangedCallback, true);
		}
		return result;
	}
	//init method of pubnub called with keys and chnnel
	gameSelf.initBoard = function(){
		pubnub = PUBNUB.init({
	   		publish_key   : 'pub-c-87af66d2-14f5-4c20-9fa2-d71e91173580',
	        subscribe_key : 'sub-c-b683b2c8-01cc-11e4-a0c4-02ee2ddab7fe'
	    });
		pubnub.subscribe({

			channel : 'aa',
			message : 	gameSelf.setPosition	
		});
	}
	// publish the message using channel
	gameSelf.play  = function(){
		var id ;
		if(currentPlayerId==0){
			id=1;
		}
		else if(currentPlayerId==1){
			id=0;
		}
		pubnub.publish({
			channel : 'aa',
			message :  players[0].getPosition()+","+ players[1].getPosition()+","+lastDiceRoll+","+playerDiceRoll+","+id

		});
	}
	var playerAddedCallback = new Array();
	var currentPlayerChangedCallback = new Array();
	var gameStateChangedCallback = new Array();
	
	gameSelf.playerAdded = function(cb){
		playerAddedCallback.push(cb);
	}
	
	gameSelf.currentPlayerChanged = function(cb){
		currentPlayerChangedCallback.push(cb)
	}
	
	gameSelf.gameStateChanged = function(cb){
		gameStateChangedCallback.push(cb);
	}
	function InvokeCB(cb, arg)
	{
	   for(var i=0;i<cb.length;i++)
	   {
		  if (cb[i]){cb[i](arg);}
	   }
	}
	
	/**
	* Player represents a player in the game.
	*/
	function Player(name){
		var playerSelf = this;
		var name = name;
		var position = START;
		playerSelf.setPosition = function(newPosition){
			playerSelf.position = newPosition;
			//InvokeCB(positionChangedCallback,position);

		}
		playerSelf.getPosition = function(){
			return position;
		}
		
		playerSelf.resetPosition = function(){
			position = START;
		//	InvokeCB(positionChangedCallback,position);
		}
		
		playerSelf.setName = function(newName){
			playerSelf.name = newName;
			InvokeCB(nameChangedCallback,newName);
		}
		
		playerSelf.getName = function(){
			return name;
		}
		
		function rollDice(){
			var result = Math.ceil(Math.random()*6);
			InvokeCB(diceRolledCallback, result);
			return result;
		}
		
		
		var positionChangedCallback = new Array();
		var nameChangedCallback = new Array();
		var diceRolledCallback = new Array();
		
		playerSelf.positionChanged = function(cb){
			positionChangedCallback.push(cb);
		}
		playerSelf.nameChanged = function(cb){
			nameChangedCallback.push(cb);
		}
		
		playerSelf.diceRolled = function(cb){
			diceRolledCallback.push(cb);
		}
		
		function InvokeCB(cb, arg)
		{
		   for(var i=0;i<cb.length;i++)
		   {
			  if (cb[i]){cb[i](arg);}
		   }
		}
		
		playerSelf.move = function(snakesAndLadders){
			lastDiceRoll = playerDiceRoll;
			playerDiceRoll = rollDice();
			position = playerDiceRoll + position;
			if(position>100){
				position = 100;
			}
			//InvokeCB(positionChangedCallback,position);
			for (var i = 0; i < snakesAndLadders.length; i++){
				if (position == snakesAndLadders[i].getHead()){
					position = snakesAndLadders[i].getTail();
					//InvokeCB(positionChangedCallback,position);
				}
			}
			
		}
	}
	
	/**
	* SnakeOrLadder represents a snake or ladder object. 
	* To create a snake the head value must be greater then the tail value.
	* To create a ladder the head value must be great then the tail value. 
	*/
	function SnakeOrLadder(head, tail){
		var snakeOrLadderSelf = this;
		var head = Math.abs(head);
		var tail = Math.abs(tail);
		
		snakeOrLadderSelf.getHead = function() {
			return head;
		}
		
		snakeOrLadderSelf.getTail = function() {
			return tail;
		}
	}
	
	gameSelf.gameState = function(){
		alert(players[0].getName() + " Position = " + players[0].getPosition() + "\n" + players[1].getName() + " Position = " + players[1].getPosition() );
	}
	
	gameSelf.testVictory = function() {
		while (!game.isGameOver()){
			game.nextTurn();
		}
		alert("Game Over player " + game.getPlayerTurn().getName() + " is the victor.");
	}
}();
