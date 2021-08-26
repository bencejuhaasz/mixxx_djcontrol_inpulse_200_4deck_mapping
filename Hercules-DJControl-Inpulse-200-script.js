// DJControl_Inpulse_200_script.js
//
// ***************************************************************************
// * Mixxx mapping script file for the Hercules DJControl Inpulse 200.
// * Author: DJ Phatso, contributions by Kerrick Staley
// * Version 1.2 (March 2020)
// * Forum: https://www.mixxx.org/forums/viewtopic.php?f=7&t=12592
// * Wiki: https://mixxx.org/wiki/doku.php/hercules_djcontrol_inpulse_200
//
// Changes to v1.2
// - Code cleanup.
//
// Changes to v1.1
// - Fix seek-to-start and cue-master behavior.
// - Tweak scratch, seek, and bend behavior.
// - Controller knob/slider values are queried on startup, so MIXXX is synced.
// - Fixed vinyl button behavior the first time it's pressed.
//
// v1.0 : Original forum release
//
// TO DO: Functions that could be implemented to the script:
//
//  FX:
//  - See how to preselect effects for a rack
//
//*************************************************************************

var DJCi200 = {};
//////////
function DJCi200() {}
DJCi200.init = function () {
    // Set up the controller to manipulate decks 1 & 2 when this script is loaded (when Mixxx starts or you save an edited script file)
    // The DJCi200.initDeck function is defined below.
    DJCi200.initDeck('[Channel1]')
    DJCi200.initDeck('[Channel2]')
}

DJCi200.shutdown = function() {}

DJCi200.deck = {
    // a hash table (technically an object) to store which deck each side of the controller is manipulating
    // The keys (object properties) on the left represent the <group> elements in the XML mapping file.
    // The values on the right represent which deck that set of mappings in the XML file is currently controlling.
    // These values are toggled between [Channel1]/[Channel3] and [Channel2]/[Channel4] by the deckToggleButton function below.
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer
    '[Channel1]': '[Channel1]',
    '[Channel2]': '[Channel2]'
}
DJCi200.buttons = { // a hash table that stores the MIDI notes that correspond to LED backlit buttons
    '[Channel1]': {
        'deckToggle': 0x01,
        // Add any other LEDs for decks 1/3 here
     },
     '[Channel2]': {
        'deckToggle': 0x02,
        // Add any other LEDs for decks 2/4 here
     }
}
DJCi200.buttons['[Channel3]'] = DJCi200.buttons['[Channel1]'] // Copy [Channel1] to [Channel3]
DJCi200.buttons['[Channel4]'] = DJCi200.buttons['[Channel2]'] // Copy [Channel2] to [Channel4]

DJCi200.channelRegEx = /\[Channel(\d+)\]/ // a regular expression used in the deckToggleButton function below
// This extracts the number from the strings '[Channel1]' ... '[Channel4]' so we can do math with that number
// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
DJCi200.deckToggleButton = function (channel, control, value, status, group) {
    if (value) { // only execute the below code when the button is pressed but not when it is released
        // First, get the number out of the string '[Channel1]' ... '[Channel4]'
        var deckNumber = parseInt( // convert string to an integer number variable
                             DJCi200.channelRegEx.exec( // execute the regular expression
                                 DJCi200.deck[group] // on this string
                             )[1] // Get the string that matches the part of the regular expression inside the first group of parentheses in the regular expression
                                  // which is (\d+)
                                  // this matches any number of digits
                          )
        if (deckNumber <= 2) {
            deckNumber += 2 // This is a shortcut for 'deckNumber = decknumber + 2'
        } else {
            deckNumber -= 2 // This is a shortcut for 'deckNumber = decknumber - 2'
        }
        DJCi200.deck[group] = '[Channel' + deckNumber + ']'
        DJCi200.initDeck(DJCi200.deck[group], channel) // Initialize the new deck. This function is defined below.
    }
}




