
function sideEffect(modifies, leavesAlone) {
    modifies.x = 1;

    if (modifies.y = 2) {
        modifies.z = 3;
    }

    const x = [1,2,3];
    x.splice(1,2);

    switch(modifies.x) {
        case 1:
            modifies.x = 4;
            break;
        default:
            modifies.x = 5
    }

    [1,2,3].shift();

    // Arrow functions
    const y = () => { return modifies.y = 12 };

    // local functions (including immediately invoked function expressions (iife)
    (function() {
        modifies.f = 13;
    })();

    return leavesAlone;
}

function noEffects(noModify, alsoNoModify) {
    const me = 12;
    return me;
}

function asdf(j) {
    j.modifies = 1;
}
