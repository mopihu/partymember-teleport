const Command = require('command');

module.exports = function PartymemberTeleport(dispatch) {

    const command = Command(dispatch);

    const keyWords = ['help','come','jesus'];
    
    let villageList = null;
    let cid = null;
    let partyMembers = {};
    let teleportTo = '';
    let instantTp = false;
    let nextLocation = null;
    
    function getVillageId(zone) {
    
        for (let key in villageList) {
        
            if (villageList[key].zone == zone) {
            
                return villageList[key].id;
            
            }
        
        }
        
        return 0;
    
    }
    
    function teleport(target) {
    
        teleportTo = '';
    
        dispatch.toServer('C_PCBANGINVENTORY_USE_SLOT', 1, { slot : 4 });

        setTimeout( function() {
        
            let villageId = getVillageId(target.location3);
            
            if (villageId == 0) { return; }
            
            nextLocation = {x: target.x, y: target.y, z: target.z};
        
            dispatch.toServer('C_TELEPORT_TO_VILLAGE', 1, { id : villageId });

        }, 800);

    }

    dispatch.hook('S_LOGIN', 1, event => ({ cid } = event));
    
    dispatch.hook('S_VILLAGE_LIST_TO_TELEPORT', 1, (event) => {
        if (villageList == null) {
            villageList = event.locations;
        }
    });

    dispatch.hook('S_PARTY_MEMBER_LIST', 4, (event) => {
        partyMembers = event.members;
    });

    dispatch.hook('S_PARTY_MEMBER_INTERVAL_POS_UPDATE', 2, (event) => {
    
        if (teleportTo != '') {

            for (let item in partyMembers) {

                if (partyMembers[item].name.toLowerCase() == teleportTo.toLowerCase()) {

                    if (partyMembers[item].playerId == event.playerId) {
                        
                        teleport(event);

                    }

                }

            }

        }

    });

    dispatch.hook('S_CHAT', 2, (event) => {
    
        for (let key in partyMembers) {

            if (partyMembers[key].name == event.authorName) {
            
                for (let i = 0; i < keyWords.length; i++) {
                    
                    if (event.message.includes(keyWords[i])) {
    
                        if (instantTp) {
    
                            command.message(' Set teleport Request to: ' + event.authorName);
    
                            teleportTo = event.authorName;
    
                        } else {
    
                            command.message(' Info: Detected teleport request, type "/8 tp toggle" to activate instant teleport requests');
    
                        }
    
                    }
                
                }

            }

        }

    });
    
    dispatch.hook('S_LOAD_TOPO', (event) => {
        if (nextLocation != null) {
            Object.assign(event, nextLocation);
            return true;
        }
    });

    dispatch.hook('S_SPAWN_ME', (event) => {
        if (nextLocation != null) {
            Object.assign(event, nextLocation);
            nextLocation = null;
            return true;
        }
    });

    command.add('tp', (name) => {

        if (name == 'toggle') {

            instantTp = !instantTp;

            command.message(` Instant Teleport is now ${instantTp ? 'enabled' : 'disabled'}.`);

            return;

        }

        for (let key in partyMembers) {

            if (partyMembers[key].name.toLowerCase() == name.toLowerCase()) {

                command.message(' Set teleport Request to: ' + name);

                teleportTo = name;

                return;

            }

        }

        command.message(' Party Member not found: ' + name);

    });

} 