DJCi200.initDeck = function (group, channel) { // This function is not mapped to a MIDI signal; it is only called by this script in the init and deckToggleButton functions
    // Execute code to set up the controller for manipulating a deck
    // Putting this code in a function allows you to call the same code from the script's init function and the deckToggleButton function without having to copy and paste code

    // Figure out which deck was being controlled before so automatic reactions to changes in Mixxx (see above) can be disabled for that deck
    var disconnectDeck = parseInt(DJCi200.channelRegEx.exec(group)[1])
    if (disconnectDeck <= 2) {
        disconnectDeck += 2
    } else {
        disconnectDeck -= 2
    }
    DJCi200.connectDeckControls(channel, '[Channel'+disconnectDeck+']', true) // disconnect old deck's Mixxx controls from LEDs. This function is defined below.
    DJCi200.connectDeckControls(channel, group) // connect new deck's Mixxx controls to LEDs

    // Toggle LED that indicates which deck is being controlled
    midi.sendShortMsg(
        0x90,
        DJCi200.buttons[group]['deckToggle'],
        (disconnectDeck > 2) ? 0x7f : 0x00 // If the condition in parentheses is true, send 0x7f; otherwise, send 0x00
                                           // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_Operator
    )
}

DJCi200.connectDeckControls = function (channel, group, remove) { // This function is not mapped to a MIDI signal; it is only called by this script in the initDeck function below
    // This function either connects or disconnects automatic reactions to changes in Mixxx (see wiki section above), depending on the value of the 'remove' parameter
    // Putting this in its own function allows the same code to be reused for both connecting and disconnecting
    // This is particularly helpful when the list of Mixxx controls connected to LEDs is long
    
    remove = (typeof remove !== 'undefined') ? remove : false // If the 'remove' parameter is not passed to this function, set remove = false
    var controlsToFunctions = { // This hash table maps Mixxx controls to the script functions (not shown in this example) that control LEDs that react to changes in those controls
        'pfl': 'PFL',
        'beatloop_1_toggle': 'BEATLOOP_1_toggle',
        'beatloop_2_toggle': 'BEATLOOP_2_toggle',
        'beatloop_4_toggle': 'BEATLOOP_4_toggle',
        'beatloop_8_toggle': 'BEATLOOP_8_toggle',
        'cue_indicator': 'CUE_INDICATOR',
        'end_of_track': 'END_OF_TRACK',
        'hotcue_1_enabled': 'HOTCUE_1_ENABLED',
        'hotcue_2_enabled': 'HOTCUE_2_ENABLED',
        'hotcue_3_enabled': 'HOTCUE_3_ENABLED',
        'hotcue_4_enabled': 'HOTCUE_4_ENABLED',
        'play_indicator': 'PLAY_INDICATOR',
        'start_play': 'START_PLAY',
        'sync_enabled': 'SYNC_ENABLED'
	}
	if (group=='[Channel1]'||group=='[Channel3]') {
		engine.connectControl('[EffectRack1_EffectUnit1]', 'group_'+group+'_enable', EFFECT1_ENABLE, remove)
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		engine.connectControl('[EffectRack1_EffectUnit2]', 'group_'+group+'_enable', EFFECT2_ENABLE, remove)
	}
        
        if (! remove) {
        	if (group=='[Channel1]'||group=='[Channel3]') {
			engine.trigger('[EffectRack1_EffectUnit1]', 'group_'+group+'_enable')
		}
		if (group=='[Channel2]'||group=='[Channel4]') {
			engine.trigger('[EffectRack1_EffectUnit2]', 'group_'+group+'_enable')
		}
        }
        
        // ... and any other functions that react to changes in Mixxx controls for a deck
    for (var control in controlsToFunctions) { // For each property (key: value pair) in controlsToFunctions, control = that property of controlsToFunctions
                                               // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
        engine.connectControl(group, control, controlsToFunctions[control], remove)
        if (! remove) { // '!' means "not"; it inverts the value of a boolean (true/false)
            engine.trigger(group, control)
        }
    }
}

function EFFECT1_ENABLE(value, _group, control, channel) {
	if (engine.getValue(_group, control)) {
			midi.sendShortMsg(0x96, 0x23, 0x7f);
			midi.sendShortMsg(0x96, 0x2B, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x23, 0x00);
			midi.sendShortMsg(0x96, 0x2B, 0x00);
		}
}

function EFFECT2_ENABLE(value, _group, control, channel) {
	if (engine.getValue(_group, control)) {
			midi.sendShortMsg(0x97, 0x23, 0x7f);
			midi.sendShortMsg(0x97, 0x2B, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x23, 0x00);
			midi.sendShortMsg(0x97, 0x2B, 0x00);
		}
}



function PFL(value, group, control, channel) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'pfl')) {
			midi.sendShortMsg(0x91, 0x0C, 0x7f);
		}
		else {
			midi.sendShortMsg(0x91, 0x0C, 0x00);
		}
	}
	
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'pfl')) {
			midi.sendShortMsg(0x92, 0x0C, 0x7f);
		}
		else {
			midi.sendShortMsg(0x92, 0x0C, 0x00);
		}
	}
}

function BEATLOOP_4_ENABLED(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'beatloop_4_enabled')) {
			midi.sendShortMsg(0x91, 0x09, 0x7f);
		}
		else {
			midi.sendShortMsg(0x91, 0x09, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'beatloop_4_enabled')) {
			midi.sendShortMsg(0x92, 0x09, 0x7f);
		}
		else {
			midi.sendShortMsg(0x92, 0x09, 0x00);
		}
	}
	
}

function BEATLOOP_1_toggle(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'beatloop_1_enabled')) {
			midi.sendShortMsg(0x96, 0x10, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x10, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'beatloop_1_enabled')) {
			midi.sendShortMsg(0x97, 0x10, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x10, 0x00);
		}
	}
	
}

function BEATLOOP_2_toggle(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'beatloop_2_enabled')) {
			midi.sendShortMsg(0x96, 0x11, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x11, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'beatloop_2_enabled')) {
			midi.sendShortMsg(0x97, 0x11, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x11, 0x00);
		}
	}
	
}

function BEATLOOP_4_toggle(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'beatloop_4_enabled')) {
			midi.sendShortMsg(0x96, 0x12, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x12, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'beatloop_4_enabled')) {
			midi.sendShortMsg(0x97, 0x12, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x12, 0x00);
		}
	}
	
}

function BEATLOOP_8_toggle(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'beatloop_8_enabled')) {
			midi.sendShortMsg(0x96, 0x13, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x13, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'beatloop_8_enabled')) {
			midi.sendShortMsg(0x97, 0x13, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x13, 0x00);
		}
	}
	
}

function CUE_INDICATOR(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'cue_indicator')) {
			midi.sendShortMsg(0x91, 0x06, 0x7f);
		}
		else {
			midi.sendShortMsg(0x91, 0x06, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'cue_indicator')) {
			midi.sendShortMsg(0x92, 0x06, 0x7f);
		}
		else {
			midi.sendShortMsg(0x92, 0x06, 0x00);
		}
	}
	
}

function END_OF_TRACK(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'end_of_track')) {
			midi.sendShortMsg(0x91, 0x1C, 0x7f);
			midi.sendShortMsg(0x91, 0x1C, 0x7f);
		}
		else {
			midi.sendShortMsg(0x91, 0x1D, 0x00);
			midi.sendShortMsg(0x91, 0x1D, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'end_of_track')) {
			midi.sendShortMsg(0x92, 0x1C, 0x7f);
			midi.sendShortMsg(0x92, 0x1D, 0x7f);
		}
		else {
			midi.sendShortMsg(0x92, 0x1C, 0x00);
			midi.sendShortMsg(0x92, 0x1D, 0x00);
		}
	}
	
}


function HOTCUE_1_ENABLED(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'hotcue_1_enabled')) {
			midi.sendShortMsg(0x96, 0x00, 0x7f);
			midi.sendShortMsg(0x96, 0x08, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x00, 0x00);
			midi.sendShortMsg(0x96, 0x08, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'hotcue_1_enabled')) {
			midi.sendShortMsg(0x97, 0x00, 0x7f);
			midi.sendShortMsg(0x97, 0x08, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x00, 0x00);
			midi.sendShortMsg(0x97, 0x08, 0x00);
		}
	}
	
}

function HOTCUE_2_ENABLED(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'hotcue_2_enabled')) {
			midi.sendShortMsg(0x96, 0x01, 0x7f);
			midi.sendShortMsg(0x96, 0x09, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x01, 0x00);
			midi.sendShortMsg(0x96, 0x09, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'hotcue_2_enabled')) {
			midi.sendShortMsg(0x97, 0x01, 0x7f);
			midi.sendShortMsg(0x97, 0x09, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x01, 0x00);
			midi.sendShortMsg(0x97, 0x09, 0x00);
		}
	}
	
}

function HOTCUE_3_ENABLED(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'hotcue_3_enabled')) {
			midi.sendShortMsg(0x96, 0x02, 0x7f);
			midi.sendShortMsg(0x96, 0x0A, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x02, 0x00);
			midi.sendShortMsg(0x96, 0x0A, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'hotcue_3_enabled')) {
			midi.sendShortMsg(0x97, 0x02, 0x7f);
			midi.sendShortMsg(0x97, 0x0A, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x02, 0x00);
			midi.sendShortMsg(0x97, 0x0A, 0x00);
		}
	}
	
}

function HOTCUE_4_ENABLED(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'hotcue_4_enabled')) {
			midi.sendShortMsg(0x96, 0x03, 0x7f);
			midi.sendShortMsg(0x96, 0x0B, 0x7f);
		}
		else {
			midi.sendShortMsg(0x96, 0x03, 0x00);
			midi.sendShortMsg(0x96, 0x0B, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'hotcue_4_enabled')) {
			midi.sendShortMsg(0x97, 0x03, 0x7f);
			midi.sendShortMsg(0x97, 0x0B, 0x7f);
		}
		else {
			midi.sendShortMsg(0x97, 0x03, 0x00);
			midi.sendShortMsg(0x97, 0x0B, 0x00);
		}
	}
	
}


function PLAY_INDICATOR(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'play_indicator')) {
			midi.sendShortMsg(0x91, 0x07, 0x7f);
		}
		else {
			midi.sendShortMsg(0x91, 0x07, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'play_indicator')) {
			midi.sendShortMsg(0x92, 0x07, 0x7f);
		}
		else {
			midi.sendShortMsg(0x92, 0x07, 0x00);
		}
	}
	
}

function START_PLAY(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'start_play')) {
			midi.sendShortMsg(0x94, 0x06, 0x7f);
		}
		else {
			midi.sendShortMsg(0x94, 0x06, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'start_play')) {
			midi.sendShortMsg(0x95, 0x06, 0x7f);
		}
		else {
			midi.sendShortMsg(0x95, 0x06, 0x00);
		}
	}
	
}

function SYNC_ENABLED(value, group, control) {
	if (group=='[Channel1]'||group=='[Channel3]') {
		if (engine.getValue(group, 'sync_enabled')) {
			midi.sendShortMsg(0x91, 0x05, 0x7f);
		}
		else {
			midi.sendShortMsg(0x91, 0x05, 0x00);
		}
	}
	if (group=='[Channel2]'||group=='[Channel4]') {
		if (engine.getValue(group, 'sync_enabled')) {
			midi.sendShortMsg(0x92, 0x05, 0x7f);
		}
		else {
			midi.sendShortMsg(0x92, 0x05, 0x00);
		}
	}
	
}





DJCi200.playButton = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'play', ! (engine.getValue(group, 'play')))
    }
}

DJCi200.hotcue_1_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    engine.setValue(group, 'hotcue_1_activate', value);
}

DJCi200.volume = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        DJCi200.softParameter(group, "volume", value);
    }
}

DJCi200.hotcue_2_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    engine.setValue(group, 'hotcue_2_activate', value);
}

DJCi200.hotcue_3_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    engine.setValue(group, 'hotcue_3_activate', value);
}

DJCi200.hotcue_4_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    engine.setValue(group, 'hotcue_4_activate', value);
}

DJCi200.sync_enabled = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'sync_enabled', ! (engine.getValue(group, 'sync_enabled')))
    }
}

DJCi200.sync_master = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'sync_master', ! (engine.getValue(group, 'sync_master')))
    }
}

DJCi200.cue_default = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    engine.setValue(group, 'cue_default', value);
    /*if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'cue_default', ! (engine.getValue(group, 'cue_default')))
    }*/
}

DJCi200.start_play = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'start_play', ! (engine.getValue(group, 'start_play')))
    }
}

DJCi200.play_stutter = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'play_stutter', ! (engine.getValue(group, 'play_stutter')))
    }
}

DJCi200.hotcue_1_clear = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'hotcue_1_clear', ! (engine.getValue(group, 'hotcue_1_clear')))
    }
}

DJCi200.rate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        DJCi200.softParameter(group, "rate", value);
    }
}

DJCi200.beatloop_4_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'beatloop_4_activate', true)
    }
}

DJCi200.loop_halve = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'loop_halve', ! (engine.getValue(group, 'loop_halve')))
    }
}

DJCi200.hotcue_2_clear = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'hotcue_2_clear', ! (engine.getValue(group, 'hotcue_2_clear')))
    }
}

DJCi200.reloop_toggle = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'reloop_toggle', true)
    }
}

DJCi200.loop_double = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'loop_double', ! (engine.getValue(group, 'loop_double')))
    }
}

DJCi200.hotcue_3_clear = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'hotcue_3_clear', ! (engine.getValue(group, 'hotcue_3_clear')))
    }
}

DJCi200.hotcue_4_clear = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'hotcue_4_clear', ! (engine.getValue(group, 'hotcue_4_clear')))
    }
}

DJCi200.pfl = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'pfl', ! (engine.getValue(group, 'pfl')))
    }
}

DJCi200.LoadSelectedTrack = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        engine.setValue(group, 'LoadSelectedTrack', ! (engine.getValue(group, 'LoadSelectedTrack')))
    }
}

DJCi200.beatloop_1_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
	engine.setValue(group, 'beatloop_1_toggle', true)
        //engine.setValue(group, 'beatloop_1_toggle', ! (engine.getValue(group, 'beatloop_1_toggle')))
    }
}

DJCi200.beatloop_2_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
	engine.setValue(group, 'beatloop_2_toggle', true)
        //engine.setValue(group, 'beatloop_1_toggle', ! (engine.getValue(group, 'beatloop_1_toggle')))
    }
}

DJCi200.beatloop_4_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
	engine.setValue(group, 'beatloop_4_toggle', true)
        //engine.setValue(group, 'beatloop_1_toggle', ! (engine.getValue(group, 'beatloop_1_toggle')))
    }
}

DJCi200.beatloop_8_activate = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
	engine.setValue(group, 'beatloop_8_toggle', true)
        //engine.setValue(group, 'beatloop_1_toggle', ! (engine.getValue(group, 'beatloop_1_toggle')))
    }
}

DJCi200.effectrack1_effectunit1_enable = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        var key = 'group_'+group+'_enable';
        engine.setValue('[EffectRack1_EffectUnit1]', key, ! (engine.getValue('[EffectRack1_EffectUnit1]', key)))
    }
}
DJCi200.effectrack1_effectunit2_enable = function (channel, control, value, status, group) {
    group = DJCi200.deck[group] // Change the value of the group variable to the deck we actually want to manipulate based on the state of the deck toggle button
    if (value) {
        // toggle whether the deck is playing
        var key = 'group_'+group+'_enable';
        engine.setValue('[EffectRack1_EffectUnit2]', key, ! (engine.getValue('[EffectRack1_EffectUnit2]', key)))
    }
}



///////////////////////////////////////////////////////////////
//                       USER OPTIONS                        //
///////////////////////////////////////////////////////////////

// How fast scratching is.
DJCi200.scratchScale = 1.0;

// How much faster seeking (shift+scratch) is than scratching.
DJCi200.scratchShiftMultiplier = 4;

// How fast bending is.
DJCi200.bendScale = 1;

// Other scratch related options
DJCi200.kScratchActionNone = 0;
DJCi200.kScratchActionScratch = 1;
DJCi200.kScratchActionSeek = 2;
DJCi200.kScratchActionBend = 3;

DJCi200.init = function() {
    // Scratch button state
    DJCi200.scratchButtonState = true;
    // Scratch Action
    DJCi200.scratchAction = {
        1: DJCi200.kScratchActionNone,
        2: DJCi200.kScratchActionNone
    };

    //Turn On Vinyl buttons LED(one for each deck).
    midi.sendShortMsg(0x91, 0x03, 0x7F);
    midi.sendShortMsg(0x92, 0x03, 0x7F);

    //Turn On Browser button LED
    midi.sendShortMsg(0x90, 0x04, 0x05);

    //Softtakeover for Pitch fader
    engine.softTakeover("[Channel1]", "rate", true);
    engine.softTakeover("[Channel2]", "rate", true);
    engine.softTakeover("[EqualizerRack1_[Channel2]_Effect1]", "parameter1", true);
    engine.softTakeover("[EqualizerRack1_[Channel2]_Effect1]", "parameter3", true);
    engine.softTakeoverIgnoreNextValue("[Channel1]", "rate");
    engine.softTakeoverIgnoreNextValue("[Channel2]", "rate");
    engine.softTakeoverIgnoreNextValue("[EqualizerRack1_[Channel2]_Effect1]", "parameter1");
    engine.softTakeoverIgnoreNextValue("[EqualizerRack1_[Channel2]_Effect1]", "parameter3");

    //Set effects Levels - Dry/Wet
    engine.setParameter("[EffectRack1_EffectUnit1_Effect1]", "meta", 0.6);
    engine.setParameter("[EffectRack1_EffectUnit1_Effect2]", "meta", 0.6);
    engine.setParameter("[EffectRack1_EffectUnit1_Effect3]", "meta", 0.6);
    engine.setParameter("[EffectRack1_EffectUnit2_Effect1]", "meta", 0.6);
    engine.setParameter("[EffectRack1_EffectUnit2_Effect2]", "meta", 0.6);
    engine.setParameter("[EffectRack1_EffectUnit2_Effect3]", "meta", 0.6);
    engine.setParameter("[EffectRack1_EffectUnit1]", "mix", 1);
    engine.setParameter("[EffectRack1_EffectUnit2]", "mix", 1);

    // Ask the controller to send all current knob/slider values over MIDI, which will update
    // the corresponding GUI controls in MIXXX.
    //midi.sendShortMsg(0xB0, 0x7F, 0x7F);
};

DJCi200.softParameter = function(group, mcontrol, value) {
	var threshold = 0.07;
	var currentKnobVal = value/128; // knob position in range 0.0-1.0
	var currentParamVal = engine.getParameter(group, mcontrol); // get the current setting for this control
	var spread = Math.abs(currentParamVal - currentKnobVal); // calculate the difference between the current setting and the knob position

	if (spread < threshold){ // if the difference is within the threshold range, we can set the new value... 
		engine.setParameter(group, mcontrol, currentKnobVal); 
	} else { // otherwise we do nothing until the value gets closer
		return; 
	}
};

DJCi200.gainone = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter(group, "pregain", value);
	
};

DJCi200.gaintwo = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter(group, "pregain", value);
	
};

DJCi200.filterone = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter('[QuickEffectRack1_'+group+']', "super1", value);
	
};

DJCi200.filtertwo = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter('[QuickEffectRack1_'+group+']', "super1", value);
	
};

DJCi200.eqhigh1 = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter('[EqualizerRack1_'+group+'_Effect1]', "parameter3", value);
};

DJCi200.eqhigh2 = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter('[EqualizerRack1_'+group+'_Effect1]', "parameter3", value);
};

DJCi200.eqlow1 = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter('[EqualizerRack1_'+group+'_Effect1]', "parameter1", value);
};

DJCi200.eqlow2 = function(channel, control, value, _status, _group) {
	var group = DJCi200.deck[_group];
	DJCi200.softParameter('[EqualizerRack1_'+group+'_Effect1]', "parameter1", value);
};

DJCi200.effect11 = function(channel, control, value, _status, _group) {
	DJCi200.softParameter("[EffectRack1_EffectUnit1_Effect1]", "meta", value);
	
};

DJCi200.effect12 = function(channel, control, value, _status, _group) {
	DJCi200.softParameter("[EffectRack1_EffectUnit1_Effect2]", "meta", value);
	
};
DJCi200.effect13 = function(channel, control, value, _status, _group) {
	DJCi200.softParameter("[EffectRack1_EffectUnit1_Effect3]", "meta", value);
	
};

DJCi200.effect21 = function(channel, control, value, _status, _group) {
	DJCi200.softParameter("[EffectRack1_EffectUnit2_Effect1]", "meta", value);
	
};

DJCi200.effect22 = function(channel, control, value, _status, _group) {
	DJCi200.softParameter("[EffectRack1_EffectUnit2_Effect2]", "meta", value);
	
};

DJCi200.effect23 = function(channel, control, value, _status, _group) {
	DJCi200.softParameter("[EffectRack1_EffectUnit2_Effect3]", "meta", value);
	
};



// The Vinyl button, used to enable or disable scratching on the jog wheels (One per deck).
DJCi200.vinylButton = function(_channel, _control, value, status, _group) {
    if (value) {
        if (DJCi200.scratchButtonState) {
            DJCi200.scratchButtonState = false;
            midi.sendShortMsg(status, 0x03, 0x00);
        } else {
            DJCi200.scratchButtonState = true;
            midi.sendShortMsg(status, 0x03, 0x7F);
        }
    }
};

DJCi200._scratchEnable = function(deck) {
    var alpha = 1.0/8;
    var beta = alpha/32;
    engine.scratchEnable(deck, 248, 33 + 1/3, alpha, beta);
};

DJCi200._convertWheelRotation = function(value) {
    // When you rotate the jogwheel, the controller always sends either 0x1
    // (clockwise) or 0x7F (counter clockwise). 0x1 should map to 1, 0x7F
    // should map to -1 (IOW it's 7-bit signed).
    return value < 0x40 ? 1 : -1;
};

// The touch action on the jog wheel's top surface
DJCi200.wheelTouch = function(channel, control, value, _status, _group) {
    var group = DJCi200.deck[_group];
    var decknum = 1;
    if (group == '[Channel1]') {
    	decknum = 1;
    }
    if (group == '[Channel2]') {
    	decknum = 2;
    }
    if (group == '[Channel3]') {
    	decknum = 3;
    }
    if (group == '[Channel4]') {
    	decknum = 4;
    }
    var deck = decknum;
    //var deck = channel;
    if (value > 0) {
        //  Touching the wheel.
        if (engine.getValue("[Channel" + deck + "]", "play") !== 1 || DJCi200.scratchButtonState) {
            DJCi200._scratchEnable(deck);
            DJCi200.scratchAction[deck] = DJCi200.kScratchActionScratch;
        } else {
            DJCi200.scratchAction[deck] = DJCi200.kScratchActionBend;
        }
    } else {
        // Released the wheel.
        engine.scratchDisable(deck);
        DJCi200.scratchAction[deck] = DJCi200.kScratchActionNone;
    }
};

// The touch action on the jog wheel's top surface while holding shift
DJCi200.wheelTouchShift = function(channel, control, value, _status, _group) {
    var group = DJCi200.deck[_group];
    var decknum = 1;
    if (group == '[Channel1]') {
    	decknum = 1;
    }
    if (group == '[Channel2]') {
    	decknum = 2;
    }
    if (group == '[Channel3]') {
    	decknum = 3;
    }
    if (group == '[Channel4]') {
    	decknum = 4;
    }
    var deck = decknum;
    //var deck = channel - 3;
    // We always enable scratching regardless of button state.
    if (value > 0) {
        DJCi200._scratchEnable(deck);
        DJCi200.scratchAction[deck] = DJCi200.kScratchActionSeek;
    } else {
        // Released the wheel.
        engine.scratchDisable(deck);
        DJCi200.scratchAction[deck] = DJCi200.kScratchActionNone;
    }
};

// Scratching on the jog wheel (rotating it while pressing the top surface)
DJCi200.scratchWheel = function(channel, control, value, status, _group) {
    var deck;
    var group = DJCi200.deck[_group];
    var decknum = 1;
    if (group == '[Channel1]') {
    	decknum = 1;
    }
    if (group == '[Channel2]') {
    	decknum = 2;
    }
    if (group == '[Channel3]') {
    	decknum = 3;
    }
    if (group == '[Channel4]') {
    	decknum = 4;
    }
    deck = decknum;
    /*switch (status) {
    case 0xB1:
    case 0xB4:
        deck  = 1;
        break;
    case 0xB2:
    case 0xB5:
        deck  = 2;
        break;
    default:
        return;
    }*/
    var interval = DJCi200._convertWheelRotation(value);
    var scratchAction = DJCi200.scratchAction[deck];
    if (scratchAction === DJCi200.kScratchActionScratch) {
        engine.scratchTick(deck, interval * DJCi200.scratchScale);
    } else if (scratchAction === DJCi200.kScratchActionSeek) {
        engine.scratchTick(deck,
            interval *  DJCi200.scratchScale *
            DJCi200.scratchShiftMultiplier);
    } else {
        engine.setValue(
            "[Channel" + deck + "]", "jog", interval * DJCi200.bendScale);
    }
};

// Bending on the jog wheel (rotating using the edge)
DJCi200.bendWheel = function(channel, control, value, _status, _group) {
    var interval = DJCi200._convertWheelRotation(value);
    var group = DJCi200.deck[_group];
    var decknum = 1;
    if (group == '[Channel1]') {
    	decknum = 1;
    }
    if (group == '[Channel2]') {
    	decknum = 2;
    }
    if (group == '[Channel3]') {
    	decknum = 3;
    }
    if (group == '[Channel4]') {
    	decknum = 4;
    }
    var deck = decknum;
    engine.setValue(
        "[Channel" + deck + "]", "jog", interval * DJCi200.bendScale);
};

DJCi200.shutdown = function() {
    midi.sendShortMsg(0xB0, 0x7F, 0x7E);
    midi.sendShortMsg(0x90, 0x04, 0x00);
}
DJCi200.initDeck('[Channel1]')
DJCi200.initDeck('[Channel2]')
